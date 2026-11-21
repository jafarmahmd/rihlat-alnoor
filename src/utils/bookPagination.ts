export interface QuranPageSlice {
  pageNumber: number;
  ayat: {
    text: string;
    ayahNumber: number; // 1-based
    unitIndex: number; // 0-based
  }[];
}

export interface GenericBlockSlice<T> {
  pageNumber: number;
  items: T[];
}

export const ARABIC_INDIC_NUMS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => ARABIC_INDIC_NUMS[Number(d)] ?? d);
}

/**
 * Computes comfortable character & line budgets per manuscript book page
 * scaled inversely with typography size so pages never feel cramped.
 */
function getQuranCharBudget(fontSizePx: number): number {
  const clamped = Math.max(16, Math.min(36, fontSizePx));
  // 16px -> ~920 chars, 22px -> ~680 chars, 28px -> ~490 chars, 36px -> ~340 chars
  return Math.round(920 - ((clamped - 16) / 20) * 580);
}

function getProseCharBudget(fontSizePx: number): number {
  const clamped = Math.max(16, Math.min(36, fontSizePx));
  // 16px -> ~840 chars, 22px -> ~620 chars, 30px -> ~420 chars, 36px -> ~310 chars
  return Math.round(840 - ((clamped - 16) / 20) * 530);
}

export function paginateQuranAyat(
  ayat: string[],
  fontSizePx: number,
  hasOpeningOrnament: boolean
): QuranPageSlice[] {
  if (!ayat || ayat.length === 0) return [];

  const baseBudget = getQuranCharBudget(fontSizePx);
  const firstPageBudget = hasOpeningOrnament
    ? Math.max(220, Math.round(baseBudget * 0.72))
    : baseBudget;

  const pages: QuranPageSlice[] = [];
  let currentAyat: QuranPageSlice['ayat'] = [];
  let currentChars = 0;

  for (let i = 0; i < ayat.length; i++) {
    const text = ayat[i];
    const weight = text.length + 18; // include rosette marker width
    const pageBudget = pages.length === 0 ? firstPageBudget : baseBudget;

    if (
      currentAyat.length > 0 &&
      (currentChars + weight > pageBudget || currentAyat.length >= 14)
    ) {
      pages.push({
        pageNumber: pages.length + 1,
        ayat: currentAyat,
      });
      currentAyat = [];
      currentChars = 0;
    }

    currentAyat.push({
      text,
      ayahNumber: i + 1,
      unitIndex: i,
    });
    currentChars += weight;
  }

  if (currentAyat.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      ayat: currentAyat,
    });
  }

  return pages;
}

export interface PaginatableBlock {
  textLength: number;
  isNote?: boolean;
  unitIndices?: number[];
}

export function paginateProseBlocks<T extends PaginatableBlock>(
  blocks: T[],
  fontSizePx: number,
  hasMeaningIntroOnFirstPage = true
): GenericBlockSlice<T>[] {
  if (!blocks || blocks.length === 0) return [];

  const baseBudget = getProseCharBudget(fontSizePx);
  const firstPageBudget = hasMeaningIntroOnFirstPage
    ? Math.max(200, Math.round(baseBudget * 0.78))
    : baseBudget;

  const pages: GenericBlockSlice<T>[] = [];
  let currentItems: T[] = [];
  let currentWeight = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    // Account for paragraph spacing cleanly
    const weight = Math.max(40, block.textLength + (block.isNote ? 55 : 45));
    const pageBudget = pages.length === 0 ? firstPageBudget : baseBudget;

    // Never leave an editorial note stranded at the very end of a page without its next paragraph
    const nextBlockWeight =
      block.isNote && i + 1 < blocks.length
        ? Math.min(240, blocks[i + 1].textLength + 45)
        : 0;

    if (
      currentItems.length > 0 &&
      currentWeight + weight + nextBlockWeight > pageBudget
    ) {
      pages.push({
        pageNumber: pages.length + 1,
        items: currentItems,
      });
      currentItems = [];
      currentWeight = 0;
    }

    currentItems.push(block);
    currentWeight += weight;
  }

  if (currentItems.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      items: currentItems,
    });
  }

  return pages;
}

const VIEW_MODE_STORAGE_KEY = 'rihlat_alnoor_reading_view_mode_v1';
export type ReaderViewMode = 'book' | 'scroll';

export function loadReaderViewMode(): ReaderViewMode {
  if (typeof window === 'undefined') return 'book';
  try {
    const val = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return val === 'scroll' ? 'scroll' : 'book';
  } catch {
    return 'book';
  }
}

export function saveReaderViewMode(mode: ReaderViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage error
  }
}
