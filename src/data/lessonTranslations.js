/**
 * Multilingual lesson content (lesson_translations table mirror).
 * Each entry: { lessonId, locale, title, summary, ruralExample, detailedNotes[], formulas, keyPoints[] }
 * Supports: en (English), hi (Hindi), or (Odia), te (Telugu)
 * Falls back to English when a locale is missing.
 */
export const LESSON_TRANSLATIONS = {
  // Math: Linear Equations (m1, m2, m3)
  m1: {
    en: {
      title: 'Introduction to Linear Equations',
      summary: "Learn how variables like 'x' represent unknown quantities in real life, such as counting seeds or measuring farm plots.",
      ruralExample: "Imagine weighing 5 kg of wheat on a double-pan balance. If you add 2 kg of rice to the left pan, you must add 2 kg to the right pan to keep it level. That is the core rule of linear equations: equality is maintained when identical operations are applied to both sides.",
      detailedNotes: [
        "1. What is a Variable? A letter (like x, y, z) that stands for an unknown numerical value.",
        "2. Linear Equation in One Variable: An equation of the form ax + b = c, where the highest power of x is 1.",
        "3. Transposition Rules: Moving + across '=' becomes -, moving - across '=' becomes +, multiplication becomes division, and division becomes multiplication."
      ],
      formulas: "ax + b = c  ⇒  x = (c - b) / a",
      keyPoints: [
        "An equation is like a balanced weighing scale.",
        "Whatever operation you do on the left side, you must do on the right side.",
        "Transposing a term across '=' changes its sign (+ becomes -, * becomes /)."
      ]
    },
    hi: {
      title: 'रैखिक समीकरणों का परिचय',
      summary: 'सीखें कि "x" जैसे चर कैसे अज्ञात राशियों को दर्शाते हैं — जैसे बीज गिनना या खेत का माप लेना।',
      ruralExample: 'मान लीजिए आप दो पलड़ों वाले तराज़ू पर 5 किग्रा गेहूँ तौल रहे हैं। यदि आप बाएँ पलड़े में 2 किग्रा अनाज डालते हैं, तो तराज़ू को संतुलित रखने के लिए दाएँ पलड़े में भी 2 किग्रा डालना पड़ेगा। यही रैखिक समीकरण का मूल नियम है!',
      detailedNotes: [
        '1. चर (Variable) क्या है? एक प्रतीक (जैसे x, y, z) जो किसी अज्ञात संख्यात्मक मान को दर्शाता है।',
        '2. एक चर वाला रैखिक समीकरण: ax + b = c के रूप का समीकरण, जहाँ चर x की अधिकतम घात 1 होती है।',
        '3. पक्षान्तरण (Transposition) के नियम: + वाले पद को "=" के पार ले जाने पर वह - बनता है, - वाला पद + बनता है, गुणा ÷ में तथा भाग × में बदलता है।'
      ],
      formulas: 'ax + b = c  ⇒  x = (c - b) / a',
      keyPoints: [
        'समीकरण एक संतुलित तराज़ू जैसा होता है।',
        'जो भी संक्रिया आप बायीं ओर करते हैं, दायीं ओर भी करनी होगी।',
        '"=" के पार ले जाने पर चिह्न बदल जाता है (+ बन जाता है -, × बन जाता है ÷)।'
      ]
    },
    or: {
      title: 'ରେଖୀୟ ସମୀକରଣର ପରିଚୟ',
      summary: 'ଅଜଣା ରାଶିକୁ "x" ଭଳି ଚଳରେ କିପରି ଲେଖାଯାଏ ଶିଖନ୍ତୁ — ଯଥା ବୀଜ ଗଣିବା ବା ଜମି ମାପିବା।',
      ruralExample: 'ଧରନ୍ତୁ ଆପଣ ୫ କିଗ୍ରା ଗହମ ତରାଜୁରେ ଓଜନ କରୁଛନ୍ତି। ବାମ ପାଖରେ ୨ କିଗ୍ରା ଯୋଗ କଲେ ସମାନ ରଖିବାକୁ ଡାହାଣ ପାଖରେ ବି ୨ କିଗ୍ରା ଯୋଗ କରିବାକୁ ହେବ।',
      detailedNotes: [
        '୧. ଚଳ (Variable): ଯେଉଁ ସଙ୍କେତ (x, y) ଏକ ଅଜଣା ସଂଖ୍ୟାକୁ ଦର୍ଶାଏ।',
        '୨. ରେଖୀୟ ସମୀକରଣ: ax + b = c ରୂପର ସମୀକରଣ ଯାହାର ସର୍ବାଧିକ ଘାତ ୧।',
        '୩. ପାର୍ଶ୍ୱ ପରିବର୍ତ୍ତନ ନିୟମ: = ର ବାମରୁ ଡାହାଣକୁ ଗଲେ + ଚିହ୍ନ - ହୁଏ ଏବଂ × ଚିହ୍ନ ÷ ହୁଏ।'
      ],
      formulas: 'ax + b = c  ⇒  x = (c - b) / a',
      keyPoints: [
        'ସମୀକରଣ ହେଉଛି ଏକ ସନ୍ତୁଳିତ ତରାଜୁ।',
        'ବାମକୁ ଯେଉଁ କାର୍ଯ୍ୟ କରୁ, ଦକ୍ଷିଣକୁ ମଧ୍ୟ କରିବାକୁ ହେବ।',
        '"=" ପାର୍ଶ୍ୱକୁ ଯିବା ବେଳେ ଚିହ୍ନ ବଦଳିଯାଏ (+ ହୁଏ -, × ହୁଏ ÷)।'
      ]
    },
    te: {
      title: 'రేఖీయ సమీకరణాల పరిచయం',
      summary: "'x' వంటి చరరాశులు నిజ జీవితంలో అజ్ఞాత పరిమాణాలను ఎలా సూచిస్తాయో నేర్చుకోండి.",
      ruralExample: 'రెండు త్రాసు పళ్ళెలపై 5 కిలోల గోధుమలను తూచేటప్పుడు, ఎడమ వైపు 2 కిలోలు కలిపితే సమానంగా ఉండటానికి కుడి వైపు కూడా 2 కిలోలు కలపాలి.',
      detailedNotes: [
        '1. చరరాశి (Variable): తెలియనటువంటి సంఖ్యను సూచించే అక్షరం (x, y, z).',
        '2. రేఖీయ సమీకరణం: అత్యధిక ఘాతం 1 కలిగిన సమీకరణం ax + b = c.',
        '3. పక్షాంతర సూత్రాలు: + ని "=" దాటిస్తే - అవుతుంది, × ని దాటిస్తే ÷ అవుతుంది.'
      ],
      formulas: 'ax + b = c  ⇒  x = (c - b) / a',
      keyPoints: [
        'సమీకరణం సమానంగా ఉండే త్రాసు లాంటిది.',
        'ఎడమ వైపు ఏ ప్రక్రియ చేస్తే, కుడి వైపు కూడా అదే చేయాలి.',
        "'=' దాటినప్పుడు గురుతు మారుతుంది (+ మైనస్ అవుతుంది, × భాగహారం అవుతుంది)."
      ]
    }
  },

  m2: {
    en: {
      title: 'Solving Equations with Variables on Both Sides',
      summary: 'Step-by-step methods to collect variables on one side and constants on the other.',
      ruralExample: 'If two farmers trade sacks of grain and weight markers on a balance, subtract equal numbers of sacks from both sides until only one variable sack remains on the left.',
      detailedNotes: [
        '1. Group Variable Terms: Move all x terms to the left side using inverse operations.',
        '2. Group Constants: Move all constant numbers to the right side.',
        '3. Isolate x: Divide both sides by the numerical coefficient of x.'
      ],
      formulas: '3x + 4 = x + 12  ⇒  2x = 8  ⇒  x = 4',
      keyPoints: [
        'Group all x terms together on one side.',
        'Simplify constants on the opposing side.',
        'Divide by the coefficient of x to find the final value.'
      ]
    },
    hi: {
      title: 'दोनों ओर चर वाले समीकरण',
      summary: 'चर को एक ओर और स्थिरांक को दूसरी ओर इकट्ठा करने की चरण-दर-चरण विधि।',
      ruralExample: 'यदि दो किसान अपने खेतों से अनाज के बोरे और बाट आपस में बदलते हैं, तो दोनों तरफ से बराबर संख्या में बोरे घटाकर अज्ञात संख्या x प्राप्त की जाती है।',
      detailedNotes: [
        '1. चर पदों को एकत्र करें: सभी x वाले पदों को बाएँ पक्ष में लाएँ।',
        '2. अचरों को एकत्र करें: सभी संख्याओं को दाएँ पक्ष में भेजें।',
        '3. x का मान निकालें: x के गुणांक से दोनों पक्षों को भाग दें।'
      ],
      formulas: '3x + 4 = x + 12  ⇒  2x = 8  ⇒  x = 4',
      keyPoints: [
        'सभी "x" पदों को एक साथ लाएँ।',
        'दूसरी ओर के स्थिरांक सरल बनाएँ।',
        'x के गुणांक से भाग देकर हल करें।'
      ]
    },
    or: {
      title: 'ଉଭୟ ପାର୍ଶ୍ୱରେ ଚଳ ଥିବା ସମୀକରଣ',
      summary: 'ଚଳକୁ ଗୋଟିଏ ପାଖକୁ ଓ ସ୍ଥିରାଙ୍କକୁ ଅନ୍ୟ ପାଖକୁ ଆଣିବାର ସୋପାନ ବିଧି।',
      ruralExample: 'ଦୁଇଜଣ କୃଷକ ନିଜର ଶସ୍ୟ ବସ୍ତା ବଦଳାଇବା ବେଳେ ଉଭୟ ପାଖରୁ ସମାନ ସଂଖ୍ୟକ ବସ୍ତା କାଢି ଅଜଣା ମୂଲ୍ୟ x ବାହାର କରନ୍ତି।',
      detailedNotes: [
        '୧. ଚଳ ପଦ ଏକାଠି କରନ୍ତୁ: ସମସ୍ତ x ପଦକୁ ବାମ ପାଖକୁ ଆଣନ୍ତୁ।',
        '୨. ସ୍ଥିରାଙ୍କ ଏକାଠି କରନ୍ତୁ: ସମସ୍ତ ସଂଖ୍ୟାକୁ ଡାହାଣ ପାଖକୁ ନିଅନ୍ତୁ।',
        '୩. ସରଳ କରନ୍ତୁ: x ର ଗୁଣାଙ୍କ ଦ୍ୱାରା ଭାଗ କରନ୍ତୁ।'
      ],
      formulas: '3x + 4 = x + 12  ⇒  2x = 8  ⇒  x = 4',
      keyPoints: [
        'ସମସ୍ତ "x" ପଦଗୁଡ଼ିକୁ ଏକାଠି ଆଣନ୍ତୁ।',
        'ଅନ୍ୟ ପାଖର ସ୍ଥିରାଙ୍କ ସରଳ କରନ୍ତୁ।',
        'x ର ଗୁଣାଙ୍କରେ ଭାଗ କରନ୍ତୁ।'
      ]
    },
    te: {
      title: 'రెండు వైపులా చరరాశులు ఉన్న సమీకరణాలు',
      summary: 'చరరాశులను ఒక వైపు, స్థిరరాశులను మరొక వైపు చేర్చే పద్ధతి.',
      ruralExample: 'ఇద్దరు రైతులు ధాన్యం బస్తాలను త్రాసుపై తూచేటప్పుడు, రెండు వైపులా సమాన బస్తాలను తీసివేసి x విలువను కనుగొంటారు.',
      detailedNotes: [
        '1. చరరాశులను ఎడమ వైపుకు చేర్చండి.',
        '2. సంఖ్యలను కుడి వైపుకు పంపండి.',
        '3. x యొక్క గుణకంతో భాగించి సమాధానం రాబట్టండి.'
      ],
      formulas: '3x + 4 = x + 12  ⇒  2x = 8  ⇒  x = 4',
      keyPoints: [
        'అన్ని x పదాలను ఒకే వైపున చేర్చండి.',
        'స్థిరరాశులను మరో వైపున సులభతరం చేయండి.',
        'x గుణకంతో భాగించి పరిష్కరించండి.'
      ]
    }
  },

  m3: {
    en: {
      title: 'Pythagoras Theorem in Everyday Life',
      summary: 'Understand right-angled triangles and calculate heights of trees or ladders using a² + b² = c².',
      ruralExample: 'If a wooden ladder of length 5m is leaned against a house wall 3m away from the base, the height reached on the wall is h = √(5² - 3²) = 4 meters!',
      detailedNotes: [
        '1. Right-Angled Triangle Condition: Applies exclusively when one angle is exactly 90 degrees.',
        '2. Hypotenuse Identification: The longest side directly facing the 90-degree angle.',
        '3. Theorem Formula: Hypotenuse² = Base² + Perpendicular².'
      ],
      formulas: 'c² = a² + b²  |  c = √(a² + b²)',
      keyPoints: [
        'Applicable strictly to right-angled triangles (90 degrees).',
        'Hypotenuse is the longest side opposite to 90 degrees.',
        'Formula: Hypotenuse² = Base² + Perpendicular².'
      ]
    },
    hi: {
      title: 'पाइथागोरस प्रमेय: रोज़मर्रा की ज़िंदगी में',
      summary: 'समकोण त्रिभुज समझें और पेड़ या सीढ़ी की ऊँचाई निकालें — a² + b² = c²।',
      ruralExample: 'यदि 5 मीटर लंबी सीढ़ी को दीवार से 3 मीटर दूर रखा जाए, तो दीवार पर सीढ़ी की ऊँचाई h = √(5² - 3²) = 4 मीटर होगी!',
      detailedNotes: [
        '1. समकोण त्रिभुज की शर्त: यह केवल 90° वाले त्रिभुज पर लागू होता है।',
        '2. कर्ण (Hypotenuse): 90° के सामने वाली सबसे लंबी भुजा।',
        '3. प्रमेय का सूत्र: कर्ण² = आधार² + लंब²।'
      ],
      formulas: 'c² = a² + b²  |  c = √(a² + b²)',
      keyPoints: [
        'यह केवल समकोण (90°) त्रिभुज पर लागू होता है।',
        'कर्ण 90° के सामने वाली सबसे लंबी भुजा है।',
        'सूत्र: कर्ण² = आधार² + लंब²।'
      ]
    },
    or: {
      title: 'ପାଇଥାଗୋରାସ୍ ପ୍ରମେୟ: ଦୈନନ୍ଦିନ ଜୀବନରେ',
      summary: 'ସମକୋଣ ତ୍ରିଭୁଜ ବୁଝନ୍ତୁ ଓ ଗଛ ବା ସିଡ଼ିର ଉଚ୍ଚତା ଗଣନା କରନ୍ତୁ — a² + b² = c²।',
      ruralExample: '୫ ମିଟର ଲମ୍ବର ସିଡ଼ି ଘର କାନ୍ଥଠାରୁ ୩ ମିଟର ଦୂରରେ ରଖିଲେ, କାନ୍ଥରେ ଉଚ୍ଚତା h = √(୫² - ୩²) = ୪ ମିଟର ହେବ!',
      detailedNotes: [
        '୧. ସମକୋଣ ତ୍ରିଭୁଜ: ଏହା କେବଳ ୯୦° କୋଣ ଥିବା ତ୍ରିଭୁଜରେ ଲାଗୁ।',
        '୨. କର୍ଣ୍ଣ: ୯୦° ସମ୍ମୁଖରେ ଥିବା ସବୁଠାରୁ ଲମ୍ବା ବାହୁ।',
        '୩. ସୂତ୍ର: କର୍ଣ୍ଣ² = ଭୂମି² + ଲମ୍ବ²।'
      ],
      formulas: 'c² = a² + b²  |  c = √(a² + b²)',
      keyPoints: [
        'ଏହା କେବଳ ସମକୋଣ (90°) ତ୍ରିଭୁଜରେ ଲାଗୁ।',
        'କର୍ଣ୍ଣ ହେଉଛି 90° ସମ୍ମୁଖର ସବୁଠାରୁ ଲମ୍ବା ବାହୁ।',
        'ସୂତ୍ର: କର୍ଣ୍ଣ² = ଭୂମି² + ଲମ୍ବ²।'
      ]
    },
    te: {
      title: 'పైథాగరస్ సిద్ధాంతం: రోజువారీ జీవితంలో',
      summary: 'లంబకోణ త్రిభుజం మరియు a² + b² = c² తో చెట్లు లేదా నిచ్చెనల ఎత్తును గణించండి.',
      ruralExample: '5 మీటర్ల నిచ్చెనను గోడ నుండి 3 మీటర్ల దూరంలో అమర్చితే, గోడపై నిచ్చెన ఎత్తు h = √(5² - 3²) = 4 మీటర్లు అవుతుంది!',
      detailedNotes: [
        '1. లంబకోణం (90°): ఇది లంబకోణ త్రిభుజాలకు మాత్రమే వర్తిస్తుంది.',
        '2. కర్ణం: 90° కోణానికి ఎదురుగా ఉండే అతి పొడవైన భుజం.',
        '3. సూత్రం: కర్ణం² = భూమి² + లంబం².'
      ],
      formulas: 'c² = a² + b²  |  c = √(a² + b²)',
      keyPoints: [
        'ఇది కేవలం లంబకోణ (90°) త్రిభుజాలకు వర్తిస్తుంది.',
        'కర్ణం అనేది 90° కి ఎదురుగా ఉండే అతి పొడవైన భుజం.',
        'సూత్రం: కర్ణం² = భూమి² + లంబం².'
      ]
    }
  },

  s1: {
    en: {
      title: 'Friction: Friend or Foe?',
      summary: 'Discover why bicycle tires need treads and how oil reduces friction in bullock cart wheels.',
      ruralExample: 'Grease applied to bullock cart axles reduces friction so cattle pull loads easily, whereas grooved tractor tires increase friction to prevent slipping in muddy rice fields.',
      detailedNotes: [
        '1. Friction Force: Force resisting the relative motion of solid surfaces sliding against each other.',
        '2. Types of Friction: Static friction (at rest), Sliding friction (moving), Rolling friction (wheels).',
        '3. Methods to Modify Friction: Lubricants (grease/oil) reduce friction; rough treads increase friction.'
      ],
      formulas: 'F_friction = μ × N  (μ = Coefficient of friction, N = Normal force)',
      keyPoints: [
        'Friction opposes motion between two surfaces in contact.',
        'Rough surfaces produce higher friction; smooth surfaces produce lower friction.',
        'Lubricants reduce friction.'
      ]
    },
    hi: {
      title: 'घर्षण: मित्र या शत्रु?',
      summary: 'जानें साइकिल के टायरों में क्यों उभार होते हैं और बैलगाड़ी के पहियों में तेल कैसे घर्षण कम करता है।',
      ruralExample: 'जब बैलगाड़ी के धुरे में ग्रीस लगाई जाती है तो घर्षण कम होता है और बैल आसानी से गाड़ी खींच पाते हैं। वहीं ट्रैक्टर के टायरों में खाँचे घर्षण बढ़ाकर कीचड़ में फिसलने से बचाते हैं!',
      detailedNotes: [
        '1. घर्षण बल: दो संपर्क में रखी वस्तुओं की आपेक्षिक गति का विरोध करने वाला बल।',
        '2. घर्षण के प्रकार: स्थैतिक घर्षण (विराम अवस्था), सर्पी घर्षण (फिसलना), बेलन घर्षण (पहिए)।',
        '3. घर्षण नियंत्रण: ग्रीस और तेल घर्षण घटाते हैं; टायरों के खाँचे घर्षण बढ़ाते हैं।'
      ],
      formulas: 'F = μ × N  (μ = घर्षण गुणांक, N = लंबवत बल)',
      keyPoints: [
        'घर्षण दो सतहों के बीच गति का विरोध करता है।',
        'खुरदरी सतह अधिक घर्षण; चिकनी सतह कम घर्षण देती है।',
        'स्नेहक (lubricants) घर्षण कम करते हैं।'
      ]
    },
    or: {
      title: 'ଘର୍ଷଣ: ବନ୍ଧୁ ନା ଶତ୍ରୁ?',
      summary: 'ସାଇକେଲ ଟାୟାରରେ କାହିଁକି କଟା ଥାଏ ଓ ବଳଦ ଗାଡ଼ି ଚକରେ ତେଲ କିପରି ଘର୍ଷଣ କମାଏ ଜାଣନ୍ତୁ।',
      ruralExample: 'ବଳଦ ଗାଡ଼ି ଚକରେ ଗ୍ରୀସ୍ ଲଗାଇଲେ ଘର୍ଷଣ କମିଯାଏ, ଫଳରେ ବଳଦ ସହଜରେ ଗାଡ଼ି ଟାଣିପାରନ୍ତି। ଟ୍ରାକ୍ଟର ଟାୟାରର ଖାଜ କାଦୁଅରେ ଖସିବାରୁ ରକ୍ଷା କରେ।',
      detailedNotes: [
        '୧. ଘର୍ଷଣ ବଳ: ଦୁଇଟି ସ୍ପର୍ଶକାରୀ ସତହ ମଧ୍ୟରେ ଗତିକୁ ବାଧା ଦେଉଥିବା ବଳ।',
        '୨. ଘର୍ଷଣ ପ୍ରକାର: ସ୍ଥିତିଜ, ସର୍ପିଳ ଏବଂ ଚକ୍ରାକାର ଘର୍ଷଣ।',
        '୩. ଲୁବ୍ରିକେଣ୍ଟ (ତେଲ/ଗ୍ରୀସ୍) ଘର୍ଷଣ କମାଏ।'
      ],
      formulas: 'F = μ × N',
      keyPoints: [
        'ଘର୍ଷଣ ଦୁଇ ସତହ ମଧ୍ୟରେ ଗତିକୁ ବାଧା ଦିଏ।',
        'ଖୋଜାତ ସତହରେ ଅଧିକ ଘର୍ଷଣ; ସମତଳ ସତହରେ କମ।',
        'ଲୁବ୍ରିକେଣ୍ଟ ଘର୍ଷଣ କମାଏ।'
      ]
    },
    te: {
      title: 'ఘర్షణ: మిత్రుడా లేదా శత్రువా?',
      summary: 'సైకిల్ టైర్లకు గీతలు ఎందుకు అవసరమో మరియు ఎడ్ల బండి చక్రాలకు నూనె ఘర్షణను ఎలా తగ్గిస్తుందో తెలుసుకోండి.',
      ruralExample: 'ఎడ్ల బండి ఇరుసులకు గ్రీజు రాయడం వల్ల ఘర్షణ తగ్గి ఎడ్లు సులభంగా బండిని లాగగలవు. ట్రాక్టర్ టైర్ల గీతలు బురదలో జారకుండా ఘర్షణను పెంచుతాయి.',
      detailedNotes: [
        '1. ఘర్షణ బలం: రెండు స్పర్శలో ఉన్న ఉపరితలాల మధ్య సాపేక్ష చలనాన్ని నిరోధించే బలం.',
        '2. ఘర్షణ రకాలు: స్థైతిక, జారుడు మరియు దొర్లుడు ఘర్షణ.',
        '3. నూనె మరియు గ్రీజు ఘర్షణను తగ్గిస్తాయి; టైర్ల గీతలు ఘర్షణను పెంచుతాయి.'
      ],
      formulas: 'F = μ × N',
      keyPoints: [
        'ఘర్షణ రెండు ఉపరితలాల మధ్య చలనాన్ని నిరోధిస్తుంది.',
        'రాపిడి ఉన్న ఉపరితలాలు ఎక్కువ ఘర్షణను ఇస్తాయి.',
        'సాఫీ చేసే పదార్థాలు ఘర్షణను తగ్గిస్తాయి.'
      ]
    }
  },

  s2: {
    en: {
      title: 'Cell Structure and Functions',
      summary: 'The building blocks of plant and animal life compared to bricks in an earthen house.',
      ruralExample: 'Just as a traditional mud-brick house is constructed from individual bricks, every living plant and animal is built from microscopic living cells!',
      detailedNotes: [
        '1. Cell Wall: Rigid outer protective layer present exclusively in plant cells.',
        '2. Nucleus: The brain of the cell containing genetic code (DNA).',
        '3. Mitochondria: The powerhouse generating cellular energy (ATP).'
      ],
      formulas: 'Cells → Tissues → Organs → Organism',
      keyPoints: [
        'Cell wall provides rigidity in plant cells.',
        'Nucleus acts as the control center of the cell.',
        'Mitochondria generate cellular energy (Powerhouse).'
      ]
    },
    hi: {
      title: 'कोशिका की संरचना और कार्य',
      summary: 'पौधों और जीवों की जीवन-इकाइयों की तुलना मिट्टी के घर की ईंटों से।',
      ruralExample: 'जैसे गाँव का मिट्टी का घर ईंटों से बनता है, वैसे ही हर पौधा और जीव सूक्ष्म जीवित कोशिकाओं से बना है!',
      detailedNotes: [
        '1. कोशिका भित्ति (Cell Wall): केवल पादप कोशिकाओं में पायी जाने वाली कठोर बाहरी परत।',
        '2. केंद्रक (Nucleus): कोशिका का नियंत्रण कक्ष जो अनुवांशिक जानकारी (DNA) रखता है।',
        '3. माइटोकॉन्ड्रिया (Mitochondria): कोशिका का बिजलीघर जो ऊर्जा (ATP) उत्पन्न करता है।'
      ],
      formulas: 'कोशिकाएँ → ऊतक → अंग → जीव',
      keyPoints: [
        'पादप कोशिका में कोशिका भित्ति कठोरता देती है।',
        'केंद्रक (Nucleus) कोशिका का नियंत्रण कक्ष है।',
        'माइटोकॉन्ड्रिया ऊर्जा उत्पन्न करते हैं (Powerhouse)।'
      ]
    },
    or: {
      title: 'କୋଷ ଗଠନ ଓ କାର୍ଯ୍ୟ',
      summary: 'ଉଦ୍ଭିଦ ଓ ପ୍ରାଣୀର ଜୀବନ ଏକକକୁ ମାଟି ଘରର ଇଟା ସହିତ ତୁଳନା କରନ୍ତୁ।',
      ruralExample: 'ଯେପରି ମାଟି ଘର ଇଟାରେ ତିଆରି, ସେହିପରି ପ୍ରତ୍ୟେକ ଉଦ୍ଭିଦ ଓ ଜୀବ କ୍ଷୁଦ୍ର କୋଷ ଦ୍ୱାରା ଗଠିତ!',
      detailedNotes: [
        '୧. କୋଷ ଭିତ୍ତି: ଉଦ୍ଭିଦ କୋଷକୁ କଠିନତା ଦିଏ।',
        '୨. ନ୍ୟୁକ୍ଲିୟସ୍: କୋଷର ନିୟନ୍ତ୍ରଣ କେନ୍ଦ୍ର।',
        '୩. ମାଇଟୋକଣ୍ଡ୍ରିଆ: ଶକ୍ତି ଉତ୍ପାଦନ କେନ୍ଦ୍ର।'
      ],
      formulas: 'କୋଷ → ଟିସୁ → ଅଙ୍ଗ → ଜୀବ',
      keyPoints: [
        'ଉଦ୍ଭିଦ କୋଷରେ କୋଷ କାନ୍ଥ କଠିନତା ଦିଏ।',
        'ନ୍ୟୁକ୍ଲିୟସ୍ କୋଷର ନିୟନ୍ତ୍ରଣ କେନ୍ଦ୍ର।',
        'ମାଇଟୋକଣ୍ଡ୍ରିଆ ଶକ୍ତି ଉତ୍ପାଦନ କରେ।'
      ]
    },
    te: {
      title: 'కణం నిర్మాణం మరియు విధులు',
      summary: 'మట్టి ఇంటి ఇటుకలతో పోల్చబడిన మొక్కలు మరియు జంతువుల జీవనాధారాలు.',
      ruralExample: 'మట్టి ఇల్లు ఇటుకలతో నిర్మించబడినట్లే, ప్రతి మొక్క మరియు జీవి సూక్ష్మ జీవ కణాలతో నిర్మించబడింది!',
      detailedNotes: [
        '1. కణ కవచం: మొక్కల కణాలకు రక్షణ మరియు దృఢత్వాన్ని ఇస్తుంది.',
        '2. కేంద్రకం: కణం యొక్క నియంత్రణ కేంద్రం (DNA).',
        '3. మైటోకాండ్రియా: కణానికి శక్తిని ఉత్పత్తి చేసే కేంద్రం.'
      ],
      formulas: 'కణాలు → కణజాలాలు → అవయవాలు → జీవి',
      keyPoints: [
        'కణ కవచం వృక్ష కణాలకు దృఢత్వాన్ని ఇస్తుంది.',
        'కేంద్రకం కణం యొక్క నియంత్రణ కేంద్రంగా పనిచేస్తుంది.',
        'మైటోకాండ్రియా కణ శక్తిని ఉత్పత్తి చేస్తుంది.'
      ]
    }
  },

  p1: {
    en: {
      title: "Ohm's Law & Simple Electric Circuits",
      summary: "Voltage (V) = Current (I) × Resistance (R). Learn how solar lanterns light up rural homes.",
      ruralExample: "Water pressure from an elevated rooftop tank drives water flow through a pipe; similarly, electric voltage (V) pushes current (I) through circuit resistors (R) in a solar home lamp.",
      detailedNotes: [
        "1. Ohm's Law Statement: At constant temperature, the current passing through a conductor is directly proportional to potential difference across its ends.",
        "2. Formula Components: V = Potential Difference (Volts), I = Electric Current (Amperes), R = Resistance (Ohms Ω).",
        "3. Practical Rural Solar Circuit: Solar Panel Charge → Battery Storage → Resistor Switch → LED Light."
      ],
      formulas: "V = I × R  |  I = V / R  |  R = V / I",
      keyPoints: [
        "Current is flow of electric charge per unit time.",
        "Resistance hinders charge flow (measured in Ohms Ω).",
        "V is directly proportional to I at constant temperature."
      ]
    },
    hi: {
      title: "ओम का नियम और विद्युत परिपथ",
      summary: "विभवांतर (V) = धारा (I) × प्रतिरोध (R)। जानें सौर लालटेन से ग्रामीण घर कैसे रोशन होते हैं।",
      ruralExample: "जैसे छत की पानी की टंकी की ऊँचाई (V) पानी के बहाव (I) को बढ़ाती है और पतली पाइप (R) रुकावट डालती है, वैसे ही सौर लालटेन परिपथ में वोल्टेज धारा को प्रवाहित करता है!",
      detailedNotes: [
        "1. ओम का नियम: नियत ताप पर चालक में प्रवाहित धारा (I) विभवांतर (V) के समानुपाती होती है।",
        "2. सूत्र के घटक: V = विभवांतर (वोल्ट), I = विद्युत धारा (एम्पियर), R = प्रतिरोध (ओम Ω)।",
        "3. सौर लालटेन परिपथ: सौर पैनल → बैटरी → स्विच/प्रतिरोध → LED बल्ब।"
      ],
      formulas: "V = I × R  |  I = V / R  |  R = V / I",
      keyPoints: [
        "धारा प्रति इकाई समय आवेश प्रवाह की दर है।",
        "प्रतिरोध धारा के प्रवाह में रुकावट डालता है (ओम Ω)।",
        "नियत ताप पर V और I परस्पर समानुपाती होते हैं।"
      ]
    },
    or: {
      title: "ଓମ୍‌ଙ୍କ ନିୟମ ଓ ବିଦ୍ୟୁତ୍ ପରିପଥ",
      summary: "ଭୋଲ୍ଟେଜ୍ (V) = କରେଣ୍ଟ (I) × ପ୍ରତିରୋଧ (R)। ସୌର ଲଣ୍ଠନ ଗ୍ରାମୀଣ ଘରକୁ କିପରି ଆଲୋକିତ କରେ ଶିଖନ୍ତୁ।",
      ruralExample: "ଛାତ ଟାଙ୍କିର ପାଣି ଚାପ ଯେପରି ପାଇପ୍‌ରେ ପାଣି ବୁହାଏ, ସେହିପରି ଭୋଲ୍ଟେଜ୍ ସୌର ଲ୍ୟାମ୍ପରେ ବିଦ୍ୟୁତ୍ ସ୍ରୋତ ପ୍ରବାହିତ କରେ।",
      detailedNotes: [
        "୧. ଓମ୍‌ଙ୍କ ନିୟମ: ସ୍ଥିର ତାପମାତ୍ରାରେ ବିଦ୍ୟୁତ୍ ସ୍ରୋତ (I) ବିଭବାନ୍ତର (V) ସହିତ ସମାନୁପାତୀ।",
        "୨. ସୂତ୍ର: V = I × R, ଯାହାର ଏକକ ଭୋଲ୍ଟ, ଆମ୍ପିୟର ଓ ଓମ୍।"
      ],
      formulas: "V = I × R  |  I = V / R  |  R = V / I",
      keyPoints: [
        "କରେଣ୍ଟ ହେଉଛି ବିଦ୍ୟୁତ୍ ଚାର୍ଜର ପ୍ରବାହ।",
        "ପ୍ରତିରୋଧ କରେଣ୍ଟ ପ୍ରବାହକୁ ବାଧା ଦିଏ (ଓମ୍ Ω)।",
        "ସ୍ଥିର ତାପମାତ୍ରାରେ V ଏବଂ I ସମାନୁପାତୀ।"
      ]
    },
    te: {
      title: "ఓమ్ నియమం మరియు విద్యుత్ వలయాలు",
      summary: "వోల్టేజ్ (V) = కరెంట్ (I) × నిరోధం (R). సోలార్ దీపాలు గ్రామీణ ఇళ్లను ఎలా వెలిగిస్తాయో నేర్చుకోండి.",
      ruralExample: "ట్యాంకు నీటి పీడనం పైపు ద్వారా నీటి ప్రవాహాన్ని నెట్టినట్లే, వోల్టేజ్ (V) సోలార్ లైట్ వలయంలో విద్యుత్ (I) ని ప్రవహింపజేస్తుంది.",
      detailedNotes: [
        "1. ఓమ్ నియమం: స్థిర ఉష్ణోగ్రత వద్ద విద్యుత్ ప్రవాహం (I) వోల్టేజ్ (V) కి ప్రత్యక్ష అనుపాతంలో ఉంటుంది.",
        "2. సూత్రం: V = I × R (వోల్ట్లు, యాంపియర్లు, ఓమ్‌లు)."
      ],
      formulas: "V = I × R  |  I = V / R  |  R = V / I",
      keyPoints: [
        "కరెంట్ అనేది విద్యుత్ ఆవేశాల ప్రవాహ రేటు.",
        "నిరోధం విద్యుత్ ప్రవాహాన్ని అడ్డుకుంటుంది (ఓమ్స్ Ω).",
        "స్థిర ఉష్ణోగ్రత వద్ద V మరియు I అనుపాతంలో ఉంటాయి."
      ]
    }
  },

  c1: {
    en: {
      title: "Separation Techniques for Water Purification",
      summary: "Methods like sedimentation, decantation, and chlorination for clean drinking water.",
      ruralExample: "Allowing turbid well water to settle in a clay pot causes mud to sink to the bottom (sedimentation), after which clean top water is poured off (decantation) and filtered through cloth.",
      detailedNotes: [
        "1. Sedimentation: Heavy insoluble mud particles settle at the bottom of the container due to gravity.",
        "2. Decantation & Filtration: Pouring clear liquid off the top and passing through fine cloth or sand filter.",
        "3. Chlorination & Boiling: Chemical disinfection using chlorine tablets or boiling to kill harmful bacteria."
      ],
      formulas: "Raw Water  →  Sedimentation  →  Filtration  →  Chlorination  →  Safe Drinking Water",
      keyPoints: [
        "Sedimentation settles heavy insoluble particles.",
        "Filtration removes suspended impurities.",
        "Chlorination kills harmful pathogens."
      ]
    },
    hi: {
      title: "जल शोधन के लिए पृथक्करण तकनीकें",
      summary: "स्वच्छ पेयजल के लिए अवसादन, निस्तारण और क्लोरीनीकरण जैसी विधियाँ।",
      ruralExample: "गाँव के कुएँ या तालाब के गंदे पानी को घड़े में रखकर छोड़ने पर मिट्टी नीचे बैठ जाती है (अवसादन)। फिर ऊपर का साफ़ पानी छानकर अलग किया जाता है!",
      detailedNotes: [
        "1. अवसादन (Sedimentation): भारी अघुलनशील गंदे कण बर्तन के पेंदे में बैठ जाते हैं।",
        "2. निस्तारण व छानना (Filtration): ऊपर के साफ़ पानी को कपड़े या बालू फ़िल्टर से छानना।",
        "3. क्लोरीनीकरण (Chlorination): पानी में जीवाणुओं को नष्ट करने के लिए क्लोरीन गोली डालना या उबालना।"
      ],
      formulas: "गंदा जल  →  अवसादन  →  छानना  →  क्लोरीनीकरण  →  शुद्ध पेयजल",
      keyPoints: [
        "अवसादन भारी अघुलनशील कणों को नीचे बैठाता है।",
        "निस्पंदन तैरती हुई अशुद्धियों को हटाता है।",
        "क्लोरीनीकरण हानिकारक कीटाणुओं को नष्ट करता है।"
      ]
    },
    or: {
      title: "ଜଳ ବିଶୋଧନ ପାଇଁ ପୃଥକୀକରଣ ପ୍ରଣାଳୀ",
      summary: "ବିଶୁଦ୍ଧ ପାନୀୟ ଜଳ ପାଇଁ ଅବସାଦନ, ଛାଣିବା ଓ କ୍ଲୋରିନେସନ୍ ପଦ୍ଧତି।",
      ruralExample: "ଗାଁ କୂଅର ଗୋଳିଆ ପାଣି ହାଣ୍ଡିରେ ରଖିଲେ ମାଟି ତଳେ ବସିଯାଏ (ଅବସାଦନ)। ତାପରେ ଉପର ପାଣି ଛାଣି ବ୍ୟବହାର କରାଯାଏ।",
      detailedNotes: [
        "୧. ଅବସାଦନ: ଭାରୀ ମାଟି କଣିକା ତଳେ ବସିବା।",
        "୨. ଛାଣିବା: ସୂତା କପଡ଼ାରେ ପାଣି ଛାଣିବା।",
        "୩. କ୍ଲୋରିନେସନ୍: ଜୀବାଣୁ ନଷ୍ଟ କରିବା ପାଇଁ କ୍ଲୋରିନ୍ ବଟିକା ପକାଇବା।"
      ],
      formulas: "ଅବିଶୁଦ୍ଧ ଜଳ  →  ଅବସାଦନ  →  ଛାଣିବା  →  କ୍ଲୋରିନେସନ୍  →  ବିଶୁଦ୍ଧ ଜଳ",
      keyPoints: [
        "ଅବସାଦନ ଭାରୀ ମାଟି କଣିକାକୁ ତଳେ ବସାଏ।",
        "ଛାଣିବା ଦ୍ୱାରା ଅଳିଆ ଅଲଗା ହୁଏ।",
        "କ୍ଲୋରିନେସନ୍ ଜୀବାଣୁ ମାରିଥାଏ।"
      ]
    },
    te: {
      title: "నీటి శుద్ధి కోసం వేరుచేసే పద్ధతులు",
      summary: "పరిశుభ్రమైన తాగునీటి కోసం అవసాధనం, వడపోత మరియు క్లోరినేషన్ పద్ధతులు.",
      ruralExample: "బురద నీటిని కుండలో కొంత సమయం ఉంచితే బురద అడుగునకు చేరుతుంది (అవసాధనం), ఆపై పైన ఉన్న స్వచ్ఛమైన నీటిని గుడ్డతో వడపోస్తారు.",
      detailedNotes: [
        "1. అవసాధనం: బరువైన బురద కణాలు అడుగు భాగానికి చేరుతాయి.",
        "2. వడపోత: నీటిని పలుచని గుడ్డ లేదా ఇసుక ఫిల్టర్ ద్వారా వడపోయడం.",
        "3. క్లోరినేషన్: క్రిములను చంపడానికి క్లోరిన్ బిళ్ళలను కలపడం."
      ],
      formulas: "కలుషిత నీరు  →  అవసాధనం  →  వడపోత  →  క్లోరినేషన్  →  సురక్షిత తాగునీరు",
      keyPoints: [
        "అవసాధనం బరువైన కణాలను అడుగునకు చేరుస్తుంది.",
        "వడపోత వ్యర్థాలను తొలగిస్తుంది.",
        "క్లోరినేషన్ హానికర క్రిములను సంహరిస్తుంది."
      ]
    }
  },

  b1: {
    en: {
      title: "Photosynthesis: How Plants Make Food",
      summary: "Sunlight, chlorophyll, water, and carbon dioxide produce glucose and release oxygen.",
      ruralExample: "Leaves act like solar-powered kitchens on farm crops, utilizing green chlorophyll to catch sunlight and combine soil water with air to produce food and oxygen.",
      detailedNotes: [
        "1. Chlorophyll Role: Green pigment in leaves that absorbs radiant sunlight energy.",
        "2. Stomata Function: Microscopic pores on leaf undersides that absorb CO₂ from the atmosphere.",
        "3. Chemical Products: Glucose (stored food energy) and Oxygen gas (released into air for living beings)."
      ],
      formulas: "6CO₂ + 6H₂O + Solar Energy  →  C₆H₁₂O₆ (Glucose) + 6O₂ (Oxygen)",
      keyPoints: [
        "Chlorophyll absorbs solar energy.",
        "Stomata on leaves take in carbon dioxide.",
        "Formula: CO₂ + H₂O + Sunlight → Glucose + O₂."
      ]
    },
    hi: {
      title: "प्रकाश संश्लेषण: पौधे अपना भोजन कैसे बनाते हैं",
      summary: "सूर्य का प्रकाश, क्लोरोफिल, जल और कार्बन डाइऑक्साइड ग्लूकोज बनाते हैं और ऑक्सीजन छोड़ते हैं।",
      ruralExample: "जैसे खेत में फसलें धूप और पानी पाकर हरी-भरी होती हैं, वैसे ही पत्तियों का हरा रंग (क्लोरोफिल) सूरज की रोशनी को सोखकर ग्लूकोज रूपी भोजन पकाता है और हमें ऑक्सीजन देता है!",
      detailedNotes: [
        "1. क्लोरोफिल (Chlorophyll): पत्तियों में हरा वर्णक जो सूर्य के प्रकाश को सोखता है।",
        "2. रंध्र (Stomata): पत्तियों की निचली सतह पर सूक्ष्म छिद्र जो हवा से CO₂ गैस लेते हैं।",
        "3. रासायनिक उत्पाद: ग्लूकोज (पौधों का भोजन) और ऑक्सीजन (जीवनदायी गैस)।"
      ],
      formulas: "6CO₂ + 6H₂O + सूर्य प्रकाश  →  C₆H₁₂O₆ (ग्लूकोज) + 6O₂ (ऑक्सीजन)",
      keyPoints: [
        "क्लोरोफिल सौर ऊर्जा को अवशोषित करता है।",
        "पत्तियों पर रंध्र कार्बन डाइऑक्साइड लेते हैं।",
        "सूत्र: CO₂ + H₂O + सूर्य प्रकाश → ग्लूकोज + O₂।"
      ]
    },
    or: {
      title: "ଆଲୋକ ସଂଶ୍ଳେଷଣ: ଉଦ୍ଭିଦ କିପରି ଖାଦ୍ୟ ତିଆରି କରେ",
      summary: "ସୂର୍ଯ୍ୟାଲୋକ, କ୍ଲୋରୋଫିଲ୍, ଜଳ ଓ କାର୍ବନ ଡାଇଅକ୍ସାଇଡ୍ ମିଶି ଗ୍ଲୁକୋଜ୍ ଓ ଅମ୍ଳଜାନ ତିଆରି କରନ୍ତି।",
      ruralExample: "ପତ୍ରଗୁଡ଼ିକ ସୂର୍ଯ୍ୟକିରଣ ଓ ପାଣି ବ୍ୟବହାର କରି ଗ୍ଲୁକୋଜ୍ ଖାଦ୍ୟ ତିଆରି କରନ୍ତି ଏବଂ ଆମକୁ ଜୀବନଦାୟୀ ଅମ୍ଳଜାନ ଦିଅନ୍ତି!",
      detailedNotes: [
        "୧. କ୍ଲୋରୋଫିଲ୍: ପତ୍ରର ସବୁଜ କଣିକା ଯାହା ସୂର୍ଯ୍ୟାଲୋକ ଶୋଷଣ କରେ।",
        "୨. ଷ୍ଟୋମାଟା: ପତ୍ରର ସୂକ୍ଷ୍ମ ଛିଦ୍ର ଯାହା CO₂ ଗ୍ରହଣ କରେ।",
        "୩. ଉତ୍ପାଦ: ଗ୍ଲୁକୋଜ୍ (ଖାଦ୍ୟ) ଏବଂ ଅମ୍ଳଜାନ (O₂)।"
      ],
      formulas: "6CO₂ + 6H₂O + ସୂର୍ଯ୍ୟାଲୋକ  →  C₆H₁₂O₆ + 6O₂",
      keyPoints: [
        "କ୍ଲୋରୋଫିଲ୍ ସୌର ଶକ୍ତି ଶୋଷଣ କରେ।",
        "ପତ୍ରରେ ଥିବା ଷ୍ଟୋମାଟା କାର୍ବନ ଡାଇଅକ୍ସାଇଡ୍ ଗ୍ରହଣ କରେ।",
        "ସୂତ୍ର: CO₂ + H₂O + ସୂର୍ଯ୍ୟାଲୋକ → ଗ୍ଲୁକୋଜ୍ + O₂।"
      ]
    },
    te: {
      title: "కిరణజన్య సంయోగక్రియ: మొక్కలు ఆహారాన్ని ఎలా తయారు చేస్తాయి",
      summary: "సూర్యరశ్మి, క్లోరోఫిల్, నీరు మరియు కార్బన్ డై ఆక్సైడ్ గ్లూకోజ్‌ను తయారు చేసి ఆక్సిజన్‌ను విడుదల చేస్తాయి.",
      ruralExample: "మొక్కల ఆకులు సోలార్ వంటగదిలా పనిచేస్తాయి, ఆకుపచ్చని క్లోరోఫిల్ సహాయంతో సూర్యరశ్మిని గ్రహించి గ్లూకోజ్ ఆహారాన్ని మరియు ఆక్సిజన్‌ను ఉత్పత్తి చేస్తాయి.",
      detailedNotes: [
        "1. క్లోరోఫిల్: సూర్యరశ్మిని గ్రహించే ఆకుపచ్చ వర్ణకం.",
        "2. పత్రరంధ్రాలు: గాలి నుండి CO₂ ని గ్రహించే సూక్ష్మ రంధ్రాలు.",
        "3. ఉత్పత్తులు: గ్లూకోజ్ (ఆహారం) మరియు ఆక్సిజన్."
      ],
      formulas: "6CO₂ + 6H₂O + సూర్యరశ్మి  →  C₆H₁₂O₆ + 6O₂",
      keyPoints: [
        "క్లోరోఫిల్ సౌర శక్తిని గ్రహిస్తుంది.",
        "ఆకులపై ఉండే పత్రరంధ్రాలు కార్బన్ డై ఆక్సైడ్‌ను తీసుకుంటాయి.",
        "సూత్రం: CO₂ + H₂O + సూర్యరశ్మి → గ్లూకోజ్ + O₂."
      ]
    }
  }
};

/** Look up a localized lesson field with safe English fallback. */
export const localizeLesson = (lesson, locale, field) => {
  if (!lesson) return '';
  const tr = LESSON_TRANSLATIONS[lesson.id]?.[locale];
  if (tr && tr[field]) return tr[field];
  if (locale !== 'en') {
    const en = LESSON_TRANSLATIONS[lesson.id]?.en;
    if (en && en[field]) return en[field];
  }
  return lesson[field];
};
