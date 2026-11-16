import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Bird,
  BookOpen,
  Check,
  Crown,
  Feather,
  Flame,
  Flower2,
  Heart,
  Home,
  Lamp,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trees,
  Trophy,
} from 'lucide-react';
import { STORE_ITEMS } from '../data/storeItems';
import { GameProgress, StoreCategory, StoreItem } from '../types/game';

interface StoreScreenProps {
  progress: GameProgress;
  availableStars: number;
  onBuyItem: (item: StoreItem) => void;
  onActivateItem: (item: StoreItem) => void;
  onDeactivateKind: (kind: 'title' | 'frame' | 'background') => void;
  onBackHome: () => void;
}

type FilterTab = 'all' | StoreCategory | 'cabinet';

function renderStoreIcon(iconName: StoreItem['iconName'], className = 'w-6 h-6') {
  switch (iconName) {
    case 'heart':
      return <Heart className={className} aria-hidden="true" />;
    case 'shield':
      return <ShieldCheck className={className} aria-hidden="true" />;
    case 'book':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'feather':
      return <Feather className={className} aria-hidden="true" />;
    case 'award':
      return <Award className={className} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles className={className} aria-hidden="true" />;
    case 'star':
      return <Star className={className} aria-hidden="true" />;
    case 'home':
      return <Home className={className} aria-hidden="true" />;
    case 'sun':
      return <Sun className={className} aria-hidden="true" />;
    case 'flame':
      return <Flame className={className} aria-hidden="true" />;
    case 'bird':
      return <Bird className={className} aria-hidden="true" />;
    case 'lamp':
      return <Lamp className={className} aria-hidden="true" />;
    case 'crown':
      return <Crown className={className} aria-hidden="true" />;
    case 'trees':
      return <Trees className={className} aria-hidden="true" />;
    case 'moon':
      return <Moon className={className} aria-hidden="true" />;
    case 'flower':
      return <Flower2 className={className} aria-hidden="true" />;
  }
}

export const StoreScreen: React.FC<StoreScreenProps> = ({
  progress,
  availableStars,
  onBuyItem,
  onActivateItem,
  onDeactivateKind,
  onBackHome,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [celebratingItem, setCelebratingItem] = useState<{
    item: StoreItem;
    justPurchased: boolean;
  } | null>(null);

  const purchasedSet = new Set(progress.purchasedItemIds);
  const ownedMedals = STORE_ITEMS.filter(
    (item) => item.category === 'medals' && purchasedSet.has(item.id)
  );

  const isItemActive = (item: StoreItem) => {
    if (item.category === 'titles') return progress.activeTitleId === item.id;
    if (item.themeKind === 'frame') return progress.activeFrameId === item.id;
    if (item.themeKind === 'background')
      return progress.activeBackgroundId === item.id;
    return false;
  };

  const handleBuyClick = (item: StoreItem) => {
    if (purchasedSet.has(item.id) || availableStars < item.price) return;
    onBuyItem(item);
    setCelebratingItem({ item, justPurchased: true });
  };

  const handleToggleActivate = (item: StoreItem) => {
    if (isItemActive(item)) {
      if (item.category === 'titles') onDeactivateKind('title');
      else if (item.themeKind === 'frame') onDeactivateKind('frame');
      else if (item.themeKind === 'background') onDeactivateKind('background');
    } else {
      onActivateItem(item);
    }
  };

  const sections: {
    id: StoreCategory;
    title: string;
    subtitle: string;
    items: StoreItem[];
  }[] = [
    {
      id: 'titles',
      title: 'القسم الأول: ألقاب الشرف',
      subtitle: 'تُعرض ألقاب الشرف المفعّلة بجانب اسمك في أعلى الشاشة بكل فخر.',
      items: STORE_ITEMS.filter((i) => i.category === 'titles'),
    },
    {
      id: 'medals',
      title: 'القسم الثاني: أوسمة وبطاقات معنوية',
      subtitle: 'أوسمة وحكم قصيرة مستوحاة من أهل البيت (عليهم السلام) تُحفظ في خزانة إنجازاتك.',
      items: STORE_ITEMS.filter((i) => i.category === 'medals'),
    },
    {
      id: 'themes',
      title: 'القسم الثالث: إطارات وخلفيات مبهجة',
      subtitle: 'غيّر شكل واجهة اللعبة وزيّن صورة ملفك بألوان وإطارات جميلة.',
      items: STORE_ITEMS.filter((i) => i.category === 'themes'),
    },
  ];

  const visibleSections =
    activeTab === 'all'
      ? sections
      : activeTab === 'cabinet'
      ? []
      : sections.filter((s) => s.id === activeTab);

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
      {/* Top Store Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-7 border border-amber-200/90 shadow-lg shadow-emerald-950/5 mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-bold text-sm sm:text-base flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-emerald-950">
                متجر الأنوار
              </h1>
              <p className="text-sm sm:text-base text-slate-700 mt-0.5">
                استبدل نجوم النور التي جمعتها بألقاب شرف وأوسمة وخلفيات مبهجة!
              </p>
            </div>
          </div>

          {/* Available Star Balance */}
          <div className="rounded-2xl px-5 py-3 bg-gradient-to-l from-amber-50 to-amber-100 border-2 border-amber-300 flex items-center justify-between sm:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Star
                className="w-7 h-7 text-amber-500 fill-amber-400"
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-amber-900">رصيدك المتاح:</span>
            </div>
            <span className="font-display font-black text-2xl text-amber-950 tabular-nums">
              {availableStars} نجمة
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          className="mt-5 sm:mt-6 pt-4 border-t border-emerald-100 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap"
          role="tablist"
          aria-label="أقسام متجر الأنوار"
        >
          {[
            { id: 'all' as const, label: 'جميع الأقسام' },
            { id: 'titles' as const, label: 'ألقاب الشرف (6)' },
            { id: 'medals' as const, label: 'أوسمة وبطاقات (6)' },
            { id: 'themes' as const, label: 'إطارات وخلفيات (4)' },
            {
              id: 'cabinet' as const,
              label: `خزانة إنجازاتي (${progress.purchasedItemIds.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-base transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trophy Cabinet View */}
      {activeTab === 'cabinet' && (
        <section
          aria-label="خزانة إنجازات الطفل"
          className="bg-white/90 rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-md mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Trophy className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-emerald-950">
                خزانة إنجازات {progress.childName}
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                كل الأوسمة والبطاقات والألقاب والخلفيات التي اقتنيتها في رحلتك محفوظة هنا.
              </p>
            </div>
          </div>

          {progress.purchasedItemIds.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-sky-50/70 border border-sky-200">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" aria-hidden="true" />
              <p className="font-display font-bold text-lg text-emerald-950">
                خزانتك بانتظار أول وسام أو لقب!
              </p>
              <p className="text-slate-600 mt-1 text-base">
                اجمع 10 نجوم من المحطات الأولى واختر ما يعجبك من متجر الأنوار.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="mt-5 min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors"
              >
                استعراض المتجر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STORE_ITEMS.filter((i) => purchasedSet.has(i.id)).map((item) => {
                const active = isItemActive(item);
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl p-5 bg-gradient-to-br from-white to-amber-50/50 border border-amber-200 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          {renderStoreIcon(item.iconName)}
                        </div>
                        <div>
                          <h3 className="font-display font-extrabold text-lg text-emerald-950">
                            {item.name}
                          </h3>
                          {item.inspiration && (
                            <p className="text-xs font-bold text-sky-700">
                              {item.inspiration}
                            </p>
                          )}
                        </div>
                      </div>
                      {item.wisdomText ? (
                        <p className="mt-3 text-sm text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-100">
                          {item.wisdomText}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-slate-600">{item.description}</p>
                      )}
                    </div>

                    {item.category === 'medals' ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCelebratingItem({ item, justPurchased: false })
                        }
                        className="min-h-[44px] w-full rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-sm cursor-pointer transition-colors"
                      >
                        عرض البطاقة والحكمة
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleActivate(item)}
                        className={`min-h-[44px] w-full rounded-xl font-bold text-sm cursor-pointer transition-colors ${
                          active
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                        }`}
                      >
                        {active ? 'مُفعّل حالياً (إلغاء)' : 'تفعيل الآن'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Owned Medals Quick Bar when viewing Store */}
      {activeTab === 'all' && ownedMedals.length > 0 && (
        <div className="mb-8 rounded-2xl bg-amber-50/90 border border-amber-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-display font-extrabold text-base text-amber-950">
                في خزانة إنجازاتك الآن: {ownedMedals.length} من 6 أوسمة وبطاقات معنوية
              </p>
              <p className="text-xs sm:text-sm text-amber-800">
                اضغط على أي وسام مقتنى لقراءة حكمته أو افتح خزانة إنجازاتك.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('cabinet')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-bold text-sm cursor-pointer transition-colors"
          >
            فتح خزانة إنجازاتي
          </button>
        </div>
      )}

      {/* Store Sections */}
      <div className="space-y-10">
        {visibleSections.map((section) => (
          <section key={section.id} aria-labelledby={`section-heading-${section.id}`}>
            <div className="mb-4">
              <h2
                id={`section-heading-${section.id}`}
                className="font-display font-black text-xl sm:text-2xl text-emerald-950"
              >
                {section.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                {section.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {section.items.map((item) => {
                const isPurchased = purchasedSet.has(item.id);
                const isActive = isItemActive(item);
                const canAfford = availableStars >= item.price;

                return (
                  <article
                    key={item.id}
                    className={`rounded-3xl p-5 sm:p-6 bg-white/95 border-2 flex flex-col justify-between gap-5 shadow-sm transition-shadow ${
                      isActive
                        ? 'border-emerald-500 shadow-emerald-900/10'
                        : isPurchased
                        ? 'border-amber-300'
                        : 'border-emerald-100 hover:border-sky-200'
                    }`}
                  >
                    <div>
                      {/* Preview Swatch for Themes */}
                      {item.previewGradient && (
                        <div
                          className={`h-16 rounded-2xl mb-4 bg-gradient-to-l ${item.previewGradient} border border-amber-200/80 flex items-center justify-center`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white/85 flex items-center justify-center text-amber-600 shadow-xs">
                            {renderStoreIcon(item.iconName, 'w-5 h-5')}
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {!item.previewGradient && (
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                isPurchased
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {renderStoreIcon(item.iconName, 'w-6 h-6')}
                            </div>
                          )}
                          <div>
                            <h3 className="font-display font-black text-lg text-emerald-950 leading-snug">
                              {item.name}
                            </h3>
                            {item.inspiration && (
                              <p className="text-xs font-bold text-sky-700 mt-0.5">
                                {item.inspiration}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price display */}
                        {!isPurchased && (
                          <div className="flex items-center gap-1 text-amber-800 font-display font-black text-base shrink-0 tabular-nums">
                            <Star
                              className="w-4 h-4 text-amber-500 fill-amber-400"
                              aria-hidden="true"
                            />
                            <span>{item.price}</span>
                          </div>
                        )}
                      </div>

                      <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Area */}
                    <div>
                      {!isPurchased ? (
                        <button
                          type="button"
                          onClick={() => handleBuyClick(item)}
                          disabled={!canAfford}
                          className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 transition-colors ${
                            canAfford
                              ? 'bg-gradient-to-l from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white shadow-sm cursor-pointer'
                              : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              canAfford ? 'fill-white text-white' : 'text-slate-400'
                            }`}
                            aria-hidden="true"
                          />
                          <span>
                            {canAfford
                              ? `شراء (${item.price} نجمة)`
                              : `ينقصك ${item.price - availableStars} نجمة`}
                          </span>
                        </button>
                      ) : item.category === 'medals' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCelebratingItem({ item, justPurchased: false })
                          }
                          className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-950 font-display font-bold text-base flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                          <span>في خزانتك · اقرأ الحكمة</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleActivate(item)}
                          className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-sky-50 border border-sky-300 hover:bg-sky-100 text-sky-900'
                          }`}
                        >
                          {isActive && <Check className="w-4 h-4" aria-hidden="true" />}
                          <span>
                            {isActive ? 'مُفعّل الآن · اضغط للإلغاء' : 'تفعيل'}
                          </span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Purchase / Medal Celebration Modal */}
      {celebratingItem && (
        <div
          className="fixed inset-0 z-50 bg-emerald-950/45 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebrate-item-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-2xl text-center"
          >
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-400 text-amber-700 mb-4">
              <span
                className="absolute -inset-2 rounded-full border-2 border-amber-300/70 animate-noor-halo pointer-events-none"
                aria-hidden="true"
              />
              {renderStoreIcon(celebratingItem.item.iconName, 'w-10 h-10')}
            </div>

            <p className="text-sm font-bold text-emerald-700">
              {celebratingItem.justPurchased ? 'مبارك لك الاقتناء الجديد!' : 'من خزانة إنجازاتك'}
            </p>
            <h2
              id="celebrate-item-title"
              className="mt-1 font-display font-black text-2xl sm:text-3xl text-emerald-950"
            >
              {celebratingItem.item.name}
            </h2>

            <p className="mt-3 text-slate-700 text-base sm:text-lg leading-relaxed">
              {celebratingItem.item.celebrationMessage}
            </p>

            {celebratingItem.item.wisdomText && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 font-display font-bold text-base leading-relaxed">
                {celebratingItem.item.wisdomText}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              {(celebratingItem.item.category === 'titles' ||
                celebratingItem.item.category === 'themes') &&
                !isItemActive(celebratingItem.item) && (
                  <button
                    type="button"
                    onClick={() => {
                      onActivateItem(celebratingItem.item);
                      setCelebratingItem(null);
                    }}
                    className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-base cursor-pointer transition-colors"
                  >
                    تفعيل الآن
                  </button>
                )}

              <button
                type="button"
                onClick={() => setCelebratingItem(null)}
                className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-display font-bold text-base cursor-pointer transition-colors"
              >
                {celebratingItem.item.category === 'medals' ? 'حفظ في خزانتي' : 'حسناً'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
};
