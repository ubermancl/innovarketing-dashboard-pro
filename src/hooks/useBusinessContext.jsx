import { useState, useCallback, createContext, useContext } from 'react';
import { AI_MODELS } from '../utils/constants';

const CONTEXT_KEY = 'ik_business_context';

const DEFAULT_CONTEXT = {
  businessName: '',
  logoUrl: '',        // URL de imagen o vacío para usar las iniciales
  logoInitials: '',   // Ej: "IK", "NC" — si está vacío se auto-genera desde businessName
  logoColor: '#F97316', // Color de fondo del avatar cuando no hay imagen
  country: '',
  city: '',
  vertical: '',           // clínica | inmobiliaria | academia | retail | agencia | ecommerce | otro
  businessModel: '',      // B2B | B2C
  avgTicket: '',          // USD
  recurring: false,
  avgClientLifetime: '',  // meses
  monthlyAdSpend: '',     // USD
  adPlatforms: [],        // Meta | Google | TikTok | ninguna
  teamSize: '',
  monthlyGoal: '',        // USD
  mainChannel: '',        // orgánico | pagado | referidos | mixto
  openrouterKey: '',
  nocodbToken: '',
  aiModel: AI_MODELS[0].id,
  onboardingComplete: false,
};

function loadContext() {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    if (!raw) return DEFAULT_CONTEXT;
    return { ...DEFAULT_CONTEXT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONTEXT;
  }
}

const BusinessContextCtx = createContext(null);

export function BusinessContextProvider({ children }) {
  const [businessContext, setBusinessContextState] = useState(loadContext);

  const saveBusinessContext = useCallback((updates) => {
    setBusinessContextState(prev => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem(CONTEXT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const resetBusinessContext = useCallback(() => {
    localStorage.removeItem(CONTEXT_KEY);
    setBusinessContextState(DEFAULT_CONTEXT);
  }, []);

  return (
    <BusinessContextCtx.Provider value={{ businessContext, saveBusinessContext, resetBusinessContext }}>
      {children}
    </BusinessContextCtx.Provider>
  );
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContextCtx);
  if (!ctx) throw new Error('useBusinessContext debe usarse dentro de BusinessContextProvider');
  return ctx;
}
