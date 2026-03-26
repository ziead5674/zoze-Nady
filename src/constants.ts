import { Sunnah, Thikr, PrayerTime, Dua } from './types';

export const SUNNAHS: Sunnah[] = [
  {
    id: '1',
    title: 'النوم على طهارة',
    description: 'من بات طاهراً بات في شعاره ملك، لا يستيقظ ساعة من الليل إلا قال الملك: اللهم اغفر لعبدك.',
    category: 'قبل النوم',
    icon: 'bedtime',
    target: 'all'
  },
  {
    id: '2',
    title: 'التنفس في الإناء',
    description: 'السنة التنفس خارج الإناء ثلاثاً، وهي أهنأ وأمرأ وأبرأ للبدن كما وصفها المصطفى.',
    category: 'آداب الطعام',
    icon: 'water_drop',
    target: 'all'
  },
  {
    id: '3',
    title: 'السواك عند دخول البيت',
    description: 'كان النبي صلى الله عليه وسلم إذا دخل بيته بدأ بالسواك، تطهيراً للفم ومرضاة للرب.',
    category: 'عند الدخول',
    icon: 'brush',
    target: 'all'
  },
  {
    id: '4',
    title: 'البدء باليمين',
    description: 'التيمن في التنعل والترجل والطهور وفي شأنه كله.',
    category: 'سنة فعلية',
    icon: 'clean_hands',
    target: 'all'
  },
  {
    id: '5',
    title: 'صلاة الضحى',
    description: 'صلاة الأوابين، تجزئ عن كل سلامى من جسدك صدقة.',
    category: 'الضحى',
    icon: 'wb_sunny',
    target: 'all'
  },
  {
    id: '6',
    title: 'نفض الفراش',
    description: 'إذا أوى أحدكم إلى فراشه فلينفض فراشه بداخلة إزاره، فإنه لا يدري ما خلفه عليه.',
    category: 'قبل النوم',
    icon: 'cleaning_services',
    target: 'all'
  },
  {
    id: '7',
    title: 'المصافحة عند اللقاء',
    description: 'ما من مسلمين يلتقيان فيتصافحان إلا غفر لهما قبل أن يفترقا.',
    category: 'الآداب الاجتماعية',
    icon: 'handshake',
    target: 'all'
  },
  {
    id: '8',
    title: 'إماطة الأذى عن الطريق',
    description: 'وتميط الأذى عن الطريق صدقة.',
    category: 'عامة',
    icon: 'delete',
    target: 'all'
  },
  {
    id: '9',
    title: 'السلام قبل الكلام',
    description: 'السنة أن يبدأ المسلم بالسلام قبل البدء بأي حديث.',
    category: 'الآداب الاجتماعية',
    icon: 'chat',
    target: 'all'
  },
  {
    id: '10',
    title: 'عيادة المريض',
    description: 'من عاد مريضاً لم يزل في خرفة الجنة حتى يرجع.',
    category: 'الآداب الاجتماعية',
    icon: 'medical_services',
    target: 'all'
  },
  {
    id: '11',
    title: 'التبسم في وجه الأخ',
    description: 'تبسمك في وجه أخيك لك صدقة.',
    category: 'الآداب الاجتماعية',
    icon: 'sentiment_satisfied',
    target: 'all'
  },
  {
    id: '12',
    title: 'سنة الوضوء',
    description: 'صلاة ركعتين بعد الوضوء بنية سنة الوضوء.',
    category: 'العبادات',
    icon: 'opacity',
    target: 'all'
  },
  {
    id: '13',
    title: 'تطييب المسجد',
    description: 'أمر رسول الله صلى الله عليه وسلم ببناء المساجد في الدور وأن تنظف وتطيب.',
    category: 'المسجد',
    icon: 'auto_awesome',
    target: 'male'
  },
  {
    id: '14',
    title: 'لبس الثياب الجميلة للجمعة',
    description: 'من اغتسل يوم الجمعة ومس من طيب إن كان عنده ولبس من أحسن ثيابه.',
    category: 'الجمعة',
    icon: 'checkroom',
    target: 'male'
  },
  {
    id: '15',
    title: 'الحجاب والستر',
    description: 'المرأة عورة، فإذا خرجت استشرفها الشيطان، وأقرب ما تكون من ربها وهي في قعر بيتها.',
    category: 'المرأة المسلمة',
    icon: 'woman',
    target: 'female'
  },
  {
    id: '16',
    title: 'بر الوالدين للأطفال',
    description: 'يا غلام، احفظ الله يحفظك، احفظ الله تجده تجاهك.',
    category: 'الناشئة',
    icon: 'child_care',
    target: 'child'
  },
  {
    id: '17',
    title: 'الأذكار بعد الصلاة للأطفال',
    description: 'تعليم الأطفال الأذكار البسيطة بعد الصلاة لتعويدهم على ذكر الله.',
    category: 'الناشئة',
    icon: 'stars',
    target: 'child'
  }
];

export const ATHKAR: Thikr[] = [
  // Morning
  { id: 'm1', text: 'أصبحنا وأصبح الملك لله والحمد لله لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير', repeat: 1, count: 0, category: 'morning' },
  { id: 'm2', text: 'اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور', repeat: 1, count: 0, category: 'morning' },
  { id: 'm3', text: 'اللهم أنت ربي لا إله إلا أنت خلقتني وأنا عبدك وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت', repeat: 1, count: 0, category: 'morning' },
  { id: 'm4', text: 'سبحان الله وبحمده', repeat: 100, count: 0, category: 'morning' },
  { id: 'm5', text: 'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم', repeat: 3, count: 0, category: 'morning' },
  { id: 'm6', text: 'رضيت بالله رباً وبالإسلام ديناً وبمحمد صلى الله عليه وسلم نبياً', repeat: 3, count: 0, category: 'morning' },
  { id: 'm7', text: 'يا حي يا قيوم برحمتك أستغيث أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين', repeat: 1, count: 0, category: 'morning' },
  { id: 'm8', text: 'أصبحنا على فطرة الإسلام وعلى كلمة الإخلاص وعلى دين نبينا محمد صلى الله عليه وسلم وعلى ملة أبينا إبراهيم حنيفاً مسلماً وما كان من المشركين', repeat: 1, count: 0, category: 'morning' },
  { id: 'm9', text: 'اللهم إني أسألك علماً نافعاً ورزقاً طيباً وعملاً متقبلاً', repeat: 1, count: 0, category: 'morning' },
  { id: 'm10', text: 'اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت', repeat: 3, count: 0, category: 'morning' },
  { id: 'm11', text: 'اللهم إني أعوذ بك من الكفر والفقر، وأعوذ بك من عذاب القبر، لا إله إلا أنت', repeat: 3, count: 0, category: 'morning' },
  { id: 'm12', text: 'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم', repeat: 7, count: 0, category: 'morning' },
  { id: 'm13', text: 'اللهم إني أسألك العفو والعافية في الدنيا والآخرة، اللهم إني أسألك العفو والعافية في ديني ودنياي وأهلي ومالي', repeat: 1, count: 0, category: 'morning' },
  { id: 'm14', text: 'سبحان الله وبحمده عدد خلقه ورضا نفسه وزنة عرشه ومداد كلماته', repeat: 3, count: 0, category: 'morning' },
  
  // Evening
  { id: 'e1', text: 'أمسينا وأمسى الملك لله والحمد لله لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير', repeat: 1, count: 0, category: 'evening' },
  { id: 'e2', text: 'اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير', repeat: 1, count: 0, category: 'evening' },
  { id: 'e3', text: 'أعوذ بكلمات الله التامات من شر ما خلق', repeat: 3, count: 0, category: 'evening' },
  { id: 'e4', text: 'اللهم إني أسألك العفو والعافية في الدنيا والآخرة، اللهم استر عوراتي وآمن روعاتي', repeat: 1, count: 0, category: 'evening' },
  { id: 'e5', text: 'اللهم عالم الغيب والشهادة فاطر السماوات والأرض رب كل شيء ومليكه، أشهد أن لا إله إلا أنت، أعوذ بك من شر نفسي ومن شر الشيطان وشركه', repeat: 1, count: 0, category: 'evening' },
  { id: 'e6', text: 'يا حي يا قيوم برحمتك أستغيث أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين', repeat: 1, count: 0, category: 'evening' },
  { id: 'e7', text: 'أمسينا على فطرة الإسلام وعلى كلمة الإخلاص وعلى دين نبينا محمد صلى الله عليه وسلم وعلى ملة أبينا إبراهيم حنيفاً مسلماً وما كان من المشركين', repeat: 1, count: 0, category: 'evening' },
  { id: 'e8', text: 'اللهم ما أمسى بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر', repeat: 1, count: 0, category: 'evening' },
  { id: 'e9', text: 'اللهم إني أمسيت أشهدك وأشهد حملة عرشك وملائكتك وجميع خلقك أنك أنت الله لا إله إلا أنت وحدك لا شريك لك وأن محمداً عبدك ورسولك', repeat: 4, count: 0, category: 'evening' },
  
  // Sleep
  { id: 's1', text: 'باسمك ربي وضعت جنبي وبك أرفعه، إن أمسكت نفسي فارحمها وإن أرسلتها فاحفظها بما تحفظ به عبادك الصالحين', repeat: 1, count: 0, category: 'sleep' },
  { id: 's2', text: 'اللهم قني عذابك يوم تبعث عبادك', repeat: 3, count: 0, category: 'sleep' },
  { id: 's3', text: 'باسمك اللهم أموت وأحيا', repeat: 1, count: 0, category: 'sleep' },
  { id: 's4', text: 'سورة الإخلاص والمعوذتين (الإخلاص، الفلق، الناس)', repeat: 3, count: 0, category: 'sleep' },
  { id: 's5', text: 'آية الكرسي (الله لا إله إلا هو الحي القيوم...)', repeat: 1, count: 0, category: 'sleep' },
  { id: 's6', text: 'اللهم أسلمت نفسي إليك، وفوضت أمري إليك، ووجهت وجهي إليك، وألجأت ظهري إليك، رغبة ورهبة إليك، لا ملجأ ولا منجا منك إلا إليك، آمنت بكتابك الذي أنزلت، وبنبيك الذي أرسلت', repeat: 1, count: 0, category: 'sleep' },
];

export const DUAS: Dua[] = [
  { id: 'd1', title: 'دعاء الاستخارة', text: 'اللهم إني أستخيرك بعلمك وأستقدرك بقدرتك وأسألك من فضلك العظيم، فإنك تقدر ولا أقدر وتعلم ولا أعلم وأنت علام الغيوب، اللهم إن كنت تعلم أن هذا الأمر خير لي في ديني ومعاشي وعاقبة أمري فاقدره لي ويسره لي ثم بارك لي فيه، وإن كنت تعلم أن هذا الأمر شر لي في ديني ومعاشي وعاقبة أمري فاصرفه عني واصرفني عنه واقدر لي الخير حيث كان ثم أرضني به', category: 'عامة' },
  { id: 'd2', title: 'دعاء الكرب', text: 'لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم، لا إله إلا الله رب السماوات ورب الأرض ورب العرش الكريم', category: 'عند الهم' },
  { id: 'd3', title: 'دعاء دخول المسجد', text: 'اللهم افتح لي أبواب رحمتك', category: 'المسجد' },
  { id: 'd4', title: 'دعاء الخروج من المسجد', text: 'اللهم إني أسألك من فضلك', category: 'المسجد' },
  { id: 'd5', title: 'دعاء السفر', text: 'الله أكبر، الله أكبر، الله أكبر، سبحان الذي سخر لنا هذا وما كنا له مقرنين وإنا إلى ربنا لمنقلبون، اللهم إنا نسألك في سفرنا هذا البر والتقوى ومن العمل ما ترضى، اللهم هون علينا سفرنا هذا واطو عنا بعده، اللهم أنت الصاحب في السفر والخليفة في الأهل، اللهم إني أعوذ بك من وعثاء السفر وكآبة المنظر وسوء المنقلب في المال والأهل', category: 'السفر' },
  { id: 'd6', title: 'دعاء الوالدين', text: 'رب اغفر لي ولوالدي رب ارحمهما كما ربياني صغيرا', category: 'العائلة' },
  { id: 'd7', title: 'دعاء تيسير الأمور', text: 'اللهم لا سهل إلا ما جعلته سهلاً وأنت تجعل الحزن إذا شئت سهلاً', category: 'عامة' },
  { id: 'd8', title: 'دعاء طلب الرزق', text: 'اللهم اكفني بحلالك عن حرامك وأغنني بفضلك عمن سواك', category: 'عامة' },
];

export const PRAYER_TIMES: PrayerTime[] = [
  { name: 'الفجر', time: '04:38 ص', icon: 'wb_twilight', description: 'قبل الشروق' },
  { name: 'الشروق', time: '06:02 ص', icon: 'light_mode', description: 'وقت النهوض' },
  { name: 'الظهر', time: '12:05 م', icon: 'sunny', description: 'منتصف النهار' },
  { name: 'العصر', time: '03:34 م', icon: 'wb_sunny', description: 'قبل الغروب' },
  { name: 'المغرب', time: '06:08 م', icon: 'clear_night', description: 'موعد الإفطار' },
  { name: 'العشاء', time: '07:26 م', icon: 'bedtime', description: 'وقت السكينة' },
];

export const COUNTRIES = [
  { name: 'مصر', en: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'السعودية', en: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  { name: 'فلسطين', en: 'Palestine', lat: 31.9522, lng: 35.2332 },
  { name: 'الأردن', en: 'Jordan', lat: 31.9454, lng: 35.9284 },
  { name: 'الكويت', en: 'Kuwait', lat: 29.3759, lng: 47.9774 },
  { name: 'الإمارات', en: 'UAE', lat: 24.4539, lng: 54.3773 },
  { name: 'قطر', en: 'Qatar', lat: 25.2769, lng: 51.5200 },
  { name: 'البحرين', en: 'Bahrain', lat: 26.2285, lng: 50.5860 },
  { name: 'عمان', en: 'Oman', lat: 23.5859, lng: 58.4059 },
  { name: 'اليمن', en: 'Yemen', lat: 15.3694, lng: 44.1910 },
  { name: 'العراق', en: 'Iraq', lat: 33.3152, lng: 44.3661 },
  { name: 'سوريا', en: 'Syria', lat: 33.5138, lng: 36.2765 },
  { name: 'لبنان', en: 'Lebanon', lat: 33.8938, lng: 35.5018 },
  { name: 'المغرب', en: 'Morocco', lat: 34.0209, lng: -6.8416 },
  { name: 'الجزائر', en: 'Algeria', lat: 36.7538, lng: 3.0588 },
  { name: 'تونس', en: 'Tunisia', lat: 36.8065, lng: 10.1815 },
  { name: 'ليبيا', en: 'Libya', lat: 32.8872, lng: 13.1913 },
  { name: 'السودان', en: 'Sudan', lat: 15.5007, lng: 32.5599 },
  { name: 'موريتانيا', en: 'Mauritania', lat: 18.0735, lng: -15.9582 },
  { name: 'الصومال', en: 'Somalia', lat: 2.0469, lng: 45.3182 },
  { name: 'جيبوتي', en: 'Djibouti', lat: 11.5883, lng: 43.1450 },
  { name: 'جزر القمر', en: 'Comoros', lat: -11.6455, lng: 43.3333 },
  { name: 'تركيا', en: 'Turkey', lat: 39.9334, lng: 32.8597 },
  { name: 'إندونيسيا', en: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { name: 'ماليزيا', en: 'Malaysia', lat: 3.1390, lng: 101.6869 },
  { name: 'باكستان', en: 'Pakistan', lat: 33.6844, lng: 73.0479 },
  { name: 'أفغانستان', en: 'Afghanistan', lat: 34.5553, lng: 69.1775 },
  { name: 'إيران', en: 'Iran', lat: 35.6892, lng: 51.3890 },
  { name: 'نيجيريا', en: 'Nigeria', lat: 9.0765, lng: 7.3986 },
  { name: 'الولايات المتحدة', en: 'USA', lat: 38.9072, lng: -77.0369 },
  { name: 'المملكة المتحدة', en: 'UK', lat: 51.5074, lng: -0.1278 },
  { name: 'فرنسا', en: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'ألمانيا', en: 'Germany', lat: 52.5200, lng: 13.4050 },
  { name: 'إيطاليا', en: 'Italy', lat: 41.9028, lng: 12.4964 },
  { name: 'إسبانيا', en: 'Spain', lat: 40.4168, lng: -3.7038 },
  { name: 'كندا', en: 'Canada', lat: 45.4215, lng: -75.6972 },
  { name: 'أستراليا', en: 'Australia', lat: -35.2809, lng: 149.1300 },
  { name: 'اليابان', en: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'الصين', en: 'China', lat: 39.9042, lng: 116.4074 },
  { name: 'الهند', en: 'India', lat: 28.6139, lng: 77.2090 },
  { name: 'روسيا', en: 'Russia', lat: 55.7558, lng: 37.6173 },
  { name: 'البرازيل', en: 'Brazil', lat: -15.7975, lng: -47.8919 },
];

export const RECITERS = [
  { id: 'ar.alafasy', name: 'مشاري العفاسي', en: 'Mishary Alafasy' },
  { id: 'ar.minshawi', name: 'المنشاوي (مرتل)', en: 'Al-Minshawi (Murattal)' },
  { id: 'ar.minshawimujawwad', name: 'المنشاوي (مجود)', en: 'Al-Minshawi (Mujawwad)' },
  { id: 'ar.husary', name: 'الحصري', en: 'Al-Husary' },
  { id: 'ar.husarymujawwad', name: 'الحصري (مجود)', en: 'Al-Husary (Mujawwad)' },
  { id: 'ar.abdulsamad', name: 'عبد الباسط عبد الصمد', en: 'AbdulBaset AbdulSamad' },
  { id: 'ar.shuraym', name: 'سعود الشريم', en: 'Saud Al-Shuraim' },
  { id: 'ar.sudais', name: 'عبد الرحمن السديس', en: 'Abdur-Rahman as-Sudais' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', en: 'Maher Al Muaiqly' },
  { id: 'ar.ahmedajamy', name: 'أحمد بن علي العجمي', en: 'Ahmed ibn Ali al-Ajamy' },
  { id: 'ar.yasseraldossari', name: 'ياسر الدوسري', en: 'Yasser Al-Dosari' },
  { id: 'ar.qatami', name: 'ناصر القطامي', en: 'Nasser Al-Qatami' },
];
