import { useMemo } from 'react';
import {
  calculateMetrics,
  calculateFunnel,
  calculatePipeline,
  calculateDistribution,
  calculateLeadsByDay,
  calculateAdvancedMetrics,
  generateAlerts,
  generateInsights,
  calculateCAC,
  calculateSourceDistribution,
  calculateAIvsManual,
} from '../utils/calculations';

export function useStats(leads, dateFilter = 'month', customStart = null, customEnd = null, businessContext = null) {
  const metrics = useMemo(() => {
    const base = calculateMetrics(leads, dateFilter, customStart, customEnd);
    // Añadir CAC si hay ad spend configurado
    const cac = calculateCAC(businessContext?.monthlyAdSpend, base.newLeads);
    return { ...base, cac };
  }, [leads, dateFilter, customStart, customEnd, businessContext]);

  const funnelData = useMemo(() => calculateFunnel(leads), [leads]);
  const pipelineData = useMemo(() => calculatePipeline(leads), [leads]);

  const statusDistribution = useMemo(() => calculateDistribution(leads, 'Estado CRM'), [leads]);
  const districtDistribution = useMemo(() => calculateDistribution(leads, 'Distrito Usado Para Calificar'), [leads]);
  const originDistribution = useMemo(() => calculateSourceDistribution(leads), [leads]);

  const disqualificationReasons = useMemo(() => {
    const disqualified = leads.filter(l => l['Estado CRM'] === 'Descalificado');
    return calculateDistribution(disqualified, 'Razón Descalificación');
  }, [leads]);

  const leadsByDay = useMemo(() => calculateLeadsByDay(leads, 30), [leads]);

  const appointmentsByDay = useMemo(() => {
    return calculateLeadsByDay(leads, 30, 'Fecha de agendamiento');
  }, [leads]);

  const revenueByWeek = useMemo(() => {
    const weeks = {};
    leads.forEach(lead => {
      if (lead['Monto Venta Cerrada (PEN)'] && lead['CreatedAt']) {
        try {
          const date = new Date(lead['CreatedAt']);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          weeks[weekKey] = (weeks[weekKey] || 0) + parseFloat(lead['Monto Venta Cerrada (PEN)']);
        } catch {}
      }
    });
    return Object.entries(weeks)
      .map(([week, revenue]) => ({ week, revenue }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8);
  }, [leads]);

  const advancedMetrics = useMemo(() => calculateAdvancedMetrics(leads), [leads]);
  const aiVsManual = useMemo(() => calculateAIvsManual(leads), [leads]);
  const alerts = useMemo(() => generateAlerts(leads), [leads]);
  const insights = useMemo(() => generateInsights(leads, advancedMetrics), [leads, advancedMetrics]);

  return {
    metrics,
    funnelData,
    pipelineData,
    statusDistribution,
    districtDistribution,
    originDistribution,
    disqualificationReasons,
    leadsByDay,
    appointmentsByDay,
    revenueByWeek,
    advancedMetrics,
    aiVsManual,
    alerts,
    insights,
  };
}

export default useStats;
