import { HijriOccasion } from '../types/game';

export const HIJRI_MONTH_NAMES: Record<number, string> = {
  1: 'محرم الحرام',
  2: 'صفر الخير',
  3: 'ربيع الأول',
  4: 'ربيع الآخر',
  5: 'جمادى الأولى',
  6: 'جمادى الآخرة',
  7: 'رجب الأصب',
  8: 'شعبان المعظم',
  9: 'رمضان المبارك',
  10: 'شوال المكرم',
  11: 'ذو القعدة الحرام',
  12: 'ذو الحجة الحرام',
};

export const GREGORIAN_MONTH_NAMES: Record<number, string> = {
  1: 'كانون الثاني (يناير)',
  2: 'شباط (فبراير)',
  3: 'آذار (مارس)',
  4: 'نيسان (أبريل)',
  5: 'أيار (مايو)',
  6: 'حزيران (يونيو)',
  7: 'تموز (يوليو)',
  8: 'آب (أغسطس)',
  9: 'أيلول (سبتمبر)',
  10: 'تشرين الأول (أكتوبر)',
  11: 'تشرين الثاني (نوفمبر)',
  12: 'كانون الأول (ديسمبر)',
};

export const ARABIC_WEEKDAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const HIJRI_OCCASIONS: HijriOccasion[] = [
  // ─── 1. محرم الحرام ───
  {
    id: 'occ-muharram-1',
    month: 1,
    day: 1,
    type: 'remembrance',
    category: 'event',
    title: 'رأس السنة الهجرية المباركة',
    figureName: 'النبي محمد (ﷺ) وأهل بيته (عليهم السلام)',
    shortStory:
      'بداية عامٍ هجري جديد يذكّرنا بهجرة النبي الأكرم (ﷺ) من مكة إلى المدينة لبناء دولة العدل والرحمة والإخاء.',
    shortDua:
      'اللَّهُمَّ بَارِكْ لَنَا فِي هَذَا الْعَامِ الْجَدِيدِ، وَاجْعَلْهُ عَامَ خَيْرٍ وَنُورٍ وَطَاعَةٍ لَكَ.',
  },
  {
    id: 'occ-muharram-2',
    month: 1,
    day: 2,
    type: 'remembrance',
    category: 'event',
    title: 'وصول الإمام الحسين (عليه السلام) إلى أرض كربلاء',
    figureName: 'الإمام الحسين (عليه السلام)',
    shortStory:
      'نزل الإمام الحسين (عليه السلام) مع أهل بيته وأصحابه أرض كربلاء في الثاني من المحرم معلناً الثبات على الحق مهما كانت التضحيات.',
    shortDua:
      'اللَّهُمَّ ثَبِّتْ قُلُوبَنَا عَلَى الْحَقِّ وَالْهُدَى كَمَا ثَبَّتَّ أَقْدَامَ أَوْلِيَائِكَ فِي كَرْبَلَاءَ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-ashura',
    linkedLabel: 'اقرأ زيارة عاشوراء',
  },
  {
    id: 'occ-muharram-7',
    month: 1,
    day: 7,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'منع الماء عن معسكر الإمام الحسين (عليه السلام)',
    figureName: 'أطفال وعيال الحسين (عليهم السلام)',
    shortStory:
      'حُرم أطفال كربلاء من ماء الفرات منذ اليوم السابع من محرم، فصبروا بشهامة وأظهروا أروع أمثلة الوفاء والصمود.',
    shortDua:
      'اللَّهُمَّ اسْقِنَا مِنْ حَوْضِ نَبِيِّكَ (ﷺ) شَرْبَةً لَا نَظْمَأُ بَعْدَهَا أَبَداً.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-abbas',
    linkedLabel: 'اقرأ زيارة أبي الفضل العباس (ع)',
  },
  {
    id: 'occ-muharram-9',
    month: 1,
    day: 9,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'يوم تاسوعاء — يوم أبي الفضل العباس (عليه السلام)',
    figureName: 'أبو الفضل العباس (عليه السلام)',
    shortStory:
      'جسّد العباس بن علي (عليه السلام) في يوم تاسوعاء أسمى معاني الأخوّة والوفاء حين رفض الأمان وآثر نصرة أخيه الإمام الحسين (ع).',
    shortDua:
      'السَّلَامُ عَلَيْكَ يَا أَبَا الْفَضْلِ الْعَبَّاسَ، اللَّهُمَّ ارْزُقْنَا وَفَاءً وَشَهَامَةً كَوَفَائِهِ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-abbas',
    linkedLabel: 'اقرأ زيارة العباس بن علي (ع)',
  },
  {
    id: 'occ-muharram-10',
    month: 1,
    day: 10,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'يوم عاشوراء — واقعة الطف وشهادة الإمام الحسين (عليه السلام)',
    figureName: 'الإمام الحسين (عليه السلام)',
    shortStory:
      'وقف الإمام الحسين (عليه السلام) في كربلاء بشجاعة نادرة ليدافع عن الحق والعدل وكرامة الإنسان، وبقيت تضحيته منارةً للأحرار في كل زمان.',
    shortDua:
      'اَلسَّلَامُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ، اللَّهُمَّ اجْعَلْنِي مِنَ الصَّادِقِينَ الشُّجْعَانِ الثَّابِتِينَ عَلَى الْحَقِّ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-ashura',
    linkedLabel: 'اقرأ زيارة عاشوراء المشهورة',
  },
  {
    id: 'occ-muharram-12',
    month: 1,
    day: 12,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'دفن الأجساد الطاهرة في كربلاء ومسير السبايا',
    figureName: 'الإمام السجاد والسيدة زينب (عليهما السلام)',
    shortStory:
      'في الثاني عشر من محرم وُوريت أجساد شهداء الطف الثرى بحضور الإمام السجاد (ع)، فيما انطلقت السيدة زينب برسالة كربلاء الصادقة.',
    shortDua:
      'اللَّهُمَّ صَلِّ عَلَى الْحُسَيْنِ وَعَلَى أَوْلَادِ الْحُسَيْنِ وَعَلَى أَصْحَابِ الْحُسَيْنِ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-husain',
    linkedLabel: 'اقرأ زيارة وارث',
  },
  {
    id: 'occ-muharram-25',
    month: 1,
    day: 25,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة الإمام علي زين العابدين (عليه السلام)',
    figureName: 'الإمام زين العابدين (عليه السلام)',
    shortStory:
      'علّمنا الإمام السجاد (عليه السلام) لغة الدعاء الصادق في «الصحيفة السجادية»، وكان يحمل الطعام ليلاً لمئة عائلة فقيرة دون أن يراه أحد.',
    shortDua:
      'اللَّهُمَّ ارْزُقْنِي قَلْباً خَاشِعاً، وَلِسَاناً ذَاكِراً، وَيَداً سَخِيَّةً بِالْخَيْرِ فِي السِّرِّ وَالْعَلَنِ.',
    linkedSection: 'sahifa',
    linkedEntryId: 'dl-sahifa-1',
    linkedLabel: 'اقرأ من الصحيفة السجادية',
  },

  // ─── 2. صفر الخير ───
  {
    id: 'occ-safar-1',
    month: 2,
    day: 1,
    type: 'remembrance',
    category: 'event',
    title: 'دخول قافلة سبايا أهل البيت (عليهم السلام) إلى الشام',
    figureName: 'الإمام السجاد والسيدة زينب (عليهما السلام)',
    shortStory:
      'صدح صوت الإمام السجاد والسيدة زينب (عليهما السلام) بالحق في الشام فكشفا للناس حقيقة ثورة الإمام الحسين (ع) ومكانته عند رسول الله (ﷺ).',
    shortDua:
      'اللَّهُمَّ انْصُرْ كَلِمَةَ الْحَقِّ وَالْعَدْلِ وَأَعِزَّ أَهْلَ الصِّدْقِ فِي كُلِّ مَكَانٍ.',
  },
  {
    id: 'occ-safar-5',
    month: 2,
    day: 5,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة السيدة رقية بنت الإمام الحسين (عليهما السلام)',
    figureName: 'السيدة رقية (عليها السلام)',
    shortStory:
      'طفلةٌ طاهرةٌ من بيت النبوة صبرت على الفراق والألم في الشام، وبقيت رمزاً لبراءة الطفولة ومحبة الإمام الحسين (عليه السلام).',
    shortDua:
      'اللَّهُمَّ احْفَظْ أَطْفَالَنَا وَأَنْبِتْهُمْ نَبَاتاً حَسَناً وَارْزُقْهُمْ مَحَبَّةَ أَهْلِ الْبَيْتِ (ع).',
  },
  {
    id: 'occ-safar-7',
    month: 2,
    day: 7,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة الإمام موسى الكاظم (عليه السلام)',
    figureName: 'الإمام موسى الكاظم (عليه السلام)',
    shortStory:
      'وُلد الإمام الكاظم (عليه السلام) في الأبواء بين مكة والمدينة، واشتهر بكظم الغيظ ومقابلة الإساءة بالابتسامة والهدية السخية.',
    shortDua:
      'اللَّهُمَّ زَيِّنِّي بِالْحِلْمِ وَالصَّبْرِ، وَاجْعَلْنِي مِمَّنْ يَكْظِمُ الْغَيْظَ وَيَعْفُو عَنِ النَّاسِ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-kadhim',
    linkedLabel: 'اقرأ زيارة الإمام الكاظم (ع)',
  },
  {
    id: 'occ-safar-20',
    month: 2,
    day: 20,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'يوم الأربعين — زيارة الأربعين وعودة الركب الحسيني',
    figureName: 'أهل بيت النبوة (عليهم السلام)',
    shortStory:
      'يجتمع الملايين في يوم الأربعين لإحياء قيم الكرم وخدمة الضيف والمسير نحو الحق والسلام، تماماً كما علّمنا أهل البيت.',
    shortDua:
      'اللَّهُمَّ اجْعَلْ خُطُوَاتِنَا فِي الْخَيْرِ وَخِدْمَةِ النَّاسِ، وَابْعَثْ فِي قُلُوبِنَا السَّلَامَ وَالْمَحَبَّةَ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-husain',
    linkedLabel: 'اقرأ زيارة وارث',
  },
  {
    id: 'occ-safar-28',
    month: 2,
    day: 28,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى رحيل النبي محمد (ﷺ) وشهادة الإمام الحسن المجتبى (ع)',
    figureName: 'النبي محمد (ﷺ) والإمام الحسن (عليه السلام)',
    shortStory:
      'رحل النبي الرحيم (ﷺ) بعد أن ترك لنا القرآن وأهل بيته الطاهرين نبراساً للأخلاق والرحمة، وفيه أيضاً استشهد ريحانته الإمام الحسن (ع).',
    shortDua:
      'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ، وَاحْشُرْنَا فِي زُمْرَتِهِمْ وَوَفِّقْنَا لِاتِّبَاعِ أَخْلَاقِهِمْ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-prophet-far',
    linkedLabel: 'اقرأ زيارة النبي (ﷺ) من البعد',
  },
  {
    id: 'occ-safar-30',
    month: 2,
    day: 30,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة الإمام علي بن موسى الرضا (عليه السلام)',
    figureName: 'الإمام علي الرضا (عليه السلام)',
    shortStory:
      'في آخر شهر صفر استشهد غريب طوس وشمس الشموس الإمام الرضا (عليه السلام) بعد أن نشر العلم والحكمة ومكارم الأخلاق في خراسان.',
    shortDua:
      'السَّلَامُ عَلَيْكَ يَا غَرِيبَ الْغُرَبَاءِ، اللَّهُمَّ ارْزُقْنَا فِي الدُّنْيَا زِيَارَتَهُ وَفِي الْآخِرَةِ شَفَاعَتَهُ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-reza',
    linkedLabel: 'اقرأ زيارة الإمام الرضا (ع)',
  },

  // ─── 3. ربيع الأول ───
  {
    id: 'occ-rabi1-1',
    month: 3,
    day: 1,
    type: 'remembrance',
    category: 'event',
    title: 'ليلة المبيت وهجرة النبي محمد (ﷺ) إلى المدينة',
    figureName: 'النبي محمد (ﷺ) والإمام علي (عليه السلام)',
    shortStory:
      'نام الإمام علي (عليه السلام) في فراش النبي (ﷺ) ليلة الهجرة فداءً لرسول الله، فأنزل الله فيه آية الشراء والوفاء العظيم.',
    shortDua:
      'اللَّهُمَّ ارْزُقْنَا شَجَاعَةَ الْإِيمَانِ وَالْإِخْلَاصَ فِي نُصْرَةِ دِينِكَ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-amin',
    linkedLabel: 'اقرأ زيارة أمين الله',
  },
  {
    id: 'occ-rabi1-8',
    month: 3,
    day: 8,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة الإمام الحسن العسكري (عليه السلام)',
    figureName: 'الإمام الحسن العسكري (عليه السلام)',
    shortStory:
      'كان الإمام العسكري (عليه السلام) سنداً للمحتاجين وباباً للطمأنينة، وقد مهّد القلوب لاستقبال عصر الإمام المهدي (عجل الله فرجه).',
    shortDua:
      'اللَّهُمَّ اشْرَحْ صُدُورَنَا بِالْإِيمَانِ، وَاجْعَلْنَا عَوْناً لِلضُّعَفَاءِ وَالْمُحْتَاجِينَ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-askari-special',
    linkedLabel: 'اقرأ زيارة الإمام العسكري (ع)',
  },
  {
    id: 'occ-rabi1-9',
    month: 3,
    day: 9,
    type: 'birth',
    category: 'eid',
    title: 'ذكرى تتويج وبداية إمامة الإمام المهدي (عجل الله فرجه)',
    figureName: 'الإمام المهدي المنتظر (عجل الله فرجه)',
    shortStory:
      'يوم فرحة المؤمنين ببدء إمامة الحجة بن الحسن المهدي (عجل الله تعالى فرجه الشريف) وتجديد العهد والبيعة الصادقة له.',
    shortDua:
      'اللَّهُمَّ عَجِّلْ لِوَلِيِّكَ الْفَرَجَ وَاجْعَلْنَا مِنْ أَنْصَارِهِ وَأَعْوَانِهِ.',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-ahed',
    linkedLabel: 'اقرأ دعاء العهد',
  },
  {
    id: 'occ-rabi1-17',
    month: 3,
    day: 17,
    type: 'birth',
    category: 'birth',
    title: 'ولادة الرحمة المهداة النبي محمد (ﷺ) والإمام الصادق (ع)',
    figureName: 'النبي محمد (ﷺ) والإمام جعفر الصادق (عليه السلام)',
    shortStory:
      'في السابع عشر من ربيع الأول أشرق الكون بميلاد خاتم الأنبياء (ﷺ) وميلاد حفيده الإمام الصادق (عليه السلام) مؤسس مدرسة العلم والأخلاق.',
    shortDua:
      'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ، وَامْلَأْ قُلُوبَنَا رَحْمَةً وَصِدْقاً وَعِلْماً نَافِعاً.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-prophet-near',
    linkedLabel: 'اقرأ زيارة النبي محمد (ﷺ)',
  },

  // ─── 4. ربيع الآخر ───
  {
    id: 'occ-rabi2-8',
    month: 4,
    day: 8,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة الإمام الحسن العسكري (عليه السلام)',
    figureName: 'الإمام الحسن العسكري (عليه السلام)',
    shortStory:
      'وُلد الإمام الحسن العسكري (عليه السلام) في المدينة المنورة، ونشأ قدوةً في الحِلم والوقار ورعاية الأسر المتعففة.',
    shortDua:
      'اللَّهُمَّ اجْعَلْنَا مِنَ السَّاعِينَ فِي قَضَاءِ حَوَائِجِ إِخْوَانِنَا بِمَحَبَّةٍ وَصَمْتٍ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-askari-special',
    linkedLabel: 'اقرأ زيارة الإمام العسكري (ع)',
  },
  {
    id: 'occ-rabi2-10',
    month: 4,
    day: 10,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى وفاة السيدة فاطمة المعصومة (عليها السلام)',
    figureName: 'السيدة فاطمة المعصومة (عليها السلام)',
    shortStory:
      'بنت الإمام الكاظم وأخت الإمام الرضا (عليهما السلام)؛ عُرِفت بالعلم والعبادة والعفة فصار مرقدها في قم المقدسة ملاذاً للمحبين.',
    shortDua:
      'يَا فَاطِمَةُ اشْفَعِي لَنَا فِي الْجَنَّةِ، فَإِنَّ لَكِ عِنْدَ اللَّهِ شَأْناً مِنَ الشَّأْنِ.',
  },

  // ─── 5. جمادى الأولى ───
  {
    id: 'occ-jumada1-5',
    month: 5,
    day: 5,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة السيدة زينب الكبرى (عليها السلام)',
    figureName: 'السيدة زينب (عليها السلام)',
    shortStory:
      'تربّت السيدة زينب (عليها السلام) في بيت الوحي فصارت مثالاً في الشجاعة والفصاحة وحماية الأطفال والأيتام.',
    shortDua:
      'اللَّهُمَّ ارْزُقْنَا الثَّبَاتَ وَالشَّجَاعَةَ فِي قَوْلِ الْحَقِّ وَالْعَطْفَ عَلَى الصِّغَارِ.',
  },
  {
    id: 'occ-jumada1-13',
    month: 5,
    day: 13,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'شهادة السيدة فاطمة الزهراء (عليها السلام) — الرواية الأولى',
    figureName: 'السيدة فاطمة الزهراء (عليها السلام)',
    shortStory:
      'إحياء الليالي الفاطمية الأولى استذكاراً لمظلومية سيدة نساء العالمين (عليها السلام) ودورها في الدفاع عن الولاية والإسلام.',
    shortDua:
      'السَّلَامُ عَلَيْكِ يَا مُمْتَحَنَةُ امْتَحَنَكِ الَّذِي خَلَقَكِ، اللَّهُمَّ اجْعَلْنَا مِنْ مُحِبِّي الزَّهْرَاءِ (ع).',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-fatima',
    linkedLabel: 'اقرأ زيارة السيدة الزهراء (ع)',
  },

  // ─── 6. جمادى الآخرة ───
  {
    id: 'occ-jumada2-3',
    month: 6,
    day: 3,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة السيدة فاطمة الزهراء (عليها السلام)',
    figureName: 'السيدة فاطمة الزهراء (عليها السلام)',
    shortStory:
      'علّمتنا سيدة نساء العالمين (عليها السلام) أن «الجار ثم الدار»، وأن العطاء من أحب ما نملك يقربنا إلى الجنة.',
    shortDua:
      'اللَّهُمَّ صَلِّ عَلَى فَاطِمَةَ وَأَبِيهَا وَبَعْلِهَا وَبَنِيهَا، وَاجْعَلْنَا مِنَ الْمُقْتَدِينَ بِعِفَّتِهَا وَكَرَمِهَا.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-fatima',
    linkedLabel: 'اقرأ زيارة السيدة الزهراء (ع)',
  },
  {
    id: 'occ-jumada2-13',
    month: 6,
    day: 13,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى وفاة السيدة الجليلة أم البنين (عليها السلام)',
    figureName: 'السيدة أم البنين (عليها السلام)',
    shortStory:
      'أم أبي الفضل العباس وإخوته؛ قدّمت أبناءها الأربعة فداءً للإمام الحسين (ع) وضربت أروع مثل في الإخلاص لأهل البيت.',
    shortDua:
      'اللَّهُمَّ ارْزُقْنَا صِدْقَ الْمَوَدَّةِ لِآلِ نَبِيِّكَ وَاقْضِ حَوَائِجَ الْمُؤْمِنِينَ.',
  },
  {
    id: 'occ-jumada2-20',
    month: 6,
    day: 20,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة السيدة فاطمة الزهراء (عليها السلام)',
    figureName: 'السيدة فاطمة الزهراء (عليها السلام)',
    shortStory:
      'أشرقت مكة بميلاد الزهراء البتول (عليها السلام) فسمّاها النبي محمد (ﷺ) «أم أبيها» لما أظهرته من حنان وبِرٍّ وعقلٍ راجح.',
    shortDua:
      'اللَّهُمَّ بَارِكْ لِأُمَّهَاتِنَا وَأُسَرِنَا، وَزِدْ بُيُوتَنَا نُوراً وَمَوَدَّةً وَبِرّاً.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-fatima',
    linkedLabel: 'اقرأ زيارة السيدة الزهراء (ع)',
  },

  // ─── 7. رجب الأصب ───
  {
    id: 'occ-rajab-1',
    month: 7,
    day: 1,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة الإمام محمد الباقر (عليه السلام)',
    figureName: 'الإمام محمد الباقر (عليه السلام)',
    shortStory:
      'استهل شهر رجب بولادة «باقر العلم» (عليه السلام) الذي شجع الناس على طلب العلم والعمل الشريف وترك الكسل.',
    shortDua:
      'اللَّهُمَّ افْتَحْ لَنَا أَبْوَابَ الْعِلْمِ وَالْفَهْمِ وَبَارِكْ لَنَا فِي شَهْرِ رَجَبَ.',
  },
  {
    id: 'occ-rajab-3',
    month: 7,
    day: 3,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة الإمام علي الهادي النقي (عليه السلام)',
    figureName: 'الإمام علي الهادي (عليه السلام)',
    shortStory:
      'الإمام العاشر الذي أرشد الأمة في سامراء وخلّد لنا أسمى معاني التوحيد والزهد ومكارم الأخلاق في الزيارة الجامعة الكبيرة.',
    shortDua:
      'السَّلَامُ عَلَيْكَ يَا أَبَا الْحَسَنِ عَلِيَّ بْنَ مُحَمَّدٍ الْهَادِيَ النَّقِيَّ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-hadi',
    linkedLabel: 'اقرأ زيارة الإمام الهادي (ع)',
  },
  {
    id: 'occ-rajab-10',
    month: 7,
    day: 10,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة الإمام محمد الجواد (عليه السلام)',
    figureName: 'الإمام محمد الجواد (عليه السلام)',
    shortStory:
      'وُلد باب المراد الإمام الجواد (عليه السلام) فأظهر في صباه حكمةً وعلماً وكرماً جعله قدوةً للأطفال والأذكياء.',
    shortDua:
      'اللَّهُمَّ انْفَعْنَا بِمَا عَلَّمْتَنَا وَزِدْنَا ذَكَاءً وَتَوَاضُعاً وَسَخَاءً.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-jawad',
    linkedLabel: 'اقرأ زيارة الإمام الجواد (ع)',
  },
  {
    id: 'occ-rajab-13',
    month: 7,
    day: 13,
    type: 'birth',
    category: 'birth',
    title: 'ولادة الإمام علي بن أبي طالب (عليه السلام) في الكعبة المشرفة',
    figureName: 'الإمام علي (عليه السلام)',
    shortStory:
      'في حادثة فريدة لم تتكرر لأحد غيره، وُلد أمير المؤمنين (عليه السلام) داخل الكعبة المشرفة ليكون رمزاً للعدل والشجاعة والعلم.',
    shortDua:
      'اللَّهُمَّ ثَبِّتْنَا عَلَى الْعَدْلِ وَالصِّدْقِ وَمَحَبَّةِ أَمِيرِ الْمُؤْمِنِينَ عَلِيٍّ (عَلَيْهِ السَّلَامُ).',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-amin',
    linkedLabel: 'اقرأ زيارة أمين الله',
  },
  {
    id: 'occ-rajab-15',
    month: 7,
    day: 15,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى وفاة السيدة زينب الكبرى (عليها السلام)',
    figureName: 'السيدة زينب (عليها السلام)',
    shortStory:
      'رحلت عقيلة بني هاشم (عليها السلام) بعد حياةٍ حافلةٍ بالصبر والجهاد وحفظ رسالة أخيها الإمام الحسين (عليه السلام).',
    shortDua:
      'السَّلَامُ عَلَيْكِ يَا بِنْتَ أَمِيرِ الْمُؤْمِنِينَ، اللَّهُمَّ اجْعَلْنَا مِنَ الصَّابِرِينَ الشَّاكِرِينَ.',
  },
  {
    id: 'occ-rajab-25',
    month: 7,
    day: 25,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة الإمام موسى بن جعفر الكاظم (عليه السلام)',
    figureName: 'الإمام موسى الكاظم (عليه السلام)',
    shortStory:
      'استشهد الإمام الكاظم (عليه السلام) صابراً محتسباً في السجون بعد سنواتٍ من العبادة والصبر وإعانة المحتاجين.',
    shortDua:
      'اللَّهُمَّ صَلِّ عَلَى مُوسَى بْنِ جَعْفَرٍ الْكَاظِمِ وَارْزُقْنَا شَفَاعَتَهُ وَطَاعَتَكَ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-kadhim',
    linkedLabel: 'اقرأ زيارة الإمام الكاظم (ع)',
  },
  {
    id: 'occ-rajab-27',
    month: 7,
    day: 27,
    type: 'birth',
    category: 'eid',
    title: 'عيد المبعث النبوي الشريف',
    figureName: 'النبي محمد (ﷺ)',
    shortStory:
      'في السابع والعشرين من رجب نزل الوحي على قلب رسول الله (ﷺ) بـ«اقرأ» لتبدأ رسالة النور والعلم والرحمة للعالمين.',
    shortDua:
      'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ، وَأَحْيِ قُلُوبَنَا بِنُورِ الْقُرْآنِ وَالْإِيمَانِ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-prophet-far',
    linkedLabel: 'اقرأ زيارة النبي (ﷺ)',
  },

  // ─── 8. شعبان المعظم ───
  {
    id: 'occ-shaban-3',
    month: 8,
    day: 3,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة الإمام الحسين (عليه السلام)',
    figureName: 'الإمام الحسين (عليه السلام)',
    shortStory:
      'فرح النبي (ﷺ) بميلاد ريحانته الحسين (عليه السلام)، وأمر أن يُسمّى «حسيناً» وأحاطه بالمحبة والحنان.',
    shortDua:
      'اللَّهُمَّ اجْعَلْ قُلُوبَنَا مَلِيئَةً بِالشَّهَامَةِ وَنُصْرَةِ الْمَظْلُومِ وَالْأَدَبِ الْجَمِيلِ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-husain-special',
    linkedLabel: 'اقرأ زيارة الإمام الحسين (ع)',
  },
  {
    id: 'occ-shaban-4',
    month: 8,
    day: 4,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة أبي الفضل العباس بن علي (عليه السلام)',
    figureName: 'أبو الفضل العباس (عليه السلام)',
    shortStory:
      'أشرق قمر بني هاشم في الرابع من شعبان ليكون رمز الشجاعة والوفاء وحماية العائلة والمحتاجين.',
    shortDua:
      'اللَّهُمَّ ارْزُقْنَا الْبَصِيرَةَ وَالصِّدْقَ وَالْإِخْلَاصَ كَمَا رَزَقْتَ أَبَا الْفَضْلِ الْعَبَّاسَ (ع).',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-abbas',
    linkedLabel: 'اقرأ زيارة العباس (ع)',
  },
  {
    id: 'occ-shaban-5',
    month: 8,
    day: 5,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة الإمام علي زين العابدين (عليه السلام)',
    figureName: 'الإمام زين العابدين (عليه السلام)',
    shortStory:
      'وُلد سيد الساجدين (عليه السلام) فملأ الدنيا بمناجاته الرقيقة ودعائه للأهل والجيران والطلبة.',
    shortDua:
      'اللَّهُمَّ أَحْيِ قُلُوبَنَا بِذِكْرِكَ، وَارْزُقْنَا لَذَّةَ مُنَاجَاتِكَ وَالْخُشُوعَ فِي صَلَاتِنَا.',
    linkedSection: 'munajat',
    linkedLabel: 'تأمل في همسات المناجاة',
  },
  {
    id: 'occ-shaban-11',
    month: 8,
    day: 11,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة علي الأكبر بن الحسين (عليه السلام)',
    figureName: 'علي الأكبر (عليه السلام)',
    shortStory:
      'الشاب الشهم الذي كان أشبه الناس خلقاً وخُلقاً ومنطقاً برسول الله (ﷺ)، وقدوةً للشباب المؤمن.',
    shortDua:
      'اللَّهُمَّ جَمِّلْ شَبَابَنَا وَفَتَيَاتِنَا بِأَخْلَاقِ النَّبِيِّ وَآلِهِ الْأَطْهَارِ.',
  },
  {
    id: 'occ-shaban-15',
    month: 8,
    day: 15,
    type: 'birth',
    category: 'eid',
    title: 'النصف من شعبان — ولادة الإمام المهدي (عجل الله فرجه)',
    figureName: 'الإمام المهدي (عجل الله فرجه)',
    shortStory:
      'تتزيّن البيوت بالأنوار في النصف من شعبان احتفاءً بميلاد أمل المستضعفين، ونجدد العهد على أن نكون صالحين مجتهدين.',
    shortDua:
      'اللَّهُمَّ كُنْ لِوَلِيِّكَ الْحُجَّةِ بْنِ الْحَسَنِ وَلِيّاً وَحَافِظاً وَقَائِداً وَنَاصِراً، وَاجْعَلْنَا مِنْ خَيْرِ أَنْصَارِهِ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-yasin',
    linkedLabel: 'اقرأ زيارة آل ياسين',
  },

  // ─── 9. رمضان المبارك ───
  {
    id: 'occ-ramadan-1',
    month: 9,
    day: 1,
    type: 'birth',
    category: 'event',
    title: 'أول شهر رمضان المبارك — شهر القرآن والضيافة الإلهية',
    figureName: 'أهل البيت (عليهم السلام)',
    shortStory:
      'أقبل شهر الرحمة والمغفرة وتلاوة القرآن، الذي تُفتح فيه أبواب السماء وتُضاعف فيه الحسنات والأعمال الصالحة.',
    shortDua:
      'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْأَمْنِ وَالْإِيمَانِ وَالسَّلَامَةِ وَالْإِسْلَامِ وَأَعِنَّا عَلَى صِيَامِهِ وَقِيَامِهِ.',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-iftitah',
    linkedLabel: 'اقرأ دعاء الافتتاح',
  },
  {
    id: 'occ-ramadan-10',
    month: 9,
    day: 10,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى وفاة السيدة خديجة الكبرى (عليها السلام)',
    figureName: 'السيدة خديجة الكبرى (عليها السلام)',
    shortStory:
      'أم المؤمنين وأم السيدة فاطمة الزهراء (ع)؛ ناصرت النبي (ﷺ) في أصعب الأيام وبذلت كل مالها في سبيل نشر الإسلام.',
    shortDua:
      'اللَّهُمَّ صَلِّ عَلَى خَدِيجَةَ الْكُبْرَى وَارْحَمْ أُمَّهَاتِنَا وَاجْزِهِنَّ عَنَّا خَيْرَ الْجَزَاءِ.',
  },
  {
    id: 'occ-ramadan-15',
    month: 9,
    day: 15,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة الإمام الحسن المجتبى (عليه السلام)',
    figureName: 'الإمام الحسن (عليه السلام)',
    shortStory:
      'في منتصف شهر الصيام والقرآن وُلد كريم أهل البيت الإمام الحسن (عليه السلام)، فكان يبتسم للمحتاجين ويقاسمهم طعامه.',
    shortDua:
      'اللَّهُمَّ بَارِكْ لَنَا فِي شَهْرِ رَمَضَانَ وَارْزُقْنَا سَمَاحَةَ الْإِمَامِ الْحَسَنِ وَكَرَمَهُ.',
  },
  {
    id: 'occ-ramadan-19',
    month: 9,
    day: 19,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ليلة القدر الأولى — ضربة الإمام علي (عليه السلام) في المحراب',
    figureName: 'الإمام علي (عليه السلام)',
    shortStory:
      'في فجر التاسع عشر من رمضان أصيب أمير المؤمنين (عليه السلام) وهو قائم يصلي في محراب مسجد الكوفة، فهتف: «فزت ورب الكعبة».',
    shortDua:
      'اللَّهُمَّ ارْحَمْنَا فِي لَيَالِي الْقَدْرِ وَثَبِّتْنَا عَلَى الصَّلَاةِ وَطَاعَتِكَ.',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-jawshan-kabir',
    linkedLabel: 'اقرأ دعاء الجوشن الكبير',
  },
  {
    id: 'occ-ramadan-21',
    month: 9,
    day: 21,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ليلة القدر — شهادة أمير المؤمنين الإمام علي (عليه السلام)',
    figureName: 'الإمام علي (عليه السلام)',
    shortStory:
      'قبل رحيله أوصى الإمام علي (عليه السلام) أولاده والمسلمين بتقوى الله، ونظم أمورهم، والرحمة بالأيتام، والعطف على الجيران.',
    shortDua:
      'اللَّهُمَّ ارْحَمْ أَيْتَامَنَا وَمَرْضَانَا، وَاغْفِرْ لَنَا وَلِوَالِدَيْنَا فِي لَيَالِي الْقَدْرِ الْمُبَارَكَةِ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-amin',
    linkedLabel: 'اقرأ زيارة أمين الله',
  },
  {
    id: 'occ-ramadan-23',
    month: 9,
    day: 23,
    type: 'remembrance',
    category: 'event',
    title: 'ليلة القدر الكبرى — خير من ألف شهر',
    figureName: 'شهر الله المبارك',
    shortStory:
      'الليلة المرجوّة التي تتنزل فيها الملائكة والروح وتُقدّر فيها أرزاق العباد وآجالهم لعامٍ قادم بالرحمة والمغفرة.',
    shortDua:
      'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنَّا، وَاكْتُبْنَا مِنَ السُّعَدَاءِ.',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-jawshan-kabir',
    linkedLabel: 'اقرأ دعاء الجوشن الكبير',
  },

  // ─── 10. شوال المكرم ───
  {
    id: 'occ-shawwal-1',
    month: 10,
    day: 1,
    type: 'birth',
    category: 'eid',
    title: 'عيد الفطر السعيد',
    figureName: 'أمة الإسلام',
    shortStory:
      'يوم الجائزة والفرحة للصائمين، تتصافح فيه القلوب وتُوصل الأرحام ويُدخل فيه السرور على الفقراء والأطفال.',
    shortDua:
      'اللَّهُمَّ تَقَبَّلْ صِيَامَنَا وَقِيَامَنَا وَأَعِدْهُ عَلَيْنَا بِالْخَيْرِ وَالْيُمْنِ وَالْبَرَكَاتِ.',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-nudba',
    linkedLabel: 'اقرأ دعاء الندبة الشريف',
  },
  {
    id: 'occ-shawwal-8',
    month: 10,
    day: 8,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى هدم قبور أئمة البقيع (عليهم السلام)',
    figureName: 'أئمة البقيع (عليهم السلام)',
    shortStory:
      'ذكرى أليمة يستحضر فيها المسلمون مكانة الأئمة الأربعة المدفونين في بقيع الغرقد: الحسن المجتبى، السجاد، الباقر، والصادق (عليهم السلام).',
    shortDua:
      'السَّلَامُ عَلَيْكُمْ يَا أَئِمَّةَ الْبَقِيعِ، اللَّهُمَّ ارْزُقْنَا زِيَارَتَهُمْ وَشَفَاعَتَهُمْ.',
  },
  {
    id: 'occ-shawwal-25',
    month: 10,
    day: 25,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة الإمام جعفر الصادق (عليه السلام)',
    figureName: 'الإمام جعفر الصادق (عليه السلام)',
    shortStory:
      'ترك الإمام الصادق (عليه السلام) آلاف التلاميذ والكتب المضيئة التي حفظت علوم الدين والأخلاق والفكر عبر العصور.',
    shortDua:
      'اللَّهُمَّ انْفَعْنَا بِعِلْمِ الصَّادِقِينَ وَاجْعَلْ أَلْسِنَتَنَا لَاهِجَةً بِالصِّدْقِ وَالشُّكْرِ.',
  },

  // ─── 11. ذو القعدة الحرام ───
  {
    id: 'occ-dhulqadah-1',
    month: 11,
    day: 1,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة السيدة فاطمة المعصومة (عليها السلام)',
    figureName: 'السيدة فاطمة المعصومة (عليها السلام)',
    shortStory:
      'استهلال شهر ذي القعدة بميلاد كريمة أهل البيت (عليها السلام) صاحبة الفضل والعلم والتقوى.',
    shortDua:
      'اللَّهُمَّ بَارِكْ لَنَا فِي شَهْرِ ذِي الْقَعْدَةِ وَاجْعَلْنَا مِنْ أَهْلِ الْعِلْمِ وَالتَّقْوَى.',
  },
  {
    id: 'occ-dhulqadah-11',
    month: 11,
    day: 11,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة الإمام علي بن موسى الرضا (عليه السلام)',
    figureName: 'الإمام علي الرضا (عليه السلام)',
    shortStory:
      'أشرق نور أنيس النفوس الإمام الرضا (عليه السلام)، ضامن الغزالة الخائفة ومعلم التواضع والرحمة بكل الكائنات.',
    shortDua:
      'اللَّهُمَّ صَلِّ عَلَى عَلِيِّ بْنِ مُوسَى الرِّضَا، وَارْزُقْنَا زِيَارَتَهُ وَسَمَاحَةَ خُلُقِهِ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-reza',
    linkedLabel: 'اقرأ زيارة الإمام الرضا (ع)',
  },
  {
    id: 'occ-dhulqadah-25',
    month: 11,
    day: 25,
    type: 'birth',
    category: 'event',
    title: 'يوم دحو الأرض المبارك',
    figureName: 'الكعبة المشرفة',
    shortStory:
      'اليوم الذي دُحيت فيه الأرض وبُسطت من تحت الكعبة المشرفة، ويُستحب فيه الصيام والدعاء وذكر الله تعالى.',
    shortDua:
      'اللَّهُمَّ دَاحِيَ الْكَعْبَةِ وَفَالِقَ الْحَبَّةِ، بَارِكْ لَنَا فِي أَرْزَاقِنَا وَطَاعَتِكَ.',
  },
  {
    id: 'occ-dhulqadah-29',
    month: 11,
    day: 29,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة الإمام محمد الجواد (عليه السلام)',
    figureName: 'الإمام محمد الجواد (عليه السلام)',
    shortStory:
      'رحل باب المراد الإمام الجواد (عليه السلام) في ريعان شبابه بعدما ملأ الدنيا بحكمته وجوده وكراماته.',
    shortDua:
      'السَّلَامُ عَلَيْكَ يَا أَبَا جَعْفَرٍ مُحَمَّدَ بْنَ عَلِيٍّ الْجَوَادَ، اللَّهُمَّ اقْضِ حَوَائِجَنَا بِجُودِكَ.',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-jawad',
    linkedLabel: 'اقرأ زيارة الإمام الجواد (ع)',
  },

  // ─── 12. ذو الحجة الحرام ───
  {
    id: 'occ-dhulhijjah-1',
    month: 12,
    day: 1,
    type: 'birth',
    category: 'event',
    title: 'ذكرى زواج النورين الإمام علي والسيدة الزهراء (عليهما السلام)',
    figureName: 'الإمام علي والسيدة الزهراء (عليهما السلام)',
    shortStory:
      'أجمل زواجٍ مبارك في التاريخ الإسلامي اتّسم بالبساطة والقناعة والمودة، فكان أساس أسرة النور والطهارة.',
    shortDua:
      'اللَّهُمَّ أَلِّفْ بَيْنَ قُلُوبِ أُسَرِنَا وَاجْعَلْ بُيُوتَنَا عَامِرَةً بِالْمَوَدَّةِ وَالسَّعَادَةِ.',
  },
  {
    id: 'occ-dhulhijjah-7',
    month: 12,
    day: 7,
    type: 'remembrance',
    category: 'martyrdom',
    title: 'ذكرى شهادة الإمام محمد الباقر (عليه السلام)',
    figureName: 'الإمام محمد الباقر (عليه السلام)',
    shortStory:
      'الإمام الخامس الذي بقر علوم الأولين والآخرين وربّى جيل العلماء والفقهاء قبل رحيله إلى جوار ربه.',
    shortDua:
      'السَّلَامُ عَلَيْكَ يَا بَاقِرَ عِلْمِ النَّبِيِّينَ، اللَّهُمَّ زِدْنَا عِلْماً نَافِعاً.',
  },
  {
    id: 'occ-dhulhijjah-9',
    month: 12,
    day: 9,
    type: 'remembrance',
    category: 'event',
    title: 'يوم عرفة المبارك وشهادة مسلم بن عقيل (عليه السلام)',
    figureName: 'الإمام الحسين (عليه السلام) ومسلم بن عقيل',
    shortStory:
      'يوم الدعاء العظيم والتوبة في عرفات حيث أبدع الإمام الحسين (ع) أعظم دعاء في التوحيد والشكر، وفيه أيضاً استشهد سفيره مسلم بن عقيل.',
    shortDua:
      'اللَّهُمَّ اجْعَلْنَا فِي يَوْمِ عَرَفَةَ مِنَ الْمُعْتَقِينَ الْمَغْفُورِ لَهُمْ بِرَحْمَتِكَ.',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-arafah',
    linkedLabel: 'اقرأ دعاء يوم عرفة كاملاً',
  },
  {
    id: 'occ-dhulhijjah-10',
    month: 12,
    day: 10,
    type: 'birth',
    category: 'eid',
    title: 'عيد الأضحى المبارك',
    figureName: 'أمة الإسلام',
    shortStory:
      'عيد البذل والإخلاص وطاعة الله، يجتمع فيه الحجاج في منى والمسلمون في كل بقاع الأرض على الشكر والتكبير ومساعدة المحتاجين.',
    shortDua:
      'اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ، اللَّهُمَّ تَقَبَّلْ مِنَّا وَبَارِكْ لَنَا فِي أَعْيَادِنَا.',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-nudba',
    linkedLabel: 'اقرأ دعاء الندبة الشريف',
  },
  {
    id: 'occ-dhulhijjah-15',
    month: 12,
    day: 15,
    type: 'birth',
    category: 'birth',
    title: 'ذكرى ولادة الإمام علي الهادي النقي (عليه السلام)',
    figureName: 'الإمام علي الهادي (عليه السلام)',
    shortStory:
      'وُلد الإمام الهادي (عليه السلام) في صريا قرب المدينة المنورة فكان هادياً للأمة في العلم والتقوى والعبادة.',
    shortDua:
      'اللَّهُمَّ اهْدِنَا صِرَاطَكَ الْمُسْتَقِيمَ وَثَبِّتْنَا عَلَى وَلَايَةِ أَهْلِ الْبَيْتِ (ع).',
    linkedSection: 'ziyarat',
    linkedEntryId: 'dl-z-hadi',
    linkedLabel: 'اقرأ زيارة الإمام الهادي (ع)',
  },
  {
    id: 'occ-dhulhijjah-18',
    month: 12,
    day: 18,
    type: 'birth',
    category: 'eid',
    title: 'عيد الغدير الأغر — يوم الولاية والمحبة والإخاء',
    figureName: 'النبي محمد (ﷺ) والإمام علي (عليه السلام)',
    shortStory:
      'أعظم الأعياد الإسلامية، يتبادل فيه المسلمون التهاني والهدايا ويُدخلون السرور على قلوب الصغار والكبار اقتداءً بأمر النبي (ﷺ).',
    shortDua:
      'الْحَمْدُ لِلَّهِ الَّذِي جَعَلَنَا مِنَ الْمُتَمَسِّكِينَ بِوَلَايَةِ أَمِيرِ الْمُؤْمِنِينَ وَالْأَئِمَّةِ الْمَعْصُومِينَ (عَلَيْهِمُ السَّلَامُ).',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-nudba',
    linkedLabel: 'اقرأ دعاء الندبة الشريف',
  },
  {
    id: 'occ-dhulhijjah-24',
    month: 12,
    day: 24,
    type: 'birth',
    category: 'event',
    title: 'يوم المباهلة الشريفة ونزول آية التطهير وسورة الإنسان',
    figureName: 'أصحاب الكساء الخمسة (عليهم السلام)',
    shortStory:
      'خرج النبي (ﷺ) ومعه علي وفاطمة والحسن والحسين (عليهم السلام) ليثبت للعالم صدق رسالته، كما نزل فيه فضل إطعامهم المسكين واليتيم والأسير.',
    shortDua:
      'اللَّهُمَّ صَلِّ عَلَى أَصْحَابِ الْكِسَاءِ الْخَمْسَةِ وَاحْشُرْنَا فِي زُمْرَتِهِمْ.',
  },
];

export interface HijriDateInfo {
  day: number;
  month: number;
  year: number;
  monthName: string;
  formattedArabic: string;
}

export interface GregorianDateInfo {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  weekdayIndex: number; // 0..6
  weekdayAr: string;
  monthNameAr: string;
  formattedArabic: string;
  isoDate: string; // YYYY-MM-DD
}

export interface DualCalendarDay {
  hijri: HijriDateInfo;
  gregorian: GregorianDateInfo;
  occasions: HijriOccasion[];
  isToday: boolean;
}

const HIJRI_OFFSET_KEY = 'rihlat_alnoor_hijri_offset_v1';

export function loadHijriOffset(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(HIJRI_OFFSET_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    if (Number.isInteger(n) && n >= -2 && n <= 2) return n;
  } catch {
    // Ignore storage read errors
  }
  return 0;
}

export function saveHijriOffset(offset: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HIJRI_OFFSET_KEY, String(offset));
    window.dispatchEvent(new CustomEvent('rihlat:hijri-offset-updated'));
  } catch {
    // Ignore storage write errors
  }
}

export function toGregorianInfoFromUtcNoon(utcNoonMs: number): GregorianDateInfo {
  const d = new Date(utcNoonMs);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const weekdayIndex = d.getUTCDay();
  const weekdayAr = ARABIC_WEEKDAYS[weekdayIndex] || '';
  const monthNameAr = GREGORIAN_MONTH_NAMES[month] || '';
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
    2,
    '0'
  )}`;
  const formattedArabic = `${weekdayAr} ${day} ${monthNameAr} ${year} م`;
  return {
    year,
    month,
    day,
    weekdayIndex,
    weekdayAr,
    monthNameAr,
    formattedArabic,
    isoDate,
  };
}

export function getHijriFromUtcNoon(
  utcNoonMs: number,
  offsetDays = 0
): HijriDateInfo {
  const adjustedMs = utcNoonMs + offsetDays * 86400000;
  const adjustedDate = new Date(adjustedMs);
  const actualWeekdayAr =
    ARABIC_WEEKDAYS[new Date(utcNoonMs).getUTCDay()] || '';
  const tryCalendars = ['islamic-civil', 'islamic-umalqura', 'islamic'];

  for (const cal of tryCalendars) {
    try {
      const numFmt = new Intl.DateTimeFormat(`en-u-ca-${cal}-nu-latn`, {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      const parts = numFmt.formatToParts(adjustedDate);
      const day = Number(parts.find((p) => p.type === 'day')?.value || 1);
      const month = Number(parts.find((p) => p.type === 'month')?.value || 1);
      const year = Number(parts.find((p) => p.type === 'year')?.value || 1448);

      if (day >= 1 && day <= 30 && month >= 1 && month <= 12) {
        const monthName = HIJRI_MONTH_NAMES[month] || '';
        const formattedArabic = `${actualWeekdayAr} ${day} ${monthName} ${year} هـ`;
        return {
          day,
          month,
          year,
          monthName,
          formattedArabic,
        };
      }
    } catch {
      // Try next calendar
    }
  }

  return {
    day: 1,
    month: 7,
    year: 1448,
    monthName: HIJRI_MONTH_NAMES[7],
    formattedArabic: `${actualWeekdayAr} 1 ${HIJRI_MONTH_NAMES[7]} 1448 هـ`,
  };
}

export function getTodayUtcNoon(): number {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

export function getTodayHijriDate(
  date: Date = new Date(),
  offsetDays = loadHijriOffset()
): HijriDateInfo {
  const utcNoon = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0
  );
  return getHijriFromUtcNoon(utcNoon, offsetDays);
}

export function getOccasionsForHijriDay(
  month: number,
  day: number
): HijriOccasion[] {
  return HIJRI_OCCASIONS.filter(
    (occ) => occ.month === month && occ.day === day
  );
}

export function getCurrentOrUpcomingOccasions(hijri: HijriDateInfo): {
  occasions: HijriOccasion[];
  isExactToday: boolean;
  daysUntil: number;
} {
  const exactList = getOccasionsForHijriDay(hijri.month, hijri.day);
  if (exactList.length > 0) {
    return { occasions: exactList, isExactToday: true, daysUntil: 0 };
  }

  const todayApprox = (hijri.month - 1) * 30 + hijri.day;
  let bestDiff = 999;

  for (const occ of HIJRI_OCCASIONS) {
    const occApprox = (occ.month - 1) * 30 + occ.day;
    let diff = occApprox - todayApprox;
    if (diff < 0) diff += 360;
    if (diff < bestDiff) {
      bestDiff = diff;
    }
  }

  const upcoming = HIJRI_OCCASIONS.filter((occ) => {
    const occApprox = (occ.month - 1) * 30 + occ.day;
    let diff = occApprox - todayApprox;
    if (diff < 0) diff += 360;
    return diff === bestDiff;
  });

  return {
    occasions: upcoming.length > 0 ? upcoming : [HIJRI_OCCASIONS[0]],
    isExactToday: false,
    daysUntil: bestDiff,
  };
}

// Keep backward-compatible helper signature if referenced anywhere
export function getCurrentOrUpcomingOccasion(hijri: HijriDateInfo): {
  occasion: HijriOccasion;
  isExactToday: boolean;
  daysUntil: number;
} {
  const res = getCurrentOrUpcomingOccasions(hijri);
  return {
    occasion: res.occasions[0],
    isExactToday: res.isExactToday,
    daysUntil: res.daysUntil,
  };
}

function findUtcNoonForHijriMonthStart(
  hYear: number,
  hMonth: number,
  offsetDays: number
): number {
  // Hijri epoch (1 Muharram 1 AH ≈ 622-07-16 Gregorian)
  const epochMs = Date.UTC(622, 6, 16, 12, 0, 0);
  const approxDays = Math.round(
    (hYear - 1) * 354.36667 + (hMonth - 1) * 29.53059
  );
  const estimateMs = epochMs + (approxDays - offsetDays) * 86400000;

  for (let delta = -15; delta <= 15; delta++) {
    const candidateMs = estimateMs + delta * 86400000;
    const h = getHijriFromUtcNoon(candidateMs, offsetDays);
    if (h.year === hYear && h.month === hMonth && h.day === 1) {
      return candidateMs;
    }
  }

  // Fallback wider scan (±45 days)
  for (let delta = -45; delta <= 45; delta++) {
    const candidateMs = estimateMs + delta * 86400000;
    const h = getHijriFromUtcNoon(candidateMs, offsetDays);
    if (h.year === hYear && h.month === hMonth && h.day === 1) {
      return candidateMs;
    }
  }

  return estimateMs;
}

export function buildHijriMonthDays(
  hYear: number,
  hMonth: number,
  offsetDays: number
): DualCalendarDay[] {
  const startMs = findUtcNoonForHijriMonthStart(hYear, hMonth, offsetDays);
  const todayIso = toGregorianInfoFromUtcNoon(getTodayUtcNoon()).isoDate;
  const days: DualCalendarDay[] = [];

  for (let i = 0; i < 31; i++) {
    const ms = startMs + i * 86400000;
    const hijri = getHijriFromUtcNoon(ms, offsetDays);
    if (hijri.year !== hYear || hijri.month !== hMonth) break;
    const gregorian = toGregorianInfoFromUtcNoon(ms);
    days.push({
      hijri,
      gregorian,
      occasions: getOccasionsForHijriDay(hijri.month, hijri.day),
      isToday: gregorian.isoDate === todayIso,
    });
  }

  return days;
}

export function buildGregorianMonthDays(
  gYear: number,
  gMonth: number,
  offsetDays: number
): DualCalendarDay[] {
  const daysCount = new Date(Date.UTC(gYear, gMonth, 0)).getUTCDate();
  const todayIso = toGregorianInfoFromUtcNoon(getTodayUtcNoon()).isoDate;
  const days: DualCalendarDay[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const ms = Date.UTC(gYear, gMonth - 1, d, 12, 0, 0);
    const hijri = getHijriFromUtcNoon(ms, offsetDays);
    const gregorian = toGregorianInfoFromUtcNoon(ms);
    days.push({
      hijri,
      gregorian,
      occasions: getOccasionsForHijriDay(hijri.month, hijri.day),
      isToday: gregorian.isoDate === todayIso,
    });
  }

  return days;
}
