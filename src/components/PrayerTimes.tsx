import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import { COUNTRIES } from '../constants';

export const PrayerTimes: React.FC<{ onNavigate: (screen: any) => void; language?: 'ar' | 'en'; fontSize?: number }> = ({ onNavigate, language = 'ar', fontSize = 16 }) => {
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string; enName?: string } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [nextPrayer, setNextPrayer] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    const savedLocation = localStorage.getItem('user_location');
    if (savedLocation) {
      setLocation(JSON.parse(savedLocation));
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: t('موقعك الحالي', 'Current Location'),
            enName: 'Current Location'
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error(t('تعذر الحصول على الموقع، سيتم استخدام إحداثيات القاهرة افتراضياً', 'Could not get location, using Cairo coordinates by default'));
          const defaultLoc = { lat: 30.0444, lng: 31.2357, name: 'القاهرة', enName: 'Cairo' };
          setLocation(defaultLoc);
        }
      );
    } else {
      const defaultLoc = { lat: 30.0444, lng: 31.2357, name: 'القاهرة', enName: 'Cairo' };
      setLocation(defaultLoc);
    }
  }, []);

  useEffect(() => {
    if (!location) return;

    const coords = new Coordinates(location.lat, location.lng);
    const params = CalculationMethod.Egyptian();
    const date = new Date();
    const times = new AdhanPrayerTimes(coords, date, params);

    const prayerList = [
      { name: t('الفجر', 'Fajr'), time: times.fajr, icon: 'wb_twilight', description: t('بداية وقت الصيام', 'Start of fasting time') },
      { name: t('الشروق', 'Sunrise'), time: times.sunrise, icon: 'wb_sunny', description: t('نهاية وقت الفجر', 'End of Fajr time') },
      { name: t('الظهر', 'Dhuhr'), time: times.dhuhr, icon: 'sunny', description: t('وقت الزوال', 'Zenith time') },
      { name: t('العصر', 'Asr'), time: times.asr, icon: 'wb_cloudy', description: t('وقت العصر', 'Afternoon prayer') },
      { name: t('المغرب', 'Maghrib'), time: times.maghrib, icon: 'wb_twilight', description: t('وقت الإفطار', 'Iftar time') },
      { name: t('العشاء', 'Isha'), time: times.isha, icon: 'nightlight_round', description: t('وقت العشاء', 'Night prayer') },
    ];

    setPrayerTimes(prayerList);

    const updateNextPrayer = () => {
      const now = new Date();
      const next = times.nextPrayer();
      const nextTime = times.timeForPrayer(next);
      
      if (nextTime) {
        const diff = nextTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setCountdown(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );

        const prayerNames: Record<string, { ar: string, en: string }> = {
          fajr: { ar: 'الفجر', en: 'Fajr' },
          dhuhr: { ar: 'الظهر', en: 'Dhuhr' },
          asr: { ar: 'العصر', en: 'Asr' },
          maghrib: { ar: 'المغرب', en: 'Maghrib' },
          isha: { ar: 'العشاء', en: 'Isha' },
          none: { ar: 'الفجر (غداً)', en: 'Fajr (Tomorrow)' },
        };

        const nextPrayerInfo = prayerNames[next] || prayerNames.fajr;
        setNextPrayer({
          name: t(nextPrayerInfo.ar, nextPrayerInfo.en),
          time: nextTime,
        });
      }
    };

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 1000);
    return () => clearInterval(interval);
  }, [location, language]);

  const handleCountrySelect = (country: any) => {
    const newLoc = {
      lat: country.lat,
      lng: country.lng,
      name: country.name,
      enName: country.en
    };
    setLocation(newLoc);
    localStorage.setItem('user_location', JSON.stringify(newLoc));
    setShowCountryModal(false);
    toast.success(t(`تم تغيير الموقع إلى ${country.name}`, `Location changed to ${country.en}`));
  };

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.includes(searchQuery) || c.en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!prayerTimes) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-12 pb-12 ${language === 'en' ? 'text-left' : 'text-right'}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <section className="relative overflow-hidden rounded-[2.5rem] p-10 bg-primary text-white shadow-2xl">
        <div className="relative z-10 flex flex-col items-center text-center">
          <button 
            onClick={() => setShowCountryModal(true)}
            className="flex items-center gap-2 mb-4 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span className="text-sm font-medium">{location ? t(location.name || '', location.enName || '') : t('اختر الدولة', 'Select Country')}</span>
            <span className="material-symbols-outlined text-xs">expand_more</span>
          </button>
          <h2 className="text-2xl opacity-80 mb-2">{t('الصلاة القادمة', 'Next Prayer')}</h2>
          <h3 className="text-7xl font-black mb-6 tracking-tight">{nextPrayer?.name}</h3>
          <div className="flex items-end gap-2 mb-8">
            <span className="text-5xl font-bold text-secondary">{countdown}</span>
            <span className="text-lg mb-1.5 opacity-70">{t('متبقي على الأذان', 'Remaining to Adhan')}</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              className="h-full bg-secondary rounded-full"
            />
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full"></div>
      </section>

      <section className="space-y-4">
        <div className={`flex justify-between items-center mb-6 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          <h4 className="text-xl font-bold text-primary">{t('جدول اليوم', 'Today\'s Schedule')}</h4>
          <span className="text-sm text-on-surface-variant font-medium">
            {new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {prayerTimes.map((prayer: any) => {
            const isNext = nextPrayer?.name === prayer.name;
            return (
              <div 
                key={prayer.name}
                className={`flex items-center justify-between p-6 rounded-2xl transition-all duration-300 ${
                  isNext 
                    ? 'bg-secondary/10 border-2 border-secondary/20 shadow-lg' 
                    : 'bg-surface-low hover:bg-surface-high'
                } ${language === 'en' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex items-center gap-5 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isNext 
                      ? 'bg-secondary text-white shadow-md' 
                      : 'bg-primary/5 text-primary'
                  }`}>
                    <span className="material-symbols-outlined">{prayer.icon}</span>
                  </div>
                  <div className={language === 'en' ? 'text-left' : 'text-right'}>
                    <p className={`font-bold ${isNext ? 'text-secondary' : 'text-primary'}`} style={{ fontSize: fontSize + 2 }}>{prayer.name}</p>
                    <p className="text-xs opacity-60" style={{ fontSize: fontSize - 4 }}>{prayer.description}</p>
                  </div>
                </div>
                <div className={language === 'en' ? 'text-right' : 'text-left'}>
                  <p className={`text-xl font-bold ${isNext ? 'text-secondary' : 'text-primary'}`}>
                    {new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(prayer.time)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section 
        onClick={() => onNavigate('qibla')}
        className={`bg-surface-low border border-primary/5 rounded-[2rem] p-8 flex items-center justify-between cursor-pointer hover:bg-surface-high transition-all group ${language === 'en' ? 'flex-row-reverse' : ''}`}
      >
        <div className={`space-y-2 ${language === 'en' ? 'text-left' : 'text-right'}`}>
          <h3 className="text-2xl text-primary" style={{ fontSize: fontSize + 8 }}>{t('اتجاه القبلة', 'Qibla Direction')}</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed" style={{ fontSize: fontSize - 2 }}>{t('حدد اتجاه الكعبة المشرفة بدقة من موقعك الحالي.', 'Determine the direction of the Kaaba accurately from your current location.')}</p>
        </div>
        <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-3xl">explore</span>
        </div>
      </section>

      {/* Country Selection Modal */}
      <AnimatePresence>
        {showCountryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCountryModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="p-8 border-b border-primary/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-primary">{t('اختر الدولة', 'Select Country')}</h3>
                  <button onClick={() => setShowCountryModal(false)} className="w-10 h-10 rounded-full hover:bg-primary/5 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
                  <input 
                    type="text"
                    placeholder={t('بحث عن دولة...', 'Search for a country...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-low border border-primary/10 rounded-2xl py-4 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredCountries.map((country) => (
                  <button
                    key={country.en}
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all group ${location?.enName === country.en ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${location?.enName === country.en ? 'bg-primary text-white' : 'bg-primary/5 text-primary'}`}>
                        <span className="material-symbols-outlined">flag</span>
                      </div>
                      <span className="font-bold text-primary">{t(country.name, country.en)}</span>
                    </div>
                    {location?.enName === country.en && (
                      <span className="material-symbols-outlined text-primary">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
