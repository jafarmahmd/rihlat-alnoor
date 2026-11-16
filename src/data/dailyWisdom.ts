export interface DailyWisdomItem {
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  title: string;
  arabicDhikr: string;
  wisdomText: string;
  recommendedAction: string;
  targetSection?: 'quran' | 'adiyat' | 'ziyarat' | 'munajat' | 'library' | 'tasbih';
}

export const DAILY_WISDOM_ITEMS: DailyWisdomItem[] = [
  {
    dayOfWeek: 0, // Sunday
    title: 'نور الإمام علي (ع) — الأحد',
    arabicDhikr: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    wisdomText: 'خيرُ إخوانِكَ من نَصَحَكَ في عيبِكَ ودعا لكَ في غيبِكَ.',
    recommendedAction: 'تصفح دعاء يوم الأحد وزيارة أمين الله',
    targetSection: 'adiyat',
  },
  {
    dayOfWeek: 1, // Monday
    title: 'نور الإمامين الحسن والحسين (ع) — الإثنين',
    arabicDhikr: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    wisdomText: 'من ضيَع الأمانة ورضي بالخيانة فقد أخلّ الديانة.',
    recommendedAction: 'اقرأ دعاء يوم الإثنين وزيارة الإمام الحسين (ع)',
    targetSection: 'adiyat',
  },
  {
    dayOfWeek: 2, // Tuesday
    title: 'نور الأئمة السجاد والباقر والصادق (ع) — الثلاثاء',
    arabicDhikr: 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ',
    wisdomText: 'العلمُ صبيحَةُ العقلِ وثمرةُ التأمل والتقوى.',
    recommendedAction: 'افتح الصحيفة السجادية ومناجاة التائبين',
    targetSection: 'munajat',
  },
  {
    dayOfWeek: 3, // Wednesday
    title: 'نور الأئمة الكاظم والرضا والجواد والهادي (ع) — الأربعاء',
    arabicDhikr: 'لَا إِلَهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ',
    wisdomText: 'صديقُ كلِّ امرئٍ عقلُهُ وعدوُّهُ جهلُهُ.',
    recommendedAction: 'تصفح أدعية الأيام وزيارة الكاظمين (ع)',
    targetSection: 'adiyat',
  },
  {
    dayOfWeek: 4, // Thursday
    title: 'نور الإمام العسكري (ع) — الخميس',
    arabicDhikr: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
    wisdomText: 'أورعُ الناسِ من وَقَفَ عندَ الشُّبهةِ، وأعبُدُ الناسِ من أقامَ على الفرضِ.',
    recommendedAction: 'اقرأ دعاء كميل وزيارة آل ياسين',
    targetSection: 'adiyat',
  },
  {
    dayOfWeek: 5, // Friday
    title: 'يوم العرض والفرج (الإمام الحجة عجل الله فرجه) — الجمعة',
    arabicDhikr: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَعَجِّلْ فَرَجَهُمْ',
    wisdomText: 'انتظارُ الفرجِ بالصبرِ عبادةٌ وتوكلٌ خالصٌ على الله.',
    recommendedAction: 'اقرأ دعاء الندبة وزيارة آل ياسين',
    targetSection: 'adiyat',
  },
  {
    dayOfWeek: 6, // Saturday
    title: 'نور النبي الأكرم وآله الأطهار (ص) — السبت',
    arabicDhikr: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    wisdomText: 'إنَّما بُعِثْتُ لأُتَمِّمَ مَكارِمَ الأخلاقِ.',
    recommendedAction: 'تصفح مكتبة قصص أهل البيت (ع)',
    targetSection: 'library',
  },
];

export function getTodayWisdom(): DailyWisdomItem {
  const day = new Date().getDay();
  return DAILY_WISDOM_ITEMS[day] || DAILY_WISDOM_ITEMS[0];
}
