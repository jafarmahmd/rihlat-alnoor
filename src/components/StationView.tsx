import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Star,
} from 'lucide-react';
import { STAGES, STATIONS } from '../data/stations';
import { StationData } from '../types/game';
import { StationIllustration } from './StationIllustration';
import {
  BirthStarMark,
  CornerOrnaments,
  ManuscriptDivider,
} from './IslamicOrnaments';

interface StationViewProps {
  station: StationData;
  alreadyCompleted: boolean;
  onCompleteStation: (stationId: number, starsEarned: number) => void;
  onBackToMap: () => void;
  onGoToNextStation: (nextStationId: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
  onVictory: () => void;
}

type StationPhase = 'story' | 'quiz' | 'celebration';

export const StationView: React.FC<StationViewProps> = ({
  station,
  alreadyCompleted,
  onCompleteStation,
  onBackToMap,
  onGoToNextStation,
  onCorrectAnswer,
  onWrongAnswer,
  onVictory,
}) => {
  const [phase, setPhase] = useState<StationPhase>('story');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);

  useEffect(() => {
    setPhase('story');
    setQuestionIndex(0);
    setSelectedOptionId(null);
    setFeedback(null);
  }, [station.id]);

  const stage = STAGES.find((s) => s.id === station.stageId);
  const currentQuestion = station.questions[questionIndex];
  const hasNextStation = station.id < STATIONS.length;

  const handleOptionSelect = (optionId: string) => {
    if (feedback?.isCorrect) return;

    const chosen = currentQuestion.options.find((opt) => opt.id === optionId);
    if (!chosen) return;

    setSelectedOptionId(optionId);
    setFeedback({ text: chosen.feedback, isCorrect: chosen.isCorrect });

    if (chosen.isCorrect) {
      onCorrectAnswer();
    } else {
      onWrongAnswer();
    }
  };

  const handleNextStep = () => {
    if (questionIndex + 1 < station.questions.length) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setFeedback(null);
    } else {
      setPhase('celebration');
      onVictory();
      onCompleteStation(station.id, station.starsReward);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-9">
      {/* Top Station Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#B8924A]/35">
        <button
          type="button"
          onClick={onBackToMap}
          className="min-h-[42px] px-3.5 py-2 btn-manuscript text-sm flex items-center gap-2 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
          <span>العودة إلى الخريطة</span>
        </button>

        <div className="text-xs sm:text-sm font-bold text-[#0F3D2E] text-left">
          {stage && <span>المرحلة {stage.id}</span>}
          <span className="mx-2 text-[#B8924A]" aria-hidden="true">·</span>
          <span>
            المحطة <span className="tabular-nums">{station.id}</span> من{' '}
            <span className="tabular-nums">{STATIONS.length}</span>
          </span>
          <span className="mx-2 text-[#B8924A] hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline text-[#7A5420]">{station.valueLabel}</span>
        </div>
      </div>

      {/* Phase 1: Real Historical Story & Top Illustration */}
      {phase === 'story' && (
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="manuscript-folio paper-grain rounded-[6px] overflow-hidden"
        >
          <StationIllustration
            stationId={station.id}
            stageId={station.stageId}
            title={station.title}
          />

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="max-w-prose mx-auto">
              <p className="text-xs sm:text-sm font-bold text-[#1F6B50]">
                {station.subtitle}
              </p>
              <h1 className="mt-1 font-calligraphy font-bold text-2xl sm:text-4xl text-[#0F3D2E]">
                {station.title}
              </h1>

              <ManuscriptDivider variant="flourish" />

              <div className="mt-4 space-y-4 text-[#11271F] text-lg sm:text-xl leading-[2.1]">
                {station.storyParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              <div className="mt-7 p-4 sm:p-5 rounded-[5px] bg-[#F3ECDA]/75 border border-[#B8924A]/50 border-r-[3px] border-r-[#B8924A] text-[#11271F]">
                <p className="font-display font-bold text-xs text-[#7A5420] mb-1">
                  حكمة القصة
                </p>
                <p className="font-arabic font-bold text-lg sm:text-xl leading-relaxed text-[#0F3D2E]">
                  «{station.wisdomQuote}»
                </p>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPhase('quiz')}
                  className="w-full sm:w-auto min-h-[50px] px-7 py-2.5 btn-gilded text-base sm:text-lg flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <BirthStarMark className="w-4 h-4 text-[#0F3D2E]" />
                  <span>فكّر وأجب عن التحدي</span>
                </button>
              </div>
            </div>
          </div>
        </motion.article>
      )}

      {/* Phase 2: Interactive Comprehension Question */}
      {phase === 'quiz' && currentQuestion && (
        <motion.section
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative manuscript-folio paper-grain rounded-[6px] p-7 sm:p-10"
        >
          <CornerOrnaments />

          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#B8924A]/35 pt-2">
            <div className="flex items-center gap-2 text-[#1F6B50] font-display font-bold text-sm sm:text-base">
              <HelpCircle className="w-5 h-5 text-[#B8924A]" aria-hidden="true" />
              <span>سؤال الفهم والاستنتاج · {station.valueLabel}</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#7A5420] tabular-nums">
              المحطة {station.id}
            </span>
          </div>

          <h2 className="mt-6 font-display font-bold text-xl sm:text-2xl text-[#0F3D2E] leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isCorrectChoice = isSelected && option.isCorrect;
              const isWrongChoice = isSelected && !option.isCorrect;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option.id)}
                  disabled={Boolean(feedback?.isCorrect)}
                  className={`w-full min-h-[56px] px-5 py-3.5 rounded-[5px] border text-right font-bold text-base sm:text-lg flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                    isCorrectChoice
                      ? 'bg-[#0F3D2E] border-[#B8924A] text-[#FAF6EC]'
                      : isWrongChoice
                      ? 'bg-[#F3ECDA] border-[#7A5420] text-[#7A5420]'
                      : 'bg-[#FAF6EC] border-[#B8924A]/45 hover:border-[#0F3D2E] hover:bg-[#F3ECDA]/65 text-[#11271F]'
                  }`}
                >
                  <span>{option.text}</span>
                  {isCorrectChoice && (
                    <CheckCircle2
                      className="w-5 h-5 text-[#D9B96A] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
              className={`mt-6 p-5 rounded-[5px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                feedback.isCorrect
                  ? 'bg-[#F3ECDA]/85 border-[#1F6B50] text-[#0F3D2E]'
                  : 'bg-[#F3ECDA] border-[#B8924A] text-[#7A5420]'
              }`}
            >
              <p className="font-bold text-base leading-relaxed">
                {feedback.text}
              </p>

              {feedback.isCorrect && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2 btn-emerald text-sm sm:text-base whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {questionIndex + 1 < station.questions.length
                    ? 'السؤال التالي'
                    : 'استلم نجوم النور'}
                </button>
              )}
            </motion.div>
          )}
        </motion.section>
      )}

      {/* Phase 3: Victory Celebration */}
      {phase === 'celebration' && (
        <motion.section
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative manuscript-folio paper-grain rounded-[6px] p-7 sm:p-12 text-center"
        >
          <CornerOrnaments />

          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: idx * 0.08, type: 'spring', stiffness: 260, damping: 18 }}
              >
                <Star
                  className="w-9 h-9 sm:w-12 sm:h-12 text-[#B8924A] fill-[#D9B96A]"
                  aria-hidden="true"
                />
              </motion.div>
            ))}
          </div>

          <h2 className="font-calligraphy font-bold text-3xl sm:text-4xl text-[#0F3D2E]">
            أحسنت يا بطل النور!
          </h2>

          <ManuscriptDivider variant="rosette" />

          <p className="mt-2 text-base sm:text-lg text-[#425B51] max-w-xl mx-auto leading-relaxed">
            أكملت المحطة{' '}
            <span className="font-bold text-[#0F3D2E] tabular-nums">{station.id}</span>:{' '}
            <strong className="text-[#0F3D2E]">{station.title}</strong>
            {alreadyCompleted
              ? ' وراجعت هذه القيمة الجميلة.'
              : ` وحصلت على ${station.starsReward} نجوم نور مضيئة!`}
          </p>

          {hasNextStation && !alreadyCompleted && (
            <p className="mt-3 font-bold text-[#1F6B50] text-sm sm:text-base">
              لقد فُتحت لك المحطة {station.id + 1} بنجاح!
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {hasNextStation && (
              <button
                type="button"
                onClick={() => onGoToNextStation(station.id + 1)}
                className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 btn-gilded text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>المحطة التالية ({station.id + 1})</span>
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={onBackToMap}
              className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 btn-manuscript text-base cursor-pointer"
            >
              العودة إلى الخريطة
            </button>
          </div>
        </motion.section>
      )}
    </main>
  );
};
