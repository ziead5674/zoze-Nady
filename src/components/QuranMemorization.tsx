import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GoogleGenAI, Modality } from "@google/genai";

import { RECITERS } from '../constants';

interface QuranMemorizationProps {
  fontSize: number;
  language: 'ar' | 'en';
  reciter: string;
  setReciter: (id: string) => void;
}

interface Surah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
}

interface Ayah {
  numberInSurah: number;
  text: string;
  audio?: string;
}

export const QuranMemorization: React.FC<QuranMemorizationProps> = ({ fontSize, language, reciter, setReciter }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [hiddenAyahs, setHiddenAyahs] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<'free' | 'ayah' | 'word'>('free');
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');
  const [recitationResult, setRecitationResult] = useState<{ success: boolean; feedback: string } | null>(null);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    hideAll();
  }, [mode]);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => setSurahs(data.data))
      .catch(err => console.error('Error fetching surahs:', err));
  }, []);

  useEffect(() => {
    if (selectedSurah) {
      fetchAyahs(selectedSurah.number);
    }
  }, [reciter]);

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

  const fetchAyahs = async (surahNumber: number) => {
    setLoading(true);
    try {
      const apiReciter = apiReciterMap[reciter] || reciter;
      
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${apiReciter}`);
      const data = await res.json();
      setAyahs(data.data.ayahs);
      // Initially hide all ayahs for testing
      setHiddenAyahs(new Set(data.data.ayahs.map((a: any) => a.numberInSurah)));
      setCurrentAyahIndex(0);
      setCurrentWordIndex(-1);
    } catch (err) {
      toast.error(t('فشل في تحميل الآيات', 'Failed to load ayahs'));
    } finally {
      setLoading(false);
    }
  };

  const playAyahAudio = (audioUrl: string, ayahNumber: number) => {
    if (playingAyah === ayahNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Try to use the provided audioUrl first, fallback to constructing it
    let finalAudioUrl = audioUrl;
    if (!finalAudioUrl) {
      const reciterId = apiReciterMap[reciter] || 'ar.alafasy';
      // Find the absolute ayah number
      const ayah = ayahs.find(a => a.numberInSurah === ayahNumber);
      const absoluteAyahNumber = ayah ? ayah.number : 1;
      finalAudioUrl = `https://cdn.islamic.network/quran/audio/128/${reciterId}/${absoluteAyahNumber}.mp3`;
    }

    const audio = new Audio(finalAudioUrl);
    audioRef.current = audio;
    setPlayingAyah(ayahNumber);
    
    audio.play().catch(err => {
      console.error('Audio play error:', err);
      toast.error(t('فشل تشغيل الصوت', 'Failed to play audio'));
      setPlayingAyah(null);
    });

    audio.onended = () => {
      setPlayingAyah(null);
    };
  };

  const toggleAyahVisibility = (num: number) => {
    const newHidden = new Set(hiddenAyahs);
    if (newHidden.has(num)) {
      newHidden.delete(num);
    } else {
      newHidden.add(num);
    }
    setHiddenAyahs(newHidden);
  };

  const revealAll = () => {
    setHiddenAyahs(new Set());
    setCurrentAyahIndex(ayahs.length - 1);
    const lastAyahWords = ayahs[ayahs.length - 1]?.text.split(' ') || [];
    setCurrentWordIndex(lastAyahWords.length - 1);
  };

  const hideAll = () => {
    setHiddenAyahs(new Set(ayahs.map(a => a.numberInSurah)));
    setCurrentAyahIndex(0);
    setCurrentWordIndex(-1);
  };

  const nextStep = () => {
    if (mode === 'ayah') {
      if (currentAyahIndex < ayahs.length) {
        const newHidden = new Set(hiddenAyahs);
        newHidden.delete(ayahs[currentAyahIndex].numberInSurah);
        setHiddenAyahs(newHidden);
        setCurrentAyahIndex(prev => prev + 1);
      }
    } else if (mode === 'word') {
      const currentAyah = ayahs[currentAyahIndex];
      if (!currentAyah) return;
      
      const words = currentAyah.text.split(' ');
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        // Move to next ayah
        const newHidden = new Set(hiddenAyahs);
        newHidden.delete(currentAyah.numberInSurah);
        setHiddenAyahs(newHidden);
        
        if (currentAyahIndex < ayahs.length - 1) {
          setCurrentAyahIndex(prev => prev + 1);
          setCurrentWordIndex(0);
        } else {
          // Finished surah
          setCurrentWordIndex(words.length - 1);
        }
      }
    }
  };

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

  const startVoiceCheck = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error(t('متصفحك لا يدعم التعرف على الصوت', 'Your browser does not support speech recognition'));
      return;
    }

    setIsRecording(true);
    setTranscript('');
    transcriptRef.current = '';
    setRecitationResult(null);
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const fullTranscript = finalTranscript + interimTranscript;
      setTranscript(fullTranscript);
      transcriptRef.current = fullTranscript;
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      let errorMessage = t('حدث خطأ في التعرف على الصوت', 'Error in speech recognition');
      if (event.error === 'not-allowed') {
        errorMessage = t('يرجى السماح باستخدام الميكروفون من إعدادات المتصفح', 'Please allow microphone access from browser settings');
      } else if (event.error === 'no-speech') {
        errorMessage = t('لم يتم التعرف على أي صوت، يرجى التحدث بوضوح', 'No speech detected, please speak clearly');
      } else if (event.error === 'network') {
        errorMessage = t('خطأ في الاتصال بالشبكة، تأكد من اتصالك بالإنترنت', 'Network error, check your internet connection');
      }
      toast.error(errorMessage);
    };

    recognition.onend = async () => {
      setIsRecording(false);
      if (transcriptRef.current.trim()) {
        checkRecitation(transcriptRef.current);
      } else {
        toast.info(t('لم يتم التقاط أي صوت، يرجى المحاولة مرة أخرى', 'No speech captured, please try again'));
      }
    };

    recognition.start();
  };

  const stopVoiceCheck = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const checkRecitation = async (userText: string) => {
    toast.info(t('جاري التحقق من التسميع...', 'Checking recitation...'));
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is missing');
      }
      const ai = new GoogleGenAI({ apiKey });
      
      let targetText = '';
      if (mode === 'ayah') {
        const currentAyah = ayahs[currentAyahIndex];
        if (currentAyah) {
          targetText = cleanAyahText(currentAyah.text, selectedSurah!.number, currentAyah.numberInSurah);
        }
      } else if (mode === 'word') {
        const currentAyah = ayahs[currentAyahIndex];
        if (currentAyah) {
          const words = cleanAyahText(currentAyah.text, selectedSurah!.number, currentAyah.numberInSurah).split(' ');
          targetText = words.slice(0, currentWordIndex + 1).join(' ');
        }
      } else {
        targetText = ayahs
          .filter(a => hiddenAyahs.has(a.numberInSurah))
          .map(a => cleanAyahText(a.text, selectedSurah!.number, a.numberInSurah))
          .join(' ');
      }
      
      if (!targetText) {
        toast.warning(t('يرجى إخفاء بعض الآيات لتسميعها', 'Please hide some ayahs to recite them'));
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The user is reciting Quran. 
        Target text: "${targetText}"
        User recited: "${userText}"
        Compare them and provide feedback. If they match well (ignoring minor pronunciation or tajweed unless it changes meaning), set success to true.
        Provide feedback in ${language === 'ar' ? 'Arabic' : 'English'}.
        Return JSON: { "success": boolean, "feedback": string }`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setRecitationResult(result);
      if (result.success) {
        toast.success(t('تسميع ممتاز! بارك الله فيك', 'Excellent recitation! Barak Allahu Fik'));
        if (mode !== 'free') {
          nextStep();
        }
      } else {
        toast.warning(result.feedback || t('يوجد بعض الأخطاء في التسميع', 'There are some mistakes in the recitation'));
      }
    } catch (error) {
      console.error('Recitation check error:', error);
      toast.error(t('فشل التحقق من التسميع، تأكد من اتصالك بالإنترنت', 'Failed to check recitation, check your internet connection'));
    }
  };

  return (
    <div className="space-y-8 pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">{t('تسميع القرآن الكريم', 'Quran Memorization')}</h1>
        <p className="text-on-surface-variant opacity-70">{t('اختبر حفظك وراجع آيات الله', 'Test your memorization and review Allah\'s verses')}</p>
      </section>

      {!selectedSurah ? (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {surahs.map(surah => (
            <button
              key={surah.number}
              onClick={() => {
                setSelectedSurah(surah);
                fetchAyahs(surah.number);
              }}
              className="bg-surface-low p-6 rounded-3xl border border-outline-variant/10 hover:border-primary hover:bg-primary/5 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-3 mx-auto group-hover:bg-primary group-hover:text-white transition-colors">
                {surah.number}
              </div>
              <h3 className="text-lg font-bold text-primary">{surah.name}</h3>
              <p className="text-xs text-on-surface-variant opacity-60">{surah.englishName}</p>
            </button>
          ))}
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 bg-surface-low p-6 rounded-2xl border border-outline-variant/10">
            <div className="flex justify-between items-center w-full">
              <button onClick={() => setSelectedSurah(null)} className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">arrow_back</span>
                {t('العودة للقائمة', 'Back to List')}
              </button>
              <h2 className="text-3xl font-bold text-primary">{selectedSurah.name}</h2>
              <div className="flex gap-4 items-center">
                <button 
                  onClick={() => setShowReciterModal(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">record_voice_over</span>
                  {t(RECITERS.find(r => r.id === reciter)?.name || '', RECITERS.find(r => r.id === reciter)?.en || '')}
                </button>
                <select 
                  value={mode} 
                  onChange={(e) => setMode(e.target.value as any)}
                  className="bg-surface-low border border-outline-variant/20 rounded-xl px-3 py-1 text-sm font-bold text-primary outline-none focus:border-primary"
                >
                  <option value="free">{t('حر', 'Free')}</option>
                  <option value="ayah">{t('آية آية', 'Ayah by Ayah')}</option>
                  <option value="word">{t('كلمة كلمة', 'Word by Word')}</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={hideAll} className="p-2 rounded-full hover:bg-primary/10 text-primary" title={t('إخفاء الكل', 'Hide All')}>
                    <span className="material-symbols-outlined">visibility_off</span>
                  </button>
                  <button onClick={revealAll} className="p-2 rounded-full hover:bg-primary/10 text-primary" title={t('إظهار الكل', 'Reveal All')}>
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </div>
            </div>
            
            {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
              <div className="text-3xl text-primary font-serif opacity-80 text-center mt-4">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {mode !== 'free' && (
              <button 
                onClick={nextStep}
                className="flex items-center gap-3 px-8 py-4 rounded-full font-bold bg-secondary text-white hover:scale-105 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined">navigate_next</span>
                {mode === 'ayah' ? t('الآية التالية', 'Next Ayah') : t('الكلمة التالية', 'Next Word')}
              </button>
            )}
            <button 
              onClick={isRecording ? stopVoiceCheck : startVoiceCheck}
              className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold transition-all shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-white hover:scale-105'}`}
            >
              <span className="material-symbols-outlined">{isRecording ? 'stop' : 'record_voice_over'}</span>
              {isRecording ? t('إيقاف الاستماع', 'Stop Listening') : t('بدء التسميع الصوتي', 'Start Voice Recitation')}
            </button>
          </div>

          {isRecording && (
            <div className="text-center p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-pulse">
              <p className="text-sm text-primary font-bold mb-2">{t('جاري الاستماع...', 'Listening...')}</p>
              <p className="text-lg text-on-surface-variant italic">"{transcript || '...'}"</p>
            </div>
          )}

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

          {recitationResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl text-center font-bold ${recitationResult.success ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
            >
              {recitationResult.feedback}
            </motion.div>
          )}

          <div className="bg-surface-low rounded-[2.5rem] p-8 border border-outline-variant/10 shadow-sm min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-justify leading-[3.5] text-right" dir="rtl" style={{ fontSize: `${fontSize * 1.8}px`, fontFamily: 'Amiri, serif' }}>
                  {ayahs.map((ayah, aIdx) => {
                    const isNewJuz = aIdx === 0 || ayah.juz !== ayahs[aIdx - 1].juz;
                    const isNewHizbQuarter = aIdx === 0 || ayah.hizbQuarter !== ayahs[aIdx - 1].hizbQuarter;
                    const hizb = Math.ceil(ayah.hizbQuarter / 4);
                    const quarter = ayah.hizbQuarter % 4;
                    let quarterText = '';
                    if (quarter === 1) quarterText = `الحزب ${hizb}`;
                    else if (quarter === 2) quarterText = `ربع الحزب ${hizb}`;
                    else if (quarter === 3) quarterText = `نصف الحزب ${hizb}`;
                    else quarterText = `ثلاثة أرباع الحزب ${hizb}`;

                    const isHidden = hiddenAyahs.has(ayah.numberInSurah);
                    const isCurrentAyah = aIdx === currentAyahIndex;
                    const cleanedText = cleanAyahText(ayah.text, selectedSurah.number, ayah.numberInSurah);
                    const words = cleanedText.split(' ');

                    return (
                      <React.Fragment key={ayah.numberInSurah}>
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
                        <motion.span
                          onClick={() => mode === 'free' && toggleAyahVisibility(ayah.numberInSurah)}
                          className={`inline transition-all duration-500 rounded-lg px-1 relative group ${mode === 'free' ? 'cursor-pointer' : ''}`}
                        >
                        {mode === 'word' && isCurrentAyah ? (
                          <span className="inline">
                            {words.map((word, wIdx) => (
                              <span 
                                key={wIdx}
                                className={`inline transition-all duration-300 ${wIdx > currentWordIndex ? 'bg-primary/10 text-transparent select-none blur-sm' : 'text-primary'}`}
                              >
                                {word}{' '}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className={`inline ${isHidden ? 'bg-primary/10 text-transparent select-none blur-sm' : 'text-primary'}`}>
                            {cleanedText}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 mx-2 align-middle">
                          <span className="inline-flex items-center justify-center w-10 h-10 border-2 border-primary/30 rounded-full text-sm font-bold text-primary/60" style={{ fontFamily: 'sans-serif' }}>
                            {ayah.numberInSurah}
                          </span>
                          {ayah.audio && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                playAyahAudio(ayah.audio!, ayah.numberInSurah);
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${playingAyah === ayah.numberInSurah ? 'bg-secondary text-white' : 'bg-primary/10 text-primary hover:bg-secondary hover:text-white'}`}
                              title={t('استمع للآية', 'Listen to Ayah')}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {playingAyah === ayah.numberInSurah ? 'pause' : 'play_arrow'}
                              </span>
                            </button>
                          )}
                        </span>
                        {ayah.sajda && (
                          <span className="text-secondary mx-2 text-2xl align-middle" title="سجدة تلاوة">۩</span>
                        )}
                        </motion.span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
