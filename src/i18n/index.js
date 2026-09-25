import en from './en';
import hi from './hi';
import legacy from './legacy';
import { LANGUAGES as ALL_LANGUAGES } from '../data/constants';

/** Interface languages: English and Hindi are complete; Odia and Telugu cover the original screens' labels. */
export const LANGUAGES = ALL_LANGUAGES.map((l) => ({ ...l, label: l.native, short: l.id.toUpperCase() }));

const DICTS = { en, hi };

const lookup = (dict, key) => key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict);

/**
 * translate('hi', 'dashboard.welcome', { name: 'Aarav' })
 * Order: language dictionary → English dictionary → original flat dictionary (language, then English) → key.
 */
export function translate(language, key, vars) {
  let str = lookup(DICTS[language] ?? en, key);
  if (typeof str !== 'string') str = legacy[language]?.[key];
  if (typeof str !== 'string') str = lookup(en, key);
  if (typeof str !== 'string') str = legacy.en[key];
  if (typeof str !== 'string') return key;
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
}
