import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { signInWithGoogle, logout } from '../firebase';
import { RECITERS } from '../constants';

interface ProfileProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  reciter: string;
  setReciter: (id: string) => void;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  gender: 'male' | 'female' | 'child';
  setGender: (gender: 'male' | 'female' | 'child') => void;
  voice: string;
  setVoice: (voice: string) => void;
  user: User | null;
}

const FONT_SIZES = [
  { label: 'صغير', en: 'Small', value: 14 },
  { label: 'متوسط', en: 'Medium', value: 18 },
  { label: 'كبير', en: 'Large', value: 24 },
  { label: 'ضخم', en: 'Huge', value: 32 },
];

const LANGUAGES = [
  { label: 'العربية', en: 'Arabic', value: 'ar' },
  { label: 'English', en: 'English', value: 'en' },
];

const GENDERS = [
  { label: 'ذكر', en: 'Male', value: 'male', icon: 'male' },
  { label: 'أنثى', en: 'Female', value: 'female', icon: 'female' },
  { label: 'طفل', en: 'Child', value: 'child', icon: 'child_care' },
];

const VOICES = [
  { id: 'Zephyr', name: 'صوت هادئ (رجل)', en: 'Calm Voice (Male)' },
  { id: 'Kore', name: 'صوت واضح (امرأة)', en: 'Clear Voice (Female)' },
  { id: 'Puck', name: 'صوت عميق (رجل)', en: 'Deep Voice (Male)' },
  { id: 'Charon', name: 'صوت دافئ (رجل)', en: 'Warm Voice (Male)' },
  { id: 'Fenrir', name: 'صوت قوي (رجل)', en: 'Strong Voice (Male)' },
];

export const Profile: React.FC<ProfileProps> = ({ 
  theme, setTheme, fontSize, setFontSize, reciter, setReciter, language, setLanguage, gender, setGender, voice, setVoice, user 
}) => {
  const [activeModal, setActiveModal] = useState<'reciter' | 'fontSize' | 'language' | 'gender' | 'voice' | 'editProfile' | null>(null);
  const [userName, setUserName] = useState(() => user?.displayName || localStorage.getItem('userName') || '');
  const [userPhoto, setUserPhoto] = useState(() => user?.photoURL || localStorage.getItem('userPhoto') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4Kt1-rDb_lxSyOHbPsn4eUP9DiWDdy28SUdGK_2D1fGwKQcK6Ox3l65WYHjue1BMCNpJeZHeYoPsekYMg6mXF5zP7SOzGHTxHgZ6Q-664_wXJ8QjGoWRlbPnHm41unifgq2sRRg84PSvnmn1whVZMkbY4PiLW6AL_KXGqTl9n6dvTMwJfXTXqmMWQpKqX_Hu1hJbmsHXminXVc6k8BBbFVmN1RGqTNiGC4Ma1jzBTY_CXt_a9eN-8_QE0EXy9XmzOMswjF3zRCi4');

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleLogout = async () => {
    await logout();
    localStorage.clear();
    window.location.reload();
  };

  const saveProfile = (name: string, photo: string) => {
    setUserName(name);
    setUserPhoto(photo);
    localStorage.setItem('userName', name);
    localStorage.setItem('userPhoto', photo);
    setActiveModal(null);
  };

  const stats = [
    { label: t('الأذكار المنجزة', 'Athkar Done'), value: '124', icon: 'check_circle', color: 'text-green-500' },
    { label: t('السنن المتبعة', 'Sunnahs Followed'), value: '12', icon: 'star', color: 'text-yellow-500' },
    { label: t('أيام الالتزام', 'Streak Days'), value: '7', icon: 'calendar_today', color: 'text-blue-500' },
  ];

  const settings = [
    { 
      id: 'edit-profile', 
      label: t('تعديل الملف الشخصي', 'Edit Profile'), 
      icon: 'edit',
      action: () => setActiveModal('editProfile'),
      value: '',
      isToggle: false
    },
    { 
      id: 'theme', 
      label: t('الوضع الليلي', 'Dark Mode'), 
      icon: theme === 'dark' ? 'dark_mode' : 'light_mode',
      action: () => setTheme(theme === 'light' ? 'dark' : 'light'),
      value: theme === 'dark' ? t('مفعل', 'Enabled') : t('معطل', 'Disabled'),
      isToggle: true,
      active: theme === 'dark'
    },
    { 
      id: 'font-size', 
      label: t('حجم الخط', 'Font Size'), 
      icon: 'format_size',
      action: () => setActiveModal('fontSize'),
      value: FONT_SIZES.find(f => f.value === fontSize)?.[language === 'ar' ? 'label' : 'en'] || fontSize.toString(),
      isToggle: false
    },
    { 
      id: 'language', 
      label: t('اللغة', 'Language'), 
      icon: 'language',
      action: () => setActiveModal('language'),
      value: LANGUAGES.find(l => l.value === language)?.[language === 'ar' ? 'label' : 'en'] || language,
      isToggle: false
    },
    { 
      id: 'gender', 
      label: t('الفئة', 'Category'), 
      icon: GENDERS.find(g => g.value === gender)?.icon || 'person',
      action: () => setActiveModal('gender'),
      value: GENDERS.find(g => g.value === gender)?.[language === 'ar' ? 'label' : 'en'] || gender,
      isToggle: false
    },
    { 
      id: 'voice', 
      label: t('صوت الأذكار', 'Athkar Voice'), 
      icon: 'volume_up',
      action: () => setActiveModal('voice'),
      value: VOICES.find(v => v.id === voice)?.[language === 'ar' ? 'name' : 'en'] || voice,
      isToggle: false
    },
    { 
      id: 'reciter', 
      label: t('القارئ المفضل', 'Preferred Reciter'), 
      icon: 'record_voice_over',
      action: () => setActiveModal('reciter'),
      value: RECITERS.find(r => r.id === reciter)?.[language === 'ar' ? 'name' : 'en'] || reciter,
      isToggle: false
    },
    { 
      id: 'logout', 
      label: t('تسجيل الخروج', 'Logout'), 
      icon: 'logout',
      action: handleLogout,
      value: '',
      isToggle: false,
      color: 'text-red-500'
    },
  ];

  return (
    <div className={`space-y-8 pb-20 ${language === 'en' ? 'text-left' : 'text-right'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Profile Header */}
      <section className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden mx-auto">
            <img 
              src={userPhoto} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary" style={{ fontSize: fontSize + 8 }}>{userName || t('مرحباً بك', 'Welcome')}</h2>
          <p className="text-on-surface-variant opacity-70" style={{ fontSize: fontSize - 2 }}>{user?.email || t('سجل دخولك لحفظ بياناتك', 'Sign in to save your data')}</p>
        </div>
        {!user && (
          <button 
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-3 bg-surface-high px-6 py-3 rounded-2xl border border-outline-variant/10 hover:bg-primary/5 transition-all mx-auto"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span className="font-bold text-primary">{t('تسجيل الدخول بجوجل', 'Sign in with Google')}</span>
          </button>
        )}
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-surface-low p-4 rounded-2xl text-center border border-outline-variant/5 shadow-sm"
          >
            <span className={`material-symbols-outlined ${stat.color} mb-2`}>{stat.icon}</span>
            <div className="text-xl font-bold text-primary" style={{ fontSize: fontSize + 4 }}>{stat.value}</div>
            <div className="text-[10px] text-on-surface-variant font-medium" style={{ fontSize: fontSize - 6 }}>{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Settings List */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-primary px-2" style={{ fontSize: fontSize + 2 }}>{t('الإعدادات', 'Settings')}</h3>
        <div className="bg-surface-low rounded-3xl overflow-hidden border border-outline-variant/5 shadow-sm">
          {settings.map((item, index) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-5 hover:bg-surface-high transition-colors ${
                index !== settings.length - 1 ? 'border-b border-outline-variant/5' : ''
              } ${language === 'en' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex items-center gap-4 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center ${item.color || 'text-primary'}`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <span className={`font-bold ${item.color || 'text-on-surface'}`} style={{ fontSize: fontSize }}>{item.label}</span>
              </div>
              <div className={`flex items-center gap-3 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm text-on-surface-variant font-medium" style={{ fontSize: fontSize - 2 }}>{item.value}</span>
                {item.isToggle ? (
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${item.active ? 'bg-primary' : 'bg-outline-variant'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.active ? (language === 'ar' ? 'left-1' : 'right-1') : (language === 'ar' ? 'left-7' : 'right-7')}`} />
                  </div>
                ) : (
                  <span className={`material-symbols-outlined text-on-surface-variant opacity-30 ${language === 'ar' ? 'rotate-0' : 'rotate-180'}`}>chevron_left</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Selection Modals */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 w-full bg-surface z-[90] rounded-t-[3rem] p-8 max-h-[70vh] overflow-y-auto"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className={`flex justify-between items-center mb-6 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold text-primary">
                  {activeModal === 'reciter' && t('اختر القارئ', 'Select Reciter')}
                  {activeModal === 'fontSize' && t('اختر حجم الخط', 'Select Font Size')}
                  {activeModal === 'language' && t('اختر اللغة', 'Select Language')}
                  {activeModal === 'gender' && t('اختر الفئة', 'Select Category')}
                  {activeModal === 'voice' && t('اختر صوت الأذكار', 'Select Athkar Voice')}
                  {activeModal === 'editProfile' && t('تعديل الملف الشخصي', 'Edit Profile')}
                </h3>
                <button onClick={() => setActiveModal(null)} className="text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {activeModal === 'editProfile' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-primary mb-2">{t('الاسم', 'Name')}</label>
                      <input 
                        type="text" 
                        defaultValue={userName}
                        onBlur={(e) => saveProfile(e.target.value, userPhoto)}
                        className="w-full bg-surface-low border border-outline-variant/10 rounded-xl px-4 py-3 outline-none focus:border-primary"
                        placeholder={t('أدخل اسمك', 'Enter your name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary mb-2">{t('رابط الصورة', 'Photo URL')}</label>
                      <input 
                        type="text" 
                        defaultValue={userPhoto}
                        onBlur={(e) => saveProfile(userName, e.target.value)}
                        className="w-full bg-surface-low border border-outline-variant/10 rounded-xl px-4 py-3 outline-none focus:border-primary"
                        placeholder={t('أدخل رابط الصورة', 'Enter photo URL')}
                      />
                    </div>
                  </div>
                )}
                
                {activeModal === 'reciter' && RECITERS.map(r => (
                  <button 
                    key={r.id}
                    onClick={() => { setReciter(r.id); setActiveModal(null); }}
                    className={`w-full p-4 rounded-2xl flex justify-between items-center ${reciter === r.id ? 'bg-primary text-white' : 'hover:bg-surface-high text-primary'} ${language === 'en' ? 'flex-row-reverse' : ''}`}
                  >
                    <span className="font-bold" style={{ fontSize: fontSize }}>{t(r.name, r.en)}</span>
                    {reciter === r.id && <span className="material-symbols-outlined">check</span>}
                  </button>
                ))}
                
                {activeModal === 'fontSize' && FONT_SIZES.map(f => (
                  <button 
                    key={f.value}
                    onClick={() => { setFontSize(f.value); setActiveModal(null); }}
                    className={`w-full p-4 rounded-2xl flex justify-between items-center ${fontSize === f.value ? 'bg-primary text-white' : 'hover:bg-surface-high text-primary'} ${language === 'en' ? 'flex-row-reverse' : ''}`}
                  >
                    <span className="font-bold" style={{ fontSize: f.value }}>{t(f.label, f.en)}</span>
                    {fontSize === f.value && <span className="material-symbols-outlined">check</span>}
                  </button>
                ))}
                
                {activeModal === 'language' && LANGUAGES.map(l => (
                  <button 
                    key={l.value}
                    onClick={() => { setLanguage(l.value as any); setActiveModal(null); }}
                    className={`w-full p-4 rounded-2xl flex justify-between items-center ${language === l.value ? 'bg-primary text-white' : 'hover:bg-surface-high text-primary'} ${language === 'en' ? 'flex-row-reverse' : ''}`}
                  >
                    <span className="font-bold" style={{ fontSize: fontSize }}>{l.label}</span>
                    {language === l.value && <span className="material-symbols-outlined">check</span>}
                  </button>
                ))}

                {activeModal === 'gender' && GENDERS.map(g => (
                  <button 
                    key={g.value}
                    onClick={() => { setGender(g.value as any); setActiveModal(null); }}
                    className={`w-full p-4 rounded-2xl flex justify-between items-center ${gender === g.value ? 'bg-primary text-white' : 'hover:bg-surface-high text-primary'} ${language === 'en' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined">{g.icon}</span>
                      <span className="font-bold" style={{ fontSize: fontSize }}>{t(g.label, g.en)}</span>
                    </div>
                    {gender === g.value && <span className="material-symbols-outlined">check</span>}
                  </button>
                ))}

                {activeModal === 'voice' && VOICES.map(v => (
                  <button 
                    key={v.id}
                    onClick={() => { setVoice(v.id); setActiveModal(null); }}
                    className={`w-full p-4 rounded-2xl flex justify-between items-center ${voice === v.id ? 'bg-primary text-white' : 'hover:bg-surface-high text-primary'} ${language === 'en' ? 'flex-row-reverse' : ''}`}
                  >
                    <span className="font-bold" style={{ fontSize: fontSize }}>{t(v.name, v.en)}</span>
                    {voice === v.id && <span className="material-symbols-outlined">check</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="text-center pt-8 pb-12">
        <p className="text-xs text-on-surface-variant opacity-40">أدبُ النبوة v1.0.0</p>
        <p className="text-[10px] text-on-surface-variant opacity-30 mt-1">{t('صُنع بكل حب لخدمة المسلمين', 'Made with love for Muslims')}</p>
      </footer>
    </div>
  );
};
