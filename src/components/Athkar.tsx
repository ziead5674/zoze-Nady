import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ATHKAR } from '../constants';
import { Thikr, Reminder } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc, collection } from 'firebase/firestore';

export const Athkar: React.FC<{ fontSize: number; language: 'ar' | 'en'; reciter: string; voice: string; user: User | null }> = ({ fontSize, language, reciter, voice, user }) => {
  const [athkarState, setAthkarState] = useState<Thikr[]>(ATHKAR);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [athkarReciter, setAthkarReciter] = useState<string>('ar.yasseraldossari');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    if (user) {
      const favoritesRef = doc(db, 'users', user.uid, 'favorites', 'athkar');
      const unsubscribe = onSnapshot(favoritesRef, (snapshot) => {
        if (snapshot.exists()) {
          setFavorites(snapshot.data().ids || []);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/favorites/athkar`));
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('athkar_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('athkar_favorites', JSON.stringify(favorites));
    }
  }, [favorites, user]);

  const toggleFavorite = async (id: string) => {
    const isFav = favorites.includes(id);
    const newFavorites = isFav ? favorites.filter(f => f !== id) : [...favorites, id];
    
    if (user) {
      const favoritesRef = doc(db, 'users', user.uid, 'favorites', 'athkar');
      await setDoc(favoritesRef, { ids: newFavorites }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/favorites/athkar`));
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

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setExpandedCategory('morning');
      toast.info(t('حان وقت أذكار الصباح ☀️', 'Time for Morning Athkar ☀️'));
    } else if (hour >= 16 && hour < 20) {
      setExpandedCategory('evening');
      toast.info(t('حان وقت أذكار المساء 🌙', 'Time for Evening Athkar 🌙'));
    } else if (hour >= 22 || hour < 5) {
      setExpandedCategory('sleep');
      toast.info(t('حان وقت أذكار النوم 💤', 'Time for Sleep Athkar 💤'));
    }
  }, []);

  const incrementCount = (id: string) => {
    setAthkarState(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, count: item.count < item.repeat ? item.count + 1 : item.count };
      }
      return item;
    }));
  };

  const resetCategory = (category: string) => {
    setAthkarState(prev => prev.map(item => {
      if (item.category === category) {
        return { ...item, count: 0 };
      }
      return item;
    }));
  };

  const refreshAthkar = () => {
    toast.info(t('جاري تحديث الأذكار...', 'Refreshing Athkar...'));
    setAthkarState([...athkarState].sort(() => Math.random() - 0.5));
  };

  const setReminder = async (title: string, type: string) => {
    toast.success(t(`تم ضبط تنبيه لـ ${title}. يمكنك إدارته من شاشة التنبيهات.`, `Reminder set for ${title}. You can manage it in the reminders screen.`));
    
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: t(`تنبيه: ${title}`, `Reminder: ${title}`),
      time: type === 'morning' ? '05:30' : type === 'evening' ? '17:30' : '22:00',
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
    // If clicking the same one that's playing, stop it
    if (playingId === id) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      setPlayingId(null);
      return;
    }
    
    // Stop any currently playing audio
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
        'ar.yasseraldossari': 'Yasser Al-Dosari',
        'ar.qatami': 'Nasser Al-Qatami',
        'ar.sudais': 'Abdur-Rahman as-Sudais',
        'ar.shuraym': 'Saud Al-Shuraim'
      };
      const reciterName = reciterNames[athkarReciter] || 'a professional reciter';

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Recite this Islamic remembrance (Thikr) clearly and beautifully, in the style of ${reciterName}: ${text}` }] }],
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

  const getCategoryStats = (category: string) => {
    const items = athkarState.filter(i => i.category === category);
    const completed = items.reduce((acc, curr) => acc + curr.count, 0);
    const total = items.reduce((acc, curr) => acc + curr.repeat, 0);
    return { completed, total };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-12 pb-12"
    >
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl text-primary mb-4">{t('الأذكار (الحصن)', 'Athkar (Fortress)')}</h2>
          <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
            {t('غذِّ روحك بذكر الله. استكشف مجموعاتنا المختارة لكل لحظة من يومك.', 'Nourish your soul with the remembrance of Allah. Explore our selected collections for every moment of your day.')}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select 
            value={athkarReciter}
            onChange={(e) => setAthkarReciter(e.target.value)}
            className="bg-surface-low border border-outline-variant/20 rounded-xl px-4 py-2 text-sm font-bold text-primary outline-none focus:border-primary"
          >
            <option value="ar.yasseraldossari">{t('ياسر الدوسري', 'Yasser Al-Dosari')}</option>
            <option value="ar.qatami">{t('ناصر القطامي', 'Nasser Al-Qatami')}</option>
            <option value="ar.alafasy">{t('مشاري العفاسي', 'Mishary Alafasy')}</option>
            <option value="ar.husary">{t('الحصري', 'Al-Husary')}</option>
            <option value="ar.minshawi">{t('المنشاوي', 'Al-Minshawi')}</option>
          </select>
          <button 
            onClick={refreshAthkar}
            className="bg-surface-low text-primary w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm hover:bg-surface-high transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8">
        {favorites.length > 0 && (
          <AthkarCategoryGroup 
            title={t('الأذكار المفضلة', 'Favorite Athkar')}
            category="favorites"
            description={t('مجموعتك الخاصة من الأذكار التي اخترتها.', 'Your personal collection of chosen Athkar.')}
            icon="favorite"
            color="secondary"
            items={athkarState.filter(i => favorites.includes(i.id))}
            stats={{ 
              completed: athkarState.filter(i => favorites.includes(i.id) && i.count >= i.repeat).length, 
              total: favorites.length 
            }}
            isExpanded={expandedCategory === 'favorites'}
            onToggle={() => setExpandedCategory(expandedCategory === 'favorites' ? null : 'favorites')}
            onIncrement={incrementCount}
            onReset={() => {
              setAthkarState(prev => prev.map(item => favorites.includes(item.id) ? { ...item, count: 0 } : item));
            }}
            onSetReminder={() => setReminder(t('الأذكار المفضلة', 'Favorite Athkar'), 'morning')}
            onPlayAudio={playAudio}
            playingId={playingId}
            isLoadingAudio={isLoadingAudio}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            fontSize={fontSize}
            language={language}
          />
        )}
        <AthkarCategoryGroup 
          title={t('أذكار الصباح', 'Morning Athkar')}
          category="morning"
          description={t('ابدأ رحلتك بالنور والحفظ من طلوع الشمس.', 'Start your journey with light and protection from sunrise.')}
          icon="wb_sunny"
          color="secondary"
          items={athkarState.filter(i => i.category === 'morning')}
          stats={getCategoryStats('morning')}
          isExpanded={expandedCategory === 'morning'}
          onToggle={() => setExpandedCategory(expandedCategory === 'morning' ? null : 'morning')}
          onIncrement={incrementCount}
          onReset={() => resetCategory('morning')}
          onSetReminder={() => setReminder(t('أذكار الصباح', 'Morning Athkar'), 'morning')}
          onPlayAudio={playAudio}
          playingId={playingId}
          isLoadingAudio={isLoadingAudio}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          fontSize={fontSize}
          language={language}
        />
        <AthkarCategoryGroup 
          title={t('أذكار المساء', 'Evening Athkar')}
          category="evening"
          description={t('هدِّئ روحك مع انتقال اليوم إلى السكينة والتأمل.', 'Calm your soul as the day transitions into tranquility and reflection.')}
          icon="dark_mode"
          color="primary"
          items={athkarState.filter(i => i.category === 'evening')}
          stats={getCategoryStats('evening')}
          isExpanded={expandedCategory === 'evening'}
          onToggle={() => setExpandedCategory(expandedCategory === 'evening' ? null : 'evening')}
          onIncrement={incrementCount}
          onReset={() => resetCategory('evening')}
          onSetReminder={() => setReminder(t('أذكار المساء', 'Evening Athkar'), 'evening')}
          onPlayAudio={playAudio}
          playingId={playingId}
          isLoadingAudio={isLoadingAudio}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          fontSize={fontSize}
          language={language}
        />
        <AthkarCategoryGroup 
          title={t('أذكار النوم', 'Sleep Athkar')}
          category="sleep"
          description={t('هيئ قلبك للراحة مع الأدعية النبوية المسائية.', 'Prepare your heart for rest with the evening prophetic supplications.')}
          icon="bedtime"
          color="secondary"
          items={athkarState.filter(i => i.category === 'sleep')}
          stats={getCategoryStats('sleep')}
          isExpanded={expandedCategory === 'sleep'}
          onToggle={() => setExpandedCategory(expandedCategory === 'sleep' ? null : 'sleep')}
          onIncrement={incrementCount}
          onReset={() => resetCategory('sleep')}
          onSetReminder={() => setReminder(t('أذكار النوم', 'Sleep Athkar'), 'sleep')}
          onPlayAudio={playAudio}
          playingId={playingId}
          isLoadingAudio={isLoadingAudio}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          fontSize={fontSize}
          language={language}
        />
      </div>

      <section className="mt-20">
        <div className="relative overflow-hidden rounded-xl bg-primary-container p-12 text-white">
          <div className="relative z-10 max-w-xl">
            <span className="block text-xs uppercase tracking-[0.3em] mb-4 text-secondary-container">{t('حكمة اليوم', 'Wisdom of the Day')}</span>
            <h4 className="text-3xl md:text-4xl italic leading-tight mb-6">
              "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
            </h4>
            <p className="text-sm opacity-70">— {t('سورة الرعد، ٢٨', 'Surah Ar-Ra\'d, 28')}</p>
          </div>
          <div className="absolute top-0 left-0 h-full w-1/3 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[15rem] leading-none -ml-12 -mt-12">auto_awesome</span>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const AthkarCategoryGroup: React.FC<{
  title: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  items: Thikr[];
  stats: { completed: number; total: number };
  isExpanded: boolean;
  onToggle: () => void;
  onIncrement: (id: string) => void;
  onReset: () => void;
  onSetReminder: () => void;
  onPlayAudio: (text: string, id: string) => void;
  playingId: string | null;
  isLoadingAudio: string | null;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  fontSize: number;
  language: 'ar' | 'en';
}> = ({ title, description, icon, color, items, stats, isExpanded, onToggle, onIncrement, onReset, onSetReminder, onPlayAudio, playingId, isLoadingAudio, favorites, onToggleFavorite, fontSize, language }) => {
  const progress = (stats.completed / stats.total) * 100;
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <div className={`bg-surface-low rounded-3xl editorial-shadow transition-all duration-500 overflow-hidden ${isExpanded ? 'ring-2 ring-secondary/20' : ''}`}>
      <div 
        onClick={onToggle}
        className="p-8 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="flex items-center gap-6">
          <div className={`p-4 ${color === 'secondary' ? 'bg-secondary-container/30 text-secondary' : 'bg-primary-container/20 text-primary'} rounded-full`}>
            <span className="material-symbols-outlined text-4xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-3xl text-primary mb-1">{title}</h3>
            <p className="text-on-surface-variant leading-relaxed text-sm">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8 w-full md:w-auto">
          <div className={`${language === 'ar' ? 'text-right' : 'text-left'} min-w-[80px]`}>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1">{t('التقدم', 'Progress')}</span>
            <span className="text-2xl text-primary font-bold">{stats.completed}/{stats.total}</span>
          </div>
          <div className="flex-1 md:w-32 bg-surface-highest h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-secondary h-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onSetReminder(); }}
              className="w-10 h-10 rounded-full bg-surface-highest text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-primary/5 bg-white/50"
          >
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-primary font-bold">{t('قائمة الأذكار', 'Athkar List')}</h4>
                <button 
                  onClick={(e) => { e.stopPropagation(); onReset(); }}
                  className="text-secondary text-sm font-bold flex items-center gap-2 hover:opacity-70"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  {t('إعادة ضبط', 'Reset')}
                </button>
              </div>
              
              <div className="space-y-4">
                {items.map((item) => {
                  const isCompleted = item.count >= item.repeat;
                  const isFavorite = favorites.includes(item.id);
                  const dashArray = 175.9;
                  const dashOffset = dashArray - (dashArray * (item.count / item.repeat));

                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !isCompleted && onIncrement(item.id)}
                      className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} p-6 rounded-2xl border transition-all flex justify-between items-center gap-4 relative overflow-hidden ${
                        isCompleted 
                          ? 'bg-secondary/5 border-secondary/20 opacity-60' 
                          : 'bg-white border-primary/5 hover:border-secondary/20 shadow-sm'
                      }`}
                    >
                      <div className="flex-1 relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <p 
                            className={`leading-relaxed flex-1 ${isCompleted ? 'text-on-surface-variant line-through' : 'text-primary'}`}
                            style={{ fontSize: `${fontSize}px` }}
                          >
                            {item.text}
                          </p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                            className={`p-2 rounded-full transition-all ${isFavorite ? 'text-red-500' : 'text-on-surface-variant opacity-30 hover:opacity-100'}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                              favorite
                            </span>
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-on-surface-variant font-bold">{t('المتبقي:', 'Remaining:')} {Math.max(0, item.repeat - item.count)}</span>
                          <span className="text-xs text-secondary font-bold">{t('الهدف:', 'Goal:')} {item.repeat}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPlayAudio(item.text, item.id); }}
                            disabled={isLoadingAudio !== null && isLoadingAudio !== item.id}
                            className={`flex items-center gap-1 text-xs font-bold transition-colors ${playingId === item.id || isLoadingAudio === item.id ? 'text-secondary' : 'text-primary hover:text-secondary'} ${isLoadingAudio !== null && isLoadingAudio !== item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className={`material-symbols-outlined text-sm ${(playingId === item.id || isLoadingAudio === item.id) ? 'animate-pulse' : ''}`}>
                              {isLoadingAudio === item.id ? 'hourglass_empty' : (playingId === item.id ? 'stop_circle' : 'play_circle')}
                            </span>
                            {isLoadingAudio === item.id ? t('جاري التحميل...', 'Loading...') : (playingId === item.id ? t('إيقاف', 'Stop') : t('استماع', 'Listen'))}
                          </button>
                        </div>
                      </div>
                      
                      <div className="relative flex items-center justify-center w-16 h-16 z-10">
                        <svg className="w-full h-full -rotate-90 absolute inset-0">
                          <circle className="text-surface-highest" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                          <motion.circle 
                            className="text-secondary" 
                            cx="32" 
                            cy="32" 
                            fill="transparent" 
                            r="28" 
                            stroke="currentColor" 
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={dashArray}
                            animate={{ strokeDashoffset: dashOffset }}
                            transition={{ duration: 0.5 }}
                          />
                        </svg>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isCompleted ? 'bg-secondary text-white' : 'bg-surface-highest text-primary'}`}>
                          {isCompleted ? (
                            <span className="material-symbols-outlined text-sm">check</span>
                          ) : (
                            item.count
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
