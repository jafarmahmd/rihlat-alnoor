import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { LOCAL_QURAN_SURAHS, QURAN_SURAHS_META } from '../data/quran';
import { DUAS_LIST } from '../data/duas';
import { MUNAJAT_LIST } from '../data/munajat';
import { DIGITAL_LIBRARY_ENTRIES } from '../data/digitalLibrary';
import { MASOOMEEN_LIBRARY } from '../data/library';
import { DigitalLibrarySection } from '../types/game';
import { toArabicDigits } from '../utils/arabicNumbers';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  snippet?: string;
  action: () => void;
}

interface GlobalSearchBarProps {
  onOpenLibrarySection: (
    section: DigitalLibrarySection,
    entryId?: string
  ) => void;
  onOpenLibrary: (storyId?: string) => void;
}

function normalizeArabicText(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getSurahAyatIfCached(surahNumber: number): string[] | null {
  if (LOCAL_QURAN_SURAHS[surahNumber]) {
    return LOCAL_QURAN_SURAHS[surahNumber];
  }
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`rihlat_quran_surah_v1_${surahNumber}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onOpenLibrarySection,
  onOpenLibrary,
}) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const normalized = useMemo(() => normalizeArabicText(query), [query]);

  const results: SearchResultItem[] = useMemo(() => {
    if (normalized.length < 2) return [];

    const collected: SearchResultItem[] = [];

    // 1. Surah names & numbers
    for (const s of QURAN_SURAHS_META) {
      const nameNorm = normalizeArabicText(`سورة ${s.name}`);
      if (nameNorm.includes(normalized) || String(s.number) === normalized) {
        collected.push({
          id: `q-meta-${s.number}`,
          title: `سورة ${s.name}`,
          subtitle: `${s.type} · ${toArabicDigits(s.ayahCount)} آية`,
          category: 'القرآن الكريم',
          action: () => onOpenLibrarySection('quran', `dl-quran-${s.number}`),
        });
      }
      if (collected.length >= 16) break;
    }

    // 2. Cached & local Quran Ayat text match
    if (collected.length < 18) {
      for (const s of QURAN_SURAHS_META) {
        const ayat = getSurahAyatIfCached(s.number);
        if (!ayat) continue;
        for (let i = 0; i < ayat.length; i++) {
          if (normalizeArabicText(ayat[i]).includes(normalized)) {
            collected.push({
              id: `q-ayah-${s.number}-${i + 1}`,
              title: `سورة ${s.name} — الآية ${toArabicDigits(i + 1)}`,
              subtitle: 'تطابق في نص الآية الكريمة',
              category: 'آية قرآنية',
              snippet: ayat[i],
              action: () => onOpenLibrarySection('quran', `dl-quran-${s.number}`),
            });
            break; // Max 1 verse highlight per surah to keep results broad
          }
        }
        if (collected.length >= 20) break;
      }
    }

    // 3. Digital Library (Duas, Sahifa, Ziyarat)
    for (const item of DIGITAL_LIBRARY_ENTRIES) {
      const titleHit = normalizeArabicText(item.title).includes(normalized);
      const subHit = normalizeArabicText(item.subtitle).includes(normalized);
      const segHit = item.segments.find((seg) =>
        normalizeArabicText(seg.content).includes(normalized)
      );
      if (titleHit || subHit || segHit) {
        const sec: DigitalLibrarySection =
          item.section === 'ziyarat'
            ? 'ziyarat'
            : item.section === 'sahifa'
            ? 'sahifa'
            : 'adiyat';
        collected.push({
          id: `dl-${item.id}`,
          title: item.title,
          subtitle: item.subtitle,
          category:
            item.section === 'ziyarat'
              ? 'الزيارات'
              : item.section === 'sahifa'
              ? 'الصحيفة السجادية'
              : 'الأدعية الكبرى',
          snippet: segHit?.content.slice(0, 110),
          action: () => onOpenLibrarySection(sec, item.id),
        });
      }
      if (collected.length >= 26) break;
    }

    // 4. Weekly / Daily Duas
    for (const dua of DUAS_LIST) {
      const hit =
        normalizeArabicText(dua.title).includes(normalized) ||
        normalizeArabicText(dua.meaningSummary).includes(normalized) ||
        dua.arabicText.some((p) => normalizeArabicText(p).includes(normalized));
      if (hit) {
        collected.push({
          id: `dua-${dua.id}`,
          title: dua.title,
          subtitle: dua.subtitle,
          category: 'الأدعية اليومية',
          snippet: dua.meaningSummary,
          action: () => onOpenLibrarySection('adiyat', dua.id),
        });
      }
    }

    // 5. Munajat
    for (const m of MUNAJAT_LIST) {
      const hit =
        normalizeArabicText(m.title).includes(normalized) ||
        normalizeArabicText(m.quickMeaning).includes(normalized) ||
        m.verses.some((v) => normalizeArabicText(v).includes(normalized));
      if (hit) {
        collected.push({
          id: `munajat-${m.id}`,
          title: m.title,
          subtitle: m.quickMeaning,
          category: 'المناجاة',
          action: () => onOpenLibrarySection('munajat', m.id),
        });
      }
    }

    // 6. Stories
    for (const fig of MASOOMEEN_LIBRARY) {
      for (const st of fig.stories) {
        if (
          normalizeArabicText(st.title).includes(normalized) ||
          normalizeArabicText(fig.name).includes(normalized)
        ) {
          collected.push({
            id: `story-${st.id}`,
            title: st.title,
            subtitle: fig.name,
            category: 'قصص أهل البيت',
            action: () => onOpenLibrary(st.id),
          });
        }
      }
    }

    return collected.slice(0, 14);
  }, [normalized, onOpenLibrarySection, onOpenLibrary]);

  const showDropdown = focused && normalized.length >= 2;

  return (
    <div className="relative z-30">
      <div className="relative flex items-center">
        <Search
          className="w-4 h-4 text-[#1F6B50] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setFocused(false), 180);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocused(true);
          }}
          placeholder="ابحث في القرآن، الأدعية، الصحيفة السجادية، الزيارات أو المناجاة..."
          aria-label="البحث الشامل في رحلة النور"
          className="w-full min-h-[46px] pr-10 pl-10 py-2 rounded-[6px] bg-[#FAF6EC] focus:bg-white border border-[#B8924A]/55 focus:border-[#0F3D2E] text-sm font-medium text-[#11271F] placeholder:text-[#425B51]/75 focus:outline-none shadow-xs transition-colors"
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQuery('')}
            aria-label="مسح البحث"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[#425B51] hover:text-[#0F3D2E] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          role="listbox"
          aria-label="نتائج البحث الشامل"
          className="mt-2 rounded-[6px] manuscript-folio border border-[#B8924A]/65 shadow-xl max-h-[360px] overflow-y-auto divide-y divide-[#B8924A]/20"
        >
          {results.length === 0 ? (
            <div className="p-5 text-center text-xs sm:text-sm text-[#425B51]">
              لم نعثر على نتائج مطابقة لعبارة «{query}». جرّب اسم سورة أو دعاء أو كلمة من آية.
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected="false"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setFocused(false);
                  item.action();
                }}
                className="w-full text-right p-3.5 hover:bg-[#F3ECDA]/85 transition-colors flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#9C7835]">
                    <span>{item.category}</span>
                    {item.subtitle && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#425B51] truncate">{item.subtitle}</span>
                      </>
                    )}
                  </div>
                  <div className="font-display font-bold text-sm sm:text-base text-[#0F3D2E] truncate mt-0.5">
                    {item.title}
                  </div>
                  {item.snippet && (
                    <p className="text-xs font-arabic text-[#11271F]/85 line-clamp-1 mt-0.5">
                      {item.snippet}
                    </p>
                  )}
                </div>
                <ArrowLeft className="w-4 h-4 text-[#1F6B50] shrink-0" aria-hidden="true" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
