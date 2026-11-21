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
import {
  ManuscriptCornerBracket,
  ManuscriptDivider,
  StoreTreasuryIcon,
} from './IslamicOrnaments';

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
      title: 'ألقاب الشرف الكشفية',
      subtitle: 'تُعرض ألقاب الشرف المفعّلة بجانب اسمك في أعلى الشاشة بكل فخر.',
      items: STORE_ITEMS.filter((i) => i.category === 'titles'),
    },
    {
      id: 'medals',
      title: 'أوسمة وبطاقات معنوية',
      subtitle: 'أوسمة وحكم قصيرة مستوحاة من أهل البيت (عليهم السلام) تُحفظ في خزانة إنجازاتك.',
      items: STORE_ITEMS.filter((i) => i.category === 'medals'),
    },
    {
      id: 'themes',
      title: 'إطارات وخلفيات مبهجة',
      subtitle: 'غيّر مظهر الواجهة وزيّن إطار ملفك بألوان مستوحاة من المخطوطات.',
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
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Top Store Masthead */}
      <div className="manuscript-folio paper-grain rounded-[6px] p-5 sm:p-7 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[42px] px-3.5 py-2 btn-manuscript text-sm flex items-center gap-2 cursor-pointer shrink-0"
            >
              <ArrowRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>
            <div>
              <h1 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E] flex items-center gap-2">
                <StoreTreasuryIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
                <span>خزانة الأنوار</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#425B51] mt-0.5">
                استبدل نجوم النور التي جمعتها بألقاب شرف وأوسمة وخلفيات تراثية
              </p>
            </div>
          </div>

          {/* Gilded Star Balance */}
          <div className="rounded-[5px] px-4 py-2.5 bg-[#0F3D2E] border border-[#D9B96A] text-[#FAF6EC] flex items-center justify-between sm:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Star
                className="w-5 h-5 text-[#D9B96A] fill-[#D9B96A]"
                aria-hidden="true"
              />
              <span className="text-xs sm:text-sm font-medium text-[#D9B96A]">رصيدك المتاح:</span>
            </div>
            <span className="font-display font-bold text-xl sm:text-2xl text-[#FAF6EC] tabular-nums">
              {availableStars} نجمة
            </span>
          </div>
        </div>

        {/* Architectural Treasury Filter Tabs */}
        <div
          className="mt-5 pt-4 border-t border-[#B8924A]/30 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap"
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
              className={`min-h-[40px] px-3.5 py-1.5 rounded-[5px] border font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                  : 'btn-manuscript'
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
          className="manuscript-folio paper-grain rounded-[6px] p-6 sm:p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#B8924A]/30">
            <Trophy className="w-7 h-7 text-[#B8924A] shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E]">
                خزانة إنجازات {progress.childName}
              </h2>
              <p className="text-sm text-[#425B51]">
                كل الأوسمة والبطاقات والألقاب والخلفيات التي اقتنيتها محفوظة هنا.
              </p>
            </div>
          </div>

          {progress.purchasedItemIds.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-[5px] bg-[#F3ECDA]/55 border border-[#B8924A]/35">
              <p className="font-display font-bold text-lg text-[#0F3D2E]">
                خزانتك بانتظار أول وسام أو لقب!
              </p>
              <p className="text-[#425B51] mt-1 text-sm sm:text-base">
                اجمع ١٠ نجوم من المحطات الأولى واختر ما يعجبك من خزانة الأنوار.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="mt-5 min-h-[42px] px-6 py-2 btn-emerald text-sm cursor-pointer"
              >
                استعراض الخزانة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STORE_ITEMS.filter((i) => purchasedSet.has(i.id)).map((item) => {
                const active = isItemActive(item);
                return (
                  <div
                    key={item.id}
                    className="rounded-[5px] p-5 bg-[#FAF6EC] border border-[#B8924A]/55 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#B8924A] shrink-0">
                          {renderStoreIcon(item.iconName)}
                        </span>
                        <div>
                          <h3 className="font-display font-bold text-lg text-[#0F3D2E]">
                            {item.name}
                          </h3>
                          {item.inspiration && (
                            <p className="text-xs font-bold text-[#1F6B50]">
                              {item.inspiration}
                            </p>
                          )}
                        </div>
                      </div>
                      {item.wisdomText ? (
                        <p className="mt-3 text-sm text-[#11271F] leading-relaxed bg-[#F3ECDA]/70 p-3 rounded-[4px] border-r-2 border-[#B8924A]">
                          {item.wisdomText}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-[#425B51]">{item.description}</p>
                      )}
                    </div>

                    {item.category === 'medals' ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCelebratingItem({ item, justPurchased: false })
                        }
                        className="min-h-[42px] w-full btn-manuscript text-sm cursor-pointer"
                      >
                        عرض البطاقة والحكمة
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleActivate(item)}
                        className={`min-h-[42px] w-full text-sm cursor-pointer ${
                          active ? 'btn-emerald' : 'btn-gilded'
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

      {/* Owned Medals Summary Bar */}
      {activeTab === 'all' && ownedMedals.length > 0 && (
        <div className="mb-8 rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#B8924A] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-[#D9B96A] shrink-0" aria-hidden="true" />
            <div>
              <p className="font-display font-bold text-sm sm:text-base text-[#FAF6EC]">
                في خزانة إنجازاتك الآن: {ownedMedals.length} من 6 أوسمة وبطاقات معنوية
              </p>
              <p className="text-xs text-[#D9B96A]/90">
                افتح خزانتك لقراءة الحكم المعنوية المقتناة.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('cabinet')}
            className="min-h-[40px] px-4 py-1.5 btn-gilded text-xs sm:text-sm cursor-pointer"
          >
            فتح خزانة إنجازاتي
          </button>
        </div>
      )}

      {/* Store Sections */}
      <div className="space-y-10">
        {visibleSections.map((section) => (
          <section key={section.id} aria-labelledby={`section-heading-${section.id}`}>
            <div className="mb-4 pb-2 border-b border-[#B8924A]/30">
              <h2
                id={`section-heading-${section.id}`}
                className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E]"
              >
                {section.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#425B51] mt-0.5">
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
                    className={`manuscript-folio paper-grain rounded-[6px] p-5 flex flex-col justify-between gap-5 transition-colors ${
                      isActive
                        ? 'ring-2 ring-[#0F3D2E] border-[#B8924A]'
                        : isPurchased
                        ? 'border-[#B8924A]'
                        : ''
                    }`}
                  >
                    <div>
                      {item.previewGradient && (
                        <div
                          className={`h-14 rounded-[4px] mb-4 bg-gradient-to-l ${item.previewGradient} border border-[#B8924A]/55 flex items-center justify-center`}
                        >
                          <span className="text-[#7A5420]">
                            {renderStoreIcon(item.iconName, 'w-5 h-5')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {!item.previewGradient && (
                            <span
                              className={`mt-0.5 shrink-0 ${
                                isPurchased ? 'text-[#B8924A]' : 'text-[#1F6B50]'
                              }`}
                            >
                              {renderStoreIcon(item.iconName, 'w-5 h-5')}
                            </span>
                          )}
                          <div>
                            <h3 className="font-display font-bold text-lg text-[#0F3D2E] leading-snug">
                              {item.name}
                            </h3>
                            {item.inspiration && (
                              <p className="text-xs font-bold text-[#7A5420] mt-0.5">
                                {item.inspiration}
                              </p>
                            )}
                          </div>
                        </div>

                        {!isPurchased && (
                          <div className="flex items-center gap-1 text-[#7A5420] font-display font-bold text-sm shrink-0 tabular-nums">
                            <Star
                              className="w-4 h-4 text-[#B8924A] fill-[#D9B96A]"
                              aria-hidden="true"
                            />
                            <span>{item.price}</span>
                          </div>
                        )}
                      </div>

                      <p className="mt-3 text-sm text-[#425B51] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div>
                      {!isPurchased ? (
                        <button
                          type="button"
                          onClick={() => handleBuyClick(item)}
                          disabled={!canAfford}
                          className={`w-full min-h-[44px] px-4 py-2 text-sm flex items-center justify-center gap-2 transition-colors ${
                            canAfford
                              ? 'btn-gilded cursor-pointer'
                              : 'rounded-[6px] bg-[#F3ECDA] border border-[#B8924A]/30 text-[#425B51]/70 font-display font-bold cursor-not-allowed'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              canAfford ? 'fill-current' : 'opacity-45'
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
                          className="w-full min-h-[44px] px-4 py-2 btn-manuscript text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                          <span>في خزانتك · اقرأ الحكمة</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleActivate(item)}
                          className={`w-full min-h-[44px] px-4 py-2 text-sm flex items-center justify-center gap-2 cursor-pointer ${
                            isActive ? 'btn-emerald' : 'btn-manuscript'
                          }`}
                        >
                          {isActive && <Check className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />}
                          <span>
                            {isActive ? 'مُفعّل الآن · اضغط للإلغاء' : 'تفعيل الآن'}
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
          className="fixed inset-0 z-50 bg-[#081A14]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebrate-item-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="relative w-full max-w-md manuscript-folio paper-grain rounded-[6px] p-6 sm:p-8 shadow-2xl text-center"
          >
            <ManuscriptCornerBracket position="top-right" className="absolute top-2.5 right-2.5" />
            <ManuscriptCornerBracket position="top-left" className="absolute top-2.5 left-2.5" />

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0F3D2E] border-2 border-[#D9B96A] text-[#D9B96A] mb-3">
              {renderStoreIcon(celebratingItem.item.iconName, 'w-8 h-8')}
            </div>

            <p className="text-xs font-bold text-[#1F6B50]">
              {celebratingItem.justPurchased ? 'مبارك لك الاقتناء الجديد' : 'من خزانة إنجازاتك'}
            </p>
            <h2
              id="celebrate-item-title"
              className="mt-1 font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E]"
            >
              {celebratingItem.item.name}
            </h2>

            <ManuscriptDivider variant="rosette" />

            <p className="text-[#425B51] text-sm sm:text-base leading-relaxed">
              {celebratingItem.item.celebrationMessage}
            </p>

            {celebratingItem.item.wisdomText && (
              <div className="mt-4 p-4 rounded-[5px] bg-[#F3ECDA]/75 border border-[#B8924A]/50 text-[#0F3D2E] font-arabic font-bold text-base leading-relaxed">
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
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2 btn-emerald text-sm sm:text-base cursor-pointer"
                  >
                    تفعيل الآن
                  </button>
                )}

              <button
                type="button"
                onClick={() => setCelebratingItem(null)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2 btn-gilded text-sm sm:text-base cursor-pointer"
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
