// Compares every UI dictionary in src/i18n with en.js: same keys, same {placeholders},
// no empty strings, and text written in the language's script.
// Usage: node scripts/check-i18n.mjs            (exit code 1 on any error)
import en from '../src/i18n/en.js';
import hi from '../src/i18n/hi.js';

const SCRIPTS = { hi: [0x0900, 0x097f], or: [0x0b00, 0x0b7f], te: [0x0c00, 0x0c7f] };
const dicts = { hi };
for (const lang of ['or', 'te']) {
  try {
    dicts[lang] = (await import(`../src/i18n/${lang}.js`)).default;
  } catch {
    console.log(`WARN  ${lang}.js not present`);
  }
}

const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  (v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]));
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const ratio = (s, [lo, hi2]) => {
  const letters = [...String(s).replace(/\{\w+\}/g, '')].filter((c) => /\p{L}/u.test(c));
  if (!letters.length) return 1;
  return letters.filter((c) => c.codePointAt(0) >= lo && c.codePointAt(0) <= hi2).length / letters.length;
};

const base = new Map(flatten(en));
let errors = 0;
for (const [lang, dict] of Object.entries(dicts)) {
  const entries = new Map(flatten(dict));
  const missing = [...base.keys()].filter((k) => !entries.has(k));
  const extra = [...entries.keys()].filter((k) => !base.has(k));
  const report = (msg) => { errors += 1; console.log(`ERROR ${lang}: ${msg}`); };
  if (missing.length) report(`missing ${missing.length} key(s): ${missing.slice(0, 15).join(', ')}${missing.length > 15 ? ' …' : ''}`);
  if (extra.length) report(`unknown key(s): ${extra.join(', ')}`);
  for (const [key, value] of entries) {
    if (!base.has(key)) continue;
    if (typeof value !== 'string' || !value.trim()) report(`${key} is empty`);
    else if (placeholders(value) !== placeholders(base.get(key))) report(`${key} placeholders {${placeholders(value)}} != {${placeholders(base.get(key))}}`);
    else if (/[A-Za-z]{3}/.test(base.get(key)) && ratio(value, SCRIPTS[lang]) < 0.3) report(`${key} is not in the ${lang} script: "${value}"`);
  }
  console.log(`${lang}: ${entries.size}/${base.size} keys`);
}
console.log(`${errors} error(s)`);
process.exitCode = errors ? 1 : 0;
