// La darija varie selon les régions. Les équivalents sont expliqués en contexte.
const text = (fr, ar, darija) => ({ fr, ar, darija });

export const pronouns = [
  { fr: 'Je', ar: 'أنا', darija: 'ana', sound: 'ژُ', example: text('Je suis à la maison.', 'أنا في البيت.', 'Ana f ddar.') },
  { fr: 'Tu', ar: 'أنتَ / أنتِ', darija: 'nta / ntiya', sound: 'تُو', example: text('Tu es à la maison.', 'أنت في البيت.', 'Nta / ntiya f ddar.') },
  { fr: 'Il', ar: 'هو', darija: 'howa', sound: 'إيل', example: text('Il est à la maison.', 'هو في البيت.', 'Howa f ddar.') },
  { fr: 'Elle', ar: 'هي', darija: 'hiya', sound: 'إيل', example: text('Elle est à la maison.', 'هي في البيت.', 'Hiya f ddar.') },
  { fr: 'On', ar: 'نحن في الكلام اليومي، أو الناس حسب السياق', darija: '7na / nnas, 7sab lma3na', sound: 'أون (صوت أنفي)', example: text('On est à la maison.', 'نحن في البيت. هنا « on » تعني « نحن ».', '7na f ddar. Hna « on » kat3ni « 7na ».') },
  { fr: 'Nous', ar: 'نحن', darija: '7na', sound: 'نُو', example: text('Nous sommes à la maison.', 'نحن في البيت.', '7na f ddar.') },
  { fr: 'Vous', ar: 'أنتم / أنتنّ، أو أنتَ / أنتِ للاحترام', darija: 'ntouma / nta b l-i7tiram', sound: 'ڤُو', example: text('Vous êtes à la maison.', 'أنتم في البيت، أو أنت في البيت بصيغة الاحترام.', 'Ntouma f ddar, wla nta / ntiya b l-i7tiram.') },
  { fr: 'Ils', ar: 'هم (ذكور أو مجموعة مختلطة)', darija: 'houma (drari / groupe mkhllet)', sound: 'إيل', example: text('Ils sont à la maison.', 'هم في البيت.', 'Houma f ddar.') },
  { fr: 'Elles', ar: 'هنّ (إناث فقط)', darija: 'houma (l3yalat / lbnat)', sound: 'إيل', example: text('Elles sont à la maison.', 'هنّ في البيت.', 'Houma f ddar (ghir l3yalat / lbnat).') },
];

const subjects = ['Je', 'Tu', 'Il', 'Elle', 'On', 'Nous', 'Vous', 'Ils', 'Elles'];
const etreForms = ['suis', 'es', 'est', 'est', 'est', 'sommes', 'êtes', 'sont', 'sont'];
const avoirForms = ['ai', 'as', 'a', 'a', 'a', 'avons', 'avez', 'ont', 'ont'];
const etreDarija = ['ana', 'nta / ntiya', 'howa', 'hiya', '7na (f had lmital)', '7na', 'ntouma', 'houma', 'houma'];
const avoirDarija = ['3ndi', '3ndek', '3ndo', '3ndha', '3ndna (mlli on = 7na)', '3ndna', '3ndkom', '3ndhom', '3ndhom'];
const etreAr = ['أنا', 'أنتَ / أنتِ', 'هو', 'هي', 'نحن هنا، حسب السياق', 'نحن', 'أنتم / أنتنّ أو أنت للاحترام', 'هم', 'هنّ'];
const avoirAr = ['عندي', 'عندكَ / عندكِ', 'عنده', 'عندها', 'عندنا هنا، حسب السياق', 'عندنا', 'عندكم / عندكنّ', 'عندهم', 'عندهنّ'];
const etreSounds = ['ژُ سْوي', 'تُو إِ', 'إيل إِ', 'إيل إِ', 'أون إِ', 'نُو سوم', 'ڤُو زِت', 'إيل سون', 'إيل سون'];
const avoirSounds = ['ژِ', 'تُو آ', 'إيل آ', 'إيل آ', 'أون آ', 'نُو زاڤون', 'ڤُو زاڤي', 'إيل زون', 'إيل زون'];

export const conjugations = subjects.map((subject, i) => ({
  subject,
  etre: { fr: `${subject} ${etreForms[i]}`, ar: etreAr[i], darija: etreDarija[i], sound: etreSounds[i] },
  avoir: { fr: i === 0 ? 'J’ai' : `${subject} ${avoirForms[i]}`, ar: avoirAr[i], darija: avoirDarija[i], sound: avoirSounds[i] },
}));

export const baseLessons = [
  {
    id: 'pronoms', icon: 'people', week: 1, date: '2026-10-25',
    title: text('Les pronoms personnels', 'الضمائر الشخصية', 'Dama2ir chakhsiya'),
    short: text('Les pronoms', 'الضمائر', 'Dama2ir'),
    description: text('Je, tu, il… Fais les présentations !', 'أنا، أنت، هو… تعرّف على الضمائر!', 'Ana, nta, howa… nt3erfo 3la dama2ir!'),
    intro: text('Un pronom remplace le nom d’une personne. Il indique de qui on parle.', 'الضمير يحلّ محلّ اسم الشخص ويبيّن عمّن نتحدّث.', 'Ddamir kay3ewwed smit chi wa7ed, bach n3erfo 3la men kanhdro.'),
    tips: [
      text('« Tu » : une personne proche. « Vous » : plusieurs personnes, ou une personne avec politesse.', '« Tu » لشخص واحد مقرّب. « Vous » لعدة أشخاص، أو لشخص واحد باحترام.', '« Tu » l wa7ed qrib. « Vous » l bzzaf dyal nnas, wla l wa7ed b l-i7tiram.'),
      text('À l’oral, « on » veut souvent dire « nous ». Mais le verbe reste au singulier : on est, on a.', 'في الكلام اليومي، « on » تعني غالبًا « نحن ». لكن الفعل يبقى مفردًا: on est، on a.', 'F lhedra, « on » ghaliban hiya « 7na ». Walakin lfi3l kaybqa mofrad: on est, on a.'),
      text('Il, ils, elle et elles se prononcent pareil deux par deux. Le contexte aide à comprendre.', '« il » و« ils » لهما النطق نفسه، وكذلك « elle » و« elles ». السياق يساعد على الفهم.', '« Il » w « ils » kaytntqo b7al b7al, w « elle » w « elles » ta homa. Lma3na kayban mn siyaq.'),
      text('Le son « u » de « tu » est différent du « ou » de « nous ». Pour essayer : garde les lèvres arrondies comme pour « ou », puis essaie de dire « i ». Écoute et répète.', 'صوت « u » في tu يختلف عن « ou » في nous. للتجربة: دوّر شفتيك كما في « ou » ثم حاول نطق « i ». استمع وكرّر.', '« U » dyal tu machi b7al « ou » dyal nous. Dwwer chfayfek b7al « ou », w jereb tgoul « i ». Sme3 w 3awed.'),
      text('Les lettres arabes sont seulement un repère approximatif. Pour apprendre le son, utilise surtout le bouton d’écoute.', 'الحروف العربية تقريب للنطق فقط. لتعلّم الصوت، استعمل خصوصًا زر الاستماع.', 'L7orof l3arbiya ghir taqrib dyal ssot. Bach t3ellem nnotq, sta3mel bouton ssot.'),
    ],
    cards: pronouns,
  },
  {
    id: 'etre-avoir', icon: 'spark', week: 1, date: '2026-10-25',
    title: text('Être et avoir au présent', 'فعلا être وavoir في الحاضر', 'Être w avoir f l7adir'),
    short: text('Être et avoir', 'فعلا être وavoir', 'Être w avoir'),
    description: text('Je suis, tu es, j’ai… Les premiers verbes.', 'تعلّم تصريف أول فعلين: être وavoir.', 'Net3ellmo nsarrfo être w avoir.'),
    intro: text('Être sert à dire qui on est ou comment on se sent. Avoir sert à dire ce qu’on possède, son âge, et certaines sensations.', 'نستخدم être للتعريف بالشخص أو وصف حالته، وavoir للملكية والعمر وبعض الأحاسيس.', 'Être bach ngolo chkoun 7na w kif 7assin. Avoir bach ngolo chno 3ndna, l3mer w chi i7sassat.'),
    tips: [
      text('En darija et en arabe, on n’exprime souvent pas « être » au présent : « Je suis marocain » → « Ana mghribi ». En français, le verbe est nécessaire.', 'في العربية والدارجة غالبًا لا نذكر فعل « être » في الحاضر: Je suis marocain = أنا مغربي. أمّا في الفرنسية فالفعل ضروري.', 'F ddarija, « Je suis marocain » hiya « Ana mghribi ». F lfrançais, khasna ngolo « suis ».'),
      text('Devant « ai », « je » devient « j’ » : j’ai. Pour l’âge : j’ai 25 ans.', 'قبل « ai » تصبح « je »: « j’ ». وللعمر نقول: j’ai 25 ans = عمري 25 سنة.', 'Qbel « ai », « je » katwlli « j’ »: j’ai. F l3mer: j’ai 25 ans = 3ndi 25 3am.'),
      text('On dit « j’ai faim », mais « je suis fatigué ». Apprends ces expressions avec leur verbe.', 'نقول « j’ai faim » أي أنا جائع، و« je suis fatigué » أي أنا متعب. احفظ كل تعبير مع فعله.', 'Kangolo « j’ai faim » = ana ji3an, w « je suis fatigué » = ana 3yyan. 7fed kol ta3bir m3a lfi3l dyalo.'),
    ],
    cards: [],
  },
];

function options(values, correct) {
  return [...new Set([correct, ...values])].slice(0, 4).map(value => ({ text: value, speech: value }));
}
const question = (id, prompt, choices, correct, explanation, sentence, audio) => ({ id, prompt, options: choices, correct, explanation, sentence, audio });

export function makeBaseQuestions() {
  const quizPronouns = pronouns.map((p, i) => {
    const correct = p.darija;
    const other = pronouns.filter((_, n) => n !== i && n !== 4).map(p => p.darija);
    return question(`p-q-${i}`, `Quel est l’équivalent de « ${p.fr} » en darija ?`, options(other, correct), correct,
      text(`« ${p.fr} » correspond à « ${correct} ». ${i === 4 ? 'Ici, on utilise « on » pour dire « nous ».' : ''}`.trim(), `${p.fr} = ${p.ar}.`, `${p.fr} = ${correct}.`), null, p.fr);
  });
  const avoirSentences = [
    'J’… un livre.', 'Tu … un frère.', 'Il … un livre.', 'Elle … une sœur.',
    'On … un rendez-vous.', 'Nous … un livre.', 'Vous … un livre.',
    'Ils … un rendez-vous.', 'Elles … un frère.',
  ];
  const quizVerbs = conjugations.flatMap((row, i) => {
    const etreChoices = [...new Set(etreForms)].map(form => `${row.subject} ${form}`);
    const etreQuestion = question(`v-q-etre-${i}`, `Quelle est la forme de « être » avec « ${row.subject} » ?`,
      options(etreChoices.filter(value => value !== row.etre.fr), row.etre.fr), row.etre.fr,
      text(`Avec « ${row.subject} », on dit « ${row.etre.fr} ».`, `مع « ${row.subject} » نقول « ${row.etre.fr} ».`, `M3a « ${row.subject} », kangolo « ${row.etre.fr} ».`), row.etre.fr, row.subject);
    const avoirForm = avoirForms[i];
    const sentence = avoirSentences[i].replace('…', avoirForm);
    const prompt = `Complète : « ${avoirSentences[i]} »`;
    const avoirQuestion = question(`v-q-avoir-${i}`, prompt,
      options(avoirForms.filter(form => form !== avoirForm), avoirForm), avoirForm,
      text(`Avec « ${row.subject} », on utilise « ${avoirForm} » : ${sentence}`, `مع « ${row.subject} » نستخدم « ${avoirForm} »: ${sentence}`, `M3a « ${row.subject} », kangolo « ${avoirForm} »: ${sentence}`), sentence, prompt);
    return [etreQuestion, avoirQuestion];
  });
  const pronounExercises = [
    ['… suis marocain.', 'Je', ['Tu', 'Il', 'Nous'], 'أنا مغربي.', 'Ana mghribi.'],
    ['… es à la maison.', 'Tu', ['Je', 'Nous', 'Ils'], 'أنت في البيت.', 'Nta / ntiya f ddar.'],
    ['… sommes à la maison.', 'Nous', ['Je', 'Tu', 'Vous'], 'نحن في البيت.', '7na f ddar.'],
    ['… êtes à la maison.', 'Vous', ['Tu', 'Nous', 'Elles'], 'أنتم في البيت.', 'Ntouma f ddar.'],
    ['… ai un livre.', 'J’', ['Tu', 'Nous', 'Vous'], 'أنا عندي كتاب.', 'Ana 3ndi ktab.'],
    ['… a un frère.', 'Elle', ['Il', 'Ils', 'Elles'], 'هي عندها أخ.', 'Hiya 3ndha khou.'],
    ['… sont marocaines.', 'Elles', ['Elle', 'Nous', 'Il'], 'هنّ مغربيات.', 'Houma mghribiyat.'],
    ['… sont marocains.', 'Ils', ['Il', 'On', 'Vous'], 'هم مغاربة.', 'Houma mgharba.'],
    ['… parle français ici.', 'On', ['Nous', 'Vous', 'Ils'], 'الناس يتكلّمون الفرنسية هنا.', 'Nnas kayhdro b lfrançais hna.'],
  ].map(([prompt, correct, distractors, ar, darija], i) => {
    const sentence = prompt.replace('…', correct).replace('J’ ai', 'J’ai');
    return { ...question(`p-e-${i}`, prompt, options(distractors, correct), correct, text(sentence, ar, darija), sentence, null), hint: text(sentence, ar, darija) };
  });
  const verbExercises = [
    ['Il … marocain.', 'est', ['es', 'a', 'suis'], 'هو مغربي.', 'Howa mghribi.'],
    ['Je … fatigué.', 'suis', ['ai', 'est', 'sommes'], 'أنا متعب.', 'Ana 3yyan.'],
    ['Tu … à la maison.', 'es', ['est', 'as', 'êtes'], 'أنت في البيت.', 'Nta / ntiya f ddar.'],
    ['Nous … contents.', 'sommes', ['sont', 'avons', 'êtes'], 'نحن سعداء.', '7na fer7anin.'],
    ['Vous … un livre.', 'avez', ['avons', 'êtes', 'ont'], 'عندكم كتاب.', '3ndkom ktab.'],
    ['J’… 25 ans.', 'ai', ['suis', 'as', 'a'], 'عمري 25 سنة. للعمر نستخدم avoir.', '3ndi 25 3am. L l3mer kansta3mlo avoir.'],
    ['Elle … une sœur.', 'a', ['est', 'as', 'ont'], 'عندها أخت.', '3ndha kht.'],
    ['Ils … à Paris.', 'sont', ['ont', 'est', 'sommes'], 'هم في باريس.', 'Houma f Paris.'],
    ['Elles … un rendez-vous.', 'ont', ['sont', 'avons', 'a'], 'عندهنّ موعد.', '3ndhom rendez-vous.'],
    ['On … à la maison.', 'est', ['sommes', 'a', 'êtes'], 'نحن في البيت. مع on نستخدم est.', '7na f ddar. M3a on kangolo est.'],
    ['Nous … faim.', 'avons', ['sommes', 'ont', 'avez'], 'نحن جائعون. نقول avoir faim.', '7na ji3anin. Kangolo avoir faim.'],
    ['Tu … un frère.', 'as', ['es', 'a', 'ai'], 'عندك أخ.', '3ndek khou.'],
  ].map(([prompt, correct, distractors, ar, darija], i) => {
    const sentence = prompt.replace('…', correct);
    return question(`v-e-${i}`, prompt, options(distractors, correct), correct, text(sentence, ar, darija), sentence, null);
  });
  return { pronoms: { quiz: quizPronouns, exercises: pronounExercises }, 'etre-avoir': { quiz: quizVerbs, exercises: verbExercises } };
}

export function validateLesson(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Leçon invalide.');
  if (typeof value.id !== 'string' || !/^custom-[a-z0-9-]{1,80}$/.test(value.id)) throw new Error('Identifiant de leçon invalide.');
  const localized = (v, label) => {
    if (!v || ['fr', 'ar', 'darija'].some(k => typeof v[k] !== 'string' || !v[k].trim() || v[k].length > 4000)) throw new Error(`${label} : les trois langues sont nécessaires.`);
  };
  localized(value.title, 'Titre'); localized(value.description, 'Description'); localized(value.intro, 'Récapitulatif');
  if (!Number.isInteger(value.week) || value.week < 1 || value.week > 520) throw new Error('Semaine invalide.');
  if (!Array.isArray(value.cards) || value.cards.length > 100) throw new Error('Maximum : 100 mots par leçon.');
  value.cards.forEach(card => { localized(card, 'Mot'); if (card.example) localized(card.example, 'Exemple'); });
  for (const type of ['quiz', 'exercises']) {
    if (!Array.isArray(value[type]) || value[type].length > 100) throw new Error('Maximum : 100 questions par catégorie.');
    value[type].forEach((q, i) => {
      if (typeof q.id !== 'string' || q.id !== `${value.id}-${type}-${i}`) throw new Error('Identifiant de question invalide.');
      if (typeof q.prompt !== 'string' || !q.prompt.trim() || q.prompt.length > 2000) throw new Error('Question manquante ou trop longue.');
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4 || q.options.some(o => typeof o.text !== 'string' || !o.text.trim() || o.text.length > 500 || (o.speech != null && typeof o.speech !== 'string'))) throw new Error('Il faut entre deux et quatre réponses.');
      if (new Set(q.options.map(o => o.text.trim().toLocaleLowerCase('fr'))).size !== q.options.length) throw new Error('Les réponses doivent être différentes.');
      if (!q.options.some(o => o.text === q.correct)) throw new Error('Bonne réponse absente.');
      if (q.audio != null && (typeof q.audio !== 'string' || q.audio.length > 2000)) throw new Error('Texte audio invalide.');
      if (q.sentence != null && (typeof q.sentence !== 'string' || q.sentence.length > 2000)) throw new Error('Phrase corrigée invalide.');
      if (q.hint != null) localized(q.hint, 'Indice');
      localized(q.explanation, 'Correction');
    });
  }
  return value;
}
