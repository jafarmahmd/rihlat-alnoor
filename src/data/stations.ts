import heroIllustration from '../assets/images/hero_rihlat_alnoor_1794670601900.jpg';
import medinaGardenImg from '../assets/images/station_medina_garden_1794670602835.jpg';
import breadBasketImg from '../assets/images/station_bread_basket_1794670603532.jpg';
import wisdomScrollImg from '../assets/images/station_wisdom_scroll_1794670603413.jpg';
import lanternArchImg from '../assets/images/station_lantern_arch_1794670604609.jpg';
import { StageData, StationData } from '../types/game';
import { STATIONS_1_TO_50 } from './stages1to5';
import { STATIONS_51_TO_100 } from './stages6to10';

export const HERO_ARTWORK = heroIllustration;

export const STAGES: StageData[] = [
  {
    id: 1,
    title: 'الكرم ومساعدة المحتاجين',
    description: 'نتعلم كيف نشارك الخير ونسعد المحتاجين بقلب محب ومعطاء.',
    themeColor: 'emerald',
    stationRange: [1, 10],
    artworkPath: breadBasketImg,
    artworkAlt: 'سلة خبز وتمر وماء رمز الكرم والإيثار',
  },
  {
    id: 2,
    title: 'الرحمة والرفق بالحيوان والطبيعة',
    description: 'نكتشف رفق أهل البيت (عليهم السلام) بالطيور والحيوانات والنباتات.',
    themeColor: 'sky',
    stationRange: [11, 20],
    artworkPath: medinaGardenImg,
    artworkAlt: 'بستان أخضر جميل فيه طيور وزهور',
  },
  {
    id: 3,
    title: 'الصدق والأمانة وحفظ الحقوق',
    description: 'نتعرف على قيمة الصدق وحفظ الأمانات والعدل في كل تعاملاتنا.',
    themeColor: 'amber',
    stationRange: [21, 30],
    artworkPath: wisdomScrollImg,
    artworkAlt: 'كتاب مفتوح ومصباح مضيء',
  },
  {
    id: 4,
    title: 'بر الوالدين واحترام الكبير والعطف على الصغير',
    description: 'نعيش أجواء المودة الأسرية وحنان النبي ﷺ وأهل بيته مع الصغار والكبار.',
    themeColor: 'teal',
    stationRange: [31, 40],
    artworkPath: lanternArchImg,
    artworkAlt: 'قوس ترحيبي مضيء بالفوانيس الدافئة',
  },
  {
    id: 5,
    title: 'النظافة والنظام وحب العلم والتعلم',
    description: 'نرتقي بالنظافة وتنظيم الوقت والشغف بالقراءة والاكتشاف.',
    themeColor: 'sky',
    stationRange: [41, 50],
    artworkPath: wisdomScrollImg,
    artworkAlt: 'مكتب منظم وكتب علمية مفتوحة',
  },
  {
    id: 6,
    title: 'الحِلم وضبط النفس',
    description: 'نتدرب على الهدوء وكظم الغيظ والرد اللطيف عند المواقف الصعبة.',
    themeColor: 'emerald',
    stationRange: [51, 60],
    artworkPath: lanternArchImg,
    artworkAlt: 'فناء هادئ مضيء بالفوانيس',
  },
  {
    id: 7,
    title: 'العفو عند المقدرة والصفح',
    description: 'نتأمل جمال التسامح والعفو وصفاء القلب عندما نقدر على المسامحة.',
    themeColor: 'amber',
    stationRange: [61, 70],
    artworkPath: heroIllustration,
    artworkAlt: 'فانوس النور والصفاء',
  },
  {
    id: 8,
    title: 'الشجاعة في قول الحق ونصرة المظلوم',
    description: 'نتعلم قول الصدق بشجاعة والوقوف إلى جانب الضعيف والمظلوم.',
    themeColor: 'teal',
    stationRange: [71, 80],
    artworkPath: wisdomScrollImg,
    artworkAlt: 'كتاب الحق والحكمة',
  },
  {
    id: 9,
    title: 'التعاون وخدمة الآخرين والتواضع',
    description: 'نكتشف لذة العمل الجماعي والاعتماد على النفس وخدمة الفريق.',
    themeColor: 'emerald',
    stationRange: [81, 90],
    artworkPath: medinaGardenImg,
    artworkAlt: 'حديقة متفتحة بروح التعاون',
  },
  {
    id: 10,
    title: 'حب الجار وبناء المجتمع المترابط',
    description: 'نختتم الرحلة بمحبة الجيران والابتسامة ونشر السلام في الحي والمدرسة.',
    themeColor: 'amber',
    stationRange: [91, 100],
    artworkPath: heroIllustration,
    artworkAlt: 'فانوس رحلة النور المتكاملة',
  },
];

export const STATIONS: StationData[] = [...STATIONS_1_TO_50, ...STATIONS_51_TO_100];

export const TOTAL_POSSIBLE_STARS = STATIONS.reduce(
  (sum, s) => sum + s.starsReward,
  0
);
