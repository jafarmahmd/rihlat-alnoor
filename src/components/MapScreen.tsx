import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Navigation,
  RotateCcw,
  Star,
} from 'lucide-react';
import { STAGES, STATIONS, TOTAL_POSSIBLE_STARS } from '../data/stations';
import { GameProgress, StageData, StationData } from '../types/game';
import {
  BirthStarMark,
  JourneyCompassIcon,
  ManuscriptDivider,
} from './IslamicOrnaments';

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
    mapBg: string;
    hillLight: string;
    hillDeep: string;
  }
> = {
  emerald: {
    headerBg: 'bg-[#0F3D2E]',
    mapBg: 'from-[#FBF7ED] via-[#F3ECDA] to-[#EAE4D1]',
    hillLight: '#DCE7DB',
    hillDeep: '#C5D8C7',
  },
  sky: {
    headerBg: 'bg-[#124536]',
    mapBg: 'from-[#F9F6EC] via-[#EEF3EC] to-[#E6EDE6]',
    hillLight: '#D8E5DF',
    hillDeep: '#BFD5CC',
  },
  amber: {
    headerBg: 'bg-[#184B39]',
    mapBg: 'from-[#FCF8EE] via-[#F5EBD6] to-[#EDE1C6]',
    hillLight: '#EADEC2',
    hillDeep: '#DDD0AE',
  },
  teal: {
    headerBg: 'bg-[#0C3629]',
    mapBg: 'from-[#FAF6EC] via-[#EFF2E8] to-[#E5EBDF]',
    hillLight: '#D4E2D8',
    hillDeep: '#BDD1C5',
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
        } أولاً لتضيء لك.`
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
      {/* Journey Ledger Header */}
      <div className="manuscript-folio paper-grain rounded-[6px] p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[42px] px-3.5 py-2 btn-manuscript text-sm flex items-center gap-2 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>
            <div>
              <h1 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E] flex items-center gap-2">
                <JourneyCompassIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
                <span>خريطة رحلة النور</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#425B51] font-medium mt-0.5 tabular-nums">
                المحطات المكتملة:{' '}
                <strong className="text-[#0F3D2E]">{completedCount}</strong> من{' '}
                {STATIONS.length}
                <span className="mx-2 text-[#B8924A]" aria-hidden="true">·</span>
                النجوم:{' '}
                <strong className="text-[#7A5420]">{totalStars}</strong> /{' '}
                {TOTAL_POSSIBLE_STARS}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={scrollToActiveStation}
              className="min-h-[42px] px-4 py-2 btn-gilded text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4" aria-hidden="true" />
              <span>محطتي الحالية ({progress.unlockedStationId})</span>
            </button>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[42px] px-3.5 py-2 btn-manuscript text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#7A5420]" aria-hidden="true" />
                <span>إعادة الرحلة</span>
              </button>
            )}
          </div>
        </div>

        {/* Crisp Gilded Progress Rule */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#425B51] mb-1.5">
            <span>تقدّمك العام عبر المراحل العشر</span>
            <span className="tabular-nums text-[#0F3D2E]">{overallPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#F3ECDA] border border-[#B8924A]/45 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-[#D9B96A] via-[#B8924A] to-[#1F6B50] transition-all duration-500"
              style={{ width: `${Math.max(overallPercent, completedCount > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>

        {/* Quick-Jump 10 Stages Index */}
        <div className="mt-5 pt-4 border-t border-[#B8924A]/30">
          <p className="text-xs font-bold text-[#425B51] mb-2.5">
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
                  className={`min-h-[46px] px-3 py-1.5 rounded-[5px] border text-right transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isStageComplete
                      ? 'bg-[#0F3D2E] border-[#B8924A] text-[#FAF6EC]'
                      : isStageUnlocked
                      ? 'bg-[#F3ECDA] border-[#B8924A]/70 text-[#0F3D2E] hover:bg-[#EAE0C5]'
                      : 'bg-[#FAF6EC] border-[#B8924A]/25 text-[#425B51]/75 hover:bg-[#F3ECDA]/50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-display font-bold text-xs sm:text-sm truncate">
                      المرحلة {stage.id}
                    </div>
                    <div className="text-[11px] font-bold opacity-85 tabular-nums">
                      {stageDoneCount}/10
                    </div>
                  </div>
                  {isStageComplete ? (
                    <CheckCircle2
                      className="w-4 h-4 text-[#D9B96A] shrink-0"
                      aria-hidden="true"
                    />
                  ) : isStageUnlocked ? (
                    <BirthStarMark className="w-4 h-4 text-[#B8924A] shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 opacity-55 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Locked Station Notice */}
      {lockedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="sticky top-20 z-30 mb-5 px-5 py-3 rounded-[6px] bg-[#0F3D2E] border border-[#D9B96A] text-[#FAF6EC] font-display font-bold text-sm sm:text-base flex items-center gap-3 shadow-lg"
        >
          <Lock className="w-4 h-4 text-[#D9B96A] shrink-0" aria-hidden="true" />
          <span>{lockedMessage}</span>
        </motion.div>
      )}

      {/* Grand Completion Celebration */}
      {completedCount === STATIONS.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-6 rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#D9B96A] shadow-lg flex flex-col sm:flex-row items-center gap-4"
        >
          <BirthStarMark className="w-9 h-9 text-[#D9B96A] shrink-0" />
          <div className="text-center sm:text-right">
            <h2 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#D9B96A]">
              مبارك لك يا سفير النور! أتممت المحطات الـ ١٠٠
            </h2>
            <p className="text-[#FAF6EC]/90 text-sm sm:text-base mt-1">
              جمعت {totalStars} نجمة نور وتعلمت أروع القيم من القصص الواقعية لأهل البيت (عليهم السلام).
            </p>
          </div>
        </motion.div>
      )}

      {/* 10 Illuminated Cartographic Stage Trails */}
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
              className="rounded-[6px] overflow-hidden border border-[#B8924A]/65 shadow-md bg-[#FAF6EC] scroll-mt-20"
            >
              {/* Deep Emerald Stage Header */}
              <div
                className={`${theme.headerBg} text-[#FAF6EC] p-5 sm:p-6 border-b border-[#B8924A]/60`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#D9B96A]">
                      المرحلة <span className="tabular-nums">{stage.id}</span> من ١٠
                      <span className="mx-2" aria-hidden="true">·</span>
                      المحطات{' '}
                      <span className="tabular-nums">
                        {stage.stationRange[0]} – {stage.stationRange[1]}
                      </span>
                    </div>
                    <h2 className="mt-1 font-calligraphy font-bold text-2xl sm:text-3xl text-[#FAF6EC]">
                      {stage.title}
                    </h2>
                    <p className="mt-1 text-sm text-[#FAF6EC]/85 max-w-2xl">
                      {stage.description}
                    </p>
                  </div>

                  <div className="bg-[#081A14]/55 rounded-[5px] px-4 py-3 border border-[#D9B96A]/45 shrink-0 min-w-[175px]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#FAF6EC]">
                      <span>إنجاز المرحلة</span>
                      <span className="tabular-nums text-[#D9B96A]">
                        {stageCompletedCount} / {stageStations.length}
                      </span>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-[#05120E] overflow-hidden">
                      <div
                        className="h-full bg-[#D9B96A] transition-all duration-500"
                        style={{ width: `${stagePercent}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-[#D9B96A]">
                      <Star className="w-3.5 h-3.5 fill-[#D9B96A]" aria-hidden="true" />
                      <span className="tabular-nums">
                        {stageStarsEarned} / {stageMaxStars} نجمة
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cartographic Winding Path Canvas */}
              <div
                className={`relative w-full h-[1120px] sm:h-[1180px] bg-gradient-to-b ${theme.mapBg} paper-grain`}
              >
                {/* Warm Parchment Scenic Hills SVG */}
                <svg
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                >
                  <path
                    d="M 0 380 Q 300 330 600 375 T 1000 350 L 1000 1000 L 0 1000 Z"
                    fill={theme.hillLight}
                    opacity="0.4"
                  />
                  <path
                    d="M 0 720 Q 350 670 680 725 T 1000 700 L 1000 1000 L 0 1000 Z"
                    fill={theme.hillDeep}
                    opacity="0.32"
                  />
                </svg>

                {/* Winding Golden / Brass Cartographic Trail */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                >
                  <path
                    d={FULL_STAGE_PATH_D}
                    fill="none"
                    stroke="#B8924A"
                    strokeWidth="16"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.18"
                  />
                  <path
                    d={FULL_STAGE_PATH_D}
                    fill="none"
                    stroke="#FAF6EC"
                    strokeWidth="12"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={FULL_STAGE_PATH_D}
                    fill="none"
                    stroke="#425B51"
                    strokeWidth="1.5"
                    strokeDasharray="7 7"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.4"
                  />

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
                          stroke="#D9B96A"
                          strokeWidth="12"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          opacity="0.35"
                        />
                        <path
                          d={seg.d}
                          fill="none"
                          stroke="#0F3D2E"
                          strokeWidth="2.5"
                          strokeDasharray="9 6"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* 10 Illuminated Station Medallions */}
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
                            className="absolute -inset-2 rounded-full border border-[#B8924A] pointer-events-none"
                            aria-hidden="true"
                          />
                        )}

                        <motion.button
                          type="button"
                          whileHover={isUnlocked ? { scale: 1.06 } : { scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleStationPress(station)}
                          aria-label={
                            isUnlocked
                              ? `المحطة ${station.id}: ${station.title} - ${
                                  isCompleted ? 'مكتملة' : 'مفتوحة، اضغط للبدء'
                                }`
                              : `المحطة ${station.id}: ${station.title} - مقفلة`
                          }
                          className={`relative w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-full flex flex-col items-center justify-center transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8924A] ${
                            isWiggling ? 'animate-lock-wiggle' : ''
                          } ${
                            isCompleted
                              ? 'bg-[#0F3D2E] text-[#FAF6EC] border-2 border-[#D9B96A] shadow-md'
                              : isCurrentActive
                              ? 'bg-gradient-to-b from-[#D9B96A] to-[#B8924A] text-[#0F3D2E] border-2 border-[#0F3D2E] shadow-lg'
                              : 'bg-[#EFE8D6] text-[#425B51] border border-[#B8924A]/45 hover:bg-[#E7DEC8]'
                          }`}
                        >
                          {isUnlocked ? (
                            <>
                              <span className="font-display font-bold text-xl sm:text-2xl leading-none tabular-nums">
                                {station.id}
                              </span>
                              {isCompleted ? (
                                <CheckCircle2
                                  className="w-4 h-4 text-[#D9B96A] mt-0.5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <BirthStarMark className="w-3.5 h-3.5 text-[#0F3D2E] mt-0.5" />
                              )}
                            </>
                          ) : (
                            <>
                              <Lock
                                className="w-4 h-4 text-[#425B51] mb-0.5"
                                aria-hidden="true"
                              />
                              <span className="font-display font-bold text-xs text-[#425B51] leading-none tabular-nums">
                                {station.id}
                              </span>
                            </>
                          )}
                        </motion.button>
                      </div>

                      {/* Station Parchment Plaque */}
                      <button
                        type="button"
                        onClick={() => handleStationPress(station)}
                        className={`mt-1.5 px-2.5 py-1.5 rounded-[5px] border text-center shadow-xs transition-colors cursor-pointer w-[132px] min-[400px]:w-[152px] sm:w-[192px] ${
                          isUnlocked
                            ? 'bg-[#FAF6EC] border-[#B8924A]/65 hover:border-[#0F3D2E] text-[#0F3D2E]'
                            : 'bg-[#FAF6EC]/85 border-[#B8924A]/30 text-[#425B51]'
                        }`}
                      >
                        <p className="font-display font-bold text-xs sm:text-sm leading-snug line-clamp-1">
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
                                    ? 'text-[#B8924A] fill-[#D9B96A]'
                                    : 'text-[#425B51]/30'
                                }`}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                        ) : isCurrentActive ? (
                          <span className="block mt-0.5 text-[11px] font-bold text-[#1F6B50]">
                            مفتوحة · اضغط للانطلاق
                          </span>
                        ) : (
                          <span className="block mt-0.5 text-[11px] font-medium text-[#425B51]/75">
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

      {/* Reset Confirmation Modal */}
      {confirmReset && (
        <div
          className="fixed inset-0 z-50 bg-[#081A14]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md manuscript-folio paper-grain rounded-[6px] p-6 sm:p-7 shadow-2xl text-center"
          >
            <h2
              id="reset-dialog-title"
              className="font-calligraphy font-bold text-2xl text-[#0F3D2E]"
            >
              هل تريد بدء الرحلة من جديد؟
            </h2>
            <ManuscriptDivider variant="rosette" />
            <p className="text-[#425B51] text-sm sm:text-base">
              سيعود رصيد نجوم النور إلى الصفر وتُفتح المحطة الأولى فقط لتلعبها مجدداً.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onResetProgress();
                }}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2 btn-gilded text-sm sm:text-base cursor-pointer"
              >
                نعم، ابدأ من جديد
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2 btn-manuscript text-sm sm:text-base cursor-pointer"
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
