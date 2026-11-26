export type ScreenView =
  | 'home'
  | 'map'
  | 'station'
  | 'store'
  | 'duas'
  | 'munajat'
  | 'ziyarat'
  | 'library'
  | 'digital-library'
  | 'tasbih'
  | 'calendar'
  | 'adhan-settings';

export interface StationQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

export interface StageData {
  id: number;
  title: string;
  description: string;
  themeColor: 'emerald' | 'sky' | 'amber' | 'teal';
  stationRange: [number, number];
  artworkPath: string;
  artworkAlt: string;
}

export interface StationData {
  id: number;
  stageId: number;
  title: string;
  subtitle: string;
  valueLabel: string;
  figureName: string;
  storyParagraphs: string[];
  wisdomQuote: string;
  imagePath: string;
  imageAlt: string;
  starsReward: number;
  questions: StationQuestion[];
}

export type StoreCategory = 'titles' | 'medals' | 'themes';
export type ThemeKind = 'frame' | 'background';

export interface StoreItem {
  id: string;
  category: StoreCategory;
  name: string;
  description: string;
  price: number;
  celebrationMessage: string;
  inspiration?: string;
  wisdomText?: string;
  themeKind?: ThemeKind;
  themeClass?: string;
  previewGradient?: string;
  iconName:
    | 'heart'
    | 'shield'
    | 'book'
    | 'feather'
    | 'award'
    | 'sparkles'
    | 'star'
    | 'home'
    | 'sun'
    | 'flame'
    | 'bird'
    | 'lamp'
    | 'crown'
    | 'trees'
    | 'moon'
    | 'flower';
}

export interface DuaItem {
  id: string;
  category: 'days' | 'daily';
  title: string;
  subtitle: string;
  meaningSummary: string;
  arabicText: string[];
  sourceNote: string;
}

export interface MunajatItem {
  id: string;
  number: number;
  title: string;
  quickMeaning: string;
  lifeLesson: string;
  verses: string[];
}

export interface LibraryStory {
  id: string;
  title: string;
  valueTag: string;
  overview: string;
  sceneStationId: number; // Maps to bespoke luminous vector scene in StationIllustration
  paragraphs: string[];
  wisdom: string;
  lesson: string;
}

export interface MasoomProfile {
  id: string;
  orderNumber: number;
  name: string;
  title: string;
  birthInfo: string;
  keyValues: string[];
  summary: string;
  stories: LibraryStory[];
}

export type HijriOccasionCategory =
  | 'birth'
  | 'martyrdom'
  | 'eid'
  | 'event';

export interface HijriOccasion {
  id: string;
  month: number; // 1..12
  day: number; // 1..30
  type: 'birth' | 'remembrance';
  category?: HijriOccasionCategory;
  title: string;
  figureName: string;
  shortStory: string;
  shortDua: string;
  linkedSection?: DigitalLibrarySection;
  linkedEntryId?: string;
  linkedLabel?: string;
}

export interface LastReadPosition {
  section: string;
  itemId: string;
  title: string;
  timestamp: number;
}

export interface GameProgress {
  unlockedStationId: number;
  completedStations: Record<number, number>; // stationId -> stars earned
  completedReadingIds: string[]; // IDs of completed duas, munajat, library stories, occasions
  spentStars: number;
  purchasedItemIds: string[];
  activeTitleId: string | null;
  activeFrameId: string | null;
  activeBackgroundId: string | null;
  childName: string;
  userAge?: number | null;
  profileCompleted?: boolean;
  lastRead: LastReadPosition | null;
  bookmarkedIds: string[];
}

export type DigitalLibrarySection =
  | 'adiyat'
  | 'sahifa'
  | 'ziyarat'
  | 'munajat'
  | 'quran';

export interface DigitalLibrarySegment {
  type: 'text' | 'note';
  content: string;
}

export interface DigitalLibraryEntry {
  id: string;
  section: 'sahifa' | 'adiyat' | 'ziyarat';
  title: string;
  subtitle: string;
  segments: DigitalLibrarySegment[];
}

export interface QuranSurahMeta {
  number: number;
  name: string;
  englishName: string;
  type: 'مكية' | 'مدنية';
  ayahCount: number;
}

export interface QuranSurahContent extends QuranSurahMeta {
  ayat: string[];
}
