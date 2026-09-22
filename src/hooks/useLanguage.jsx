import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations } from '../i18n/translations';
import { STATUS_LABELS, FUNNEL_TOOLTIPS, DISTRIBUTION_TOOLTIPS } from '../utils/statusLabels';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'dashboard_lang';

function detectInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
  } catch {
    // localStorage puede fallar en modo privado — seguimos con el default
  }
  // Default en inglés: el demo se comparte con clientes internacionales.
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // no-op si localStorage no está disponible
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'es' ? 'en' : 'es');
  }, [lang, setLang]);

  const t = useCallback((key) => translations[lang]?.[key] ?? translations.es[key] ?? key, [lang]);

  // Traduce un valor de estado del CRM (ej. "Compró") solo para mostrar,
  // nunca para comparar/filtrar — la clave real de datos sigue en español.
  const statusLabel = useCallback((key) => STATUS_LABELS[lang]?.[key] ?? key, [lang]);
  const funnelTooltip = useCallback((key) => FUNNEL_TOOLTIPS[lang]?.[key] ?? '', [lang]);
  const distributionTooltip = useCallback((key) => DISTRIBUTION_TOOLTIPS[lang]?.[key] ?? '', [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, statusLabel, funnelTooltip, distributionTooltip }),
    [lang, setLang, toggleLang, t, statusLabel, funnelTooltip, distributionTooltip]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage debe usarse dentro de <LanguageProvider>');
  return ctx;
}
