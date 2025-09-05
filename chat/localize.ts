import Vue from 'vue';
// Keep base English file (en.json) as upstream template for Weblate, but default runtime locale is en_us.
const en: { [k: string]: string } = require('./locales/en.json');
let enUS: { [k: string]: string };
try {
  enUS = require('./locales/en_us.json');
} catch {
  enUS = en;
}

// Reactive state so templates depending on l() update when language changes.
export const i18nState = Vue.observable({ locale: 'en_us', version: 0 });

let current: { [k: string]: string } = { ...en, ...enUS }; // start with US English combined over base

// List of available display languages (extend when new JSON files are added)
// Name is what we show in the dropdown. Code is the file name (code.json)
export const availableDisplayLanguages: { code: string; name: string }[] = [
  { code: 'en_us', name: 'English (US)' },
  { code: 'en-x-uwu', name: 'Cyute Engwish' }
];

export function setLanguage(lang: string | undefined): void {
  if (!lang) lang = 'en_us';
  if (lang === 'en-US') lang = 'en_us';
  if (lang === 'en_x_uwu') lang = 'en-x-uwu';
  if (lang === i18nState.locale) return;
  try {
    const data: { [k: string]: string } = require(`./locales/${lang}.json`);
    // Always layer: base template -> en_us (if distinct) -> requested
    current = { ...en, ...enUS, ...data };
    i18nState.locale = lang;
  } catch (e) {
    current = { ...en, ...enUS };
    i18nState.locale = 'en_us';
    if (process.env.NODE_ENV !== 'production')
      console.warn('Missing locale file for', lang, e);
  }
  i18nState.version++; // trigger re-render
}

export default function l(key: string, ...args: (string | number)[]): string {
  i18nState.version;
  let str = current[key];
  if (str === undefined) {
    str = enUS[key] !== undefined ? enUS[key] : en[key];
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
