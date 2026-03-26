import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Surah, Ayah } from '../types';
import { toast } from 'sonner';
import { RECITERS } from '../constants';

interface QuranProps {
  fontSize: number;
  reciter: string;
  setReciter: (id: string) => void;
  language: 'ar' | 'en';
}

export const Quran: React.FC<QuranProps> = ({ fontSize, reciter, setReciter, language }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [englishAyahs, setEnglishAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    fetchSurahs();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (selectedSurah) {
      fetchAyahs(selectedSurah.number);
    }
  }, [reciter]);

  useEffect(() => {
    if (selectedSurah) {
      fetchAyahs(selectedSurah.number);
    }
  }, [reciter]);

  const fetchSurahs = async () => {
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await response.json();
      if (data.code === 200) {
        setSurahs(data.data);
      }
    } catch (error) {
      toast.error(t('فشل تحميل قائمة السور', 'Failed to load Surahs'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAyahs = async (surahNumber: number) => {
    setLoading(true);
    try {
      // Fetch Arabic with audio
      // Map our internal reciter IDs to Al Quran Cloud identifiers if needed
      const apiReciterMap: Record<string, string> = {
        'ar.alafasy': 'ar.alafasy',
        'ar.minshawi': 'ar.minshawi',
        'ar.minshawimujawwad': 'ar.minshawimujawwad',
        'ar.husary': 'ar.husary',
        'ar.husarymujawwad': 'ar.husarymujawwad',
        'ar.abdulsamad': 'ar.abdulsamad',
        'ar.shuraym': 'ar.saoodshuraym',
        'ar.sudais': 'ar.abdurrahmaansudais',
        'ar.mahermuaiqly': 'ar.mahermuaiqly',
        'ar.ahmedajamy': 'ar.ahmedajamy',
        'ar.yasseraldossari': 'ar.yasseraldossari'
      };
      const apiReciter = apiReciterMap[reciter] || reciter;
      
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${apiReciter}`);
      const data = await response.json();
      
      // Fetch English translation
      const engResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.sahih`);
      const engData = await engResponse.json();

      if (data.code === 200 && engData.code === 200) {
        setAyahs(data.data.ayahs);
        setEnglishAyahs(engData.data.ayahs);
      }
    } catch (error) {
      toast.error(t('فشل تحميل الآيات', 'Failed to load Ayahs'));
    } finally {
      setLoading(false);
    }
  };

  const playAyahAudio = (audioUrl: string, ayahNumber: number, currentAyahs: Ayah[]) => {
    if (playingAyah === ayahNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    let finalAudioUrl = audioUrl;
    const apiReciterMap: Record<string, string> = {
      'ar.alafasy': 'ar.alafasy',
      'ar.minshawi': 'ar.minshawi',
      'ar.minshawimujawwad': 'ar.minshawimujawwad',
      'ar.husary': 'ar.husary',
      'ar.husarymujawwad': 'ar.husarymujawwad',
      'ar.abdulsamad': 'ar.abdulsamad',
      'ar.shuraym': 'ar.saoodshuraym',
      'ar.sudais': 'ar.abdurrahmaansudais',
      'ar.mahermuaiqly': 'ar.mahermuaiqly',
      'ar.ahmedajamy': 'ar.ahmedajamy',
      'ar.yasseraldossari': 'ar.yasseraldossari',
      'ar.qatami': 'ar.qatami'
    };
    const reciterId = apiReciterMap[reciter] || 'ar.alafasy';

    if (!finalAudioUrl) {
      finalAudioUrl = `https://cdn.islamic.network/quran/audio/128/${reciterId}/${ayahNumber}.mp3`;
    }

    // Use preloaded audio if available and matches
    let audio = (window as any).__nextAudio && (window as any).__nextAudio.src === finalAudioUrl 
      ? (window as any).__nextAudio 
      : new Audio(finalAudioUrl);

    audioRef.current = audio;
    setPlayingAyah(ayahNumber);
    
    audio.play().catch(err => {
      console.error('Audio play error:', err);
      toast.error(t('فشل تشغيل الصوت', 'Failed to play audio'));
      setPlayingAyah(null);
    });

    const currentIndex = currentAyahs.findIndex(a => a.number === ayahNumber);

    // Preload next ayah
    if (currentIndex !== -1 && currentIndex < currentAyahs.length - 1) {
      const nextAyah = currentAyahs[currentIndex + 1];
      let nextAudioUrl = nextAyah.audio;
      if (!nextAudioUrl) {
        nextAudioUrl = `https://cdn.islamic.network/quran/audio/128/${reciterId}/${nextAyah.number}.mp3`;
      }
      const nextAudio = new Audio(nextAudioUrl);
      nextAudio.preload = 'auto';
      (window as any).__nextAudio = nextAudio;
    }

    audio.onended = () => {
      if (currentIndex !== -1 && currentIndex < currentAyahs.length - 1) {
        const nextAyah = currentAyahs[currentIndex + 1];
        playAyahAudio(nextAyah.audio, nextAyah.number, currentAyahs);
        
        // Scroll next ayah into view
        const nextElement = document.getElementById(`ayah-${nextAyah.number}`);
        if (nextElement) {
          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setPlayingAyah(null);
      }
    };
  };

  const handleSurahClick = (surah: Surah) => {
    setSelectedSurah(surah);
    fetchAyahs(surah.number);
  };

  const filteredSurahs = surahs.filter(s => 
    s.name.includes(searchQuery) || 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString() === searchQuery
  );

  const cleanAyahText = (text: string, surahNumber: number, ayahNumberInSurah: number) => {
    if (surahNumber !== 1 && surahNumber !== 9 && ayahNumberInSurah === 1) {
      let cleanedText = text;
      const bismillahs = [
        "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
        "بسم الله الرحمن الرحيم",
        "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ"
      ];
      
      for (const b of bismillahs) {
        if (cleanedText.startsWith(b)) {
          cleanedText = cleanedText.substring(b.length);
          break;
        } else if (cleanedText.includes(b)) {
          cleanedText = cleanedText.replace(b, '');
          break;
        }
      }
      
      if (cleanedText === text) {
        if (cleanedText.includes('\n')) {
          cleanedText = cleanedText.split('\n')[1];
        } else {
          const words = cleanedText.split(' ');
          if (words.length > 4 && words[0].includes('س') && words[0].includes('م')) {
            cleanedText = words.slice(4).join(' ');
          }
        }
      }
      
      return cleanedText.replace(/^[\s\u200B\u200C\u200D\uFEFF]+/, '').trim();
    }
    return text;
  };

  if (selectedSurah) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8 pb-12"
      >
        <div className={`flex items-center justify-between ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          <button 
            onClick={() => {
              setSelectedSurah(null);
              if (audioRef.current) audioRef.current.pause();
              setPlayingAyah(null);
            }}
            className="flex items-center gap-2 text-secondary font-bold hover:opacity-70 transition-opacity"
          >
            <span className={`material-symbols-outlined ${language === 'ar' ? 'rotate-180' : 'rotate-0'}`}>arrow_forward</span>
            {t('العودة لقائمة السور', 'Back to Surah List')}
          </button>
          
          <button 
            onClick={() => setShowReciterModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full font-bold hover:bg-secondary/20 transition-all"
          >
            <span className="material-symbols-outlined">record_voice_over</span>
            {t(RECITERS.find(r => r.id === reciter)?.name || '', RECITERS.find(r => r.id === reciter)?.en || '')}
          </button>
        </div>

        <AnimatePresence>
          {showReciterModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface-low w-full max-w-md rounded-[2.5rem] p-8 border border-outline-variant/10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-primary">{t('اختر القارئ', 'Select Reciter')}</h2>
                  <button onClick={() => setShowReciterModal(false)} className="p-2 hover:bg-primary/10 rounded-full">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {RECITERS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setReciter(r.id);
                        setShowReciterModal(false);
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${reciter === r.id ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-surface-high border-outline-variant/10 text-primary hover:border-secondary/50'}`}
                    >
                      <span className="font-bold">{t(r.name, r.en)}</span>
                      {reciter === r.id && <span className="material-symbols-outlined">check_circle</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <section className="text-center space-y-4 py-12 bg-surface-low rounded-[3rem] editorial-shadow border border-outline-variant/5">
          <h1 className="text-7xl text-primary font-serif mb-4">{selectedSurah.name}</h1>
          <p className="text-on-surface-variant tracking-[0.3em] uppercase text-sm font-black opacity-60">
            {selectedSurah.englishName} • {selectedSurah.revelationType === 'Meccan' ? t('مكية', 'Meccan') : t('مدنية', 'Medinan')} • {selectedSurah.numberOfAyahs} {t('آية', 'Ayahs')}
          </p>
          {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
            <div className="text-4xl text-primary font-serif pt-8 opacity-80">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          )}
          <div className="w-32 h-1 bg-secondary mx-auto rounded-full opacity-30 mt-6"></div>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Mushaf View (Arabic Text) */}
            <div className="bg-surface-low rounded-[3rem] p-8 md:p-16 editorial-shadow border border-outline-variant/5 text-center">
              <div className="text-justify leading-[3.5] text-right" dir="rtl" style={{ fontSize: `${fontSize * 1.8}px`, fontFamily: 'Amiri, serif' }}>
                {ayahs.map((ayah, index) => {
                  const isNewJuz = index === 0 || ayah.juz !== ayahs[index - 1].juz;
                  const isNewHizbQuarter = index === 0 || ayah.hizbQuarter !== ayahs[index - 1].hizbQuarter;
                  const hizb = Math.ceil(ayah.hizbQuarter / 4);
                  const quarter = ayah.hizbQuarter % 4;
                  let quarterText = '';
                  if (quarter === 1) quarterText = `الحزب ${hizb}`;
                  else if (quarter === 2) quarterText = `ربع الحزب ${hizb}`;
                  else if (quarter === 3) quarterText = `نصف الحزب ${hizb}`;
                  else quarterText = `ثلاثة أرباع الحزب ${hizb}`;

                  return (
                    <React.Fragment key={ayah.number}>
                      {isNewJuz && (
                        <div className="w-full flex justify-center my-6">
                          <span className="px-6 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-bold border border-secondary/20" style={{ fontFamily: 'sans-serif' }}>
                            الجزء {ayah.juz}
                          </span>
                        </div>
                      )}
                      {isNewHizbQuarter && !isNewJuz && (
                        <div className="w-full flex justify-center my-4">
                          <span className="px-4 py-1 bg-primary/5 text-primary/60 rounded-full text-xs font-bold border border-primary/10" style={{ fontFamily: 'sans-serif' }}>
                            {quarterText}
                          </span>
                        </div>
                      )}
                      <span 
                        id={`ayah-${ayah.number}`}
                        onClick={() => playAyahAudio(ayah.audio, ayah.number, ayahs)}
                        className={`inline cursor-pointer transition-all duration-300 rounded-xl px-1 ${playingAyah === ayah.number ? 'bg-secondary/20 text-secondary' : 'text-primary hover:bg-primary/5'}`}
                      >
                        {cleanAyahText(ayah.text, selectedSurah.number, ayah.numberInSurah)}
                        <span className="inline-flex items-center justify-center w-10 h-10 border-2 border-secondary/30 rounded-full text-sm font-bold mx-2 text-secondary/60 align-middle" style={{ fontFamily: 'sans-serif' }}>
                          {ayah.numberInSurah}
                        </span>
                        {ayah.sajda && (
                          <span className="text-secondary mx-2 text-2xl align-middle" title="سجدة تلاوة">۩</span>
                        )}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Translation View */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-primary px-4">{t('الترجمة والتحكم', 'Translation & Controls')}</h3>
              <div className="space-y-4">
                {ayahs.map((ayah, index) => (
                  <div 
                    key={`trans-${ayah.number}`}
                    className={`p-6 rounded-3xl transition-all duration-300 border border-outline-variant/5 ${playingAyah === ayah.number ? 'bg-secondary/5 ring-2 ring-secondary/20' : 'bg-surface-low'}`}
                  >
                    <div className={`flex items-start gap-4 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                      <button 
                        onClick={() => playAyahAudio(ayah.audio, ayah.number, ayahs)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${playingAyah === ayah.number ? 'bg-secondary text-white' : 'bg-primary/5 text-primary hover:bg-secondary hover:text-white'}`}
                      >
                        <span className="material-symbols-outlined">
                          {playingAyah === ayah.number ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className={`flex items-center gap-2 text-xs font-bold text-secondary opacity-60 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                          <span>{t('آية', 'Ayah')} {ayah.numberInSurah}</span>
                        </div>
                        <p className={`text-on-surface-variant leading-relaxed ${language === 'en' ? 'text-left' : 'text-right'}`} style={{ fontSize: fontSize }}>
                          {englishAyahs[index]?.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-12"
    >
      <section className="space-y-6 text-center md:text-right">
        <h1 className="text-7xl md:text-9xl text-primary font-serif tracking-tight">{t('القرآن الكريم', 'The Holy Quran')}</h1>
        <p className="text-on-surface-variant text-xl md:text-2xl max-w-3xl leading-relaxed opacity-80 mx-auto md:mr-0">
          {t('"كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ"', '"[This is] a blessed Book which We have revealed to you, [O Muhammad], that they might reflect upon its verses and that those of understanding would be reminded."')}
        </p>
      </section>

      <div className="relative group max-w-4xl mx-auto md:mr-0">
        <span className={`absolute ${language === 'ar' ? 'right-8' : 'left-8'} top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant group-focus-within:text-secondary transition-colors text-3xl`}>search</span>
        <input 
          type="text" 
          placeholder={t('ابحث عن سورة بالاسم أو الرقم...', 'Search Surah by name or number...')} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full bg-surface-low border-2 border-outline-variant/5 rounded-[3rem] py-8 ${language === 'ar' ? 'pr-20 pl-8' : 'pl-20 pr-8'} focus:outline-none focus:ring-8 focus:ring-secondary/10 transition-all text-2xl shadow-xl editorial-shadow`}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredSurahs.map((surah) => (
            <motion.div 
              key={surah.number}
              whileHover={{ y: -12, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSurahClick(surah)}
              className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant/5 cursor-pointer hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden editorial-shadow"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-bl-[6rem] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className={`flex justify-between items-center relative z-10 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-8 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    {surah.number}
                  </div>
                  <div className={language === 'en' ? 'text-left' : 'text-right'}>
                    <h3 className="text-4xl text-primary font-serif mb-1">{surah.name}</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] font-black opacity-40">{surah.englishName}</p>
                  </div>
                </div>
                <div className={language === 'en' ? 'text-left' : 'text-right'}>
                  <p className="text-secondary font-black text-xl mb-1">{surah.numberOfAyahs}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-black opacity-40 tracking-widest">{surah.revelationType === 'Meccan' ? t('مكية', 'Meccan') : t('مدنية', 'Medinan')}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
