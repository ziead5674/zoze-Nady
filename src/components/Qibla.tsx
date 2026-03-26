import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };

export const Qibla: React.FC<{ language?: 'ar' | 'en' }> = ({ language = 'ar' }) => {
  const [heading, setHeading] = useState<number>(0);
  const [qiblaDir, setQiblaDir] = useState<number>(0);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setLocation({ lat: userLat, lng: userLng });
          
          // Calculate Qibla bearing
          const φ1 = userLat * (Math.PI / 180);
          const φ2 = KAABA_COORDS.lat * (Math.PI / 180);
          const Δλ = (KAABA_COORDS.lng - userLng) * (Math.PI / 180);
          
          const y = Math.sin(Δλ);
          const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
          let bearing = Math.atan2(y, x) * (180 / Math.PI);
          bearing = (bearing + 360) % 360;
          setQiblaDir(bearing);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error(t('تعذر الحصول على الموقع لتحديد القبلة بدقة', 'Could not get location to determine Qibla accurately'));
        }
      );
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Use webkitCompassHeading if available (iOS), otherwise alpha (Android/others)
      const compass = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
      setHeading(compass);
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      setIsSupported(false);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [language]);

  const relativeQibla = (qiblaDir - heading + 360) % 360;
  const isAligned = Math.abs(relativeQibla) < 5 || Math.abs(relativeQibla - 360) < 5;

  return (
    <motion.div 
      initial={{ opacity: 0, rotate: -10 }}
      animate={{ opacity: 1, rotate: 0 }}
      className={`min-h-[80vh] flex flex-col items-center justify-center space-y-12 ${language === 'en' ? 'text-left' : 'text-right'}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <section className="w-full max-w-md text-center">
        <h2 className="text-4xl font-black text-primary tracking-tight mb-4">{t('وجه هاتفك نحو القبلة', 'Point your phone towards Qibla')}</h2>
        <p className="text-on-surface-variant font-medium opacity-70">{t('اتبع الإشارة بدقة للوصول إلى اتجاه الكعبة المشرفة', 'Follow the indicator accurately to find the direction of the Kaaba')}</p>
        {!isSupported && (
          <p className="text-red-500 text-sm mt-2">{t('جهازك لا يدعم مستشعر البوصلة، سيتم عرض الاتجاه التقريبي فقط', 'Your device does not support a compass sensor, only an approximate direction will be shown')}</p>
        )}
      </section>

      {/* Compass Dial */}
      <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${isAligned ? 'border-secondary scale-110' : 'border-secondary/20 scale-105 opacity-50'}`}></div>
        <div className={`absolute inset-0 rounded-full border transition-all duration-500 ${isAligned ? 'border-secondary/40 scale-125' : 'border-secondary/20 scale-90 opacity-80'}`}></div>
        
        <div className={`relative w-72 h-72 rounded-full bg-gradient-to-br transition-colors duration-500 ${isAligned ? 'from-secondary/80 to-secondary shadow-[0_0_50px_rgba(119,90,25,0.4)]' : 'from-primary-container to-primary shadow-2xl'} flex items-center justify-center`}>
          <div className="absolute inset-4 border-2 border-white/10 rounded-full"></div>
          
          {/* Cardinal Points */}
          <div className="absolute inset-0 p-6 flex flex-col justify-between items-center pointer-events-none">
            <span className="text-white/40 text-xs font-bold">N</span>
            <span className="text-white/40 text-xs font-bold">S</span>
          </div>
          <div className="absolute inset-0 p-6 flex justify-between items-center pointer-events-none">
            <span className="text-white/40 text-xs font-bold">W</span>
            <span className="text-white/40 text-xs font-bold">E</span>
          </div>

          {/* Needle */}
          <motion.div 
            animate={{ rotate: relativeQibla }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className={`h-1/2 w-2 rounded-full origin-bottom -translate-y-1/2 shadow-lg transition-colors duration-500 ${isAligned ? 'bg-white' : 'bg-secondary'}`}></div>
            <div className="absolute top-0 -translate-y-8 flex flex-col items-center">
              <motion.span 
                animate={isAligned ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`material-symbols-outlined text-5xl transition-colors duration-500 ${isAligned ? 'text-white' : 'text-secondary'}`} 
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mosque
              </motion.span>
              {isAligned && <div className="w-3 h-3 bg-white rounded-full animate-ping mt-2"></div>}
            </div>
          </motion.div>

          <div className="z-10 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-inner">
            <span className="text-4xl font-bold text-white">{Math.round(relativeQibla)}°</span>
            <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold mt-1">
              {isAligned ? t('متجه للقبلة', 'Aligned with Qibla') : t('ابحث عن الاتجاه', 'Search for direction')}
            </span>
          </div>
        </div>
      </div>

      <section className={`w-full max-w-md bg-surface-low rounded-2xl p-6 flex items-center justify-between ${language === 'en' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">location_on</span>
          </div>
          <div className={language === 'en' ? 'text-left' : 'text-right'}>
            <h3 className="font-bold text-primary">{t('موقعك الحالي', 'Your Current Location')}</h3>
            <p className="text-sm text-on-surface-variant">
              {location ? `${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°` : t('جاري تحديد الموقع...', 'Determining location...')}
            </p>
          </div>
        </div>
        <div className={language === 'en' ? 'text-right' : 'text-left'}>
          <span className="text-xs font-bold text-secondary uppercase tracking-tighter block mb-1">{t('القبلة', 'Qibla')}</span>
          <span className="text-lg font-black text-primary">{Math.round(qiblaDir)}°</span>
        </div>
      </section>
    </motion.div>
  );
};
