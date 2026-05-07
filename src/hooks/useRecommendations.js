import { useState, useEffect, useCallback } from 'react';
import { fetchRecommendations, createRecommendations, updateRecommendation, deleteRecommendation, generateSessionId } from '../api/recommendations';
import { useBusinessContext } from './useBusinessContext';

export function useRecommendations(recsConfigured) {
  const { businessContext } = useBusinessContext();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!recsConfigured) { setNotConfigured(true); return; }
    setIsLoading(true);
    try {
      const { data, notConfigured: nc } = await fetchRecommendations(100, businessContext.nocodbToken);
      setRecommendations(data);
      setNotConfigured(nc);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [recsConfigured]);

  useEffect(() => { load(); }, [load]);

  // Guarda los resultados completos de una sesión de diagnóstico en NocoDB.
  // Crea: 1 registro del cuello de botella + 3 insights + 1 nota estratégica (si existe).
  const saveSession = useCallback(async ({ bottleneck, insights, strategic_note, model, usage, costData }) => {
    if (notConfigured) return null;
    setIsSaving(true);
    const sessionId = generateSessionId();
    const now = new Date().toISOString();
    const tokens = usage?.total_tokens || 0;
    const cost = costData?.totalCost || 0;

    const records = [];

    if (bottleneck) {
      records.push({
        Titulo: bottleneck.title || 'Cuello de botella',
        Dato: bottleneck.evidence || '',
        Accion: bottleneck.description || '',
        Tipo: 'cuello_botella',
        Sesion_ID: sessionId,
        Modelo_IA: model || '',
        Estado: 'Pendiente',
        Nota_Cliente: '',
        Tokens_Sesion: tokens,
        Costo_Sesion: cost,
      });
    }

    (insights || []).slice(0, 3).forEach((ins, i) => {
      records.push({
        Titulo: ins.title || `Insight ${i + 1}`,
        Dato: ins.data || '',
        Accion: ins.action || '',
        Tipo: 'insight',
        Sesion_ID: sessionId,
        Modelo_IA: model || '',
        Estado: 'Pendiente',
        Nota_Cliente: '',
        Tokens_Sesion: tokens,
        Costo_Sesion: cost,
      });
    });

    if (strategic_note) {
      records.push({
        Titulo: 'Nota estratégica',
        Dato: '',
        Accion: strategic_note,
        Tipo: 'nota_estrategica',
        Sesion_ID: sessionId,
        Modelo_IA: model || '',
        Estado: 'Pendiente',
        Nota_Cliente: '',
        Tokens_Sesion: tokens,
        Costo_Sesion: cost,
      });
    }

    try {
      await createRecommendations(records, businessContext.nocodbToken);
      // Recargar la lista para mostrar los nuevos registros
      await load();
      return sessionId;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [notConfigured, load]);

  // Elimina un registro individual por ID
  const deleteRecord = useCallback(async (id) => {
    try {
      await deleteRecommendation(id, businessContext.nocodbToken);
      setRecommendations(prev => prev.filter(r => r.Id !== id));
    } catch (e) {
      setError(e.message);
    }
  }, [businessContext.nocodbToken]);

  // Elimina todos los registros de una sesión por su Sesion_ID
  const deleteSession = useCallback(async (sessionId) => {
    const toDelete = recommendations.filter(r => r.Sesion_ID === sessionId);
    try {
      await Promise.all(toDelete.map(r => deleteRecommendation(r.Id, businessContext.nocodbToken)));
      setRecommendations(prev => prev.filter(r => r.Sesion_ID !== sessionId));
    } catch (e) {
      setError(e.message);
    }
  }, [recommendations, businessContext.nocodbToken]);

  // Actualiza el estado de una recomendación y refleja el cambio localmente
  const updateStatus = useCallback(async (id, estado, nota = undefined) => {
    const update = { Estado: estado };
    if (nota !== undefined) update.Nota_Cliente = nota;
    try {
      await updateRecommendation(id, update, businessContext.nocodbToken);
      setRecommendations(prev =>
        prev.map(r => r.Id === id ? { ...r, Estado: estado, ...(nota !== undefined ? { Nota_Cliente: nota } : {}) } : r)
      );
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // Agrupa las recomendaciones por sesión para mostrar el historial
  const groupedBySession = recommendations.reduce((acc, rec) => {
    const key = rec.Sesion_ID || 'sin_sesion';
    if (!acc[key]) acc[key] = { sessionId: key, date: rec.CreatedAt, records: [] };
    acc[key].records.push(rec);
    return acc;
  }, {});

  const sessions = Object.values(groupedBySession)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Historial formateado para incluir en el prompt de IA
  const historyForPrompt = recommendations
    .slice(0, 40)
    .map(r => `[${r.CreatedAt?.split('T')[0] || '?'}] ${r.Tipo === 'cuello_botella' ? 'Cuello de botella' : 'Acción'}: "${r.Titulo}" → ${r.Estado?.toUpperCase() || 'PENDIENTE'}`)
    .join('\n');

  return {
    recommendations,
    sessions,
    historyForPrompt,
    isLoading,
    isSaving,
    notConfigured,
    error,
    saveSession,
    updateStatus,
    deleteRecord,
    deleteSession,
    reload: load,
  };
}
