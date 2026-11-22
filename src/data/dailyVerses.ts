export interface DailyVerseItem {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  arabicText: string;
}

export const DAILY_VERSES: DailyVerseItem[] = [
  {
    surahNumber: 13,
    surahName: 'الرعد',
    ayahNumber: 28,
    arabicText: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
  },
  {
    surahNumber: 2,
    surahName: 'البقرة',
    ayahNumber: 152,
    arabicText: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
  },
  {
    surahNumber: 94,
    surahName: 'الشرح',
    ayahNumber: 5,
    arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
  },
  {
    surahNumber: 2,
    surahName: 'البقرة',
    ayahNumber: 186,
    arabicText: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
  },
  {
    surahNumber: 40,
    surahName: 'غافر',
    ayahNumber: 60,
    arabicText: 'وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ',
  },
  {
    surahNumber: 3,
    surahName: 'آل عمران',
    ayahNumber: 139,
    arabicText: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ',
  },
  {
    surahNumber: 16,
    surahName: 'النحل',
    ayahNumber: 97,
    arabicText: 'مَنْ عَمِلَ صَالِحًا مِّن ذَكَرٍ أَوْ أُنثَىٰ وَهُوَ مُؤْمِنٌ فَلَنُحْيِيَنَّهُ حَيَاةً طَيِّبَةً',
  },
  {
    surahNumber: 24,
    surahName: 'النور',
    ayahNumber: 35,
    arabicText: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ',
  },
  {
    surahNumber: 65,
    surahName: 'الطلاق',
    ayahNumber: 3,
    arabicText: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ',
  },
  {
    surahNumber: 39,
    surahName: 'الزمر',
    ayahNumber: 53,
    arabicText: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
  },
  {
    surahNumber: 33,
    surahName: 'الأحزاب',
    ayahNumber: 56,
    arabicText: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا',
  },
  {
    surahNumber: 17,
    surahName: 'الإسراء',
    ayahNumber: 82,
    arabicText: 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ',
  },
  {
    surahNumber: 20,
    surahName: 'طه',
    ayahNumber: 114,
    arabicText: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
  },
  {
    surahNumber: 93,
    surahName: 'الضحى',
    ayahNumber: 5,
    arabicText: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ',
  },
  {
    surahNumber: 14,
    surahName: 'إبراهيم',
    ayahNumber: 7,
    arabicText: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
  },
];

export function getVerseOfTheDay(date: Date = new Date()): DailyVerseItem {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return DAILY_VERSES[Math.abs(dayOfYear) % DAILY_VERSES.length];
}
