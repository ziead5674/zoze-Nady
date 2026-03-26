import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { SUNNAHS } from '../constants';
import { GoogleGenAI, Modality } from "@google/genai";
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export const Sunnahs: React.FC<{ onNavigate?: (screen: any) => void; fontSize: number; language: 'ar' | 'en'; gender: 'male' | 'female' | 'child'; reciter: string; voice: string; user: User | null }> = ({ onNavigate, fontSize, language, gender, reciter, voice, user }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<string | null>(null);
  const [filteredSunnahs, setFilteredSunnahs] = useState(() => {
    const relevant = SUNNAHS.filter(s => s.target === 'all' || s.target === gender);
    return [...relevant].sort(() => Math.random() - 0.5);
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const setReminder = async (title: string) => {
    toast.success(t(`تم ضبط تنبيه لـ ${title}. يمكنك إدارته من شاشة التنبيهات.`, `Reminder set for ${title}. You can manage it in the reminders screen.`));
    const newReminder = {
      id: Date.now().toString(),
      title: t(`سنة: ${title}`, `Sunnah: ${title}`),
      time: '08:00',
      days: language === 'ar' 
        ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
        : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      enabled: true,
      type: 'sunnah'
    };

    if (user) {
      const reminderDocRef = doc(db, 'users', user.uid, 'reminders', newReminder.id);
      await setDoc(reminderDocRef, newReminder).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/reminders/${newReminder.id}`));
    } else {
      const saved = localStorage.getItem('reminders');
      const reminders = saved ? JSON.parse(saved) : [];
      localStorage.setItem('reminders', JSON.stringify([...reminders, newReminder]));
    }
  };

  const translateCategory = (cat: string) => {
    const mapping: Record<string, string> = {
      'قبل النوم': 'Before Sleep',
      'آداب الطعام': 'Eating Etiquette',
      'عند الدخول': 'Upon Entering',
      'سنة فعلية': 'Practical Sunnah',
      'الضحى': 'Duha',
      'الآداب الاجتماعية': 'Social Etiquette',
      'عامة': 'General',
      'العبادات': 'Worship',
      'المسجد': 'Mosque',
      'الجمعة': 'Friday',
      'المرأة المسلمة': 'Muslim Woman',
      'الناشئة': 'Youth'
    };
    return language === 'ar' ? cat : (mapping[cat] || cat);
  };

  const playAudio = async (text: string, id: string) => {
    if (playingId === id) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      setPlayingId(null);
      return;
    }
    
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsLoadingAudio(id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const reciterNames: Record<string, string> = {
        'ar.alafasy': 'Mishary Rashid Alafasy',
        'ar.abdulsamad': 'Abdul Basit Abdus Samad',
        'ar.minshawi': 'Mohamed Siddiq Al-Minshawi',
        'ar.husary': 'Mahmoud Khalil Al-Husary',
        'ar.aldosari': 'Yasser Al-Dosari',
        'ar.qatami': 'Nasser Al-Qatami',
        'ar.sudais': 'Abdur-Rahman as-Sudais',
        'ar.shuraym': 'Saud Al-Shuraim'
      };
      const reciterName = reciterNames[reciter] || 'a professional reciter';

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Recite this Islamic content clearly and beautifully, in the style of ${reciterName}: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice as any },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioContext;
        
        const float32Array = new Float32Array(arrayBuffer.byteLength / 2);
        const int16Array = new Int16Array(arrayBuffer);
        for (let i = 0; i < float32Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768;
        }

        const buffer = audioContext.createBuffer(1, float32Array.length, 24000);
        buffer.getChannelData(0).set(float32Array);

        const source = audioContext.createBufferSource();
        audioSourceRef.current = source;
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          setPlayingId(null);
          audioSourceRef.current = null;
        };
        
        setIsLoadingAudio(null);
        setPlayingId(id);
        source.start();
      } else {
        setIsLoadingAudio(null);
        toast.error(t('فشل في توليد الصوت', 'Failed to generate audio'));
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsLoadingAudio(null);
      setPlayingId(null);
      toast.error(t('حدث خطأ أثناء تشغيل الصوت', 'An error occurred while playing audio'));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-10 pb-12"
    >
      <section className="space-y-2">
        <p className="text-secondary font-medium uppercase tracking-[0.2em] text-sm">{t('١٤ رمضان ١٤٤٥ هـ', '14 Ramadan 1445 AH')}</p>
        <h1 className="text-5xl md:text-6xl text-primary leading-tight">{t('اقتدِ بنبيك اليوم', 'Follow Your Prophet Today')}</h1>
        <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
          {t('"لَقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ"', '"There has certainly been for you in the Messenger of Allah an excellent pattern."')}
        </p>
      </section>

      {/* Featured Sunnah Card */}
      <section className="bg-primary text-white rounded-[2.5rem] p-10 relative overflow-hidden shadow-xl shadow-primary/10">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <span className="bg-secondary/20 text-secondary p-2 rounded-full">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </span>
            <h2 className="text-2xl tracking-wide">{t('سنة اليوم المختارة', 'Featured Sunnah of the Day')}</h2>
          </div>
          <div className="space-y-4">
            <p className="text-3xl md:text-4xl leading-relaxed italic text-secondary-container">
              "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ"
            </p>
            <div className="flex items-center gap-4 text-white/70 text-sm">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">book</span> {t('رواه الترمذي', 'Narrated by At-Tirmidhi')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary/40"></span>
              <span>{t('سنة قولية', 'Verbal Sunnah')}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => toast.success(t('بارك الله فيك! تم تسجيل تطبيق سنة التبسم.', 'Barak Allahu Fik! Smile Sunnah application recorded.'))}
              className="bg-secondary text-white px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
            >
              {t('سأطبقها الآن', 'I will apply it now')}
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </button>
            <button 
              onClick={() => playAudio("تبسمك في وجه أخيك لك صدقة", "featured")}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${playingId === 'featured' ? 'bg-secondary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <span className={`material-symbols-outlined text-xl ${playingId === 'featured' ? 'animate-pulse' : ''}`}>
                {playingId === 'featured' ? 'stop' : 'play_arrow'}
              </span>
            </button>
          </div>
        </div>
        <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none transform -rotate-12">
          <span className="material-symbols-outlined text-[15rem]">mosque</span>
        </div>
      </section>

      {/* Progress Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-low border border-primary/5 rounded-[2rem] p-8 flex items-center justify-between group">
          <div className="space-y-2">
            <h3 className="text-2xl text-primary">{t('سنن اتبعتها', 'Sunnahs Followed')}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-secondary">٨</span>
              <span className="text-on-surface-variant font-medium">/ {t('١٥ سنة', '15 Sunnahs')}</span>
            </div>
            <p className="text-xs text-on-surface-variant/70">{t('استمر، أنت على نهج الهدى', 'Keep going, you are on the path of guidance')}</p>
          </div>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-surface-highest" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
              <circle className="text-primary transition-all duration-1000" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="117.2" strokeLinecap="round" strokeWidth="8"></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
          </div>
        </div>
        <div className="bg-secondary-container/30 rounded-[2rem] p-8 flex flex-col justify-center space-y-2">
          <h4 className="text-xl text-primary">{t('أقربكم مني مجلساً', 'Closest to me in assembly')}</h4>
          <p className="text-on-surface-variant text-sm leading-relaxed">{t('بإحيائك للسنن، تتقرب من النبي ﷺ وتنال شفاعته بإذن الله.', 'By reviving the Sunnahs, you draw closer to the Prophet ﷺ and gain his intercession, God willing.')}</p>
        </div>
      </section>

      {/* Sunnah Feed */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-3xl text-primary">{t('استكمل سننك', 'Complete Your Sunnahs')}</h2>
          <button 
            onClick={() => {
              const relevant = SUNNAHS.filter(s => s.target === 'all' || s.target === gender);
              setFilteredSunnahs([...relevant].sort(() => Math.random() - 0.5));
              toast.info(t('تم تغيير السنن المعروضة', 'Sunnahs list refreshed'));
            }}
            className="text-secondary font-bold text-sm tracking-widest uppercase hover:opacity-70 transition-opacity"
          >
            {t('تغيير السنن', 'Change Sunnahs')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSunnahs.map((sunnah) => (
            <div 
              key={sunnah.id} 
              onClick={() => toast.success(t('بارك الله فيك!', 'Barak Allahu Fik!'))}
              className="bg-white rounded-[2rem] p-6 border border-surface-highest flex flex-col justify-between hover:shadow-lg transition-shadow group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{sunnah.icon}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(sunnah.description, sunnah.id);
                      }}
                      disabled={isLoadingAudio !== null && isLoadingAudio !== sunnah.id}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playingId === sunnah.id || isLoadingAudio === sunnah.id ? 'bg-secondary text-white' : 'bg-surface-low text-primary hover:bg-secondary hover:text-white'}`}
                    >
                      <span className={`material-symbols-outlined text-xl ${(playingId === sunnah.id || isLoadingAudio === sunnah.id) ? 'animate-pulse' : ''}`}>
                        {isLoadingAudio === sunnah.id ? 'hourglass_empty' : (playingId === sunnah.id ? 'stop' : 'play_arrow')}
                      </span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReminder(sunnah.title);
                      }}
                      className="w-10 h-10 rounded-full bg-surface-low flex items-center justify-center text-primary hover:bg-secondary hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success(t(`تمت إضافة سنة: ${sunnah.title}`, `Sunnah added: ${sunnah.title}`));
                      }}
                      className="w-10 h-10 rounded-full bg-surface-low flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl text-primary">{sunnah.title}</h3>
                  <p 
                    className="text-on-surface-variant text-sm mt-1 line-clamp-2"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {sunnah.description}
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary px-3 py-1 bg-secondary/10 rounded-full">{translateCategory(sunnah.category)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};
