import { baseLessons, pronouns, conjugations, makeBaseQuestions, validateLesson } from './content.js';
import { getState, preference, record, markRead, isRead, stats, lastAnswers, exportProgress, importProgress, resetProgress, downloadJSON, canSave } from './store.js';
import { esc, bi, bt, icon, audio, toast, speak } from './ui.js';
import { renderEditor, bindEditor } from './editor.js';

let published = [];
let publishedLoaded = false;
let session = null;
let result = null;
let currentRoute = '';
const app = document.getElementById('app');
const baseQuestions = makeBaseQuestions();
export function allLessons() {
  const map = new Map([...published, ...getState().drafts].map(l => [l.id, l]));
  return [...baseLessons, ...map.values()];
}
const questionsFor = (topic, mode) => baseQuestions[topic]?.[mode] || allLessons().find(l => l.id === topic)?.[mode] || [];
const lessonById = id => allLessons().find(l => l.id === id);
const routeLink = (path, label, className = '') => `<a class="${className}" href="#/${path}">${label}</a>`;
const button = (action, label, className = '', attrs = '') => `<button type="button" class="${className}" data-action="${action}" ${attrs}>${label}</button>`;
const listenIcon = text => `<button type="button" class="icon-button question-listen" data-speak="${esc(text)}" aria-label="${esc(`Écouter en français : ${text} — استمع بالفرنسية`)}" title="Écouter en français">${icon('volume')}</button>`;
function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
const navItems = [
  ['cours', 'book', () => bi('Cours', 'الدروس', 'Dorous')],
  ['quiz', 'quiz', () => bi('Quiz', 'اختبارات', 'Quiz')],
  ['exercices', 'pen', () => bi('Exercices', 'تمارين', 'Tamarin')],
];
function shell(content, section, lesson = null) {
  const language = getState().language;
  const hasLesson = !!lesson && ['cours', 'quiz', 'exercices'].includes(section);
  const headerLabels = {
    quiz: ['quiz', 'UN PEU DE PRATIQUE', 'قليل من التدريب', 'Chwiya dyal tadrib'],
    exercices: ['pen', 'LE FRANÇAIS EN ACTION', 'الفرنسية في التطبيق', 'Lfrançais f tt atbiq'],
    progression: ['chart', 'REGARDE LE CHEMIN PARCOURU', 'انظر إلى تقدّمك', 'Chouf fin wselti'],
  };
  const headerLabel = headerLabels[section];
  const headerStart = hasLesson
    ? backLink(section, 'back-link header-back-link')
    : headerLabel
      ? `<span class="eyebrow context-header-label">${icon(headerLabel[0])}${bi(...headerLabel.slice(1))}</span>`
      : `<a class="mobile-brand" href="#/cours"><span class="mobile-brand-text"><span lang="ar" dir="rtl">دروس حبيبي ${icon('heart')}</span><span class="mobile-brand-subtitle" lang="en">7bibiiii! Welcome to France !</span></span></a><span class="topbar-note">${icon('heart')}${bi('Un espace fait pour toi, parce que je crois en toi', 'مساحة من أجلك، لأنني أؤمن بك', 'Blassa lik nta, 7it kanamen bik')}</span>`;
  return `<div class="app-layout">
    <aside class="sidebar">
      <a href="#/cours" class="brand" aria-label="دروس حبيبي — Accueil"><span class="brand-symbol">${icon('book')}${icon('heart')}</span><span lang="ar" dir="rtl" class="brand-ar">دروس حبيبي</span><span class="brand-subtitle">7bibiiii! Welcome to France !</span></a>
      <div class="nav-label">${bi('TON PETIT RENDEZ-VOUS', 'موعدك مع الفرنسية', 'Mew3idek m3a lfrançais')}</div>
      <nav class="desktop-nav" aria-label="Navigation principale — القائمة الرئيسية">${navItems.map(([path, name, label]) => routeLink(path, `${icon(name)}${label()}`, `nav-item ${section === path ? 'active' : ''}`)).join('')}${routeLink('progression', `${icon('chart')}${bi('Ma progression', 'تقدّمي', 'Taqaddom dyali')}`, `nav-item ${section === 'progression' ? 'active' : ''}`)}</nav>
      <div class="sidebar-bottom"><div class="daily-note">${icon('leaf')}<p>${bi('Un peu, chaque jour.', 'قليل كل يوم.', 'Chwiya kol nhar.')}<span class="note-detail">${bi('Tu avances à ton rythme.', 'تتقدّم على راحتك.', 'Katqeddem b rythme dyalek.')}</span></p></div>${routeLink('atelier', `${icon('plus')}${bi('Ajouter une leçon', 'إضافة درس', 'Zid ders')}`, `creator-link ${section === 'atelier' ? 'active' : ''}`)}</div>
    </aside>
    <div class="workspace"><header class="topbar${hasLesson || headerLabel ? ' context-topbar' : ''}">${headerStart}<div class="topbar-tools"><select id="language" aria-label="Langue de traduction — لغة الترجمة"><option value="ar" ${language === 'ar' ? 'selected' : ''}>العربية · Arabe</option><option value="darija" ${language === 'darija' ? 'selected' : ''}>Darija · الدارجة</option></select></div></header>
    <main id="main" tabindex="-1">${content}</main>
    <footer class="page-footer"><span>${icon('heart')}${bi('Fait avec amour, pour tes premiers mots.', 'بكل حب، من أجل كلماتك الأولى.', 'B l7ob, l awwel klmat dyalek.')}</span></footer></div>
    <nav class="mobile-nav" aria-label="Navigation mobile — القائمة">${navItems.map(([path, name, label]) => routeLink(path, `${icon(name)}${label()}`, section === path ? 'active' : '')).join('')}${routeLink('progression', `${icon('chart')}${bi('Progrès', 'تقدّمي', 'Taqaddom')}`, section === 'progression' ? 'active' : '')}${routeLink('atelier', `${icon('plus')}${bi('Ajouter', 'إضافة درس', 'Zid ders')}`, section === 'atelier' ? 'active' : '')}</nav></div>`;
}
function hero() {
  return `<section class="welcome-hero"><div class="hero-copy"><div class="eyebrow">${icon('spark')}${bi('BIENVENUE CHEZ TOI', 'أهلًا بك', 'Mer7ba bik')}</div><h1>${bi('Un petit pas,\nchaque jour.', 'خطوة صغيرة، كل يوم.', 'Khtwa sghira, kol nhar.')}</h1><p>${bi('Le français s’apprend tranquillement.\nOn reprend ensemble ce que tu as appris ?', 'نتعلّم الفرنسية على مهل. هل نراجع معًا ما تعلّمته؟', 'Lfrançais kayt3ellem b chwiya. Nraj3o m3a b3diyatna chno t3ellemti ?')}</p><a class="button primary-button" href="#/cours/${isRead('pronoms') ? 'etre-avoir' : 'pronoms'}">${bi('On commence ?', 'هل نبدأ؟', 'Nebdaw ?')}${icon('arrow')}</a><div class="hero-footnote">${icon('clock')}${bi('Quelques minutes, à ton rythme', 'بضع دقائق، على راحتك', 'Chi dqayeq, b rythme dyalek')}</div></div>
    <div class="hero-art" aria-hidden="true"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="art-spark">✦</span><span class="art-star">✧</span><div class="art-bubble"><span lang="ar">أهلًا</span><span>ahlan</span></div><div class="notebook"><div class="notebook-binding"></div><div class="notebook-content"><div class="notebook-label">${bi('MES PREMIERS MOTS', 'كلماتي الأولى', 'Awwel klmat dyali')}</div><span class="notebook-word">Bonjour<span lang="ar" dir="rtl">مرحبًا</span></span><div class="notebook-line"></div><span class="notebook-word small-word">Je suis…<span lang="ar" dir="rtl">أنا…</span></span><div class="notebook-doodle">${icon('heart')}</div></div></div><div class="art-letter">Aa<span lang="ar">أ ب</span></div><span class="art-caption">petit à petit<span lang="ar" dir="rtl">شويّة بشويّة</span></span></div>
  </section>`;
}
function themeCard(lesson, section, index) {
  const isCourse = section === 'cours';
  const isQuiz = section === 'quiz';
  const mode = section === 'exercices' ? 'exercises' : 'quiz';
  const count = questionsFor(lesson.id, mode).length;
  const progress = stats(lesson.id, isCourse ? undefined : mode);
  const totalQuestions = questionsFor(lesson.id, 'quiz').length + questionsFor(lesson.id, 'exercises').length;
  const ratio = totalQuestions ? Math.round(progress.mastered / totalQuestions * 100) : 0;
  const hasContent = isCourse || count > 0;
  const isCardLink = hasContent;
  const tag = isCardLink ? 'a' : 'article';
  const titleId = `${section}-title-${esc(lesson.id)}`;
  const cardAttrs = isCardLink ? ` href="#/${section}/${esc(lesson.id)}" aria-labelledby="${titleId}"` : '';
  const actionLabel = `${isCourse ? bi('Voir le cours', 'افتح الدرس', '7ell ders') : bi('Commencer', 'ابدأ', 'Bda')}${icon('arrow')}`;
  const action = hasContent
    ? `<span class="card-link" aria-hidden="true">${actionLabel}</span>`
    : `<span class="muted">${bi('Pas encore de questions', 'لا توجد أسئلة بعد', 'Mazal ma kaynch as2ila')}</span>`;
  return `<${tag} class="theme-card ${isCourse ? 'course-card ' : isQuiz ? 'quiz-card ' : 'exercise-card '}${index % 2 ? 'peach-card' : 'sage-card'}"${cardAttrs}>
    <div class="theme-card-top"><span class="theme-icon">${icon(lesson.icon || 'book')}</span></div>
    <div class="theme-card-copy"><h3${isCardLink ? ` id="${titleId}"` : ''}>${bt(lesson.title)}</h3><p>${bt(lesson.description)}</p></div>
    <div class="theme-card-bottom">${isCourse ? (isRead(lesson.id) ? `<span class="read-badge">${icon('check')}${bi('Déjà découvert', 'سبق لك الاطّلاع', 'Deja qriti')}</span>` : `<span class="start-badge"><i></i>${bi('À découvrir', 'للاكتشاف', 'Bach tktechef')}</span>`) : `<span class="start-badge">${bi(progress.sessions ? `${progress.sessions} séance${progress.sessions > 1 ? 's' : ''} terminée${progress.sessions > 1 ? 's' : ''}` : 'À toi de jouer', progress.sessions ? `${progress.sessions} جلسات مكتملة` : 'دورك الآن', progress.sessions ? `${progress.sessions} seances saliti` : 'Nouba dyalek')}</span>`}${action}</div>
    ${isCourse && ratio > 0 ? `<div class="card-progress" aria-label="${ratio}%"><i style="width:${ratio}%"></i></div>` : ''}
  </${tag}>`;
}
function library(section) {
  const lessons = allLessons();
  const isCourse = section === 'cours';
  if (!isCourse) {
    const title = section === 'quiz'
      ? bi('Ici, les erreurs font partie du voyage.', 'الأخطاء جزء من التعلّم.', 'L2akhta2 joz2 mn tta3allom.')
      : bi('Un mot à la bonne place.', 'الكلمة المناسبة في المكان المناسب.', 'Lklma lmnasba f blastha.');
    return `<div class="section-heading practice-heading"><h1>${title}</h1></div><section class="themes-section practice-themes"><div class="themes-grid">${lessons.map((lesson, i) => themeCard(lesson, section, i)).join('')}</div></section>`;
  }
  return `${hero()}<section class="themes-section"><div class="section-title-row"><h2>${bi('Tes petites leçons', 'دروسك الصغيرة', 'Dorous sghar dyalek')}</h2></div><div class="themes-grid">${lessons.map((lesson, i) => themeCard(lesson, section, i)).join('')}</div></section>`;
}

function backLink(section = 'cours', className = 'back-link') { return routeLink(section, `${icon('back')}${bi('Tous les thèmes', 'كل المواضيع', 'Ga3 lmawadi3')}`, className); }
function lessonView(lesson) {
  return `<div class="lesson-heading"><span class="theme-icon">${icon(lesson.icon || 'book')}</span><h1>${bt(lesson.title)}</h1></div>${lesson.id === 'pronoms' ? '' : `<p class="lesson-intro">${bt(lesson.intro)}</p>`}<div class="audio-hint">${icon('volume')}${bi('Écoute, puis répète à voix haute.', 'استمع، ثم كرّر بصوت عالٍ.', 'Sme3, w 3awed b sawt 3ali.')}</div>
  ${lesson.id === 'etre-avoir' ? conjugationView() : `<div class="word-grid">${lesson.cards.map(card => `<article class="word-card"><div class="word-top"><h2>${bt(card)}</h2>${audio(card.fr, true)}</div>${card.sound ? `<div class="phonetic">${bi('Un repère pour le son', 'تقريب النطق', 'Bach t3awnek f nnotq')}<span lang="ar" dir="rtl">${esc(card.sound)}</span></div>` : ''}${card.example ? `<div class="word-example">${bt(card.example)}${audio(card.example.fr, true)}</div>` : ''}</article>`).join('')}</div>`}
  ${lesson.tips?.length ? `<section class="tips-box"><h2>${icon('spark')}${bi('Les petits repères', 'ملاحظات تساعدك', 'Mola7adat t3awnek')}</h2>${lesson.tips.map(t => `<p>${bt(t)}</p>`).join('')}</section>` : ''}<div class="lesson-actions">${button('mark-read', `${icon(isRead(lesson.id) ? 'check' : 'book')}${bi(isRead(lesson.id) ? 'Cours découvert' : 'J’ai découvert ce cours', isRead(lesson.id) ? 'اطّلعت على الدرس' : 'انتهيت من الاطّلاع', isRead(lesson.id) ? 'Qrit had ders' : 'Salit had ders')}`, 'button secondary-button', `data-topic="${esc(lesson.id)}" ${isRead(lesson.id) ? 'disabled' : ''}`)}${questionsFor(lesson.id, 'quiz').length ? routeLink(`quiz/${lesson.id}`, `${bi('Essayer le quiz', 'جرّب الاختبار', 'Jerreb lquiz')}${icon('arrow')}`, 'button primary-button') : ''}${questionsFor(lesson.id, 'exercises').length ? routeLink(`exercices/${lesson.id}`, `${bi('Faire les exercices', 'ابدأ التمارين', 'Dir tamarin')}${icon('pen')}`, 'button secondary-button') : ''}</div>`;
}
function conjugationView() {
  return `<div class="conjugations-grid">${['etre', 'avoir'].map(verb => `<section class="conjugation-panel"><div class="conjugation-title"><span class="verb-number">${verb === 'etre' ? '01' : '02'}</span><h2>${bi(verb === 'etre' ? 'Être' : 'Avoir', verb === 'etre' ? 'للهوية والحالة' : 'للملكية والعمر', verb === 'etre' ? 'Lhowiya w l7ala' : 'Lmilkiya w l3mer')}</h2>${audio(verb === 'etre' ? 'être' : 'avoir', true)}</div>${conjugations.map(row => `<div class="conjugation-row"><div><strong lang="fr">${esc(row[verb].fr)}</strong><span class="verb-meaning" lang="${getState().language === 'ar' ? 'ar' : 'ary-Latn'}" dir="${getState().language === 'ar' ? 'rtl' : 'ltr'}">${esc(row[verb][getState().language])}</span></div><span class="verb-phonetic" lang="ar" dir="rtl">${esc(row[verb].sound)}</span>${audio(row[verb].fr, true)}</div>`).join('')}</section>`).join('')}</div><p class="small-note">${icon('info')}${bi('Les lettres arabes donnent seulement une approximation du son. L’écoute en français reste le meilleur repère. Les équivalents changent selon la phrase.', 'الحروف العربية تقريب للنطق فقط. الاستماع إلى الفرنسية هو المرجع الأفضل. المعنى يتغيّر حسب الجملة.', 'L7orof l3arbiya ghir taqrib dyal ssot. Sme3 lfrançais bach t3ellem nnotq. Lma3na kaytbeddel 7sab ljomla.')}</p>`;
}

function beginSession(topic, mode, mistakesOnly = false) {
  let questions = questionsFor(topic, mode);
  if (mistakesOnly) { const last = lastAnswers(topic, mode); questions = questions.filter(q => last.has(q.id) && !last.get(q.id).correct); }
  if (!questions.length) { toast('Aucune question à revoir pour le moment.', 'لا توجد أسئلة للمراجعة الآن.', 'Ma kaynach as2ila bach t3awed daba.'); return; }
  session = { id: crypto.randomUUID(), topic, mode, questions: shuffle(questions).slice(0, 9).map(q => ({ ...q, options: shuffle(q.options) })), index: 0, selected: null, checked: false, answers: [] };
  result = null; render();
}
function sessionIntro(lesson, mode) {
  const summary = stats(lesson.id, mode);
  const count = Math.min(9, questionsFor(lesson.id, mode).length);
  return `<div class="session-intro"><div class="large-theme-icon">${icon(mode === 'quiz' ? 'quiz' : 'pen')}</div><div class="eyebrow">${bi(mode === 'quiz' ? 'UN PETIT QUIZ' : 'UN PEU DE PRATIQUE', mode === 'quiz' ? 'اختبار قصير' : 'قليل من التدريب', mode === 'quiz' ? 'Quiz sghir' : 'Chwiya dyal tadrib')}</div><h1>${bt(lesson.title)}</h1><div class="session-details"><span>${icon('quiz')}${bi(`${count} questions`, `${count} أسئلة`, `${count} as2ila`)}</span><span>${icon('clock')}${bi('Sans chronomètre', 'بدون توقيت', 'Bla chrono')}</span><span>${icon('volume')}${bi('Avec le son', 'مع الصوت', 'M3a ssot')}</span></div>${button('start', `${bi('C’est parti !', 'لنبدأ!', 'Yallah !')}${icon('arrow')}`, 'button primary-button', `data-topic="${esc(lesson.id)}" data-mode="${mode}"`)}${summary.mistakes ? button('start-mistakes', `${icon('repeat')}${bi(`Revoir mes erreurs (${summary.mistakes})`, `راجع أخطاءك (${summary.mistakes})`, `3awed l2akhta2 (${summary.mistakes})`)}`, 'button text-button', `data-topic="${esc(lesson.id)}" data-mode="${mode}"`) : ''}<a class="subtle-link" href="#/cours/${esc(lesson.id)}">${bi('Relire le cours avant', 'راجع الدرس أولًا', '3awed qra ders lwwel')}</a></div>`;
}
function activeSession() {
  const q = session.questions[session.index];
  const lesson = lessonById(session.topic);
  const isExercise = session.mode === 'exercises';
  const right = session.selected === q.correct;
  const parts = isExercise ? q.prompt.split('…') : [];
  const sentenceMarkup = parts.length > 1 ? `${esc(parts[0])}<span class="blank ${session.checked ? (right ? 'correct-blank' : 'wrong-blank') : ''}">${esc(session.selected || '…')}</span>${esc(parts.slice(1).join('…'))}` : esc(q.prompt);
  const language = getState().language === 'darija' ? 'darija' : 'ar';
  const hint = isExercise && q.hint
    ? `<p class="question-hint ${language === 'darija' ? 'latin' : ''}" lang="${language === 'darija' ? 'ary-Latn' : 'ar'}" dir="${language === 'darija' ? 'ltr' : 'rtl'}">${esc(q.hint[language])}</p>`
    : '';
  return `<section class="exercise-session"><div class="session-top"><div><span class="eyebrow">${esc(lesson.title.fr)}</span><h1 class="session-kind">${isExercise ? 'Complète la phrase' : 'Choisis la bonne réponse'}</h1></div>${button('quit', `${icon('close')}<span class="sr-only">Quitter — مغادرة</span>`, 'icon-button', 'aria-label="Quitter la séance — مغادرة"')}</div>
    <div class="session-progress-label"><span>Question ${session.index + 1} sur ${session.questions.length}</span><span>${Math.round(session.index / session.questions.length * 100)} %</span></div><div class="session-progress"><i style="width:${session.index / session.questions.length * 100}%"></i></div>
    <div class="question-panel">
      <div class="question-panel-header"><div class="question-number">${icon(isExercise ? 'pen' : 'quiz')}<span>${isExercise ? 'À toi de compléter' : 'À toi de choisir'}</span></div>${q.audio ? listenIcon(q.audio) : ''}</div>
      <h2 class="question-text ${isExercise ? 'sentence-question' : ''}${hint ? ' has-hint' : ''}">${isExercise ? sentenceMarkup : esc(q.prompt)}${isExercise && q.verb ? ` <span class="question-verb">(${esc(q.verb)})</span>` : ''}</h2>${hint}
      <div class="answer-options ${isExercise ? 'word-options' : ''}" role="group" aria-label="Réponses"><span class="sr-only">Choisis une réponse puis appuie sur Vérifier.</span>${q.options.map((o, i) => `<button type="button" class="answer-option ${session.selected === o.text ? 'selected' : ''} ${session.checked && o.text === q.correct ? 'correct' : ''} ${session.checked && session.selected === o.text && !right ? 'incorrect' : ''}" data-answer="${i}" aria-pressed="${session.selected === o.text}" ${session.checked ? 'disabled' : ''}><span class="option-letter">${String.fromCharCode(65 + i)}</span><span>${esc(o.text)}</span>${session.checked && o.text === q.correct ? icon('check') : isExercise ? icon('volume', 'option-volume') : ''}</button>`).join('')}</div>
      ${isExercise ? `<label class="audio-toggle"><input type="checkbox" id="auto-audio" ${getState().autoAudio ? 'checked' : ''}> Écouter quand je choisis</label>` : ''}
      ${session.checked ? `<div class="answer-feedback ${right ? 'right-feedback' : 'try-feedback'}" role="status"><div class="feedback-icon">${icon(right ? 'check' : 'leaf')}</div><div class="answer-feedback-copy"><div class="answer-feedback-heading"><h3>${bi(right ? 'Oui, bien joué !' : 'On apprend aussi en essayant.', right ? 'نعم، أحسنت!' : 'نتعلّم أيضًا بالمحاولة.', right ? 'Iyyeh, bravo !' : 'Kant3ellmo ta b ttaj riba.')}</h3>${listenIcon(q.sentence || q.audio || q.correct)}</div><p>${bt(q.explanation)}</p></div></div>` : ''}
      <div class="question-actions">${session.checked ? button('next', `${bi(session.index === session.questions.length - 1 ? 'Voir mon résultat' : 'Question suivante', session.index === session.questions.length - 1 ? 'نتيجتي' : 'السؤال التالي', session.index === session.questions.length - 1 ? 'Nnatija dyali' : 'Sou2al jjay')}${icon('arrow')}`, 'button primary-button') : button('check', `Vérifier ma réponse${icon('check')}`, 'button primary-button', session.selected === null ? 'disabled' : '')}</div>
    </div><p class="session-gentle-note">Prends ton temps. Tu es là pour apprendre. ${icon('heart')}</p>
  </section>`;
}
function resultView() {
  const score = result.answers.filter(a => a.correct).length;
  const total = result.answers.length;
  return `<section class="result-panel"><div class="result-illustration">${icon(score === total ? 'spark' : 'leaf')}</div><div class="eyebrow">${bi('UN PETIT PAS DE PLUS', 'خطوة أخرى إلى الأمام', 'Khtwa khra lqddam')}</div><h1>${bi(score === total ? 'Bravo, 7bibi !' : 'Tu avances, 7bibi !', score === total ? 'أحسنت يا حبيبي!' : 'أنت تتقدّم يا حبيبي!', score === total ? 'Bravo, 7bibi !' : 'Rak katqeddem, 7bibi !')}</h1><div class="score-ring" style="--score:${score / total * 100}%"><span>${score}<small>/ ${total}</small></span></div><p>${bi(`${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''}. Chaque essai t’aide à retenir.`, `${score} إجابات صحيحة. كل محاولة تساعدك على التذكّر.`, `${score} ajwiba s7i7a. Kol mo7awala kat3awnek t7fed.`)}</p><div class="result-actions">${score < total ? button('retry-result', `${icon('repeat')}${bi('Revoir mes erreurs', 'راجع أخطاءك', '3awed l2akhta2')}`, 'button primary-button') : ''}${button('restart-result', `${icon('repeat')}${bi('Une autre petite séance', 'جلسة قصيرة أخرى', 'Seance sghira khra')}`, `button ${score === total ? 'primary-button' : 'secondary-button'}`)}${routeLink('cours', `${icon('book')}${bi('Retrouver mes cours', 'العودة إلى دروسي', 'Nerje3 l dorous')}`, 'button secondary-button')}</div><div class="result-review">${result.answers.map(a => `<div>${icon(a.correct ? 'check' : 'repeat')}<span lang="fr">${esc(a.question.sentence || a.question.audio || a.question.correct)}</span>${audio(a.question.sentence || a.question.audio || a.question.correct, true)}</div>`).join('')}</div></section>`;
}

function progressionView() {
  const summary = stats();
  const readCount = allLessons().filter(lesson => isRead(lesson.id)).length;
  return `<div class="section-heading progression-heading"><h1>${bi('Chaque petit pas compte.', 'كل خطوة صغيرة لها قيمة.', 'Kol khtwa sghira kat7seb.')}</h1></div>
    <div class="stats-grid">${[[readCount, 'Cours découverts', 'دروس اطّلعت عليها', 'Dorous qriti', 'book'], [summary.sessions, 'Séances terminées', 'جلسات مكتملة', 'Seances saliti', 'flag'], [summary.total ? `${summary.percent} %` : '—', 'De bonnes réponses', 'إجابات صحيحة', 'Ajwiba s7i7a', 'check']].map(([value, fr, ar, darija, name]) => `<article class="stat-card">${icon(name)}<strong>${value}</strong>${bi(fr, ar, darija)}</article>`).join('')}</div>
    <section class="progress-topics"><h2>${bi('Thème par thème', 'موضوعًا بموضوع', 'Mawdo3 b mawdo3')}</h2>${allLessons().map(lesson => {
      const s = stats(lesson.id);
      const quizCount = questionsFor(lesson.id, 'quiz').length;
      const total = quizCount + questionsFor(lesson.id, 'exercises').length;
      const titleId = `progress-title-${esc(lesson.id)}`;
      return `<a class="progress-topic" href="#/${quizCount ? 'quiz' : 'cours'}/${esc(lesson.id)}" aria-labelledby="${titleId}"><span class="theme-icon">${icon(lesson.icon || 'book')}</span><div class="progress-topic-main"><h3 id="${titleId}">${bt(lesson.short || lesson.title)}</h3><div class="topic-progress-track"><i style="width:${total ? s.mastered / total * 100 : 0}%"></i></div><p>${bi(`${s.mastered} / ${total} questions réussies au dernier essai`, `${s.mastered} / ${total} أسئلة أُجيب عنها بشكل صحيح في آخر محاولة`, `${s.mastered} / ${total} as2ila s7i7a f akher mo7awala`)}</p></div><span class="card-link" aria-hidden="true">${quizCount ? bi('Réviser', 'راجع', 'Raje3') : bi('Voir le cours', 'افتح الدرس', '7ell ders')}${icon('arrow')}</span></a>`;
    }).join('')}</section>
    <section class="transfer-panel"><div class="transfer-title">${icon('folder')}<h2>${bi('Mes progrès, d’un appareil à l’autre', 'تقدّمي من جهاز إلى آخر', 'Taqaddom dyali mn appareil l akhor')}</h2></div>
      <div class="transfer-actions">${button('export-progress', `${icon('download')}${bi('Exporter ma progression', 'تصدير تقدّمي', 'Exporti taqaddom')}`, 'button secondary-button')}<label class="button secondary-button file-button">${icon('upload')}${bi('Importer ma progression', 'استيراد تقدّمي', 'Importi taqaddom')}<input id="import-progress" type="file" accept="application/json,.json"></label>${button('reset-progress', `${icon('close')}${bi('Effacer ma progression', 'مسح تقدّمي', 'Mse7 taqaddom dyali')}`, 'button secondary-button danger-button')}</div>
      <p class="small-note">${icon('info')}${bi('Sauvegarde locale sur cet appareil. Le transfert est manuel. Importer deux fois le même fichier ne crée pas de doublons.', 'الحفظ محلي على هذا الجهاز، والنقل يدوي. استيراد الملف نفسه مرتين لا يكرّر النتائج.', 'Sauvegarde f had appareil. Ttransfert b yeddek. Ila importiti nefs lfichier jouj merrat, ma kaytzadch doublon.')}</p><p id="import-status" role="status"></p>
    </section>`;
}

function render(focus = false) {
  const [sectionRaw, topic] = location.hash.replace(/^#\/?/, '').split('/');
  const section = ['cours', 'quiz', 'exercices', 'progression', 'atelier'].includes(sectionRaw) ? sectionRaw : 'cours';
  let content;
  const lesson = topic && lessonById(topic);
  if (section === 'atelier') content = renderEditor(allLessons(), published, publishedLoaded);
  else if (section === 'progression') content = progressionView();
  else if (topic && !lesson) content = `<div class="empty-state"><h1>${bi('Ce cours est introuvable.', 'لم يُعثر على هذا الدرس.', 'Ma lqinach had ders.')}</h1>${routeLink('cours', bi('Retour aux cours', 'العودة إلى الدروس', 'Rje3 l dorous'), 'button primary-button')}</div>`;
  else if (section === 'cours') content = lesson ? lessonView(lesson) : library(section);
  else {
    const mode = section === 'quiz' ? 'quiz' : 'exercises';
    if (lesson) content = session?.topic === topic && session?.mode === mode ? activeSession() : result?.topic === topic && result?.mode === mode ? resultView() : sessionIntro(lesson, mode);
    else content = library(section);
  }
  app.innerHTML = shell(content, section, lesson);
  document.title = `${lesson?.title.fr || ({ cours: 'Mes cours', quiz: 'Mes quiz', exercices: 'Mes exercices', progression: 'Ma progression', atelier: 'Ajouter une leçon' })[section]} — دروس حبيبي`;
  bind();
  if (section === 'atelier') bindEditor({ refresh: () => render(), published, publishedLoaded });
  if (focus) document.getElementById('main').focus({ preventScroll: true });
}

function bind() {
  document.getElementById('language').addEventListener('change', e => { preference('language', e.target.value); render(); });
  document.getElementById('auto-audio')?.addEventListener('change', e => preference('autoAudio', e.target.checked));
  document.getElementById('import-progress')?.addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 15_000_000) throw new Error('Fichier trop volumineux.');
      const added = importProgress(JSON.parse(await file.text())); render();
      toast(`${added} élément${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} à ta progression.`, `أُضيف ${added} عناصر إلى تقدّمك.`, `${added} elements tzado f taqaddom.`);
    } catch { toast('Ce fichier de progression est invalide. Choisis une sauvegarde exportée depuis ce site.', 'ملف التقدّم غير صالح. اختر نسخة صُدّرت من هذا الموقع.', 'Lfichier ma s7i7ch. Khtar sauvegarde mn had site.'); }
  });
  app.querySelectorAll('[data-answer]').forEach(el => el.addEventListener('click', () => {
    if (!session || session.checked) return;
    const q = session.questions[session.index]; const choice = q.options[Number(el.dataset.answer)]; session.selected = choice.text;
    if (session.mode === 'exercises' && getState().autoAudio) speak(q.prompt.split('. ')[0].replace('…', choice.text).replace('J’ ai', 'J’ai'));
    render(); app.querySelector(`[data-answer="${el.dataset.answer}"]`)?.focus({ preventScroll: true });
  }));
  app.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', () => {
    const action = el.dataset.action;
    if (action === 'start' || action === 'start-mistakes') beginSession(el.dataset.topic, el.dataset.mode, action === 'start-mistakes');
    if (action === 'mark-read') { markRead(el.dataset.topic); render(); toast('Un petit pas de plus !', 'خطوة أخرى إلى الأمام!', 'Khtwa khra lqddam !'); }
    if (action === 'check' && session && session.selected !== null && !session.checked) {
      const q = session.questions[session.index]; const correct = session.selected === q.correct;
      session.checked = true; session.answers.push({ question: q, selected: session.selected, correct });
      record({ kind: 'answer', topic: session.topic, mode: session.mode, sessionId: session.id, questionId: q.id, correct });
      render(); app.querySelector('[data-action="next"]')?.focus({ preventScroll: true });
    }
    if (action === 'next' && session?.checked) {
      if (session.index + 1 === session.questions.length) {
        record({ kind: 'complete', topic: session.topic, mode: session.mode, sessionId: session.id, score: session.answers.filter(a => a.correct).length, total: session.questions.length });
        result = { ...session }; session = null; render(true); window.scrollTo({ top: 0, behavior: 'smooth' });
      } else { session.index++; session.selected = null; session.checked = false; render(); app.querySelector('.question-text')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
    if (action === 'quit') quitSession();
    if (action === 'restart-result') beginSession(result.topic, result.mode);
    if (action === 'retry-result') beginSession(result.topic, result.mode, true);
    if (action === 'export-progress') downloadJSON(`habibi-progression-${new Date().toISOString().slice(0, 10)}.json`, exportProgress());
    if (action === 'reset-progress') confirmProgressReset();
  }));
}
function confirmProgressReset() {
  const modal = document.getElementById('modal');
  modal.innerHTML = `<form id="reset-progress-form" class="modal-content">
    <h2 id="reset-progress-title">${bi('Effacer ma progression ?', 'هل تريد مسح تقدّمك؟', 'Tmse7 taqaddom dyalek ?')}</h2>
    <p id="reset-progress-details">${bi('Les résultats et les cours découverts seront effacés sur cet appareil. Les leçons créées seront conservées.', 'ستُمسح النتائج والدروس التي اطّلعت عليها على هذا الجهاز. ستبقى الدروس التي أنشأتها محفوظة.', 'Ghadi ytmes7o nnata2ij w dorous li qriti f had appareil. Dorous li sewwebti ghadi ybqaw.')}</p>
    <label class="form-field reset-confirmation-field" for="reset-progress-confirmation">${bi('Écris « 7bibi » pour confirmer.', 'اكتب 7bibi للتأكيد.', 'Kteb 7bibi bach t2ekked.')}<input id="reset-progress-confirmation" type="text" required pattern="7bibi" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="reset-progress-details reset-progress-error" autofocus></label>
    <p id="reset-progress-error" class="reset-progress-error" role="alert" hidden></p>
    <div class="modal-actions"><button type="button" class="button secondary-button" id="cancel-progress-reset">${bi('Annuler', 'إلغاء', 'Lghi')}</button><button type="submit" class="button danger-button" id="confirm-progress-reset" disabled>${bi('Effacer ma progression', 'مسح تقدّمي', 'Mse7 taqaddom dyali')}</button></div>
  </form>`;
  modal.setAttribute('aria-labelledby', 'reset-progress-title');
  modal.addEventListener('close', () => modal.removeAttribute('aria-labelledby'), { once: true });
  const input = document.getElementById('reset-progress-confirmation');
  const confirmButton = document.getElementById('confirm-progress-reset');
  const error = document.getElementById('reset-progress-error');
  input.addEventListener('input', () => {
    confirmButton.disabled = input.value !== '7bibi';
    error.hidden = true;
    error.textContent = '';
  });
  document.getElementById('cancel-progress-reset').onclick = () => modal.close();
  document.getElementById('reset-progress-form').onsubmit = event => {
    event.preventDefault();
    if (input.value !== '7bibi') { input.focus(); return; }
    if (!resetProgress()) {
      error.innerHTML = bi('Impossible d’enregistrer la remise à zéro. Ta progression est conservée. Réessaie.', 'تعذّر حفظ إعادة الضبط. لم يُمسح تقدّمك. حاول مجددًا.', 'Ma qdernach nsejjlo remise à zéro. Taqaddom dyalek baqi. 3awed jerreb.');
      error.hidden = false;
      return;
    }
    modal.close();
    session = null;
    result = null;
    render(true);
    window.scrollTo(0, 0);
    toast('Ta progression a été effacée sur cet appareil.', 'مُسح تقدّمك على هذا الجهاز.', 'Taqaddom dyalek tmesa7 f had appareil.');
  };
  modal.showModal();
}
function quitSession() {
  const modal = document.getElementById('modal');
  modal.innerHTML = `<div class="modal-content"><h2>${bi('On fait une petite pause ?', 'هل نأخذ استراحة؟', 'Ndiro chi pause ?')}</h2><p>${bi('Tes réponses vérifiées sont déjà enregistrées. Tu pourras commencer une nouvelle séance quand tu voudras.', 'إجاباتك التي تحقّقت منها محفوظة. يمكنك بدء جلسة جديدة متى شئت.', 'L2ajwiba li t2ekkedti menhom tsjjlo. Tqder tebda seance jdida foqma bghiti.')}</p><div class="modal-actions"><button class="button secondary-button" id="continue-session">${bi('Je continue', 'أكمل', 'Nkemmel')}</button><button class="button primary-button" id="leave-session">${bi('Faire une pause', 'آخذ استراحة', 'Ndir pause')}</button></div></div>`;
  modal.showModal();
  document.getElementById('continue-session').onclick = () => modal.close();
  document.getElementById('leave-session').onclick = () => { modal.close(); session = null; render(true); };
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-speak]'); if (el) speak(el.dataset.speak);
});
document.getElementById('modal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
window.addEventListener('hashchange', () => {
  if (location.hash !== currentRoute) { session = null; result = null; }
  currentRoute = location.hash; window.speechSynthesis?.cancel(); render(true); window.scrollTo(0, 0);
});
window.addEventListener('storage', e => { if (e.key === 'habibi:v1') toast('Des données ont changé dans un autre onglet. Recharge cette page pour les retrouver.', 'تغيّرت البيانات في علامة تبويب أخرى. أعد تحميل الصفحة.', 'Data tbeddlat f onglet akhor. 3awed 7ell had page.'); });

async function start() {
  try {
    const response = await fetch(new URL('../data/custom-lessons.json', import.meta.url), { cache: 'no-cache' });
    if (!response.ok) throw new Error('Leçons indisponibles');
    const data = await response.json();
    if (data.version !== 1 || !Array.isArray(data.lessons) || data.lessons.length > 200) throw new Error('Format invalide');
    const ids = new Set();
    published = data.lessons.map(l => { validateLesson(l); if (ids.has(l.id)) throw new Error('Identifiant dupliqué'); ids.add(l.id); return l; }); publishedLoaded = true;
  } catch { toast('Les leçons ajoutées n’ont pas pu être chargées. Les cours de départ restent disponibles.', 'تعذّر تحميل الدروس المضافة. الدروس الأولى متاحة.', 'Dorous li tzado ma tchargawch. Dorous lwala baqyin.'); }
  currentRoute = location.hash; render();
  if (!canSave()) toast('La sauvegarde sur cet appareil est indisponible. Pense à exporter ta progression.', 'الحفظ على هذا الجهاز غير متاح. صدّر تقدّمك للاحتفاظ به.', 'Sauvegarde ma khddamach. Exporti taqaddom bach t7afed 3lih.');
}
start();
