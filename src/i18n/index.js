import en from './en';
import hi from './hi';

export const LANGUAGES = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'hi', label: 'हिन्दी', short: 'हि' },
];

const DICTS = { en, hi };

const lookup = (dict, key) => key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict);

/**
 * translate('hi', 'dashboard.welcome', { name: 'Aarav' })
 * Falls back to English, then to the key itself, so a missing string is visible but never crashes.
 */
export function translate(language, key, vars) {
  let str = lookup(DICTS[language] ?? en, key);
  if (typeof str !== 'string') str = lookup(en, key);
  if (typeof str !== 'string') return key;
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
}
