export interface Sunnah {
  id: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  category: string;
  icon: string;
  hadith?: string;
  source?: string;
  target?: 'male' | 'female' | 'child' | 'all';
}

export interface Thikr {
  id: string;
  text: string;
  text_en?: string;
  count: number;
  repeat: number;
  category: 'morning' | 'evening' | 'after-prayer' | 'sleep';
}

export interface PrayerTime {
  name: string;
  time: string;
  icon: string;
  description: string;
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
  type: 'sunnah' | 'athkar' | 'prayer';
}

export interface Dua {
  id: string;
  title: string;
  title_en?: string;
  text: string;
  text_en?: string;
  source?: string;
  category: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  translation?: string;
  audio?: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface MemorizationProgress {
  surahNumber: number;
  ayahs: number[]; // List of memorized ayah numbers
  lastTested: string;
}
