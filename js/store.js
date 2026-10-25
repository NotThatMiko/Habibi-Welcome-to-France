const KEY = 'habibi:v1';
const empty = () => ({ version: 1, language: 'ar', autoAudio: true, events: [], drafts: [] });
let writable = true;
let state;
try {
  const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
  state = raw?.version === 1 ? { ...empty(), ...raw } : empty();
  if (!Array.isArray(state.events) || !Array.isArray(state.drafts)) state = empty();
} catch { state = empty(); writable = false; }

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); writable = true; }
  catch { writable = false; }
  return writable;
}
export function canSave() { return writable; }
export function getState() { return state; }
export function preference(key, value) { state[key] = value; persist(); }
export function record(event) {
  const value = { ...event, id: crypto.randomUUID(), at: new Date().toISOString() };
  state.events.push(value); persist(); return value;
}
export function markRead(topic) {
  if (!state.events.some(e => e.kind === 'read' && e.topic === topic)) record({ kind: 'read', topic });
}
export function isRead(topic) { return state.events.some(e => e.kind === 'read' && e.topic === topic); }
export function lastAnswers(topic, mode) {
  const map = new Map();
  for (const event of [...state.events].sort((a, b) => a.at.localeCompare(b.at))) {
    if (event.kind === 'answer' && (!topic || event.topic === topic) && (!mode || event.mode === mode)) map.set(event.questionId, event);
  }
  return map;
}
export function stats(topic, mode) {
  const answers = state.events.filter(e => e.kind === 'answer' && (!topic || e.topic === topic) && (!mode || e.mode === mode));
  const sessions = state.events.filter(e => e.kind === 'complete' && (!topic || e.topic === topic) && (!mode || e.mode === mode));
  const correct = answers.filter(e => e.correct).length;
  const last = lastAnswers(topic, mode);
  return { total: answers.length, correct, sessions: sessions.length, percent: answers.length ? Math.round(correct / answers.length * 100) : 0, mistakes: [...last.values()].filter(e => !e.correct).length, mastered: [...last.values()].filter(e => e.correct).length };
}

export function validateProgress(data) {
  if (!data || data.version !== 1 || data.type !== 'habibi-progress' || !Array.isArray(data.events) || data.events.length > 100000) throw new Error('Ce fichier n’est pas une sauvegarde de progression valide.');
  const seen = new Set();
  data.events.forEach(e => {
    if (!e || typeof e.id !== 'string' || e.id.length > 150 || seen.has(e.id) || typeof e.topic !== 'string' || e.topic.length > 100 || !['read', 'answer', 'complete'].includes(e.kind) || typeof e.at !== 'string' || !Number.isFinite(Date.parse(e.at))) throw new Error('La sauvegarde contient une entrée invalide.');
    if (e.kind === 'answer' && (typeof e.correct !== 'boolean' || typeof e.questionId !== 'string' || !['quiz', 'exercises'].includes(e.mode))) throw new Error('Réponse sauvegardée invalide.');
    if (e.kind === 'complete' && (!['quiz', 'exercises'].includes(e.mode) || !Number.isInteger(e.score) || !Number.isInteger(e.total) || e.score < 0 || e.score > e.total || e.total < 1)) throw new Error('Résultat sauvegardé invalide.');
    seen.add(e.id);
  });
  return data;
}
export function importProgress(data) {
  validateProgress(data);
  const ids = new Set(state.events.map(e => e.id));
  let added = 0;
  for (const event of data.events) if (!ids.has(event.id)) { state.events.push(event); ids.add(event.id); added++; }
  state.events.sort((a, b) => a.at.localeCompare(b.at));
  persist(); return added;
}
export function exportProgress() { return { version: 1, type: 'habibi-progress', exportedAt: new Date().toISOString(), events: structuredClone(state.events) }; }
export function saveDraft(lesson) {
  const index = state.drafts.findIndex(l => l.id === lesson.id);
  if (index < 0) state.drafts.push(lesson); else state.drafts[index] = lesson;
  return persist();
}
export function deleteDraft(id) { state.drafts = state.drafts.filter(l => l.id !== id); persist(); }
export function downloadJSON(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
