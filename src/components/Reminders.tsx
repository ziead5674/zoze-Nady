import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Reminder } from '../types';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export const Reminders: React.FC<{ language: 'ar' | 'en', user: User | null }> = ({ language, user }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>(
    'Notification' in window ? Notification.permission : 'default'
  );
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    time: '05:00',
    days: language === 'ar' ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    enabled: true,
    type: 'athkar'
  });

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    if (user) {
      const remindersRef = collection(db, 'users', user.uid, 'reminders');
      const unsubscribe = onSnapshot(remindersRef, (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as Reminder);
        setReminders(items);
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/reminders` ));
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('reminders');
      if (saved) setReminders(JSON.parse(saved));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('reminders', JSON.stringify(reminders));
    }
  }, [reminders, user]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error(t('متصفحك لا يدعم التنبيهات', 'Your browser does not support notifications'));
      return;
    }
    try {
      const status = await Notification.requestPermission();
      setPermissionStatus(status);
      if (status === 'granted') {
        toast.success(t('تم تفعيل التنبيهات بنجاح', 'Notifications enabled successfully'));
      } else {
        toast.error(t('يرجى تفعيل التنبيهات من إعدادات المتصفح', 'Please enable notifications in your browser settings'));
      }
    } catch (e) {
      toast.error(t('حدث خطأ أثناء طلب صلاحية التنبيهات', 'Error requesting notification permission'));
    }
  };

  const testNotification = (title: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(t('أدبُ النبوة', 'Adab Al-Nubuwwah'), {
          body: title,
          icon: '/favicon.ico'
        });
        toast.info(t('تم إرسال تنبيه تجريبي', 'Test notification sent'));
      } catch (e) {
        toast.success(t(`تنبيه: ${title}`, `Reminder: ${title}`));
      }
    } else {
      toast.success(t(`تنبيه: ${title}`, `Reminder: ${title}`));
      if ('Notification' in window) {
        requestPermission();
      }
    }
  };

  const handleAdd = async () => {
    if (!newReminder.title) {
      toast.error(t('يرجى إدخال عنوان للتنبيه', 'Please enter a title for the reminder'));
      return;
    }
    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title!,
      time: newReminder.time!,
      days: newReminder.days!,
      enabled: true,
      type: newReminder.type as any
    };

    if (user) {
      const reminderDocRef = doc(db, 'users', user.uid, 'reminders', reminder.id);
      await setDoc(reminderDocRef, reminder).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/reminders/${reminder.id}`));
    } else {
      setReminders([...reminders, reminder]);
    }

    setIsAdding(false);
    setNewReminder({ title: '', time: '05:00', days: newReminder.days, enabled: true, type: 'athkar' });
    toast.success(t('تمت إضافة التنبيه بنجاح', 'Reminder added successfully'));
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const toggleReminder = async (id: string) => {
    if (user) {
      const reminderDocRef = doc(db, 'users', user.uid, 'reminders', id);
      const reminder = reminders.find(r => r.id === id);
      if (reminder) {
        await updateDoc(reminderDocRef, { enabled: !reminder.enabled }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/reminders/${id}`));
      }
    } else {
      setReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    }
  };

  const deleteReminder = async (id: string) => {
    if (user) {
      const reminderDocRef = doc(db, 'users', user.uid, 'reminders', id);
      await deleteDoc(reminderDocRef).catch(err => handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/reminders/${id}`));
    } else {
      setReminders(reminders.filter(r => r.id !== id));
    }
    toast.info(t('تم حذف التنبيه', 'Reminder deleted'));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <section className={`flex justify-between items-end ${language === 'en' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'en' ? 'text-left' : 'text-right'}>
          <h2 className="text-4xl text-primary mb-2">{t('تنبيهات العبادة', 'Worship Reminders')}</h2>
          <p className="text-on-surface-variant mb-4">{t('نظم يومك بذكر الله ولا تنسَ وردك.', 'Organize your day with the remembrance of Allah and don\'t forget your daily portion.')}</p>
          {permissionStatus !== 'granted' && (
            <button 
              onClick={requestPermission}
              className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-sm">warning</span>
              {t('تفعيل التنبيهات', 'Enable Notifications')}
            </button>
          )}
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-secondary text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </section>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-surface-low rounded-3xl p-8 editorial-shadow space-y-6 overflow-hidden"
          >
            <h3 className="text-2xl text-primary">{t('إضافة تنبيه جديد', 'Add New Reminder')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-primary mb-2">{t('عنوان التنبيه', 'Reminder Title')}</label>
                <input 
                  type="text" 
                  value={newReminder.title}
                  onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder={t('مثلاً: أذكار الصباح', 'e.g., Morning Athkar')}
                  className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">{t('الوقت', 'Time')}</label>
                  <input 
                    type="time" 
                    value={newReminder.time}
                    onChange={e => setNewReminder({ ...newReminder, time: e.target.value })}
                    className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">{t('النوع', 'Type')}</label>
                  <select 
                    value={newReminder.type}
                    onChange={e => setNewReminder({ ...newReminder, type: e.target.value as any })}
                    className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary/20 outline-none"
                  >
                    <option value="athkar">{t('أذكار', 'Athkar')}</option>
                    <option value="sunnah">{t('سنة', 'Sunnah')}</option>
                    <option value="prayer">{t('صلاة', 'Prayer')}</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleAdd}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold"
                >
                  {t('حفظ التنبيه', 'Save Reminder')}
                </button>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-surface-highest text-primary py-3 rounded-xl font-bold"
                >
                  {t('إلغاء', 'Cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {reminders.length === 0 ? (
          <div className="text-center py-20 bg-surface-low rounded-[3rem] border-2 border-dashed border-primary/10">
            <span className="material-symbols-outlined text-6xl text-primary/20 mb-4">notifications_off</span>
            <p className="text-on-surface-variant">{t('لا توجد تنبيهات نشطة حالياً.', 'No active reminders currently.')}</p>
          </div>
        ) : (
          reminders.map(reminder => (
            <div key={reminder.id} className={`bg-surface-low rounded-3xl p-6 flex items-center justify-between editorial-shadow ${language === 'en' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-6 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${reminder.enabled ? 'bg-secondary text-white' : 'bg-surface-highest text-on-surface-variant opacity-50'}`}>
                  <span className="material-symbols-outlined text-3xl">
                    {reminder.type === 'athkar' ? 'menu_book' : reminder.type === 'sunnah' ? 'auto_awesome' : 'schedule'}
                  </span>
                </div>
                <div className={language === 'en' ? 'text-left' : 'text-right'}>
                  <h4 className={`text-xl font-bold ${reminder.enabled ? 'text-primary' : 'text-on-surface-variant opacity-50'}`}>{reminder.title}</h4>
                  <p className="text-secondary font-bold text-lg">{reminder.time}</p>
                </div>
              </div>
              <div className={`flex items-center gap-4 ${language === 'en' ? 'flex-row-reverse' : ''}`}>
                <button 
                  onClick={() => testNotification(reminder.title)}
                  className="w-10 h-10 rounded-full bg-surface-highest text-primary flex items-center justify-center hover:bg-secondary hover:text-white transition-all"
                  title={t('تجربة التنبيه', 'Test Notification')}
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
                <button 
                  onClick={() => toggleReminder(reminder.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${reminder.enabled ? 'bg-secondary' : 'bg-surface-highest'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${reminder.enabled ? (language === 'ar' ? 'left-1' : 'right-1') : (language === 'ar' ? 'left-7' : 'right-7')}`}></div>
                </button>
                <button 
                  onClick={() => deleteReminder(reminder.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-xl"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
