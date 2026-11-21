import React, { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

export interface ShareCardPayload {
  title: string;
  category: string;
  quote: string;
  attribution: string;
}

interface ShareCardModalProps {
  payload: ShareCardPayload | null;
  onClose: () => void;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split('\n').map((p) => p.trim()).filter(Boolean);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let current = '';
    for (const w of words) {
      const candidate = current ? `${current} ${w}` : w;
      if (ctx.measureText(candidate).width > maxWidth && current) {
        lines.push(current);
        current = w;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function renderManuscriptShareCanvas(payload: ShareCardPayload): string {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Ivory parchment background
  ctx.fillStyle = '#FAF6EC';
  ctx.fillRect(0, 0, width, height);

  // Subtle parchment warm radial vignette
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    180,
    width / 2,
    height / 2,
    780
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  grad.addColorStop(1, 'rgba(184, 146, 74, 0.14)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Emerald header band
  ctx.fillStyle = '#0F3D2E';
  ctx.fillRect(54, 54, width - 108, 170);

  // Double matte gold frame borders
  ctx.strokeStyle = '#B8924A';
  ctx.lineWidth = 4;
  ctx.strokeRect(42, 42, width - 84, height - 84);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(56, 56, width - 112, height - 112);

  // Corner L-brackets
  const bracket = 34;
  ctx.strokeStyle = '#D9B96A';
  ctx.lineWidth = 4;
  const corners = [
    [68, 68, 1, 1],
    [width - 68, 68, -1, 1],
    [68, height - 68, 1, -1],
    [width - 68, height - 68, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * bracket);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * bracket, cy);
    ctx.stroke();
  }

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  // Header Category & Title
  ctx.fillStyle = '#D9B96A';
  ctx.font = 'bold 26px "Amiri", "Noto Naskh Arabic", serif';
  ctx.fillText(payload.category, width / 2, 118);

  ctx.fillStyle = '#FAF6EC';
  ctx.font = 'bold 42px "Amiri", "Noto Naskh Arabic", serif';
  ctx.fillText(payload.title, width / 2, 178, width - 180);

  // Adaptive font size for Arabic body text
  const cleanQuote =
    payload.quote.length > 520
      ? `${payload.quote.slice(0, 515).trim()}...`
      : payload.quote;

  const fontSize =
    cleanQuote.length < 130 ? 52 : cleanQuote.length < 280 ? 44 : 36;
  const lineHeight = Math.round(fontSize * 1.82);

  ctx.font = `${fontSize}px "Amiri Quran", "Amiri", "Noto Naskh Arabic", serif`;
  ctx.fillStyle = '#11271F';

  const lines = wrapCanvasText(ctx, cleanQuote, width - 210);
  const maxVisibleLines = Math.min(lines.length, 13);
  const blockHeight = maxVisibleLines * lineHeight;
  const centerRegionTop = 270;
  const centerRegionBottom = 1090;
  const startY =
    centerRegionTop +
    Math.max(40, (centerRegionBottom - centerRegionTop - blockHeight) / 2);

  for (let i = 0; i < maxVisibleLines; i++) {
    ctx.fillText(lines[i], width / 2, startY + i * lineHeight);
  }

  // Ornamental Divider before Footer
  ctx.strokeStyle = 'rgba(184, 146, 74, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(220, 1135);
  ctx.lineTo(width - 220, 1135);
  ctx.stroke();

  // Attribution
  ctx.fillStyle = '#1F6B50';
  ctx.font = 'bold 28px "Amiri", "Noto Naskh Arabic", serif';
  ctx.fillText(payload.attribution, width / 2, 1188, width - 180);

  // App signature
  ctx.fillStyle = '#7A5E2A';
  ctx.font = 'bold 24px "IBM Plex Sans Arabic", sans-serif';
  ctx.fillText(
    'تطبيق رحلة النور · إشراف جمعية كشافة الموعود الإسلامية',
    width / 2,
    1248,
    width - 160
  );

  return canvas.toDataURL('image/png');
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  payload,
  onClose,
}) => {
  const [excerpt, setExcerpt] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    if (!payload) return;
    setExcerpt(payload.quote);
    setShareNote(null);
  }, [payload]);

  useEffect(() => {
    if (!payload || typeof document === 'undefined') return;
    const url = renderManuscriptShareCanvas({
      ...payload,
      quote: excerpt || payload.quote,
    });
    setPreviewUrl(url);
  }, [payload, excerpt]);

  if (!payload) return null;

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `rihlat-alnoor-card.png`;
    a.click();
    setShareNote('تم حفظ بطاقة المخطوطة في جهازك بصيغة PNG.');
  };

  const handleNativeShare = async () => {
    if (!previewUrl) return;
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const file = new File([blob], 'rihlat-alnoor-card.png', {
        type: 'image/png',
      });

      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          title: payload.title,
          text: `${payload.title} — من تطبيق رحلة النور`,
          files: [file],
        });
        return;
      }
      handleDownload();
      setShareNote(
        'متصفحك لا يدعم المشاركة المباشرة للملفات، لذا تم تحميل الصورة لتشاركها بسهولة.'
      );
    } catch {
      handleDownload();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#081A14]/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="مشاركة النص كبطاقة مخطوطة"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[94vh] flex flex-col manuscript-folio rounded-[8px] p-4 sm:p-6 shadow-2xl text-right"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#B8924A]/35 shrink-0">
          <div>
            <h3 className="font-calligraphy font-bold text-2xl text-[#0F3D2E]">
              مشاركة كبطاقة مخطوطة
            </h3>
            <p className="text-xs text-[#425B51]">{payload.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة المشاركة"
            className="min-w-[38px] min-h-[38px] rounded-[5px] border border-[#B8924A]/40 text-[#425B51] hover:bg-[#F3ECDA] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 overflow-y-auto flex-1 space-y-3">
          {previewUrl && (
            <div className="max-w-[290px] mx-auto rounded-[6px] overflow-hidden border border-[#B8924A]/65 shadow-md bg-[#FAF6EC]">
              <img
                src={previewUrl}
                alt={`معاينة بطاقة ${payload.title}`}
                className="w-full h-auto block"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="share-excerpt-editor"
              className="block text-xs font-bold text-[#0F3D2E] mb-1"
            >
              النص الظاهر على البطاقة (يمكنك تعديله أو اختصاره):
            </label>
            <textarea
              id="share-excerpt-editor"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full p-2.5 rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/50 focus:border-[#0F3D2E] focus:outline-none font-arabic text-base text-[#11271F]"
            />
          </div>

          {shareNote && (
            <p className="text-xs font-bold text-[#1F6B50]">{shareNote}</p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-[#B8924A]/30 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="min-h-[42px] px-4 py-2 btn-manuscript text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#0F3D2E]" aria-hidden="true" />
            <span>تحميل الصورة (PNG)</span>
          </button>

          <button
            type="button"
            onClick={() => void handleNativeShare()}
            className="min-h-[42px] px-5 py-2 btn-emerald text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
            <span>مشاركة البطاقة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
