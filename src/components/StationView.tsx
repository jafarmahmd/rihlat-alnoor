import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Star,
  HelpCircle,
} from 'lucide-react';
import { STAGES, STATIONS } from '../data/stations';
import { StationData } from '../types/game';
import { StationIllustration } from './StationIllustration';

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

  // Reset local view state whenever navigating directly to the next station
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
    <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
      {/* Top Station Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <button
          type="button"
          onClick={onBackToMap}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-900 font-bold text-sm sm:text-base flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
          <span>العودة إلى الخريطة</span>
        </button>

        <div className="text-sm sm:text-base font-bold text-emerald-800 text-left">
          {stage && <span>المرحلة {stage.id}</span>}
          <span className="mx-2 text-amber-500" aria-hidden="true">·</span>
          <span>
            المحطة <span className="tabular-nums">{station.id}</span> من{' '}
            <span className="tabular-nums">{STATIONS.length}</span>
          </span>
          <span className="mx-2 text-amber-500 hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline">{station.valueLabel}</span>
        </div>
      </div>

      {/* Phase 1: Real Historical Story & Top Visual Scene */}
      {phase === 'story' && (
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 rounded-3xl border border-emerald-200 shadow-xl shadow-emerald-950/5 overflow-hidden"
        >
          {/* Bespoke Vector Scene Above the Story Text */}
          <StationIllustration
            stationId={station.id}
            stageId={station.stageId}
            title={station.title}
          />

          {/* Story Text Body */}
          <div className="p-4 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-sm sm:text-base font-bold text-sky-700">
                {station.subtitle}
              </p>
              <h1 className="mt-1 font-display font-black text-2xl sm:text-3xl text-emerald-950">
                {station.title}
              </h1>

              <div className="mt-5 space-y-4 text-slate-700 text-lg sm:text-xl leading-relaxed">
                {station.storyParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950">
                <p className="font-display font-extrabold text-sm text-amber-800 mb-1">
                  حكمة القصة:
                </p>
                <p className="font-display font-bold text-base sm:text-lg leading-snug">
                  «{station.wisdomQuote}»
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setPhase('quiz')}
                className="w-full sm:w-auto min-h-[56px] px-8 py-3.5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-display font-black text-xl shadow-lg shadow-emerald-700/20 border border-amber-300/80 flex items-center justify-center gap-3 cursor-pointer transition-colors"
              >
                <Sparkles className="w-6 h-6 text-amber-200" aria-hidden="true" />
                <span>فكّر وأجب عن التحدي</span>
              </button>
            </div>
          </div>
        </motion.article>
      )}

      {/* Phase 2: Interactive Comprehension Question */}
      {phase === 'quiz' && currentQuestion && (
        <motion.section
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 rounded-3xl border border-emerald-200 shadow-xl shadow-emerald-950/5 p-4 sm:p-10"
        >
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-emerald-100">
            <div className="flex items-center gap-2.5 text-sky-800 font-bold text-base">
              <HelpCircle className="w-5 h-5 text-sky-600" aria-hidden="true" />
              <span>سؤال الفهم والاستنتاج · {station.valueLabel}</span>
            </div>
            <span className="text-sm font-bold text-emerald-700 tabular-nums">
              المحطة {station.id}
            </span>
          </div>

          <h2 className="mt-6 font-display font-extrabold text-xl sm:text-2xl text-emerald-950 leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="mt-6 space-y-3.5">
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
                  className={`w-full min-h-[60px] px-5 py-4 rounded-2xl border-2 text-right font-bold text-base sm:text-lg flex items-center justify-between gap-4 transition-all cursor-pointer ${
                    isCorrectChoice
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                      : isWrongChoice
                      ? 'bg-amber-50 border-amber-400 text-amber-950'
                      : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-slate-800'
                  }`}
                >
                  <span>{option.text}</span>
                  {isCorrectChoice && (
                    <CheckCircle2
                      className="w-6 h-6 text-emerald-600 shrink-0"
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
              className={`mt-6 p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                feedback.isCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <p className="font-bold text-base sm:text-lg leading-relaxed">
                {feedback.text}
              </p>

              {feedback.isCorrect && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-base whitespace-nowrap shrink-0 cursor-pointer transition-colors"
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
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 rounded-3xl border-2 border-amber-300 shadow-xl p-5 sm:p-12 text-center"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: idx * 0.09, type: 'spring', stiffness: 260, damping: 16 }}
              >
                <Star
                  className="w-10 h-10 sm:w-14 sm:h-14 text-amber-500 fill-amber-400 drop-shadow"
                  aria-hidden="true"
                />
              </motion.div>
            ))}
          </div>

          <h2 className="font-display font-black text-3xl sm:text-4xl text-emerald-950">
            أحسنت يا بطل النور!
          </h2>

          <p className="mt-3 text-lg sm:text-xl text-slate-700 max-w-xl mx-auto leading-relaxed">
            أكملت المحطة{' '}
            <span className="font-bold tabular-nums">{station.id}</span>:{' '}
            <strong className="text-emerald-800">{station.title}</strong>
            {alreadyCompleted
              ? ' وراجعت هذه القيمة الجميلة.'
              : ` وحصلت على ${station.starsReward} نجوم نور مضيئة!`}
          </p>

          {hasNextStation && !alreadyCompleted && (
            <p className="mt-3 font-bold text-sky-700 text-base sm:text-lg">
              لقد فُتحت لك المحطة {station.id + 1} بنجاح!
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {hasNextStation && (
              <button
                type="button"
                onClick={() => onGoToNextStation(station.id + 1)}
                className="w-full sm:w-auto min-h-[56px] px-8 py-3.5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-display font-black text-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>المحطة التالية ({station.id + 1})</span>
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={onBackToMap}
              className="w-full sm:w-auto min-h-[56px] px-8 py-3.5 rounded-2xl bg-white border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-900 font-display font-bold text-lg cursor-pointer transition-colors"
            >
              العودة إلى الخريطة
            </button>
          </div>
        </motion.section>
      )}
    </main>
  );
};
