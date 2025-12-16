import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Only import English translation statically (most common, ~50KB)
// Other locales will be loaded dynamically when needed to reduce initial bundle size
import translationEn from './en/translation.json';

export const defaultNS = 'translation';

// Lazy load locale translations - only load when language changes
const loadLocale = async (lng: string) => {
  try {
    switch (lng) {
      case 'ar': return (await import('./ar/translation.json')).default;
      case 'bs': return (await import('./bs/translation.json')).default;
      case 'ca': return (await import('./ca/translation.json')).default;
      case 'cs': return (await import('./cs/translation.json')).default;
      case 'zh-Hans': return (await import('./zh-Hans/translation.json')).default;
      case 'zh-Hant': return (await import('./zh-Hant/translation.json')).default;
      case 'da': return (await import('./da/translation.json')).default;
      case 'de': return (await import('./de/translation.json')).default;
      case 'es': return (await import('./es/translation.json')).default;
      case 'et': return (await import('./et/translation.json')).default;
      case 'fa': return (await import('./fa/translation.json')).default;
      case 'fr': return (await import('./fr/translation.json')).default;
      case 'it': return (await import('./it/translation.json')).default;
      case 'nb': return (await import('./nb/translation.json')).default;
      case 'pl': return (await import('./pl/translation.json')).default;
      case 'pt-BR': return (await import('./pt-BR/translation.json')).default;
      case 'pt-PT': return (await import('./pt-PT/translation.json')).default;
      case 'ru': return (await import('./ru/translation.json')).default;
      case 'ja': return (await import('./ja/translation.json')).default;
      case 'ka': return (await import('./ka/translation.json')).default;
      case 'sv': return (await import('./sv/translation.json')).default;
      case 'ko': return (await import('./ko/translation.json')).default;
      case 'lv': return (await import('./lv/translation.json')).default;
      case 'th': return (await import('./th/translation.json')).default;
      case 'tr': return (await import('./tr/translation.json')).default;
      case 'ug': return (await import('./ug/translation.json')).default;
      case 'vi': return (await import('./vi/translation.json')).default;
      case 'nl': return (await import('./nl/translation.json')).default;
      case 'id': return (await import('./id/translation.json')).default;
      case 'he': return (await import('./he/translation.json')).default;
      case 'hu': return (await import('./hu/translation.json')).default;
      case 'hy': return (await import('./hy/translation.json')).default;
      case 'fi': return (await import('./fi/translation.json')).default;
      case 'bo': return (await import('./bo/translation.json')).default;
      case 'sl': return (await import('./sl/translation.json')).default;
      case 'uk': return (await import('./uk/translation.json')).default;
      default: return null;
    }
  } catch (error) {
    console.warn(`Failed to load locale ${lng}:`, error);
    return null;
  }
};

// Start with only English to reduce initial bundle size (~2.3 MB saved)
const initialResources = {
  en: { translation: translationEn },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: {
      'zh-TW': ['zh-Hant', 'en'],
      'zh-HK': ['zh-Hant', 'en'],
      zh: ['zh-Hans', 'en'],
      default: ['en'],
    },
    fallbackNS: 'translation',
    ns: ['translation'],
    debug: false,
    defaultNS,
    resources: initialResources,
    interpolation: { escapeValue: false },
  });

// Load locale dynamically when language changes
i18n.on('languageChanged', async (lng) => {
  if (lng !== 'en' && !i18n.hasResourceBundle(lng, 'translation')) {
    const translation = await loadLocale(lng);
    if (translation) {
      i18n.addResourceBundle(lng, 'translation', translation, true, true);
    }
  }
});

// Preload the detected language if not English
const detectedLng = i18n.language || 'en';
if (detectedLng !== 'en') {
  loadLocale(detectedLng).then((translation) => {
    if (translation) {
      i18n.addResourceBundle(detectedLng, 'translation', translation, true, true);
    }
  });
}

export default i18n;
