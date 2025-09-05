import Vue from 'vue';
const en: { [k: string]: string } = require('./locales/en.json');

// Reactive state so templates depending on l() update when language changes.
export const i18nState = Vue.observable({ locale: 'en', version: 0 });

let current: { [k: string]: string } = en;

// List of available display languages (extend when new JSON files are added)
// Name is what we show in the dropdown. Code is the file name (code.json)
export const availableDisplayLanguages: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  // Pseudo-locale for fun / testing text expansion and placeholder handling
  { code: 'en_x_uwu', name: 'Cyute Engwish' }
];

export function setLanguage(lang: string | undefined): void {
  if (!lang) lang = 'en';
  if (lang === i18nState.locale) return;
  try {
    const data: { [k: string]: string } = require(`./locales/${lang}.json`);
    current = { ...en, ...data }; // merge to guarantee fallback keys
    i18nState.locale = lang;
  } catch (e) {
    // Fallback to English if file missing
    current = en;
    i18nState.locale = 'en';
    if (process.env.NODE_ENV !== 'production')
      console.warn('Missing locale file for', lang, e);
  }
  i18nState.version++; // trigger re-render
}

export default function l(key: string, ...args: (string | number)[]): string {
  i18nState.version;
  let str = current[key];
  if (str === undefined) {
    str = en[key];
    if (str === undefined) {
      if (process.env.NODE_ENV !== 'production')
        console.warn(`Missing translation key: ${key}`);
      return key; // show key as last resort
    }
  }
  for (let i = args.length - 1; i >= 0; i--)
    str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i].toString());
  return str;
}
