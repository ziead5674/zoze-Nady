import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Home } from './components/Home';
import { Sunnahs } from './components/Sunnahs';
import { Athkar } from './components/Athkar';
import { Qibla } from './components/Qibla';
import { PrayerTimes } from './components/PrayerTimes';
import { Reminders } from './components/Reminders';
import { Quran } from './components/Quran';
import { QuranMemorization } from './components/QuranMemorization';
import { Duas } from './components/Duas';
import { Profile } from './components/Profile';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

type Screen = 'home' | 'sunnahs' | 'athkar' | 'prayer' | 'qibla' | 'reminders' | 'quran' | 'duas' | 'profile' | 'quranMemorization';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? parseInt(saved) : 18;
  });
  const [reciter, setReciter] = useState<string>(() => {
    const saved = localStorage.getItem('reciter');
    return saved || 'ar.alafasy';
  });
  const [language, setLanguage] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem('language');
    return (saved as 'ar' | 'en') || 'ar';
  });
  const [gender, setGender] = useState<'male' | 'female' | 'child'>(() => {
    const saved = localStorage.getItem('gender');
    return (saved as 'male' | 'female' | 'child') || 'male';
  });
  const [voice, setVoice] = useState<string>(() => {
    const saved = localStorage.getItem('voice');
    return saved || 'Zephyr';
  });
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [userPhoto, setUserPhoto] = useState(() => localStorage.getItem('userPhoto') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4Kt1-rDb_lxSyOHbPsn4eUP9DiWDdy28SUdGK_2D1fGwKQcK6Ox3l65WYHjue1BMCNpJeZHeYoPsekYMg6mXF5zP7SOzGHTxHgZ6Q-664_wXJ8QjGoWRlbPnHm41unifgq2sRRg84PSvnmn1whVZMkbY4PiLW6AL_KXGqTl9n6dvTMwJfXTXqmMWQpKqX_Hu1hJbmsHXminXVc6k8BBbFVmN1RGqTNiGC4Ma1jzBTY_CXt_a9eN-8_QE0EXy9XmzOMswjF3zRCi4');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        setUserName(currentUser.displayName || '');
        setUserPhoto(currentUser.photoURL || '');
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.theme) setTheme(data.theme);
        if (data.fontSize) setFontSize(data.fontSize);
        if (data.reciter) setReciter(data.reciter);
        if (data.language) setLanguage(data.language);
        if (data.gender) setGender(data.gender);
        if (data.voice) setVoice(data.voice);
        if (data.displayName) setUserName(data.displayName);
        if (data.photoURL) setUserPhoto(data.photoURL);
      } else {
        // Initialize user doc if it doesn't exist
        setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
          theme,
          fontSize,
          reciter,
          language,
          gender,
          voice,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    return () => unsubscribe();
  }, [user]);

  // Update Firestore when local state changes (and user is logged in)
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    updateDoc(userDocRef, {
      theme,
      fontSize,
      reciter,
      language,
      gender,
      voice,
      displayName: userName,
      photoURL: userPhoto,
      updatedAt: serverTimestamp()
    }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
  }, [theme, fontSize, reciter, language, userName, userPhoto, user]);

  useEffect(() => {
    const handleStorage = () => {
      setUserName(localStorage.getItem('userName') || '');
      setUserPhoto(localStorage.getItem('userPhoto') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4Kt1-rDb_lxSyOHbPsn4eUP9DiWDdy28SUdGK_2D1fGwKQcK6Ox3l65WYHjue1BMCNpJeZHeYoPsekYMg6mXF5zP7SOzGHTxHgZ6Q-664_wXJ8QjGoWRlbPnHm41unifgq2sRRg84PSvnmn1whVZMkbY4PiLW6AL_KXGqTl9n6dvTMwJfXTXqmMWQpKqX_Hu1hJbmsHXminXVc6k8BBbFVmN1RGqTNiGC4Ma1jzBTY_CXt_a9eN-8_QE0EXy9XmzOMswjF3zRCi4');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reciter', reciter);
  }, [reciter]);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('gender', gender);
  }, [gender]);

  useEffect(() => {
    localStorage.setItem('voice', voice);
  }, [voice]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home': return <Home onNavigate={setActiveScreen} language={language} />;
      case 'sunnahs': return <Sunnahs onNavigate={setActiveScreen} fontSize={fontSize} language={language} gender={gender} reciter={reciter} voice={voice} user={user} />;
      case 'athkar': return <Athkar fontSize={fontSize} language={language} reciter={reciter} voice={voice} user={user} />;
      case 'prayer': return <PrayerTimes onNavigate={setActiveScreen} language={language} fontSize={fontSize} />;
      case 'qibla': return <Qibla language={language} />;
      case 'reminders': return <Reminders language={language} user={user} />;
      case 'quran': return <Quran fontSize={fontSize} reciter={reciter} setReciter={setReciter} language={language} />;
      case 'quranMemorization': return <QuranMemorization fontSize={fontSize} language={language} reciter={reciter} setReciter={setReciter} />;
      case 'duas': return <Duas fontSize={fontSize} language={language} reciter={reciter} voice={voice} user={user} />;
      case 'profile': return (
        <Profile 
          theme={theme} 
          setTheme={setTheme} 
          fontSize={fontSize} 
          setFontSize={setFontSize}
          reciter={reciter}
          setReciter={setReciter}
          language={language}
          setLanguage={setLanguage}
          gender={gender}
          setGender={setGender}
          voice={voice}
          setVoice={setVoice}
          user={user}
        />
      );
      default: return <Home onNavigate={setActiveScreen} language={language} />;
    }
  };

  const menuItems = [
    { id: 'home', label: t('الرئيسية', 'Home'), icon: 'home' },
    { id: 'quran', label: t('المصحف الشريف', 'The Holy Quran'), icon: 'menu_book' },
    { id: 'quranMemorization', label: t('تسميع القرآن', 'Quran Memorization'), icon: 'record_voice_over' },
    { id: 'athkar', label: t('الأذكار اليومية', 'Daily Athkar'), icon: 'auto_awesome' },
    { id: 'duas', label: t('الأدعية النبوية', 'Prophetic Duas'), icon: 'favorite' },
    { id: 'sunnahs', label: t('السنن المهجورة', 'Abandoned Sunnahs'), icon: 'star' },
    { id: 'prayer', label: t('مواقيت الصلاة', 'Prayer Times'), icon: 'schedule' },
    { id: 'qibla', label: t('اتجاة القبلة', 'Qibla Direction'), icon: 'explore' },
    { id: 'reminders', label: t('التنبيهات', 'Reminders'), icon: 'notifications' },
    { id: 'profile', label: t('الملف الشخصي', 'User Profile'), icon: 'person' },
  ];

  return (
    <div className={`min-h-screen bg-background text-on-surface font-sans ${theme} ${language === 'en' ? 'text-left' : 'text-right'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" richColors />
      
      {/* Sidebar Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: language === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '100%' : '-100%' }}
              className={`fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} h-full w-80 bg-surface z-[70] shadow-2xl p-8 flex flex-col`}
            >
              <div className={`flex justify-between items-center mb-12 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-2xl font-bold text-primary">{t('القائمة', 'Menu')}</h2>
                <button onClick={() => setIsMenuOpen(false)} className="text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id as Screen);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeScreen === item.id ? 'bg-primary text-white shadow-lg' : 'hover:bg-surface-high text-primary'} ${language === 'en' ? 'flex-row-reverse' : ''}`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="pt-8 border-t border-primary/5">
                <p className="text-xs text-on-surface-variant text-center opacity-50">سنن v1.0.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top App Bar */}
      <header className={`fixed top-0 w-full z-50 glass flex justify-between items-center px-4 md:px-8 h-20 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="text-primary hover:bg-surface-high transition-colors p-2 rounded-full"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <button 
            onClick={() => setActiveScreen('reminders')}
            className={`text-primary hover:bg-surface-high transition-colors p-2 rounded-full relative ${activeScreen === 'reminders' ? 'bg-primary/10' : ''}`}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-white"></span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>mosque</span>
          <h1 className="text-2xl font-bold text-primary tracking-wide">{t('سنن', 'Sunan')}</h1>
        </div>
        <button 
          onClick={() => setActiveScreen('profile')}
          className={`w-10 h-10 rounded-full bg-surface-high flex items-center justify-center overflow-hidden border transition-all ${activeScreen === 'profile' ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/10'}`}
        >
          <img 
            src={userPhoto} 
            alt="Profile" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-6 md:px-12 max-w-7xl mx-auto pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 w-full z-50 glass flex justify-around items-center px-4 pt-2 pb-8 rounded-t-[2rem] border-t border-primary/5 shadow-2xl ${language === 'en' ? 'flex-row-reverse' : ''}`}>
        <NavItem 
          active={activeScreen === 'home'} 
          onClick={() => setActiveScreen('home')} 
          icon="home" 
          label={t('الرئيسية', 'Home')} 
        />
        <NavItem 
          active={activeScreen === 'quran'} 
          onClick={() => setActiveScreen('quran')} 
          icon="menu_book" 
          label={t('المصحف', 'Quran')} 
        />
        <NavItem 
          active={activeScreen === 'athkar'} 
          onClick={() => setActiveScreen('athkar')} 
          icon="auto_awesome" 
          label={t('الأذكار', 'Athkar')} 
        />
        <NavItem 
          active={activeScreen === 'duas'} 
          onClick={() => setActiveScreen('duas')} 
          icon="favorite" 
          label={t('الأدعية', 'Duas')} 
        />
        <NavItem 
          active={activeScreen === 'sunnahs'} 
          onClick={() => setActiveScreen('sunnahs')} 
          icon="star" 
          label={t('السنن', 'Sunnahs')} 
        />
      </nav>
    </div>
  );
}

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: string, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center transition-all px-4 py-2 rounded-2xl ${active ? 'text-secondary bg-secondary/10' : 'text-on-surface-variant hover:text-secondary'}`}
  >
    <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
    <span className="text-[11px] font-medium mt-1">{label}</span>
  </button>
);

