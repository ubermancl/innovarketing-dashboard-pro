import { useState } from 'react';
import { Clock, UserX, CheckCircle, Receipt, MapPin, Calendar, Clock3, RefreshCw, ChevronDown, TrendingUp } from 'lucide-react';
import { Card } from './ui';
import { formatPercent, formatCurrency } from '../utils/formatters';

function MiniCard({ title, value, icon: Icon, tooltip }) {
  return (
    <div className="glass-card p-3 flex items-center gap-3 group relative hover:shadow-card-hover transition-shadow" title={tooltip}>
      <div className="p-2 rounded-lg bg-dark-700 shrink-0">
        <Icon className="w-3.5 h-3.5 text-dark-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-dark-400 truncate">{title}</p>
        <p className="text-sm font-semibold font-mono text-gray-100 truncate">
          {value ?? '—'}
        </p>
      </div>
      {tooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-20 w-64 p-3 rounded-card bg-dark-800 border border-dark-700 shadow-xl text-xs text-gray-300 leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {tooltip}
        </div>
      )}
    </div>
  );
}

export default function AdvancedMetrics({ metrics }) {
  const [expanded, setExpanded] = useState(true);
  const { avgTimeToSchedule, noShowRate, closeRate, avgTicket, bestDistrict, bestDay, peakHour } = metrics;

  const summary = [
    closeRate > 0 && `Cierre ${formatPercent(closeRate)}`,
    noShowRate > 0 && `No-Show ${formatPercent(noShowRate)}`,
    avgTicket > 0 && `Ticket ${formatCurrency(avgTicket)}`,
  ].filter(Boolean).join(' · ');

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <TrendingUp className="w-4 h-4 text-dark-400 shrink-0" />
          <h3 className="text-sm font-semibold text-gray-200 shrink-0">Métricas Avanzadas</h3>
          {!expanded && summary && (
            <span className="text-xs text-dark-400 truncate hidden sm:block ml-1">{summary}</span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-dark-700 transition-colors text-dark-400"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
          <MiniCard
            title="Tiempo → Cita"
            value={avgTimeToSchedule != null ? `${avgTimeToSchedule.toFixed(1)}d` : null}
            icon={Clock}
            tooltip="Promedio de días entre creación del lead y fecha de agendamiento."
          />
          <MiniCard
            title="Tasa No-Show"
            value={formatPercent(noShowRate)}
            icon={UserX}
            tooltip="No Asistió ÷ (Asistió + No Asistió)."
          />
          <MiniCard
            title="Tasa de Cierre"
            value={formatPercent(closeRate)}
            icon={CheckCircle}
            tooltip="Compró ÷ Asistió. De los que vinieron a consulta, cuántos compraron."
          />
          <MiniCard
            title="Ticket Promedio"
            value={formatCurrency(avgTicket)}
            icon={Receipt}
            tooltip="Suma de ventas ÷ número de ventas cerradas."
          />
          <MiniCard
            title="Mejor Zona"
            value={bestDistrict}
            icon={MapPin}
            tooltip="Zona o distrito con más conversiones."
          />
          <MiniCard
            title="Mejor Día"
            value={bestDay || '—'}
            icon={Calendar}
            tooltip="Día de la semana con más leads entrantes. Concentra inversión en ads ese día."
          />
          <MiniCard
            title="Hora Pico"
            value={peakHour != null ? `${peakHour} h` : '—'}
            icon={Clock3}
            tooltip="Hora con más leads. Responder en la primera hora tiene 7× más conversión."
          />
          <MiniCard
            title="Leads Recuperables"
            value={metrics.notBought > 0 ? metrics.notBought : '—'}
            icon={RefreshCw}
            tooltip="Leads en estado 'No Compró' — candidatos a campaña de retargeting."
          />
        </div>
      )}
    </Card>
  );
}
