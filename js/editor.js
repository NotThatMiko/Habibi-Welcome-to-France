import { validateLesson } from './content.js';
import { getState, saveDraft, deleteDraft, downloadJSON } from './store.js';
import { bi, bt, esc, icon, toast } from './ui.js';
import { config } from './config.js';

let working;
let editingId;
let dirty = false;
const blankText = () => ({ fr: '', ar: '', darija: '' });
const newLesson = () => ({ title: blankText(), description: blankText(), intro: blankText(), week: 2, cards: [], quiz: [], exercises: [] });
function input(label, path, value, options = {}) {
  const id = `field-${path.replaceAll('.', '-')}`;
  return `<label class="form-field ${options.wide ? 'wide-field' : ''}" for="${id}">${bi(...label)}${options.textarea ? `<textarea id="${id}" data-model="${path}" rows="${options.rows || 3}" maxlength="${options.max || 4000}" ${options.lang ? `lang="${options.lang}" dir="${options.lang === 'ar' ? 'rtl' : 'ltr'}"` : ''}>${esc(value)}</textarea>` : `<input id="${id}" data-model="${path}" type="${options.type || 'text'}" value="${esc(value)}" ${options.type === 'number' ? 'min="1" max="520"' : 'maxlength="500"'} ${options.lang ? `lang="${options.lang}" dir="${options.lang === 'ar' ? 'rtl' : 'ltr'}"` : ''}>`}</label>`;
}
function localizedFields(value, path, textarea = false) {
  return `<div class="form-columns">${input(['Français', 'الفرنسية', 'Lfrançais'], `${path}.fr`, value.fr, { textarea, lang: 'fr' })}${input(['Arabe', 'العربية', 'L3arbiya'], `${path}.ar`, value.ar, { textarea, lang: 'ar' })}${input(['Darija · lettres et chiffres', 'الدارجة بحروف لاتينية وأرقام', 'Darija b l7orof w l2arqam'], `${path}.darija`, value.darija, { textarea, lang: 'ary-Latn' })}</div>`;
}
function questionFields(type) {
  return working[type].map((q, i) => `<fieldset class="editor-question"><legend>${bi(`Question ${i + 1}`, `السؤال ${i + 1}`, `Sou2al ${i + 1}`)}</legend><button type="button" class="remove-row" data-remove="${type}.${i}" aria-label="Supprimer cette question — حذف السؤال">${icon('close')}</button>${input([type === 'quiz' ? 'La question' : 'La phrase à compléter · utilise … pour le trou', type === 'quiz' ? 'السؤال' : 'الجملة الناقصة · استعمل … للفراغ', type === 'quiz' ? 'Sou2al' : 'Ljomla nnaqsa · sta3mel …'], `${type}.${i}.prompt`, q.prompt, { wide: true })}<div class="form-columns answers-form">${input(['Bonne réponse', 'الإجابة الصحيحة', 'Ljawab s7i7'], `${type}.${i}.correct`, q.correct)}${[0, 1, 2].map(n => input([`Autre réponse ${n + 1}${n ? ' · facultative' : ''}`, `إجابة أخرى ${n + 1}${n ? ' · اختيارية' : ''}`, `Jawab akhor ${n + 1}${n ? ' · ikhtiyari' : ''}`], `${type}.${i}.distractors.${n}`, q.distractors[n])).join('')}</div><p class="field-hint">${bi('Une petite explication après la réponse', 'شرح قصير بعد الإجابة', 'Char7 sghir mn b3d ljawab')}</p>${localizedFields(q.explanation, `${type}.${i}.explanation`, true)}${input(['Texte français à écouter · facultatif', 'النص الفرنسي للاستماع · اختياري', 'Nass français bach tsme3 · ikhtiyari'], `${type}.${i}.audio`, q.audio, { wide: true })}</fieldset>`).join('');
}
export function renderEditor(lessons, published, loaded) {
  if (!working) working = newLesson();
  const custom = lessons.filter(l => l.id.startsWith('custom-'));
  return `<div class="section-heading"><div class="eyebrow">${icon('pen')}${bi('LE PETIT ATELIER', 'ورشة الدروس', 'Warchat dorous')}</div><h1>${bi('Une nouvelle leçon, tout simplement.', 'درس جديد بكل بساطة.', 'Ders jdid b soh ola.')}</h1><p class="lead">${bi('Prépare le cours et ses questions. Essaie-les ici, puis exporte le fichier pour GitHub.', 'حضّر الدرس وأسئلته. جرّبها هنا، ثم صدّر الملف إلى GitHub.', 'Wejjed ders w as2ila dyalo. Jerrebhom hna, w exporti lfichier l GitHub.')}</p></div>
  <section class="editor-howto"><span>${icon('pen')}${bi('1. Je crée ma leçon', '١. أحضّر الدرس', '1. Nwejjed ders')}</span>${icon('arrow')}<span>${icon('check')}${bi('2. Je la teste ici', '٢. أجرّبه هنا', '2. Njer rbo hna')}</span>${icon('arrow')}<span>${icon('upload')}${bi('3. Je la publie sur GitHub', '٣. أنشره على GitHub', '3. Npublier f GitHub')}</span></section>
  ${custom.length ? `<section class="existing-lessons"><h2>${bi('Mes leçons ajoutées', 'دروسي المضافة', 'Dorous li zedt')}</h2>${custom.map(l => `<div class="existing-lesson"><span>${bt(l.title)}<small>${bi(getState().drafts.some(d => d.id === l.id) ? 'Copie locale sur cet appareil' : 'Dans le fichier publié', getState().drafts.some(d => d.id === l.id) ? 'نسخة محلية على هذا الجهاز' : 'في الملف المنشور', getState().drafts.some(d => d.id === l.id) ? 'Copie locale f had appareil' : 'F lfichier publié')}</small></span><div><a class="icon-button" href="#/cours/${esc(l.id)}" aria-label="Voir le cours — افتح الدرس">${icon('book')}</a><button class="icon-button" data-edit="${esc(l.id)}" aria-label="Modifier — تعديل">${icon('pen')}</button>${getState().drafts.some(d => d.id === l.id) ? `<button class="icon-button" data-delete-draft="${esc(l.id)}" aria-label="Supprimer la copie locale — حذف النسخة المحلية">${icon('close')}</button>` : ''}</div></div>`).join('')}</section>` : ''}
  <form id="lesson-form" class="editor-form"><section class="editor-section"><div class="editor-section-title"><span>01</span><h2>${bi('Le cours', 'الدرس', 'Ders')}</h2>${editingId ? `<button type="button" class="button small-button secondary-button" id="new-lesson">${icon('plus')}${bi('Nouvelle leçon', 'درس جديد', 'Ders jdid')}</button>` : ''}</div>${input(['Semaine', 'الأسبوع', 'Simana'], 'week', working.week, { type: 'number' })}<h3>${bi('Le titre', 'العنوان', 'L3onwan')}</h3>${localizedFields(working.title, 'title')}<h3>${bi('Une phrase de présentation', 'جملة تقديمية', 'Jomla bach tqeddem ders')}</h3>${localizedFields(working.description, 'description')}<h3>${bi('Le récapitulatif du cours', 'ملخّص الدرس', 'Mol akhas ders')}</h3>${localizedFields(working.intro, 'intro', true)}</section>
  <section class="editor-section"><div class="editor-section-title"><span>02</span><h2>${bi('Les mots à apprendre', 'الكلمات للتعلّم', 'Lklmat bach t3ellem')}</h2></div><p>${bi('Ajoute les mots ou petites phrases du cours. Un bouton d’écoute sera créé pour chacun.', 'أضف كلمات الدرس أو جمله القصيرة. سيظهر زر استماع لكل منها.', 'Zid klmat wla jomal sghar. Kol wa7da ghadi ykoun 7daha bouton ssot.')}</p><div id="editor-cards">${working.cards.map((card, i) => `<fieldset class="editor-word"><legend>${bi(`Mot ${i + 1}`, `الكلمة ${i + 1}`, `Klma ${i + 1}`)}</legend><button type="button" class="remove-row" data-remove="cards.${i}" aria-label="Supprimer ce mot — حذف الكلمة">${icon('close')}</button>${localizedFields(card, `cards.${i}`)}</fieldset>`).join('')}</div><button type="button" class="button secondary-button" data-add="cards">${icon('plus')}${bi('Ajouter un mot', 'إضافة كلمة', 'Zid klma')}</button></section>
  ${['quiz', 'exercises'].map((type, i) => `<section class="editor-section"><div class="editor-section-title"><span>0${i + 3}</span><h2>${bi(type === 'quiz' ? 'Les questions du quiz' : 'Les phrases à compléter', type === 'quiz' ? 'أسئلة الاختبار' : 'الجمل الناقصة', type === 'quiz' ? 'As2ilat lquiz' : 'Jomal nnaqsa')}</h2></div>${questionFields(type)}<button type="button" class="button secondary-button" data-add="${type}">${icon('plus')}${bi(type === 'quiz' ? 'Ajouter une question' : 'Ajouter un exercice', type === 'quiz' ? 'إضافة سؤال' : 'إضافة تمرين', type === 'quiz' ? 'Zid sou2al' : 'Zid tamrin')}</button></section>`).join('')}
  <div id="editor-status" role="status"></div><div class="editor-save-bar"><span>${bi('Enregistré uniquement sur cet appareil avant publication.', 'يُحفظ على هذا الجهاز فقط قبل النشر.', 'Kaytsejjel ghir f had appareil qbel nn achr.')}</span><button type="submit" class="button primary-button">${icon('check')}${bi('Enregistrer et essayer', 'احفظ وجرّب', 'Sejjel w jerreb')}</button></div></form>
  <section class="publish-panel"><h2>${icon('upload')}${bi('Partager les leçons sur le site', 'نشر الدروس على الموقع', 'Ncher dorous f site')}</h2><p>${bi('Le fichier contient toutes les leçons ajoutées. Les deux cours de départ restent inclus automatiquement.', 'يحتوي الملف على كل الدروس المضافة. الدرسَان الأولان يبقيان متاحين تلقائيًا.', 'Lfichier fih ga3 dorous li zedt. Jouj dorous lwala kaybqaw automatiquement.')}</p><ol><li>${bi('Télécharge le fichier « custom-lessons.json » avec le bouton ci-dessous.', 'نزّل ملف « custom-lessons.json » بالزر أدناه.', 'Telechargi fichier « custom-lessons.json » b bouton li lte7t.')}</li><li>${bi('Dans GitHub, ouvre le dossier « data », puis « Add file → Upload files ». Remplace « custom-lessons.json » par le fichier téléchargé.', 'في GitHub، افتح مجلد data، ثم Add file → Upload files. استبدل custom-lessons.json بالملف المنزّل.', 'F GitHub, 7ell dossier data, mn b3d Add file → Upload files. Beddel custom-lessons.json b lfichier li telechargiti.')}</li><li>${bi('Clique sur « Commit changes ». Le site se mettra à jour après la publication de GitHub Pages.', 'اضغط Commit changes. سيتحدّث الموقع بعد نشر GitHub Pages.', 'Dghet 3la Commit changes. Site ghadi yt7eddet mn b3d nn achr dyal GitHub Pages.')}</li></ol><div class="transfer-actions"><button type="button" class="button primary-button" id="export-lessons" ${!loaded || !custom.length ? 'disabled' : ''}>${icon('download')}${bi('Télécharger les leçons', 'تنزيل الدروس', 'Telechargi dorous')}</button><label class="button secondary-button file-button">${icon('upload')}${bi('Importer un fichier de leçons', 'استيراد ملف دروس', 'Importi fichier dorous')}<input type="file" id="import-lessons" accept="application/json,.json"></label><a class="button secondary-button" href="https://github.com/${esc(config.githubRepository)}/tree/${esc(config.githubBranch)}/data" target="_blank" rel="noopener noreferrer">${icon('folder')}${bi('Ouvrir le dossier GitHub', 'افتح مجلد GitHub', '7ell dossier GitHub')}</a></div>${!loaded ? `<p class="error-message">${bi('Recharge le site avec une connexion avant d’exporter : les leçons déjà publiées doivent d’abord être chargées.', 'أعد تحميل الموقع مع اتصال قبل التصدير لتحميل الدروس المنشورة أولًا.', '3awed 7ell site b connexion qbel export bach tchargi dorous li publié.')}</p>` : ''}<p class="small-note">${icon('info')}${bi('Cet atelier prépare les fichiers. La publication sur GitHub nécessite ton compte GitHub. Aucun mot de passe n’est enregistré dans le site.', 'هذه الورشة تحضّر الملفات. النشر يحتاج حسابك على GitHub. لا تُحفظ أي كلمة مرور في الموقع.', 'Had lwarcha katwejjed lfichiers. Nnachr khas compte GitHub dyalek. Ma kaytsejjel 7tta mot de passe f site.')}</p></section>`;
}
export function bindEditor({ refresh, published, publishedLoaded }) {
  const preserve = () => { const y = window.scrollY; refresh(); window.scrollTo(0, y); };
  document.querySelectorAll('[data-model]').forEach(el => el.addEventListener('input', () => {
    const keys = el.dataset.model.split('.'); let object = working;
    for (const key of keys.slice(0, -1)) object = object[key];
    object[keys.at(-1)] = el.type === 'number' ? Number(el.value) : el.value; dirty = true;
  }));
  document.querySelectorAll('[data-add]').forEach(el => el.onclick = () => {
    const type = el.dataset.add;
    working[type].push(type === 'cards' ? blankText() : { prompt: '', correct: '', distractors: ['', '', ''], explanation: blankText(), audio: '' }); dirty = true;
    preserve();
    document.querySelector(`[data-model="${type}.${working[type].length - 1}.${type === 'cards' ? 'fr' : 'prompt'}"]`)?.focus();
  });
  document.querySelectorAll('[data-remove]').forEach(el => el.onclick = () => { const [type, i] = el.dataset.remove.split('.'); working[type].splice(Number(i), 1); dirty = true; preserve(); });
  document.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => {
    const lesson = [...published, ...getState().drafts].findLast(l => l.id === el.dataset.edit);
    if (!lesson) return;
    const load = () => {
      working = structuredClone(lesson); editingId = lesson.id;
      for (const type of ['quiz', 'exercises']) working[type] = lesson[type].map(q => ({ ...q, distractors: [...q.options.filter(o => o.text !== q.correct).map(o => o.text), '', '', ''].slice(0, 3) }));
      dirty = false; refresh(); document.getElementById('lesson-form').scrollIntoView({ behavior: 'smooth' });
    };
    if (dirty) confirmAction('Ouvrir cette leçon ?', 'فتح هذا الدرس؟', 'N7ell had ders ?', 'Les changements non enregistrés seront remplacés.', 'ستُستبدل التغييرات غير المحفوظة.', 'Tb dilat li ma tsejjloch ghadi ytbedlo.', load); else load();
  });
  document.querySelectorAll('[data-delete-draft]').forEach(el => el.onclick = () => confirmAction('Supprimer cette copie locale ?', 'حذف النسخة المحلية؟', 'N7yed had copie locale ?', 'La version déjà publiée sur GitHub restera disponible.', 'ستبقى النسخة المنشورة على GitHub متاحة.', 'Version li publié f GitHub ghadi tbqa.', () => { deleteDraft(el.dataset.deleteDraft); if (editingId === el.dataset.deleteDraft) { working = newLesson(); editingId = null; dirty = false; } refresh(); }));
  document.getElementById('new-lesson')?.addEventListener('click', () => {
    const reset = () => { working = newLesson(); editingId = null; dirty = false; refresh(); };
    if (dirty) confirmAction('Commencer une nouvelle leçon ?', 'بدء درس جديد؟', 'Nebda ders jdid ?', 'Les changements non enregistrés seront remplacés.', 'ستُستبدل التغييرات غير المحفوظة.', 'Tbdilat li ma tsejjloch ghadi ytbedlo.', reset); else reset();
  });
  document.getElementById('lesson-form').onsubmit = e => {
    e.preventDefault();
    try {
      const id = editingId || `custom-${crypto.randomUUID()}`;
      const lesson = { id, icon: 'book', week: working.week, date: new Date().toISOString().slice(0, 10), title: structuredClone(working.title), short: structuredClone(working.title), description: structuredClone(working.description), intro: structuredClone(working.intro), cards: structuredClone(working.cards), tips: [] };
      for (const type of ['quiz', 'exercises']) lesson[type] = working[type].map((q, i) => {
        if (type === 'exercises' && !q.prompt.includes('…')) throw new Error('Un exercice doit contenir le caractère … à la place du mot manquant.');
        const correct = q.correct.trim();
        return { id: `${id}-${type}-${i}`, prompt: q.prompt.trim(), correct, options: [correct, ...q.distractors.map(s => s.trim()).filter(Boolean)].map(text => ({ text, speech: q.audio?.trim() || text })), explanation: structuredClone(q.explanation), audio: type === 'quiz' ? q.audio.trim() || null : null, sentence: type === 'exercises' ? q.prompt.replace('…', correct) : null };
      });
      validateLesson(lesson);
      if (!saveDraft(lesson)) throw new Error('La sauvegarde locale est indisponible. Autorise le stockage dans ce navigateur.');
      editingId = id; dirty = false; refresh();
      toast('Leçon enregistrée sur cet appareil. Tu peux l’essayer dans les cours.', 'حُفظ الدرس على هذا الجهاز. يمكنك تجربته من الدروس.', 'Ders tsejjel f had appareil. Tqder tjer rbo f dorous.');
      const status = document.getElementById('editor-status');
      status.innerHTML = `<div class="save-success">${icon('check')}${bi('Ta leçon est prête à être essayée.', 'درسك جاهز للتجربة.', 'Ders dyalek wajed.')}<a href="#/cours/${id}" class="button secondary-button">${bi('Voir ma leçon', 'افتح درسي', 'Chouf ders dyali')}${icon('arrow')}</a></div>`; status.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      document.getElementById('editor-status').innerHTML = `<p class="error-message">${bi(error.message, 'تحقّق من الحقول: النصوص باللغات الثلاث، إجابتان مختلفتان على الأقل، وتصحيح لكل سؤال.', 'T2ekked mn les champs: tlata dyal lloghat, jouj ajwiba mkhtalfin 3la l2a qal, w correction dyal kol sou2al.')}</p>`;
      document.getElementById('editor-status').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  document.getElementById('export-lessons').onclick = () => {
    if (!publishedLoaded) return;
    if (dirty) { toast('Enregistre la leçon en cours avant d’exporter.', 'احفظ الدرس الحالي قبل التصدير.', 'Sejjel ders lwwel qbel export.'); return; }
    const map = new Map([...published, ...getState().drafts].map(l => [l.id, l]));
    downloadJSON('custom-lessons.json', { version: 1, lessons: [...map.values()] });
  };
  document.getElementById('import-lessons').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 10_000_000) throw new Error('Fichier trop volumineux');
      const data = JSON.parse(await file.text());
      if (data.version !== 1 || !Array.isArray(data.lessons) || data.lessons.length > 200 || new Set(data.lessons.map(l => l.id)).size !== data.lessons.length) throw new Error('Format invalide');
      data.lessons.forEach(validateLesson);
      data.lessons.forEach(saveDraft); preserve(); toast('Leçons importées sur cet appareil.', 'استُوردت الدروس على هذا الجهاز.', 'Dorous timportaw f had appareil.');
    } catch { toast('Fichier de leçons invalide. Rien n’a été importé.', 'ملف الدروس غير صالح. لم يُستورد شيء.', 'Fichier dorous ma s7i7ch. Walo ma timporta.'); }
  };
}
function confirmAction(fr, ar, darija, detailFr, detailAr, detailDarija, onConfirm) {
  const dialog = document.getElementById('modal');
  dialog.innerHTML = `<div class="modal-content"><h2>${bi(fr, ar, darija)}</h2><p>${bi(detailFr, detailAr, detailDarija)}</p><div class="modal-actions"><button type="button" class="button secondary-button" id="cancel-editor-action">${bi('Annuler', 'إلغاء', 'Lghi')}</button><button type="button" class="button primary-button" id="confirm-editor-action">${bi('Continuer', 'متابعة', 'Kemmel')}</button></div></div>`;
  dialog.showModal(); document.getElementById('cancel-editor-action').onclick = () => dialog.close(); document.getElementById('confirm-editor-action').onclick = () => { dialog.close(); onConfirm(); };
}
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
