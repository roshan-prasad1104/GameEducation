import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/mockData';

/**
 * useTranslation — returns a `t(key)` function bound to the current language.
 * Reads from the global dictionaries in mockData (which already carry en/hi/or/te/mr/ta).
 *
 *   const { t, locale } = useTranslation();
 *   <p>{t('platformName')}</p>
 *
 * Supports dotted keys: `t('common.save')` looks up `common.save` if present.
 */
export const useTranslation = () => {
  const { language } = useApp();
  const dict = TRANSLATIONS[language] ?? TRANSLATIONS.en;

  const t = (key) => {
    if (!key) return '';
    if (key.includes('.')) {
      const [head, ...rest] = key.split('.');
      const nested = dict?.[head];
      if (nested && typeof nested === 'object') {
        return rest.reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), nested) ?? key;
      }
    }
    return dict?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
  };

  return { t, locale: language };
};

/** Format a number using locale rules (1,234.5 vs 1.234,5). */
export const formatNumber = (n, locale = 'en') => {
  try {
    return new Intl.NumberFormat(localeToIntl(locale)).format(n);
  } catch {
    return String(n);
  }
};

const localeToIntl = (id) => ({ en: 'en-IN', hi: 'hi-IN', or: 'or-IN', te: 'te-IN', mr: 'mr-IN', ta: 'ta-IN' }[id] ?? 'en-IN');
