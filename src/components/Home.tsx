import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { SUNNAHS, COUNTRIES } from '../constants';

export const Home: React.FC<{ onNavigate: (screen: any) => void, language: 'ar' | 'en', fontSize: number }> = ({ onNavigate, language, fontSize }) => {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const hasFavorites = () => {
    const athkarFavs = JSON.parse(localStorage.getItem('athkar_favorites') || '[]');
    const duasFavs = JSON.parse(localStorage.getItem('duas_favorites') || '[]');
    return athkarFavs.length > 0 || duasFavs.length > 0;
  };

  const getFontSize = (base: number) => {
    return `${(fontSize / 18) * base}px`;
  };

  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const holyPlaces = [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Masjid_al-Nabawi_at_sunset.jpg/1024px-Masjid_al-Nabawi_at_sunset.jpg",
      name: t('المسجد النبوي', 'Prophet\'s Mosque'),
      quote: t('كان خلقه القرآن', 'His character was the Quran'),
      author: t('عائشة رضي الله عنها', 'Aisha (RA)')
    },
    {
      url: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1000",
      name: t('الكعبة المشرفة', 'The Holy Kaaba'),
      quote: t('جعل الله الكعبة البيت الحرام قيامًا للناس', 'Allah has made the Kaaba, the Sacred House, an asylum of security and benefits for mankind'),
      author: t('سورة المائدة', 'Surah Al-Ma\'idah')
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Dome_of_the_Rock_in_the_Temple_Mount.jpg/1024px-Dome_of_the_Rock_in_the_Temple_Mount.jpg",
      name: t('المسجد الأقصى', 'Al-Aqsa Mosque'),
      quote: t('سبحان الذي أسرى بعبده ليلاً من المسجد الحرام إلى المسجد الأقصى', 'Exalted is He who took His Servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa'),
      author: t('سورة الإسراء', 'Surah Al-Isra')
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % holyPlaces.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16 pb-12"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Hero Section */}
      <section className="relative py-12">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className={`space-y-6 ${language === 'en' ? 'text-left' : 'text-right'}`}>
            <span className="text-secondary font-semibold tracking-widest uppercase text-sm block">{t('هدى ورحمة', 'Guidance & Mercy')}</span>
            <h2 className="leading-tight text-primary" style={{ fontSize: getFontSize(60) }}>
              {t('أدبُ النبوة', 'Prophetic Manners')}<br />
              <span className="text-secondary/60">{t('وميراثُ الهدى', '& Heritage of Guidance')}</span>
            </h2>
            <p className="text-on-surface-variant leading-relaxed max-w-md" style={{ fontSize: getFontSize(18) }}>
              {t('مكتبة تفاعلية تستعرض عادات النبي صلى الله عليه وسلم اليومية، وأخلاقه الرفيعة، وسننه المهجورة لنحييها في حياتنا المعاصرة.', 'An interactive library showcasing the daily habits of the Prophet (PBUH), his noble character, and his forgotten Sunnahs to revive them in our contemporary lives.')}
            </p>
            {hasFavorites() && (
              <button 
                onClick={() => onNavigate('athkar')}
                className="flex items-center gap-3 bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl font-bold hover:bg-red-500/20 transition-all"
              >
                <span className="material-symbols-outlined">favorite</span>
                {t('عرض مفضلاتك', 'View Favorites')}
              </button>
            )}
          </div>
          <div className="relative h-[400px] rounded-[2rem] overflow-hidden shadow-2xl">
            <motion.img 
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              src={holyPlaces[currentImageIndex].url} 
              alt={holyPlaces[currentImageIndex].name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
            <div className={`absolute bottom-8 ${language === 'ar' ? 'right-8 text-right' : 'left-8 text-left'} text-white`}>
              <p className="font-serif italic" style={{ fontSize: getFontSize(24) }}>"{holyPlaces[currentImageIndex].quote}"</p>
              <p className="text-sm opacity-80 mt-1">— {holyPlaces[currentImageIndex].author}</p>
            </div>
            <div className="absolute top-4 right-4 flex gap-1">
              {holyPlaces.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-secondary w-6' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLink 
          onClick={() => onNavigate('quran')}
          icon="menu_book"
          label={t('المصحف', 'Quran')}
          color="bg-primary"
        />
        <QuickLink 
          onClick={() => onNavigate('athkar')}
          icon="auto_awesome"
          label={t('الأذكار', 'Athkar')}
          color="bg-secondary"
        />
        <QuickLink 
          onClick={() => onNavigate('duas')}
          icon="favorite"
          label={t('الأدعية', 'Duas')}
          color="bg-primary-container"
        />
        <QuickLink 
          onClick={() => onNavigate('prayer')}
          icon="schedule"
          label={t('المواقيت', 'Prayer Times')}
          color="bg-secondary-container"
        />
      </section>

      {/* Sunnahs Section */}
      <section className="space-y-8">
        <div className={`flex justify-between items-end ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className={`space-y-2 ${language === 'en' ? 'text-left' : 'text-right'}`}>
            <h3 className="text-primary" style={{ fontSize: getFontSize(30) }}>{t('سنن مهجورة', 'Forgotten Sunnahs')}</h3>
            <p className="text-on-surface-variant" style={{ fontSize: getFontSize(16) }}>{t('أحيِ سنة نبيك في يومك', 'Revive the Sunnah in your daily life')}</p>
          </div>
          <button 
            onClick={() => onNavigate('sunnahs')}
            className="text-primary font-bold flex items-center gap-2 hover:underline"
          >
            {t('عرض الكل', 'View All')} <span className={`material-symbols-outlined ${language === 'ar' ? 'rotate-180' : 'rotate-0'}`}>arrow_forward</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUNNAHS.slice(0, 3).map((sunnah, idx) => (
            <div 
              key={sunnah.id}
              className={`${idx === 1 ? 'bg-primary-container text-white' : 'bg-surface-low'} p-8 rounded-3xl space-y-4 hover:shadow-xl transition-all duration-500 group`}
            >
              <div className={`w-14 h-14 ${idx === 1 ? 'bg-secondary text-white' : 'bg-primary-container text-white'} rounded-2xl flex items-center justify-center`}>
                <span className="material-symbols-outlined text-3xl">{sunnah.icon}</span>
              </div>
              <h4 className={`font-bold ${idx === 1 ? 'text-white' : 'text-primary'}`} style={{ fontSize: getFontSize(20) }}>{t(sunnah.title, sunnah.title_en || sunnah.title)}</h4>
              <p className={`${idx === 1 ? 'text-white/70' : 'text-on-surface-variant'} leading-relaxed`} style={{ fontSize: getFontSize(14) }}>
                {t(sunnah.description, sunnah.description_en || sunnah.description)}
              </p>
              <button 
                onClick={() => idx === 1 ? onNavigate('sunnahs') : toast.success(t(`تم تسجيل تطبيق سنة: ${sunnah.title}`, `Sunnah applied: ${sunnah.title_en || sunnah.title}`))}
                className={`w-full mt-4 py-3 ${idx === 1 ? 'bg-secondary text-white' : 'bg-primary text-white'} rounded-xl font-medium hover:opacity-90 transition-opacity`}
              >
                {idx === 1 ? t('تعلم المزيد', 'Learn More') : t('تطبيق العادة', 'Apply Habit')}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-surface-highest/30 rounded-[3rem] p-10 md:p-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-primary" style={{ fontSize: getFontSize(40) }}>{t('يوم في حياة النبي', 'A Day in the Life of the Prophet')}</h3>
            <div className="w-20 h-1 bg-secondary mx-auto rounded-full"></div>
          </div>
          <div className={`relative ${language === 'ar' ? 'border-r-2 pr-10' : 'border-l-2 pl-10'} border-primary/10 space-y-16`}>
            <TimelineItem 
              time={t('الفجر والصباح', 'Dawn & Morning')}
              title={t('العبادة والتوجيه', 'Worship & Guidance')}
              description={t('يبدأ يومه بصلاة الفجر، ثم يجلس في مصلاه يذكر الله حتى تطلع الشمس، يليه تفقد أحوال الصحابة وتوجيههم.', 'Starts his day with Fajr prayer, then sits in his prayer place remembering Allah until sunrise, followed by checking on the companions and guiding them.')}
              icon="wb_sunny"
              active
              language={language}
              fontSize={fontSize}
            />
            <TimelineItem 
              time={t('الظهيرة', 'Noon')}
              title={t('قضاء الحوائج', 'Fulfilling Needs')}
              description={t('وقت العمل والجهاد واستقبال الوفود، مع حرصه على "القيلولة" للاستعانة بها على قيام الليل.', 'Time for work, Jihad, and receiving delegations, with his keenness on the "Qailulah" (midday nap) to help with the night prayer.')}
              icon="groups"
              language={language}
              fontSize={fontSize}
            />
            <TimelineItem 
              time={t('المساء والليل', 'Evening & Night')}
              title={t('الأهل والقيام', 'Family & Night Prayer')}
              description={t('يجتمع بأهله ويؤنسهم، ثم ينام أول الليل ويقوم في آخره ليناجي ربه حتى تتفطر قدماه شكرًا.', 'Gathers with his family and comforts them, then sleeps at the beginning of the night and stands at the end of it to converse with his Lord until his feet swell in gratitude.')}
              icon="nightlight_round"
              language={language}
              fontSize={fontSize}
            />
          </div>
        </div>
      </section>

      {/* Quotes Section */}
      <section className="space-y-8">
        <h3 className="text-primary text-center" style={{ fontSize: getFontSize(30) }}>{t('أخلاق النبوة', 'Prophetic Character')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <QuoteCard 
            quote={t('ما خُيِّر رسول الله ﷺ بين أمرين إلا أخذ أيسرهما، ما لم يكن إثمًا.', 'Whenever the Messenger of Allah (PBUH) was given a choice between two matters, he would choose the easier of the two, as long as it was not a sin.')}
            author={t('خلق السماحة', 'Tolerance')}
            source={t('رواه البخاري', 'Narrated by Bukhari')}
            icon="favorite"
            color="secondary"
            language={language}
            fontSize={fontSize}
          />
          <QuoteCard 
            quote={t('إنما بعثت لأتمم مكارم الأخلاق.', 'I was sent only to perfect noble character.')}
            author={t('الغاية السامية', 'The Noble Purpose')}
            source={t('رواه أحمد', 'Narrated by Ahmad')}
            icon="stars"
            color="primary"
            language={language}
            fontSize={fontSize}
          />
        </div>
      </section>

      {/* Countries Section */}
      <section className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-primary font-bold" style={{ fontSize: getFontSize(30) }}>{t('الدول الإسلامية والعالمية', 'Islamic & Global Countries')}</h3>
          <button 
            onClick={() => onNavigate('prayer-times')}
            className="text-secondary font-bold hover:underline flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">location_on</span>
            {t('تغيير الموقع', 'Change Location')}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {COUNTRIES.slice(0, 12).map((country) => (
            <motion.div
              key={country.en}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-surface-low p-6 rounded-3xl border border-primary/5 flex flex-col items-center text-center gap-3 cursor-pointer hover:bg-surface-high hover:shadow-xl transition-all duration-300 group"
              onClick={() => onNavigate('prayer-times')}
            >
              <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <span className="material-symbols-outlined text-3xl">flag</span>
              </div>
              <span className="font-bold text-primary" style={{ fontSize: getFontSize(16) }}>{t(country.name, country.en)}</span>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <button 
            onClick={() => onNavigate('prayer-times')}
            className="px-8 py-3 bg-primary/5 text-primary rounded-full font-bold hover:bg-primary hover:text-white transition-all duration-300"
          >
            {t('عرض جميع الدول', 'View All Countries')}
          </button>
        </div>
      </section>
    </motion.div>
  );
};

const QuickLink: React.FC<{ onClick: () => void, icon: string, label: string, color: string }> = ({ onClick, icon, label, color }) => (
  <button 
    onClick={onClick}
    className={`${color} p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-white shadow-lg hover:scale-105 transition-all duration-300`}
  >
    <span className="material-symbols-outlined text-3xl">{icon}</span>
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const TimelineItem: React.FC<{ time: string, title: string, description: string, icon: string, active?: boolean, language: string, fontSize: number }> = ({ time, title, description, icon, active, language, fontSize }) => {
  const getFontSize = (base: number) => `${(fontSize / 18) * base}px`;
  return (
    <div className="relative">
      <div className={`absolute ${language === 'ar' ? '-right-[51px]' : '-left-[51px]'} top-0 w-10 h-10 ${active ? 'bg-primary text-white' : 'bg-surface-highest text-primary'} rounded-full flex items-center justify-center shadow-lg`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div className="space-y-3">
        <span className="text-secondary font-bold text-sm">{time}</span>
        <h4 className="text-primary" style={{ fontSize: getFontSize(24) }}>{title}</h4>
        <p className="text-on-surface-variant leading-relaxed" style={{ fontSize: getFontSize(16) }}>{description}</p>
      </div>
    </div>
  );
};

const QuoteCard: React.FC<{ quote: string, author: string, source: string, icon: string, color: string, language: string, fontSize: number }> = ({ quote, author, source, icon, color, language, fontSize }) => {
  const getFontSize = (base: number) => `${(fontSize / 18) * base}px`;
  return (
    <div className={`relative p-1 bg-gradient-to-br ${color === 'secondary' ? 'from-secondary/20' : 'from-primary/10'} to-transparent rounded-[2rem]`}>
      <div className="bg-surface p-10 rounded-[1.9rem] h-full flex flex-col justify-between space-y-8 border border-surface-highest">
        <span className={`material-symbols-outlined text-6xl ${color === 'secondary' ? 'text-secondary/30' : 'text-primary/10'}`}>format_quote</span>
        <p className="leading-relaxed text-primary" style={{ fontSize: getFontSize(24) }}>{quote}</p>
        <div className={`flex items-center gap-4 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className={`w-12 h-12 rounded-full ${color === 'secondary' ? 'bg-primary-container text-white' : 'bg-secondary-container text-primary'} flex items-center justify-center`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div className={language === 'ar' ? 'text-right' : 'text-left'}>
            <p className="font-bold text-primary" style={{ fontSize: getFontSize(18) }}>{author}</p>
            <p className="text-sm text-on-surface-variant">{source}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
