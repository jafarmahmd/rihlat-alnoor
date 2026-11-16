import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Star,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import { STAGES, STATIONS, TOTAL_POSSIBLE_STARS } from '../data/stations';
import { GameProgress, StageData, StationData } from '../types/game';

interface MapScreenProps {
  progress: GameProgress;
  onSelectStation: (stationId: number) => void;
  onLockedClick: (station: StationData) => void;
  onBackHome: () => void;
  onResetProgress: () => void;
}

const NODE_POSITIONS: { xPercent: number; yPercent: number }[] = [
  { xPercent: 72, yPercent: 6.5 },
  { xPercent: 28, yPercent: 16 },
  { xPercent: 72, yPercent: 25.5 },
  { xPercent: 28, yPercent: 35 },
  { xPercent: 72, yPercent: 44.5 },
  { xPercent: 28, yPercent: 54 },
  { xPercent: 72, yPercent: 63.5 },
  { xPercent: 28, yPercent: 73 },
  { xPercent: 72, yPercent: 82.5 },
  { xPercent: 50, yPercent: 92 },
];

const STAGE_THEME_STYLES: Record<
  StageData['themeColor'],
  {
    headerBg: string;
    border: string;
    mapBg: string;
    progressBar: string;
    badgeText: string;
  }
> = {
  emerald: {
    headerBg: 'from-emerald-600 to-teal-600',
    border: 'border-emerald-200',
    mapBg: 'from-sky-50/90 via-emerald-50/90 to-teal-50/80',
    progressBar: 'bg-emerald-500',
    badgeText: 'text-emerald-800',
  },
  sky: {
    headerBg: 'from-sky-600 to-cyan-600',
    border: 'border-sky-200',
    mapBg: 'from-sky-100/80 via-cyan-50/85 to-emerald-50/85',
    progressBar: 'bg-sky-500',
    badgeText: 'text-sky-800',
  },
  amber: {
    headerBg: 'from-amber-500 to-orange-500',
    border: 'border-amber-200',
    mapBg: 'from-amber-50/90 via-yellow-50/75 to-emerald-50/85',
    progressBar: 'bg-amber-500',
    badgeText: 'text-amber-800',
  },
  teal: {
    headerBg: 'from-teal-600 to-emerald-600',
    border: 'border-teal-200',
    mapBg: 'from-teal-50/90 via-sky-50/85 to-emerald-50/90',
    progressBar: 'bg-teal-500',
    badgeText: 'text-teal-800',
  },
};

function buildStageCurveSegments(count: number) {
  const segs: { index: number; d: string }[] = [];
  for (let i = 0; i < count - 1; i++) {
    const p1 = NODE_POSITIONS[i];
    const p2 = NODE_POSITIONS[i + 1];
    const midY = (p1.yPercent + p2.yPercent) / 2;
    segs.push({
      index: i,
      d: `M ${p1.xPercent} ${p1.yPercent} C ${p1.xPercent} ${midY}, ${p2.xPercent} ${midY}, ${p2.xPercent} ${p2.yPercent}`,
    });
  }
  return segs;
}

const STAGE_SEGMENTS = buildStageCurveSegments(10);
const FULL_STAGE_PATH_D = STAGE_SEGMENTS.map((s) => s.d).join(' ');

export const MapScreen: React.FC<MapScreenProps> = ({
  progress,
  onSelectStation,
  onLockedClick,
  onBackHome,
  onResetProgress,
}) => {
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [wigglingId, setWigglingId] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const completedCount = Object.keys(progress.completedStations).length;
  const totalStars = Object.values(progress.completedStations).reduce(
    (a, b) => a + b,
    0
  );
  const overallPercent = Math.round((completedCount / STATIONS.length) * 100);

  const handleStationPress = (station: StationData) => {
    const isUnlocked = station.id <= progress.unlockedStationId;
    if (isUnlocked) {
      setLockedMessage(null);
      onSelectStation(station.id);
    } else {
      onLockedClick(station);
      setWigglingId(station.id);
      setLockedMessage(
        `المحطة ${station.id} مقفلة حالياً — أكمل المحطة ${
          station.id - 1
        } أولاً لتضيء لك!`
      );
      window.setTimeout(() => setWigglingId(null), 460);
    }
  };

  const scrollToStage = (stageId: number) => {
    const el = document.getElementById(`stage-${stageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToActiveStation = () => {
    const el = document.getElementById('active-station-node');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      scrollToStage(Math.ceil(progress.unlockedStationId / 10));
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Map Header & Overall Journey Progress */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-emerald-200/90 shadow-md shadow-emerald-950/5 mb-5 sm:mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-bold text-sm sm:text-base flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-emerald-950">
                خريطة رحلة النور
              </h1>
              <p className="text-sm sm:text-base text-emerald-800 font-medium">
                المحطات المكتملة:{' '}
                <span className="font-bold tabular-nums">{completedCount}</span> من{' '}
                <span className="tabular-nums">{STATIONS.length}</span>
                <span className="mx-2 text-amber-500" aria-hidden="true">
                  ·
                </span>
                النجوم:{' '}
                <span className="font-bold tabular-nums">{totalStars}</span> /{' '}
                <span className="tabular-nums">{TOTAL_POSSIBLE_STARS}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={scrollToActiveStation}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4" aria-hidden="true" />
              <span>محطتي الحالية ({progress.unlockedStationId})</span>
            </button>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-sky-800 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>إعادة الرحلة</span>
              </button>
            )}
          </div>
        </div>

        {/* Overall Journey Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
            <span>تقدّمك العام عبر المراحل العشر</span>
            <span className="tabular-nums text-emerald-800">{overallPercent}%</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-amber-400 via-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${Math.max(overallPercent, completedCount > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>

        {/* Quick-Jump 10 Stages Strip */}
        <div className="mt-5 pt-4 border-t border-emerald-100">
          <p className="text-xs sm:text-sm font-bold text-slate-600 mb-2.5">
            الانتقال السريع بين المراحل التربوية:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STAGES.map((stage) => {
              const stageStations = STATIONS.filter((s) => s.stageId === stage.id);
              const stageDoneCount = stageStations.filter(
                (s) => Boolean(progress.completedStations[s.id])
              ).length;
              const isStageUnlocked =
                progress.unlockedStationId >= stage.stationRange[0];
              const isStageComplete = stageDoneCount === stageStations.length;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => scrollToStage(stage.id)}
                  className={`min-h-[48px] px-3 py-2 rounded-xl border text-right transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isStageComplete
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                      : isStageUnlocked
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950 hover:bg-amber-100'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                      المرحلة {stage.id}
                    </div>
                    <div className="text-[11px] font-bold opacity-80 tabular-nums">
                      {stageDoneCount}/10
                    </div>
                  </div>
                  {isStageComplete ? (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                  ) : isStageUnlocked ? (
                    <Sparkles
                      className="w-4 h-4 text-amber-500 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Friendly Locked Feedback Banner */}
      {lockedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="sticky top-20 z-30 mb-5 px-5 py-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-bold text-sm sm:text-base flex items-center gap-3 shadow-lg"
        >
          <Lock className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          <span>{lockedMessage}</span>
        </motion.div>
      )}

      {/* Grand Completion Celebration Banner */}
      {completedCount === STATIONS.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-6 rounded-3xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white border-2 border-amber-300 shadow-lg flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-300/25 border border-amber-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-8 h-8 text-amber-200" aria-hidden="true" />
          </div>
          <div className="text-center sm:text-right">
            <h2 className="font-display font-black text-xl sm:text-2xl">
              مبارك لك يا سفير النور! أتممت جميع المحطات الـ 100
            </h2>
            <p className="text-emerald-50 text-sm sm:text-base mt-1">
              جمعت {totalStars} نجمة نور وتعلمت أروع القيم من القصص الواقعية لأهل البيت (عليهم السلام).
            </p>
          </div>
        </motion.div>
      )}

      {/* 10 Scrolling Educational Stages */}
      <div className="space-y-8">
        {STAGES.map((stage) => {
          const stageStations = STATIONS.filter((s) => s.stageId === stage.id);
          const stageCompletedCount = stageStations.filter((s) =>
            Boolean(progress.completedStations[s.id])
          ).length;
          const stageStarsEarned = stageStations.reduce(
            (sum, s) => sum + (progress.completedStations[s.id] || 0),
            0
          );
          const stageMaxStars = stageStations.reduce(
            (sum, s) => sum + s.starsReward,
            0
          );
          const stagePercent = Math.round(
            (stageCompletedCount / stageStations.length) * 100
          );
          const theme = STAGE_THEME_STYLES[stage.themeColor];

          return (
            <section
              key={stage.id}
              id={`stage-${stage.id}`}
              aria-label={`المرحلة ${stage.id}: ${stage.title}`}
              className={`rounded-3xl overflow-hidden border-2 ${theme.border} shadow-lg shadow-emerald-950/5 bg-white scroll-mt-20`}
            >
              {/* Stage Banner Header */}
              <div
                className={`bg-gradient-to-l ${theme.headerBg} text-white p-5 sm:p-7`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white/90">
                      المرحلة <span className="tabular-nums">{stage.id}</span> من 10
                      <span className="mx-2" aria-hidden="true">
                        ·
                      </span>
                      المحطات{' '}
                      <span className="tabular-nums">
                        {stage.stationRange[0]} – {stage.stationRange[1]}
                      </span>
                    </div>
                    <h2 className="mt-1 font-display font-black text-xl sm:text-2xl lg:text-3xl">
                      {stage.title}
                    </h2>
                    <p className="mt-1.5 text-sm sm:text-base text-white/90 max-w-2xl">
                      {stage.description}
                    </p>
                  </div>

                  {/* Stage Progress Summary Box */}
                  <div className="bg-white/15 backdrop-blur-xs rounded-2xl px-4 py-3 border border-white/25 shrink-0 min-w-[175px]">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                      <span>إنجاز المرحلة</span>
                      <span className="tabular-nums">
                        {stageCompletedCount} / {stageStations.length}
                      </span>
                    </div>
                    <div className="mt-2 w-full h-2.5 rounded-full bg-black/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-300 transition-all duration-500"
                        style={{ width: `${stagePercent}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-100">
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" aria-hidden="true" />
                      <span className="tabular-nums">
                        {stageStarsEarned} / {stageMaxStars} نجمة
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Winding Road Map Canvas for the 10 Stations of this Stage */}
              <div
                className={`relative w-full h-[1120px] sm:h-[1180px] bg-gradient-to-b ${theme.mapBg}`}
              >
                {/* Scenic Hills & Clouds SVG */}
                <svg
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                >
                  <g fill="#FFFFFF" opacity="0.65">
                    <ellipse cx="200" cy="80" rx="70" ry="22" />
                    <ellipse cx="800" cy="180" rx="65" ry="20" />
                    <ellipse cx="180" cy="540" rx="60" ry="18" />
                    <ellipse cx="830" cy="760" rx="70" ry="22" />
                  </g>
                  <path
                    d="M 0 380 Q 300 330 600 375 T 1000 350 L 1000 1000 L 0 1000 Z"
                    fill="#D1FAE5"
                    opacity="0.3"
                  />
                  <path
                    d="M 0 720 Q 350 670 680 725 T 1000 700 L 1000 1000 L 0 1000 Z"
                    fill="#A7F3D0"
                    opacity="0.24"
                  />
                </svg>

                {/* Winding S-Curve Road Connecting Stations 1..10 of the Stage */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                >
                  <path
                    d={FULL_STAGE_PATH_D}
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="22"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.5"
                  />
                  <path
                    d={FULL_STAGE_PATH_D}
                    fill="none"
                    stroke="#FEFCE8"
                    strokeWidth="15"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={FULL_STAGE_PATH_D}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2.5"
                    strokeDasharray="8 8"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.55"
                  />

                  {/* Illuminated Gold/Emerald Path for Unlocked Segments */}
                  {STAGE_SEGMENTS.map((seg) => {
                    const fromStation = stageStations[seg.index];
                    const toStation = stageStations[seg.index + 1];
                    if (!fromStation || !toStation) return null;
                    const isLit = progress.unlockedStationId >= toStation.id;
                    if (!isLit) return null;
                    return (
                      <g key={seg.index}>
                        <path
                          d={seg.d}
                          fill="none"
                          stroke="#A7F3D0"
                          strokeWidth="15"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          d={seg.d}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="3.5"
                          strokeDasharray="10 7"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* 10 Numbered Circular Stations */}
                {stageStations.map((station, idx) => {
                  const pos = NODE_POSITIONS[idx];
                  const isCompleted = Boolean(progress.completedStations[station.id]);
                  const isUnlocked = station.id <= progress.unlockedStationId;
                  const isCurrentActive =
                    station.id === progress.unlockedStationId && !isCompleted;
                  const earnedStars = progress.completedStations[station.id] || 0;
                  const isWiggling = wigglingId === station.id;

                  return (
                    <div
                      key={station.id}
                      id={isCurrentActive ? 'active-station-node' : undefined}
                      style={{
                        left: `${pos.xPercent}%`,
                        top: `${pos.yPercent}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
                    >
                      <div className="relative flex items-center justify-center">
                        {isCurrentActive && (
                          <span
                            className="absolute -inset-2.5 rounded-full bg-amber-300/70 blur-xs animate-noor-halo pointer-events-none"
                            aria-hidden="true"
                          />
                        )}

                        <motion.button
                          type="button"
                          whileHover={isUnlocked ? { scale: 1.07 } : { scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStationPress(station)}
                          aria-label={
                            isUnlocked
                              ? `المحطة ${station.id}: ${station.title} - ${
                                  isCompleted ? 'مكتملة' : 'مفتوحة، اضغط للبدء'
                                }`
                              : `المحطة ${station.id}: ${station.title} - مقفلة`
                          }
                          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                            isWiggling ? 'animate-lock-wiggle' : ''
                          } ${
                            isCompleted
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-4 border-amber-300 shadow-md shadow-emerald-700/25'
                              : isCurrentActive
                              ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-500 text-white border-4 border-white shadow-xl shadow-amber-500/40 ring-4 ring-amber-300/75'
                              : 'bg-slate-200/95 text-slate-600 border-3 border-white shadow-sm hover:bg-slate-300/90'
                          }`}
                        >
                          {isUnlocked ? (
                            <>
                              <span className="font-display font-black text-xl sm:text-2xl leading-none tabular-nums">
                                {station.id}
                              </span>
                              {isCompleted ? (
                                <CheckCircle2
                                  className="w-4 h-4 text-amber-200 mt-0.5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Sparkles
                                  className="w-4 h-4 text-amber-100 mt-0.5"
                                  aria-hidden="true"
                                />
                              )}
                            </>
                          ) : (
                            <>
                              <Lock
                                className="w-5 h-5 text-slate-500 mb-0.5"
                                aria-hidden="true"
                              />
                              <span className="font-display font-extrabold text-xs sm:text-sm text-slate-600 leading-none tabular-nums">
                                {station.id}
                              </span>
                            </>
                          )}
                        </motion.button>
                      </div>

                      {/* Station Title Card */}
                      <button
                        type="button"
                        onClick={() => handleStationPress(station)}
                        className={`mt-1.5 px-2 sm:px-3 py-1.5 rounded-xl border text-center shadow-xs transition-colors cursor-pointer w-[128px] min-[400px]:w-[148px] sm:w-[190px] ${
                          isUnlocked
                            ? 'bg-white/95 border-emerald-200 hover:border-amber-400 text-emerald-950'
                            : 'bg-white/80 border-slate-200 text-slate-500'
                        }`}
                      >
                        <p className="font-display font-extrabold text-xs sm:text-sm leading-snug line-clamp-1">
                          {station.title}
                        </p>

                        {isCompleted ? (
                          <div
                            className="mt-0.5 flex items-center justify-center gap-0.5"
                            aria-label={`${earnedStars} من 3 نجوم`}
                          >
                            {[1, 2, 3].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  starIdx <= earnedStars
                                    ? 'text-amber-500 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                        ) : isCurrentActive ? (
                          <span className="block mt-0.5 text-[11px] font-extrabold text-emerald-700">
                            مفتوحة · اضغط للانطلاق
                          </span>
                        ) : (
                          <span className="block mt-0.5 text-[11px] font-bold text-slate-500">
                            مقفلة
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* In-UI Reset Confirmation Modal */}
      {confirmReset && (
        <div
          className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200 shadow-2xl text-center"
          >
            <h2
              id="reset-dialog-title"
              className="font-display font-black text-xl sm:text-2xl text-emerald-950"
            >
              هل تريد بدء الرحلة من جديد؟
            </h2>
            <p className="mt-2.5 text-slate-600 text-base">
              سيعود رصيد نجوم النور إلى الصفر وتُفتح المحطة الأولى فقط لتلعبها مجدداً.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onResetProgress();
                }}
                className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base cursor-pointer transition-colors"
              >
                نعم، ابدأ من جديد
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base cursor-pointer transition-colors"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
};
