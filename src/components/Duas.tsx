import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DUAS } from '../constants';
import { Dua, Reminder } from '../types';
import { toast } from 'sonner';
import { GoogleGenAI, Modality } from "@google/genai";
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const Duas: React.FC<{ fontSize: number; language: 'ar' | 'en'; reciter: string; voice: string; user: User | null }> = ({ fontSize, language, reciter, voice, user }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    if (user) {
      const favoritesRef = doc(db, 'users', user.uid, 'favorites', 'duas');
      const unsubscribe = onSnapshot(favoritesRef, (snapshot) => {
        if (snapshot.exists()) {
          setFavorites(snapshot.data().ids || []);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/favorites/duas`));
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('duas_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('duas_favorites', JSON.stringify(favorites));
    }
  }, [favorites, user]);

  const toggleFavorite = async (id: string) => {
    const isFav = favorites.includes(id);
    const newFavorites = isFav ? favorites.filter(f => f !== id) : [...favorites, id];
    
    if (user) {
      const favoritesRef = doc(db, 'users', user.uid, 'favorites', 'duas');
      await setDoc(favoritesRef, { ids: newFavorites }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/favorites/duas`));
    } else {
      setFavorites(newFavorites);
    }
    toast.success(t(isFav ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة', isFav ? 'Removed from favorites' : 'Added to favorites'));
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const categories = Array.from(new Set(DUAS.map(d => d.category)));

  const translateCategory = (cat: string) => {
    const mapping: Record<string, string> = {
      'عامة': 'General',
      'عند الهم': 'Distress',
      'المسجد': 'Mosque',
      'السفر': 'Travel',
      'العائلة': 'Family'
    };
    return language === 'ar' ? cat : (mapping[cat] || cat);
  };

  const filteredDuas = DUAS.filter(d => 
    (selectedCategory === 'favorites' ? favorites.includes(d.id) : (selectedCategory ? d.category === selectedCategory : true)) &&
    (d.title.includes(searchQuery) || d.text.includes(searchQuery))
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('تم نسخ الدعاء للمحفظة', 'Dua copied to clipboard'));
  };

  const setReminder = async (title: string) => {
    toast.success(t(`تم ضبط تنبيه لـ ${title}. يمكنك إدارته من شاشة التنبيهات.`, `Reminder set for ${title}. You can manage it in the reminders screen.`));
    
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: t(`دعاء: ${title}`, `Dua: ${title}`),
      time: '06:00',
      days: language === 'ar' 
        ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
        : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      enabled: true,
      type: 'athkar'
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
      
      // Map reciter ID to name for the prompt
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
        contents: [{ parts: [{ text: `Recite this Islamic supplication (Dua) clearly and beautifully, in the style of ${reciterName}: ${text}` }] }],
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
      className="space-y-12 pb-12"
    >
      <section className="space-y-4">
        <h1 className="text-5xl md:text-6xl text-primary leading-tight">{t('الأدعية النبوية', 'Prophetic Supplications')}</h1>
        <p className="text-on-surface-variant text-lg max-w-xl">
          {t('"وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ"', '"And when My servants ask you, [O Muhammad], concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me."')}
        </p>
      </section>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1">
          <span className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant`}>search</span>
          <input 
            type="text" 
            placeholder={t('ابحث عن دعاء...', 'Search for a Dua...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-surface-low border border-primary/5 rounded-2xl py-4 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all`}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${!selectedCategory ? 'bg-primary text-white' : 'bg-surface-low text-primary hover:bg-surface-high'}`}
          >
            {t('الكل', 'All')}
          </button>
          {favorites.length > 0 && (
            <button 
              onClick={() => setSelectedCategory('favorites')}
              className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategory === 'favorites' ? 'bg-red-500 text-white' : 'bg-surface-low text-red-500 hover:bg-red-50'}`}
            >
              <span className="material-symbols-outlined text-sm">favorite</span>
              {t('المفضلة', 'Favorites')}
            </button>
          )}
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-surface-low text-primary hover:bg-surface-high'}`}
            >
              {translateCategory(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredDuas.map((dua) => (
            <motion.div 
              key={dua.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-10 border border-surface-highest flex flex-col justify-between space-y-8 hover:shadow-2xl transition-all duration-500 group"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary px-4 py-1.5 bg-secondary/10 rounded-full">{translateCategory(dua.category)}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleFavorite(dua.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${favorites.includes(dua.id) ? 'bg-red-500 text-white' : 'bg-surface-low text-primary hover:bg-red-500 hover:text-white'}`}
                    >
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: favorites.includes(dua.id) ? "'FILL' 1" : "'FILL' 0" }}>
                        favorite
                      </span>
                    </button>
                    <button 
                      onClick={() => playAudio(dua.text, dua.id)}
                      disabled={isLoadingAudio !== null && isLoadingAudio !== dua.id}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playingId === dua.id || isLoadingAudio === dua.id ? 'bg-secondary text-white' : 'bg-surface-low text-primary hover:bg-secondary hover:text-white'}`}
                    >
                      <span className={`material-symbols-outlined text-xl ${(playingId === dua.id || isLoadingAudio === dua.id) ? 'animate-pulse' : ''}`}>
                        {isLoadingAudio === dua.id ? 'hourglass_empty' : (playingId === dua.id ? 'stop' : 'play_arrow')}
                      </span>
                    </button>
                    <button 
                      onClick={() => setReminder(dua.title)}
                      className="w-10 h-10 rounded-full bg-surface-low text-primary flex items-center justify-center hover:bg-secondary hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">notifications</span>
                    </button>
                    <button 
                      onClick={() => copyToClipboard(dua.text)}
                      className="w-10 h-10 rounded-full bg-surface-low text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">content_copy</span>
                    </button>
                  </div>
                </div>
                <h3 className="text-3xl text-primary group-hover:text-secondary transition-colors">{dua.title}</h3>
                <p 
                  className="leading-relaxed text-on-surface-variant font-serif italic"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  "{dua.text}"
                </p>
              </div>
              <div className="pt-6 border-t border-primary/5 flex justify-between items-center">
                <span className="text-xs text-on-surface-variant/60">{dua.source || t('أدعية نبوية', 'Prophetic Supplications')}</span>
                <button className="text-primary font-bold text-sm flex items-center gap-2 hover:opacity-70">
                  {t('مشاركة', 'Share')} <span className="material-symbols-outlined text-sm">share</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
