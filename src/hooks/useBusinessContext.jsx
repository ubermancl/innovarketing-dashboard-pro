import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { AI_MODELS } from '../utils/constants';

const DEFAULT_CONTEXT = {
  businessName: '',
  logoUrl: '',
  logoInitials: '',
  logoColor: '#F97316',
  country: '',
  city: '',
  vertical: '',
  businessModel: '',
  avgTicket: '',
  recurring: false,
  avgClientLifetime: '',
  monthlyAdSpend: '',
  adPlatforms: [],
  teamSize: '',
  monthlyGoal: '',
  mainChannel: '',
  openrouterKey: '',
  aiModel: AI_MODELS[0].id,
  onboardingComplete: false,
};

const BusinessContextCtx = createContext(null);

export function BusinessContextProvider({ children }) {
  const [businessContext, setBusinessContextState] = useState(DEFAULT_CONTEXT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/business-context', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setBusinessContextState(prev => ({ ...DEFAULT_CONTEXT, ...prev, ...data }));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const saveBusinessContext = useCallback((updates) => {
    setBusinessContextState(prev => {
      const next = { ...prev, ...updates };
      fetch('/api/business-context', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const resetBusinessContext = useCallback(() => {
    setBusinessContextState(DEFAULT_CONTEXT);
    fetch('/api/business-context', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_CONTEXT),
    }).catch(() => {});
  }, []);

  return (
    <BusinessContextCtx.Provider value={{ businessContext, saveBusinessContext, resetBusinessContext, isLoading }}>
      {children}
    </BusinessContextCtx.Provider>
  );
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContextCtx);
  if (!ctx) throw new Error('useBusinessContext debe usarse dentro de BusinessContextProvider');
  return ctx;
}
