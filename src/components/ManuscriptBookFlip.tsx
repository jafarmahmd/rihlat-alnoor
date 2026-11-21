import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ManuscriptCornerBracket } from './IslamicOrnaments';
import { toArabicDigits } from '../utils/bookPagination';
import { playPageFlipSound } from '../utils/sound';

export interface ManuscriptBookPage {
  id: string;
  content: React.ReactNode;
}

interface ManuscriptBookFlipProps {
  bookKey: string;
  title: string;
  pages: ManuscriptBookPage[];
  currentPage: number;
  onPageChange: (nextPage: number) => void;
  nightMode?: boolean;
  pageFlipSoundEnabled?: boolean;
  /** Optional footer slot shown neatly inside the closing sheet (or beneath controls) */
  colophonFooter?: React.ReactNode;
}

interface ActiveFlipAnimation {
  direction: 'next' | 'prev';
  fromPage: number;
  toPage: number;
  progress: number; // 0 -> 1
  isAnimating: boolean;
}

export const ManuscriptBookFlip: React.FC<ManuscriptBookFlipProps> = ({
  bookKey,
  title,
  pages,
  currentPage,
  onPageChange,
  nightMode = false,
  pageFlipSoundEnabled = false,
  colophonFooter,
}) => {
  const totalPages = Math.max(1, pages.length);
  const safePage = Math.max(0, Math.min(totalPages - 1, currentPage));

  const [flip, setFlip] = useState<ActiveFlipAnimation | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);

  // Touch / pointer swipe & drag state
  const pointerRef = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lockedAxis: 'none' | 'horizontal' | 'vertical';
    dragDirection: 'next' | 'prev' | null;
    dragProgress: number;
    containerWidth: number;
  }>({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lockedAxis: 'none',
    dragDirection: null,
    dragProgress: 0,
    containerWidth: 360,
  });

  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Cancel active animation if user switches Surah/Dua cleanly
  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setFlip(null);
  }, [bookKey]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const runEaseAnimation = useCallback(
    (
      direction: 'next' | 'prev',
      fromPage: number,
      toPage: number,
      startProgress: number,
      targetProgress: number,
      durationMs: number,
      commitOnEnd: boolean
    ) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (prefersReducedMotion || durationMs <= 16) {
        setFlip(null);
        if (commitOnEnd) {
          if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            try {
              navigator.vibrate(10);
            } catch {
              // Ignore unsupported vibrate
            }
          }
          playPageFlipSound(pageFlipSoundEnabled);
          onPageChange(toPage);
        }
        return;
      }

      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = Math.min(1, (now - startTime) / durationMs);
        // Smooth manuscript paper turn ease-out-cubic
        const eased = 1 - Math.pow(1 - elapsed, 3);
        const currentProgress =
          startProgress + (targetProgress - startProgress) * eased;

        setFlip({
          direction,
          fromPage,
          toPage,
          progress: currentProgress,
          isAnimating: true,
        });

        if (elapsed < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          if (commitOnEnd) {
            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
              try {
                navigator.vibrate(10);
              } catch {
                // Ignore unsupported vibrate
              }
            }
            playPageFlipSound(pageFlipSoundEnabled);
            onPageChange(toPage);
          }
          setFlip(null);
        }
      };

      setFlip({
        direction,
        fromPage,
        toPage,
        progress: startProgress,
        isAnimating: true,
      });
      rafRef.current = requestAnimationFrame(tick);
    },
    [onPageChange, prefersReducedMotion, pageFlipSoundEnabled]
  );

  const flipToNext = useCallback(() => {
    if (flip?.isAnimating) return;
    if (safePage >= totalPages - 1) return;
    runEaseAnimation('next', safePage, safePage + 1, 0, 1, 540, true);
  }, [flip?.isAnimating, safePage, totalPages, runEaseAnimation]);

  const flipToPrev = useCallback(() => {
    if (flip?.isAnimating) return;
    if (safePage <= 0) return;
    runEaseAnimation('prev', safePage, safePage - 1, 0, 1, 540, true);
  }, [flip?.isAnimating, safePage, runEaseAnimation]);

  // Keyboard RTL book arrows: ArrowLeft -> Next page, ArrowRight -> Prev page
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (safePage < totalPages - 1) {
          e.preventDefault();
          flipToNext();
        }
      } else if (e.key === 'ArrowRight') {
        if (safePage > 0) {
          e.preventDefault();
          flipToPrev();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flipToNext, flipToPrev, safePage, totalPages]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (totalPages <= 1 || flip?.isAnimating) return;
    // Ignore drags starting directly on interactive controls
    const target = e.target as HTMLElement | null;
    if (
      target?.closest('button, a, input, select, audio, [role="button"], [role="slider"]')
    ) {
      return;
    }

    const rect = stageRef.current?.getBoundingClientRect();
    const width = Math.max(260, rect?.width || 360);

    // On desktop mouse, allow normal drag text-selection unless starting near the outer book margins (<= 64px)
    if (e.pointerType === 'mouse' && rect) {
      const distFromLeft = e.clientX - rect.left;
      const distFromRight = rect.right - e.clientX;
      if (distFromLeft > 64 && distFromRight > 64) {
        return;
      }
    }

    pointerRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lockedAxis: 'none',
      dragDirection: null,
      dragProgress: 0,
      containerWidth: width,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    if (!p.active || p.pointerId !== e.pointerId) return;

    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    p.lastX = e.clientX;

    if (p.lockedAxis === 'none') {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx) * 1.1) {
        p.lockedAxis = 'vertical';
        p.active = false;
        return;
      }
      if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.35) {
        p.lockedAxis = 'horizontal';
        // In RTL Arabic codex bound on the right:
        // Pulling left-to-right (dx > 0) lifts the outer left edge toward the right spine -> Next Page
        // Pulling right-to-left (dx < 0) draws the previous page back from the right spine -> Prev Page
        const dir: 'next' | 'prev' = dx > 0 ? 'next' : 'prev';
        if (dir === 'next' && safePage >= totalPages - 1) {
          p.active = false;
          return;
        }
        if (dir === 'prev' && safePage <= 0) {
          p.active = false;
          return;
        }
        p.dragDirection = dir;
        try {
          stageRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // Ignore pointer capture restriction if unsupported
        }
      } else {
        return;
      }
    }

    if (p.lockedAxis === 'horizontal' && p.dragDirection) {
      const dist = p.dragDirection === 'next' ? Math.max(0, dx) : Math.max(0, -dx);
      const rawProgress = Math.min(0.96, dist / (p.containerWidth * 0.65));
      p.dragProgress = rawProgress;

      setFlip({
        direction: p.dragDirection,
        fromPage: safePage,
        toPage: p.dragDirection === 'next' ? safePage + 1 : safePage - 1,
        progress: rawProgress,
        isAnimating: false,
      });
    }
  };

  const finishPointerDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    if (!p.active || p.pointerId !== e.pointerId) return;
    p.active = false;
    try {
      if (stageRef.current?.hasPointerCapture(e.pointerId)) {
        stageRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }

    if (p.lockedAxis !== 'horizontal' || !p.dragDirection) return;

    const dir = p.dragDirection;
    const progress = p.dragProgress;
    const target = dir === 'next' ? safePage + 1 : safePage - 1;

    if (progress >= 0.22) {
      runEaseAnimation(
        dir,
        safePage,
        target,
        progress,
        1,
        Math.max(220, Math.round((1 - progress) * 460)),
        true
      );
    } else {
      runEaseAnimation(
        dir,
        safePage,
        target,
        progress,
        0,
        Math.max(160, Math.round(progress * 320)),
        false
      );
    }
  };

  // Compute exact layered sheets & 3D rotation geometry
  const hasFlip = flip !== null && totalPages > 1;
  const isNextFlip = flip?.direction === 'next';
  const progress = flip?.progress ?? 0;

  // Base static sheet visible underneath the turning leaf:
  // - When flipping NEXT: targetPage is uncovered underneath as outgoing page swings right.
  // - When flipping PREV: current page sits underneath while incoming previous page swings back down over top!
  const underlayIndex = hasFlip
    ? isNextFlip
      ? flip.toPage
      : flip.fromPage
    : safePage;

  // Turning leaf sheet index:
  // - When flipping NEXT: outgoing page starts flat (0deg) and rotates to +180deg around right spine.
  // - When flipping PREV: incoming previous page starts folded on the right (+180deg) and rotates back to 0deg!
  const leafFrontPageIndex = hasFlip
    ? isNextFlip
      ? flip.fromPage
      : flip.toPage
    : safePage;

  const leafAngleDeg = hasFlip
    ? isNextFlip
      ? progress * 180
      : (1 - progress) * 180
    : 0;

  // Dynamic shadow intensity peaks midway (~90deg)
  const midCurve = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI);
  const underlayShadowOpacity = hasFlip
    ? isNextFlip
      ? (1 - progress) * 0.24
      : progress * 0.22
    : 0;

  // Visual book edge paper-stack thickness on left (remaining) & right (already read)
  const unreadRatio = totalPages > 1 ? (totalPages - 1 - safePage) / (totalPages - 1) : 0;
  const readRatio = totalPages > 1 ? safePage / (totalPages - 1) : 0;
  const leftEdgeLayers = totalPages > 1 ? Math.max(1, Math.round(unreadRatio * 3)) : 0;
  const rightEdgeLayers = totalPages > 1 ? Math.max(0, Math.round(readRatio * 3)) : 0;

  const renderPageHeaderFooter = (pageIdx: number, content: React.ReactNode) => (
    <div className="relative h-full flex flex-col justify-between p-5 sm:p-8 lg:p-10">
      {/* Corner Illuminated Brackets */}
      <ManuscriptCornerBracket
        position="top-right"
        color={nightMode ? '#D9B96A' : '#B8924A'}
        className="absolute top-2.5 right-2.5 pointer-events-none"
      />
      <ManuscriptCornerBracket
        position="top-left"
        color={nightMode ? '#D9B96A' : '#B8924A'}
        className="absolute top-2.5 left-2.5 pointer-events-none"
      />
      <ManuscriptCornerBracket
        position="bottom-right"
        color={nightMode ? '#D9B96A' : '#B8924A'}
        className="absolute bottom-2.5 right-2.5 pointer-events-none"
      />
      <ManuscriptCornerBracket
        position="bottom-left"
        color={nightMode ? '#D9B96A' : '#B8924A'}
        className="absolute bottom-2.5 left-2.5 pointer-events-none"
      />

      {/* Running Manuscript Header */}
      <div
        className={`flex items-center justify-between gap-2 pb-3 mb-4 border-b text-[11px] sm:text-xs font-medium ${
          nightMode
            ? 'border-[#D9B96A]/25 text-[#C8B88A]'
            : 'border-[#B8924A]/30 text-[#7A5E2A]'
        }`}
      >
        <span className="truncate">{title}</span>
        <span className="tabular-nums shrink-0">
          الورقة {toArabicDigits(pageIdx + 1)} من {toArabicDigits(totalPages)}
        </span>
      </div>

      {/* Main Sheet Content */}
      <div className="flex-1 min-h-[260px] sm:min-h-[320px]">{content}</div>

      {/* Subtle Folio Page Numeral */}
      <div
        className={`mt-5 pt-2.5 border-t flex items-center justify-center text-xs font-arabic tabular-nums ${
          nightMode
            ? 'border-[#D9B96A]/20 text-[#D9B96A]/85'
            : 'border-[#B8924A]/25 text-[#9C7835]'
        }`}
      >
        <span>— {toArabicDigits(pageIdx + 1)} —</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 3D Book Stage */}
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        className="relative book-stage-3d select-text touch-pan-y"
      >
        {/* Physical Book Edge Stack Layers (Right = Read Stack, Left = Remaining Stack) */}
        {rightEdgeLayers > 0 && (
          <div
            aria-hidden="true"
            className="hidden sm:block absolute top-2 bottom-2 right-[-6px] w-[7px] pointer-events-none rounded-r-[4px]"
            style={{
              background: nightMode
                ? 'repeating-linear-gradient(90deg, #0D2920 0px, #0D2920 2px, #214B3C 3px)'
                : 'repeating-linear-gradient(90deg, #EFE5CC 0px, #EFE5CC 2px, #B8924A 3px)',
              opacity: 0.85,
            }}
          />
        )}
        {leftEdgeLayers > 0 && (
          <div
            aria-hidden="true"
            className="hidden sm:block absolute top-2 bottom-2 left-[-6px] w-[7px] pointer-events-none rounded-l-[4px]"
            style={{
              background: nightMode
                ? 'repeating-linear-gradient(90deg, #0D2920 0px, #0D2920 2px, #214B3C 3px)'
                : 'repeating-linear-gradient(90deg, #EFE5CC 0px, #EFE5CC 2px, #B8924A 3px)',
              opacity: 0.85,
            }}
          />
        )}

        {/* Base Folio Sheet */}
        <div
          className={`relative overflow-hidden rounded-[6px] transition-colors duration-300 ${
            nightMode
              ? 'manuscript-folio-dark'
              : 'manuscript-folio paper-grain text-[#11271F]'
          }`}
        >
          {/* Arabic Spine Binding Groove Shadow on Right Edge */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-7 sm:w-10 pointer-events-none z-10"
            style={{
              background: nightMode
                ? 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0.42) 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(184,146,74,0.08) 65%, rgba(15,61,46,0.16) 100%)',
            }}
          />

          {/* Base Static / Underlay Page */}
          <div className="relative z-0">
            {renderPageHeaderFooter(
              underlayIndex,
              pages[underlayIndex]?.content ?? null
            )}
          </div>

          {/* Dynamic Drop Shadow Cast Onto Underlay Page */}
          {hasFlip && (
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: nightMode
                  ? `rgba(2, 10, 7, ${underlayShadowOpacity.toFixed(3)})`
                  : `rgba(17, 39, 31, ${underlayShadowOpacity.toFixed(3)})`,
              }}
            />
          )}

          {/* 3D Turning Parchment Leaf */}
          {hasFlip && (
            <div
              aria-hidden="true"
              className="book-leaf-3d absolute inset-0 z-20 pointer-events-none"
              style={{
                transformOrigin: 'right center',
                transform: `rotateY(${leafAngleDeg.toFixed(2)}deg)`,
              }}
            >
              {/* Front Side of Turning Page */}
              <div
                className={`book-face-front absolute inset-0 overflow-hidden rounded-[6px] ${
                  nightMode
                    ? 'manuscript-folio-dark'
                    : 'manuscript-folio paper-grain text-[#11271F]'
                }`}
                style={{
                  boxShadow: nightMode
                    ? `-${Math.round(8 + midCurve * 24)}px 8px ${Math.round(
                        18 + midCurve * 26
                      )}px rgba(0, 0, 0, ${(0.25 + midCurve * 0.35).toFixed(2)})`
                    : `-${Math.round(6 + midCurve * 20)}px 6px ${Math.round(
                        16 + midCurve * 24
                      )}px rgba(15, 61, 46, ${(0.12 + midCurve * 0.2).toFixed(2)})`,
                }}
              >
                {renderPageHeaderFooter(
                  leafFrontPageIndex,
                  pages[leafFrontPageIndex]?.content ?? null
                )}
                {/* Curved Page Paper Gloss / Fold Gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(to left, rgba(255,255,255,${(
                      midCurve * (nightMode ? 0.06 : 0.26)
                    ).toFixed(2)}) 0%, transparent 32%, rgba(17,39,31,${(
                      midCurve * 0.14
                    ).toFixed(2)}) 100%)`,
                  }}
                />
              </div>

              {/* Reverse / Back Side of Turning Parchment Page (visible past 90deg) */}
              <div
                className={`book-face-back absolute inset-0 overflow-hidden rounded-[6px] border ${
                  nightMode
                    ? 'bg-[#081A14] border-[#B8924A]/40 text-[#C8B88A]'
                    : 'bg-[#F2E9D2] paper-grain border-[#B8924A]/55 text-[#7A5E2A]'
                }`}
              >
                <div className="h-full w-full p-8 flex flex-col items-center justify-center opacity-55">
                  <div
                    className={`w-full h-full rounded-[4px] border border-dashed flex flex-col items-center justify-center gap-2 ${
                      nightMode ? 'border-[#D9B96A]/25' : 'border-[#B8924A]/35'
                    }`}
                  >
                    <span className="font-calligraphy text-xl">رحلة النور</span>
                    <span className="text-xs font-arabic">
                      {title}
                    </span>
                  </div>
                </div>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, rgba(17,39,31,${(
                      midCurve * 0.16
                    ).toFixed(2)}) 0%, transparent 45%)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Subtle Desktop Outer Margin Click Hotspots for Fast Tactile Flipping */}
          {totalPages > 1 && (
            <>
              {safePage > 0 && (
                <button
                  type="button"
                  onClick={flipToPrev}
                  aria-label="الورقة السابقة"
                  className="hidden sm:flex absolute inset-y-12 right-0 w-7 z-30 items-center justify-center opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                >
                  <span
                    className={`w-6 h-12 rounded-l-[4px] flex items-center justify-center border border-r-0 ${
                      nightMode
                        ? 'bg-[#0F3D2E]/90 border-[#D9B96A]/60 text-[#D9B96A]'
                        : 'bg-[#FAF6EC]/92 border-[#B8924A]/60 text-[#0F3D2E]'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </button>
              )}

              {safePage < totalPages - 1 && (
                <button
                  type="button"
                  onClick={flipToNext}
                  aria-label="الورقة التالية"
                  className="hidden sm:flex absolute inset-y-12 left-0 w-7 z-30 items-center justify-center opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                >
                  <span
                    className={`w-6 h-12 rounded-r-[4px] flex items-center justify-center border border-l-0 ${
                      nightMode
                        ? 'bg-[#0F3D2E]/90 border-[#D9B96A]/60 text-[#D9B96A]'
                        : 'bg-[#FAF6EC]/92 border-[#B8924A]/60 text-[#0F3D2E]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Book Page Navigation Bar */}
      {totalPages > 1 && (
        <div
          className={`rounded-[6px] border p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 ${
            nightMode
              ? 'bg-[#081A14]/90 border-[#B8924A]/40 text-[#F3EBD6]'
              : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#11271F]'
          }`}
        >
          <button
            type="button"
            onClick={flipToPrev}
            disabled={safePage <= 0 || Boolean(flip?.isAnimating)}
            className="min-h-[42px] px-3.5 py-2 btn-manuscript disabled:opacity-40 text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ChevronRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
            <span>السابقة</span>
          </button>

          {/* Direct Page Stepper Scrubber */}
          <div className="flex-1 min-w-[140px] max-w-xs mx-auto flex flex-col items-center gap-1.5">
            <div className="text-xs font-medium tabular-nums">
              صفحة <strong>{toArabicDigits(safePage + 1)}</strong> من{' '}
              <strong>{toArabicDigits(totalPages)}</strong>
            </div>
            <div className="w-full flex items-center gap-2" dir="rtl">
              <input
                type="range"
                min={0}
                max={totalPages - 1}
                value={safePage}
                onChange={(e) => onPageChange(Number(e.target.value))}
                aria-label="الانتقال السريع بين صفحات الكتاب"
                className="w-full accent-[#B8924A] h-1.5 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={flipToNext}
            disabled={safePage >= totalPages - 1 || Boolean(flip?.isAnimating)}
            className={`min-h-[42px] px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-40 ${
              nightMode ? 'btn-gilded' : 'btn-emerald'
            }`}
          >
            <span>التالية</span>
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Colophon / Completion Bar (Shown cleanly underneath or on final sheet) */}
      {colophonFooter && (
        <div
          className={`rounded-[6px] border p-4 sm:p-5 ${
            nightMode
              ? 'bg-[#0B221A]/90 border-[#B8924A]/35 text-[#F3EBD6]'
              : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#11271F]'
          }`}
        >
          {colophonFooter}
        </div>
      )}
    </div>
  );
};
