export type QuranReciterId =
  | 'silent'
  | 'basit-murattal'
  | 'basit-mojawwad'
  | 'maytham'
  | 'kadhimi'
  | 'osama';

export interface QuranReciterMeta {
  id: QuranReciterId;
  name: string;
  subtitle: string;
}

export interface AudioTrackOption {
  id: string;
  reciterName: string;
  url: string;
  note?: string;
}

export const QURAN_RECITERS: QuranReciterMeta[] = [
  {
    id: 'silent',
    name: 'وضع القراءة الشخصية الصامتة',
    subtitle: 'قراءة بدون صوت',
  },
  {
    id: 'basit-murattal',
    name: 'الشيخ عبد الباسط عبد الصمد (المرتل)',
    subtitle: 'سورة كاملة · مصحف مرتل',
  },
  {
    id: 'basit-mojawwad',
    name: 'الشيخ عبد الباسط عبد الصمد (المجود)',
    subtitle: 'سورة كاملة · مصحف مجود',
  },
  {
    id: 'maytham',
    name: 'الشيخ ميثم التمار',
    subtitle: 'سورة كاملة · حفص عن عاصم',
  },
  {
    id: 'kadhimi',
    name: 'القارئ عامر الكاظمي',
    subtitle: 'سورة كاملة · الطور العراقي',
  },
  {
    id: 'osama',
    name: 'القارئ أسامة الكربلائي',
    subtitle: 'تلاوة منفردة متوفرة (سورة المزمل)',
  },
];

// Standalone per-surah URLs verified for القارئ أسامة الكربلائي
const OSAMA_KARBALAEI_SURAHS: Record<number, string> = {
  73: 'https://archive.org/download/osama-al-karbalai/073.mp3',
};

export function getQuranSurahAudioUrl(
  reciterId: QuranReciterId,
  surahNumber: number
): { url: string; note?: string } | null {
  if (reciterId === 'silent') return null;

  const padded = String(surahNumber).padStart(3, '0');

  switch (reciterId) {
    case 'basit-murattal':
      return {
        url: `https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3/${padded}.mp3`,
      };
    case 'basit-mojawwad':
      return {
        url: `https://server11.mp3quran.net/basit/Almusshaf-Al-Mojawwad/${padded}.mp3`,
      };
    case 'maytham':
      return {
        url: `https://archive.org/download/MoshafHajMaythamAlTammar/${padded}.mp3`,
      };
    case 'kadhimi':
      return {
        url: `https://media.way2quran.com/amer-al-kazemi/hafs-an-asim/${padded}.mp3`,
      };
    case 'osama': {
      const url = OSAMA_KARBALAEI_SURAHS[surahNumber];
      return url ? { url } : null;
    }
    default:
      return null;
  }
}

export function getAvailableQuranRecitersForSurah(
  surahNumber: number
): QuranReciterMeta[] {
  return QURAN_RECITERS.filter(
    (reciter) =>
      reciter.id === 'silent' ||
      getQuranSurahAudioUrl(reciter.id, surahNumber) !== null
  );
}

const QURAN_RECITER_STORAGE_KEY = 'rihlat_alnoor_quran_reciter_v1';

export function loadSavedQuranReciter(): QuranReciterId {
  if (typeof window === 'undefined') return 'silent';
  try {
    const val = window.localStorage.getItem(QURAN_RECITER_STORAGE_KEY);
    if (QURAN_RECITERS.some((r) => r.id === val)) {
      return val as QuranReciterId;
    }
  } catch {
    // Ignore storage errors
  }
  return 'silent';
}

export function saveQuranReciter(reciterId: QuranReciterId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(QURAN_RECITER_STORAGE_KEY, reciterId);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Verified, CORS-compatible audio recitations for Duas, Ziyarat, and Munajat.
 * Every URL has been verified against archive.org / mp3.duas.org.
 */
export const ENTRY_AUDIO_TRACKS: Record<string, AudioTrackOption[]> = {
  // === أدعية الأيام السبعة ===
  'dua-sunday': [
    {
      id: 'dua-sunday-ar',
      reciterName: 'تلاوة خاشعة — دعاء يوم الأحد',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Youm%20%5B1%5D%20Ahad%20%5BSunday%5D.mp3',
    },
  ],
  'dua-monday': [
    {
      id: 'dua-monday-ar',
      reciterName: 'تلاوة خاشعة — دعاء يوم الإثنين',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Youm%20%5B2%5D%20Sani%20%5BMonday%5D.mp3',
    },
  ],
  'dua-tuesday': [
    {
      id: 'dua-tuesday-ar',
      reciterName: 'تلاوة خاشعة — دعاء يوم الثلاثاء',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Youm%20%5B3%5D%20Salis%20%5BTuesday%5D.mp3',
    },
  ],
  'dua-wednesday': [
    {
      id: 'dua-wednesday-ar',
      reciterName: 'تلاوة خاشعة — دعاء يوم الأربعاء',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Youm%20%5B4%5D%20Arbah%20%5BWednesday%5D.mp3',
    },
  ],
  'dua-thursday': [
    {
      id: 'dua-thursday-ar',
      reciterName: 'تلاوة خاشعة — دعاء يوم الخميس',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Youm%20%5B5%5D%20Khamis%20%5BThursday%5D.mp3',
    },
  ],
  'dua-friday': [
    {
      id: 'dua-friday-ar',
      reciterName: 'تلاوة خاشعة — دعاء يوم الجمعة',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Youm%20%5B6%5D%20Jummah%20%5BFriday%5D.mp3',
    },
  ],
  'dua-saturday': [
    {
      id: 'dua-saturday-ar',
      reciterName: 'تلاوة خاشعة — دعاء يوم السبت',
      url: "https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Youm%20%5B7%5D%20Sabi'ah%20%5BSaturday%5D.mp3",
    },
  ],

  // === الصحيفة السجادية ===
  'dl-sahifa-20': [
    {
      id: 'sahifa-20-abather',
      reciterName: 'الرادود أباذر الحلواجي',
      url: 'https://archive.org/download/dua_Akhlaq/dua_Akhlaq.mp3',
    },
    {
      id: 'sahifa-20-makarim',
      reciterName: 'تلاوة خاشعة — مكارم الأخلاق',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Makarimul%20Ikhlaq.mp3',
    },
  ],

  // === الأدعية الكبرى ===
  'dl-dua-sabah': [
    {
      id: 'sabah-maytham',
      reciterName: 'الشيخ ميثم التمار',
      url: 'https://archive.org/download/128k_20230118/%D8%AF%D8%B9%D8%A7%D8%A1_%D8%A7%D9%84%D8%B5%D8%A8%D8%A7%D8%AD_%D8%A8%D8%B5%D9%88%D8%AA_%D9%85%D9%8A%D8%AB%D9%85_%D8%A7%D9%84%D8%AA%D9%85%D8%A7%D8%B1_-_Morning_prayer%28256k%29.mp3',
    },
    {
      id: 'sabah-abather',
      reciterName: 'الرادود أباذر الحلواجي',
      url: "https://archive.org/download/duas-abather-al-halwachi/Dua%20Sabah%20-%20Abather%20Al%20Halwachi%20-%20Dua's%20Abather%20Al%20Halwachi.mp3",
    },
    {
      id: 'sabah-ar',
      reciterName: 'تلاوة خاشعة — دعاء الصباح',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Sabah.mp3',
    },
  ],
  'dl-dua-kumayl': [
    {
      id: 'kumayl-maytham',
      reciterName: 'الشيخ ميثم التمار',
      url: 'https://archive.org/download/2020-hd_202606/%D8%AF%D8%B9%D8%A7%D8%A1_%D9%83%D9%85%D9%8A%D9%84_%D8%A7%D9%84%D8%B4%D9%8A%D8%AE_%D9%85%D9%8A%D8%AB%D9%85_%D8%A7%D9%84%D8%AA%D9%85%D8%A7%D8%B1_2020_HD.m4a',
    },
    {
      id: 'kumayl-abather',
      reciterName: 'الرادود أباذر الحلواجي',
      url: "https://archive.org/download/duas-abather-al-halwachi/Dua%20e%20Kumayl%20-%20Abather%20Al%20Halwachi%20-%20Dua's%20Abather%20Al%20Halwachi.mp3",
    },
    {
      id: 'kumayl-ar',
      reciterName: 'تلاوة خاشعة — دعاء كميل',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Kumail.mp3',
    },
  ],
  'dl-dua-tawassul': [
    {
      id: 'tawassul-abather',
      reciterName: 'الرادود أباذر الحلواجي',
      url: "https://archive.org/download/duas-abather-al-halwachi/Dua%20e%20Tawassul%20-%20Abather%20Al%20Halwachi%20-%20Dua's%20Abather%20Al%20Halwachi.mp3",
    },
    {
      id: 'tawassul-duasorg',
      reciterName: 'تلاوة خاشعة — دعاء التوسل (١)',
      url: 'https://mp3.duas.org/Misc%20Duas/2_Tawassul.mp3',
    },
    {
      id: 'tawassul-ar',
      reciterName: 'تلاوة خاشعة — دعاء التوسل (٢)',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Tawassul.mp3',
    },
  ],
  'dl-dua-iftitah': [
    {
      id: 'iftitah-abather',
      reciterName: 'الرادود أباذر الحلواجي',
      url: 'https://archive.org/download/dua_alaftta7/dua_alaftta7.mp3',
    },
    {
      id: 'iftitah-farahmand',
      reciterName: 'الحاج محسن فرهمند',
      url: 'https://archive.org/download/eftetah.-farahmand-yas-dl.com-1/eftetah.Farahmand_YasDL.com%20%281%29.mp3',
    },
    {
      id: 'iftitah-ar',
      reciterName: 'تلاوة خاشعة — دعاء الافتتاح',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Iftitah.mp3',
    },
  ],
  'dl-dua-nudba': [
    {
      id: 'nudba-abather',
      reciterName: 'الرادود أباذر الحلواجي',
      url: "https://archive.org/download/duas-abather-al-halwachi/Dua%20Al%20Nodbah%20-%20Abather%20Al%20Halwachi%20-%20Dua's%20Abather%20Al%20Halwachi.mp3",
    },
    {
      id: 'nudba-ar',
      reciterName: 'تلاوة خاشعة — دعاء الندبة',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Nudbah.mp3',
    },
  ],
  'dl-dua-ahed': [
    {
      id: 'ahed-farahmand',
      reciterName: 'الحاج محسن فرهمند',
      url: 'https://archive.org/download/20240607_20240607_1540/%D8%AF%D8%B9%D8%A7%D9%8A%20%D8%B9%D9%87%D8%AF%20-%20%D9%81%D8%B1%D9%87%D9%85%D9%86%D8%AF.mp3',
    },
    {
      id: 'ahed-ar',
      reciterName: 'تلاوة خاشعة — دعاء العهد',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Ahad.mp3',
    },
  ],
  'dl-dua-jawshan-kabir': [
    {
      id: 'jawshan-kabir-1',
      reciterName: 'تلاوة خاشعة — الجوشن الكبير (١)',
      url: 'https://archive.org/download/aljawshan/aljawshan.mp3',
    },
    {
      id: 'jawshan-kabir-2',
      reciterName: 'تلاوة خاشعة — الجوشن الكبير (٢)',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Jawshan%20Kabeer.mp3',
    },
  ],
  'dl-dua-jawshan-saghir': [
    {
      id: 'jawshan-saghir-1',
      reciterName: 'تلاوة خاشعة — الجوشن الصغير',
      url: 'https://archive.org/download/duas_arabic_audio_mp3/Dua_e_Jawshan%20Sagheer.mp3',
    },
  ],
  'dl-dua-abi-hamza': [
    {
      id: 'abi-hamza-abather',
      reciterName: 'الرادود أباذر الحلواجي',
      url: "https://archive.org/download/duas-abather-al-halwachi/Dua%20Abu%20Hamza%20Al%20Thumali%20-%20Abather%20Al%20Halwachi%20-%20Dua's%20Abather%20Al%20Halwachi.mp3",
    },
  ],

  // === الزيارات الشريفة ===
  'dl-z-amin': [
    {
      id: 'z-amin-ar',
      reciterName: 'تلاوة خاشعة — زيارة أمين الله',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Aminallah.mp3',
    },
  ],
  'dl-z-prophet-near': [
    {
      id: 'z-prophet-abather',
      reciterName: 'الرادود أباذر الحلواجي',
      url: 'https://archive.org/download/prophet_m/Prophet_m.mp3',
    },
    {
      id: 'z-prophet-ar',
      reciterName: 'تلاوة خاشعة — زيارة النبي الأكرم (ﷺ)',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Muhammad%20Mustafa%28as%29.mp3',
    },
  ],
  'dl-z-prophet-far': [
    {
      id: 'z-prophet-far-abather',
      reciterName: 'الرادود أباذر الحلواجي',
      url: 'https://archive.org/download/prophet_m/Prophet_m.mp3',
    },
    {
      id: 'z-prophet-far-ar',
      reciterName: 'تلاوة خاشعة — زيارة النبي الأكرم (ﷺ)',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Muhammad%20Mustafa%28as%29.mp3',
    },
  ],
  'dl-z-fatima': [
    {
      id: 'z-fatima-ar',
      reciterName: 'تلاوة خاشعة — زيارة السيدة الزهراء (ع)',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Fatima%20Zehra%28sa%29.mp3',
    },
  ],
  'dl-z-ashura': [
    {
      id: 'z-ashura-farahmand',
      reciterName: 'الحاج محسن فرهمند',
      url: 'https://archive.org/download/Ashoora/Ashoora-Farahmand.mp3',
    },
    {
      id: 'z-ashura-abdulhai',
      reciterName: 'الرادود عبد الحي آل قمبر',
      url: 'https://mp3.duas.org/Ziyarat-Ashura-AbdulHai.mp3',
    },
    {
      id: 'z-ashura-ar',
      reciterName: 'تلاوة خاشعة — زيارة عاشوراء',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Aashura.mp3',
    },
  ],
  'dl-z-husain': [
    {
      id: 'z-warith-ar',
      reciterName: 'تلاوة خاشعة — زيارة وارث',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Warisa.mp3',
    },
  ],
  'dl-z-husain-special': [
    {
      id: 'z-husain-special-ar',
      reciterName: 'تلاوة خاشعة — زيارة الإمام الحسين (ع)',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Imam%20Hussain%28as%29.mp3',
    },
  ],
  'dl-z-abbas': [
    {
      id: 'z-abbas-ar',
      reciterName: 'تلاوة خاشعة — زيارة أبي الفضل العباس (ع)',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Abbas%20Al_Alamdar%28as%29.mp3',
    },
  ],
  'dl-z-kadhim': [
    {
      id: 'z-kadhim-ar',
      reciterName: 'تلاوة خاشعة — زيارة الإمام الكاظم (ع)',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Imam%20Kazim%28as%29.mp3',
    },
  ],
  'dl-z-jawad': [
    {
      id: 'z-jawad-farahmand',
      reciterName: 'الحاج محسن فرهمند',
      url: 'https://archive.org/download/ziarat_emam_javad_farahmand.mp3_106895/ziarat_emam_javad_farahmand.mp3_106895.mp3',
    },
    {
      id: 'z-jawad-ar',
      reciterName: 'تلاوة خاشعة — زيارة الإمام الجواد (ع)',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Imam%20Taqi%28as%29.mp3',
    },
  ],
  'dl-z-reza': [
    {
      id: 'z-reza-ar',
      reciterName: 'تلاوة خاشعة — زيارة الإمام الرضا (ع)',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Imam%20Riza%28as%29.mp3',
    },
  ],
  'dl-z-hadi': [
    {
      id: 'z-hadi-ar',
      reciterName: 'تلاوة خاشعة — زيارة الإمام الهادي (ع)',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Imam%20Naqi%28as%29.mp3',
    },
  ],
  'dl-z-yasin': [
    {
      id: 'z-yasin-farahmand',
      reciterName: 'الحاج محسن فرهمند',
      url: 'https://archive.org/download/20240203_20240203_1021/%D8%B2%D9%8A%D8%A7%D8%B1%D8%AA%20%D8%A2%D9%84%20%D9%8A%D8%A7%D8%B3%D9%8A%D9%86%20-%20%D9%81%D8%B1%D9%87%D9%85%D9%86%D8%AF.mp3',
    },
    {
      id: 'z-yasin-ar',
      reciterName: 'تلاوة خاشعة — زيارة آل ياسين',
      url: 'https://archive.org/download/ziyaraat_arabic_audio/Ziyarat_e_Aal_e_Yaseen.mp3',
    },
  ],

  // === المناجاة الخمس عشرة ===
  'munajat-1': [
    {
      id: 'munajat-1-kadhimi',
      reciterName: 'القارئ عامر الكاظمي',
      url: 'https://archive.org/download/altaayibin/altaayibin.mp3',
    },
  ],
  'dl-sahifa-m1': [
    {
      id: 'munajat-m1-kadhimi',
      reciterName: 'القارئ عامر الكاظمي',
      url: 'https://archive.org/download/altaayibin/altaayibin.mp3',
    },
  ],
  'munajat-2': [
    {
      id: 'munajat-2-ar',
      reciterName: 'تلاوة خاشعة — مناجاة الشاكين',
      url: 'https://archive.org/download/20260713_20260713_1657/%D8%A7%D9%84%D8%B4%D8%A7%D9%83%D9%8A%D9%86.m4a',
    },
  ],
  'dl-sahifa-m2': [
    {
      id: 'munajat-m2-ar',
      reciterName: 'تلاوة خاشعة — مناجاة الشاكين',
      url: 'https://archive.org/download/20260713_20260713_1657/%D8%A7%D9%84%D8%B4%D8%A7%D9%83%D9%8A%D9%86.m4a',
    },
  ],
  'munajat-3': [
    {
      id: 'munajat-3-kadhimi',
      reciterName: 'القارئ عامر الكاظمي',
      url: 'https://archive.org/download/alkaefin/alkaefin.mp3',
    },
  ],
  'munajat-4': [
    {
      id: 'munajat-4-kadhimi',
      reciterName: 'القارئ عامر الكاظمي',
      url: 'https://archive.org/download/alraajin/alraajin.mp3',
    },
  ],
  'munajat-5': [
    {
      id: 'munajat-5-kadhimi',
      reciterName: 'القارئ عامر الكاظمي',
      url: 'https://archive.org/download/alraghbin/alraghbin.mp3',
    },
  ],
  'munajat-6': [
    {
      id: 'munajat-6-kadhimi',
      reciterName: 'القارئ عامر الكاظمي',
      url: 'https://archive.org/download/alshakrin/alshakrin.mp3',
    },
    {
      id: 'munajat-6-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/alshaakrin/alshaakrin.mp3',
    },
  ],
  'munajat-7': [
    {
      id: 'munajat-7-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/almuta3yn/almuta3yn.mp3',
    },
  ],
  'munajat-8': [
    {
      id: 'munajat-8-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/almuredyn/almuredyn.mp3',
    },
  ],
  'munajat-9': [
    {
      id: 'munajat-9-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/almu7byn/almu7byn.mp3',
    },
  ],
  'munajat-10': [
    {
      id: 'munajat-10-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/almutwslin/almutwslin.mp3',
    },
  ],
  'munajat-11': [
    {
      id: 'munajat-11-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/almuftqrin/almuftqrin.mp3',
    },
  ],
  'munajat-12': [
    {
      id: 'munajat-12-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/al3arfin/al3arfin.mp3',
    },
    {
      id: 'munajat-12-ar',
      reciterName: 'تلاوة خاشعة — مناجاة العارفين',
      url: 'https://archive.org/download/20240825_20240825_2027/%D9%85%D9%86%D8%A7%D8%AC%D8%A7%D8%A9%20%D8%A7%D9%84%D8%B9%D8%A7%D8%B1%D9%81%D9%8A%D9%86.mp3',
    },
  ],
  'munajat-13': [
    {
      id: 'munajat-13-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/aldakrin/aldakrin.mp3',
    },
  ],
  'munajat-14': [
    {
      id: 'munajat-14-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/almu3tsmin/almu3tsmin.mp3',
    },
  ],
  'munajat-15': [
    {
      id: 'munajat-15-hujairat',
      reciterName: 'الملا محمد الحجيرات',
      url: 'https://archive.org/download/alzahdin/alzahdin.mp3',
    },
  ],
};
