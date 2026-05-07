import { useState, useEffect, useCallback } from 'react';

const DEFAULT = {
  client_name: '',
  currency: 'USD',
  currency_locale: 'es-419',
  nocodb_base_url: '',
  nocodb_base_id: '',
  nocodb_leads_table_id: '',
  nocodb_recs_table_id: '',
  nocodb_token_env_configured: false,
  field_mapping: {
    estadoCRM: 'Estado CRM',
    montoVenta: 'Monto Venta Cerrada (PEN)',
    origenLead: 'Origen del Lead',
    ultimaModificacion: 'Última Modificación',
    fechaAgendamiento: 'Fecha de agendamiento',
    nombre: 'Nombre',
    phone: 'Phone',
    email: 'Email',
  },
};

export function useInstallerConfig() {
  const [config, setConfig] = useState(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/installer/config', { credentials: 'include' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setConfig(prev => ({ ...DEFAULT, ...prev, ...data }));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const saveConfig = useCallback(async (updates) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/installer/config', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const { config: saved } = await res.json();
      setConfig(prev => ({ ...prev, ...saved }));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const leadsConfigured = Boolean(config.nocodb_leads_table_id && config.nocodb_base_url);
  const recsConfigured = Boolean(config.nocodb_recs_table_id && config.nocodb_base_url);

  return { config, isLoading, isSaving, error, saveConfig, fetchConfig, recsConfigured, leadsConfigured };
}
