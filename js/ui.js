import { getState } from './store.js';

export const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const loc = (fr, ar, darija) => ({ fr, ar, darija });
export function bi(fr, ar, darija, className = '') {
  const lang = getState().language;
  const sub = lang === 'darija' ? (darija || ar) : ar;
  return `<span class="bilingual ${className}"><span class="primary" lang="fr">${esc(fr)}</span>${sub ? `<span class="translation ${lang === 'darija' ? 'latin' : ''}" lang="${lang === 'darija' ? 'ary-Latn' : 'ar'}" dir="${lang === 'darija' ? 'ltr' : 'rtl'}">${esc(sub)}</span>` : ''}</span>`;
}
export const bt = (value, className) => bi(value.fr, value.ar, value.darija, className);
const paths = {
  book: '<path d="M3 5c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2Z"/><path d="M12 7v14"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  quiz: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 8 1 1 2-2m3 1h3M8 14h3m3 0h3M8 17h3"/>',
  pen: '<path d="m14 4 6 6M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15Z"/>',
  chart: '<path d="M4 3v17h17M8 15v-4m5 4V6m5 9v-6"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 4v2"/>',
  spark: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"/>',
  volume: '<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  leaf: '<path d="M20 3C8 2 1 9 7 16c7 6 14-1 13-13ZM3 21 16 8"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.5"/>',
  repeat: '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>',
  flag: '<path d="M5 21V3c5-3 9 4 14 1v10c-5 3-9-4-14-1"/>',
  folder: '<path d="M3 7V4h6l3 3h9v13H3Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18"/>',
};
export const icon = (name, className = '') => `<svg class="icon ${className}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
export function audio(text, compact = false, translated = true) {
  const label = `Écouter : ${text} — استمع`;
  return `<button type="button" class="audio-button ${compact ? 'compact' : ''}" data-speak="${esc(text)}" aria-label="${esc(label)}" title="${esc(label)}">${icon('volume')}${compact ? '' : translated ? bi('Écouter', 'استمع', 'Sme3') : '<span>Écouter</span>'}</button>`;
}
let toastTimer;
export function toast(fr, ar, darija) {
  const el = document.getElementById('toast'); el.innerHTML = `${icon('info')}${bi(fr, ar, darija)}`; el.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 6500);
}

let voices = [];
const loadVoices = () => { voices = window.speechSynthesis?.getVoices() || []; };
loadVoices();
window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
export function speak(text) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    toast('L’audio n’est pas disponible dans ce navigateur.', 'الصوت غير متاح في هذا المتصفح.', 'Ssot ma khddamch f had navigateur.'); return;
  }
  loadVoices(); window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text)); utterance.lang = 'fr-FR'; utterance.rate = 0.78; utterance.pitch = 1;
  const french = voices.find(v => v.lang === 'fr-FR') || voices.find(v => v.lang.startsWith('fr'));
  if (french) utterance.voice = french;
  utterance.onerror = event => { if (!['interrupted', 'canceled'].includes(event.error)) toast('L’audio est indisponible. Vérifie les voix françaises de ton appareil.', 'الصوت غير متاح. تحقّق من وجود صوت فرنسي على جهازك.', 'Ssot ma khddamch. Chouf wach 3ndek sawt français f appareil.'); };
  window.speechSynthesis.speak(utterance);
}
