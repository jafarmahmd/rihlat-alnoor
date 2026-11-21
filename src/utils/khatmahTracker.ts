import { QURAN_SURAHS_META } from '../data/quran';

export interface KhatmahConfig {
  targetDays: number;
  startedAt: string; // YYYY-MM-DD
}

const KHATMAH_STORAGE_KEY = 'rihlat_alnoor_khatmah_v1';

const TOTAL_QURAN_AYAT = 6236;

// Starting surah numbers for Juz 1..30 (standard Madani Mushaf divisions)
const JUZ_START_SURAHS: { juz: number; surah: number; name: string }[] = [
  { juz: 1, surah: 1, name: 'الجزء الأول' },
  { juz: 2, surah: 2, name: 'الجزء الثاني' },
  { juz: 3, surah: 2, name: 'الجزء الثالث' },
  { juz: 4, surah: 3, name: 'الجزء الرابع' },
  { juz: 5, surah: 4, name: 'الجزء الخامس' },
  { juz: 6, surah: 4, name: 'الجزء السادس' },
  { juz: 7, surah: 5, name: 'الجزء السابع' },
  { juz: 8, surah: 6, name: 'الجزء الثامن' },
  { juz: 9, surah: 7, name: 'الجزء التاسع' },
  { juz: 10, surah: 8, name: 'الجزء العاشر' },
  { juz: 11, surah: 9, name: 'الجزء الحادي عشر' },
  { juz: 12, surah: 11, name: 'الجزء الثاني عشر' },
  { juz: 13, surah: 12, name: 'الجزء الثالث عشر' },
  { juz: 14, surah: 15, name: 'الجزء الرابع عشر' },
  { juz: 15, surah: 17, name: 'الجزء الخامس عشر' },
  { juz: 16, surah: 18, name: 'الجزء السادس عشر' },
  { juz: 17, surah: 21, name: 'الجزء السابع عشر' },
  { juz: 18, surah: 23, name: 'الجزء الثامن عشر' },
  { juz: 19, surah: 25, name: 'الجزء التاسع عشر' },
  { juz: 20, surah: 27, name: 'الجزء العشرون' },
  { juz: 21, surah: 29, name: 'الجزء الحادي والعشرون' },
  { juz: 22, surah: 33, name: 'الجزء الثاني والعشرون' },
  { juz: 23, surah: 36, name: 'الجزء الثالث والعشرون' },
  { juz: 24, surah: 39, name: 'الجزء الرابع والعشرون' },
  { juz: 25, surah: 41, name: 'الجزء الخامس والعشرون' },
  { juz: 26, surah: 46, name: 'الجزء السادس والعشرون' },
  { juz: 27, surah: 51, name: 'الجزء السابع والعشرون' },
  { juz: 28, surah: 58, name: 'الجزء الثامن والعشرون' },
  { juz: 29, surah: 67, name: 'الجزء التاسع والعشرون' },
  { juz: 30, surah: 78, name: 'جزء عمّ (الثلاثون)' },
];

export function loadKhatmahConfig(): KhatmahConfig {
  const today = new Date().toISOString().slice(0, 10);
  const fallback: KhatmahConfig = { targetDays: 30, startedAt: today };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(KHATMAH_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<KhatmahConfig>;
    return {
      targetDays:
        typeof parsed.targetDays === 'number' && parsed.targetDays >= 7 && parsed.targetDays <= 365
          ? parsed.targetDays
          : 30,
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : today,
    };
  } catch {
    return fallback;
  }
}

export function saveKhatmahConfig(config: KhatmahConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KHATMAH_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('rihlat:khatmah-updated'));
  } catch {
    // Ignore storage errors
  }
}

export function getKhatmahSummary(
  completedReadingIds: string[],
  config: KhatmahConfig = loadKhatmahConfig()
) {
  const completedSurahs = QURAN_SURAHS_META.filter((s) =>
    completedReadingIds.includes(`dl-quran-${s.number}`)
  );
  const completedAyat = completedSurahs.reduce((sum, s) => sum + s.ayahCount, 0);
  const percentByAyat = Math.min(
    100,
    Math.round((completedAyat / TOTAL_QURAN_AYAT) * 100)
  );
  const estimatedJuzDone = Math.min(
    30,
    Math.floor((completedAyat / TOTAL_QURAN_AYAT) * 30)
  );

  // Recommend next unread surah in canonical order
  const nextUnreadSurah =
    QURAN_SURAHS_META.find(
      (s) => !completedReadingIds.includes(`dl-quran-${s.number}`)
    ) || QURAN_SURAHS_META[0];

  const currentJuzInfo =
    [...JUZ_START_SURAHS]
      .reverse()
      .find((j) => nextUnreadSurah.number >= j.surah) || JUZ_START_SURAHS[0];

  const dailyAyatGoal = Math.max(
    20,
    Math.ceil((TOTAL_QURAN_AYAT - completedAyat) / Math.max(1, config.targetDays))
  );

  return {
    completedSurahCount: completedSurahs.length,
    totalSurahCount: QURAN_SURAHS_META.length,
    completedAyat,
    totalAyat: TOTAL_QURAN_AYAT,
    percent: percentByAyat,
    estimatedJuzDone,
    nextUnreadSurah,
    currentJuzInfo,
    dailyAyatGoal,
    isFinished: completedSurahs.length >= QURAN_SURAHS_META.length,
  };
}
