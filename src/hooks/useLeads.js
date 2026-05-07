import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/client';
import { filterByDateRange, getDateRange } from '../utils/calculations';
import { useBusinessContext } from './useBusinessContext';

const STORAGE_KEY = 'ik_dashboard_leads_cache';

function getFromStorage() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache válido por 1 hora
      if (Date.now() - timestamp < 3600000) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error leyendo cache:', err);
  }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (err) {
    console.error('Error guardando cache:', err);
  }
}

export function useLeads() {
  const { businessContext } = useBusinessContext();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Filtros
  const [dateFilter, setDateFilter] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  // Detectar conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cargar datos
  const fetchLeads = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await api.leads.getAll({
        limit: 1000,
        sort: '-CreatedAt',
      }, businessContext.nocodbToken);

      const data = response.data || [];
      setLeads(data);
      setLastUpdated(new Date());
      saveToStorage(data);

    } catch (err) {
      console.error('Error cargando leads:', err);
      setError(err.message);

      // Usar cache si hay error
      const cached = getFromStorage();
      if (cached) {
        setLeads(cached);
        setError('Mostrando datos guardados - ' + err.message);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    // Intentar cargar desde cache primero para mostrar algo rápido
    const cached = getFromStorage();
    if (cached) {
      setLeads(cached);
      setIsLoading(false);
    }

    // Luego cargar datos frescos
    fetchLeads();
  }, [fetchLeads]);

  // Refrescar datos
  const refresh = useCallback(() => {
    return fetchLeads(true);
  }, [fetchLeads]);

  const clearCache = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setLeads([]);
  }, []);

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Filtro por fecha
    const { start, end } = getDateRange(
      dateFilter,
      customDateRange.start,
      customDateRange.end
    );
    result = filterByDateRange(result, 'CreatedAt', start, end);

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead =>
        (lead.Nombre && lead.Nombre.toLowerCase().includes(query)) ||
        (lead.Phone && lead.Phone.includes(query)) ||
        (lead.Email && lead.Email.toLowerCase().includes(query))
      );
    }

    // Filtro por estado
    if (statusFilter) {
      result = result.filter(lead => lead['Estado CRM'] === statusFilter);
    }

    // Filtro por distrito
    if (districtFilter) {
      result = result.filter(lead =>
        lead['Distrito Residencia'] === districtFilter ||
        lead['Distrito Trabajo'] === districtFilter ||
        lead['Distrito Usado Para Calificar'] === districtFilter
      );
    }

    return result;
  }, [leads, dateFilter, customDateRange, searchQuery, statusFilter, districtFilter]);

  // Obtener valores únicos para filtros
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(leads.map(l => l['Estado CRM']).filter(Boolean));
    return Array.from(statuses).sort();
  }, [leads]);

  const uniqueDistricts = useMemo(() => {
    const districts = new Set();
    leads.forEach(l => {
      if (l['Distrito Residencia']) districts.add(l['Distrito Residencia']);
      if (l['Distrito Trabajo']) districts.add(l['Distrito Trabajo']);
    });
    return Array.from(districts).sort();
  }, [leads]);

  return {
    // Datos
    leads,
    filteredLeads,
    allLeads: leads,

    // Estados
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    isOnline,

    // Acciones
    refresh,
    clearCache,

    // Filtros
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    districtFilter,
    setDistrictFilter,

    // Opciones de filtro
    uniqueStatuses,
    uniqueDistricts,
  };
}

export default useLeads;
