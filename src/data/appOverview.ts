export interface AppOverviewSectionItem {
  id: string;
  title: string;
  description: string;
  targetAction:
    | { type: 'library'; section: 'quran' | 'adiyat' | 'sahifa' }
    | { type: 'screen'; screen: 'library' | 'tasbih' | 'calendar' | 'map' };
}

export const APP_OVERVIEW = {
  title: 'تطبيق "رحلة النور" 🌟',
  subtitle: 'المكتبة الإسلامية الرقمية الشاملة (الجعفرية الإثنا عشرية)',
  supervision: 'بإدارة وإشراف: جمعية كشافة الموعود الإسلامية',
  aboutHeading: '📖 نبذة عن التطبيق:',
  aboutBody:
    'تطبيق إسلامي تفاعلي صُمّم بعناية ليناسب جميع أفراد الأسرة (الصغار والكبار)، يجمع بين عراقة المعرفة ودقة المحتوى بأسلوب عصري مشيق يربط الناشئة والكبار بمعين أهل البيت (عليهم السلام).',
  sectionsHeading: '✨ المحتويات والأقسام الأساسية:',
  sections: [
    {
      id: 'quran',
      title: 'القرآن الكريم',
      description:
        'تصفح كامل المصحف الشريف مع خيارات الاستماع للتلاوة العطرة بوجود خيارات التحكم بالصوت أو وضع القراءة الشخصية.',
      targetAction: { type: 'library', section: 'quran' },
    },
    {
      id: 'adiyat',
      title: 'الأدعية والزيارات',
      description:
        'باقة متكاملة تشمل أدعية الأيام الأسبوعية، الأدعية الكبرى (كميل والندبة)، والزيارات الشريفة كاملة.',
      targetAction: { type: 'library', section: 'adiyat' },
    },
    {
      id: 'sahifa',
      title: 'الصحيفة السجادية',
      description: 'زبور آل محمد وأدعية الإمام زين العابدين (ع).',
      targetAction: { type: 'library', section: 'sahifa' },
    },
    {
      id: 'stories-games',
      title: 'القصص والألعاب التفاعلية',
      description:
        'قسم خاص يضم قصص أهل البيت (عليهم السلام) العامة، مع لعبة قصصية تفاعلية مصممة خصيصاً للأطفال لترسيخ القيم بأسلوب ممتع ومبسط.',
      targetAction: { type: 'screen', screen: 'library' },
    },
    {
      id: 'tasbih',
      title: 'السبحة الإلكترونية',
      description:
        'سبحة تفاعلية ذكية لتسبيح الزهراء (ع) والأذكار المفتوحة.',
      targetAction: { type: 'screen', screen: 'tasbih' },
    },
    {
      id: 'calendar',
      title: 'التقويم الجعفري',
      description:
        'تقويم هجري وميلادي يوثّق مناسبات وأحداث أهل البيت (عليهم السلام).',
      targetAction: { type: 'screen', screen: 'calendar' },
    },
  ] as AppOverviewSectionItem[],
  closingLine:
    'تطبيق "رحلة النور".. رفيقك اليومي لرحلة إيمانية وتعليمية مباركة.',
} as const;
