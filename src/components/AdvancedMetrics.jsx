import { useState } from 'react';
import { Clock, UserX, CheckCircle, Receipt, MapPin, Calendar, Clock3, RefreshCw, ChevronDown, TrendingUp } from 'lucide-react';
import { Card } from './ui';
import { formatPercent, formatCurrency } from '../utils/formatters';
import { useLanguage } from '../hooks/useLanguage';

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
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const { avgTimeToSchedule, noShowRate, closeRate, avgTicket, bestDistrict, bestDay, peakHour } = metrics;

  const summary = [
    closeRate > 0 && `${t('cierre_label')} ${formatPercent(closeRate)}`,
    noShowRate > 0 && `${t('no_show_label')} ${formatPercent(noShowRate)}`,
    avgTicket > 0 && `${t('ticket_label')} ${formatCurrency(avgTicket, lang)}`,
  ].filter(Boolean).join(' · ');

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <TrendingUp className="w-4 h-4 text-dark-400 shrink-0" />
          <h3 className="text-sm font-semibold text-gray-200 shrink-0">{t('metricas_avanzadas')}</h3>
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
            title={t('tiempo_a_cita')}
            value={avgTimeToSchedule != null ? `${avgTimeToSchedule.toFixed(1)}d` : null}
            icon={Clock}
            tooltip={t('tooltip_tiempo_respuesta')}
          />
          <MiniCard
            title={t('tasa_no_show')}
            value={formatPercent(noShowRate)}
            icon={UserX}
            tooltip={t('tooltip_no_show')}
          />
          <MiniCard
            title={t('tasa_cierre')}
            value={formatPercent(closeRate)}
            icon={CheckCircle}
            tooltip={t('tooltip_tasa_cierre')}
          />
          <MiniCard
            title={t('ticket_promedio')}
            value={formatCurrency(avgTicket, lang)}
            icon={Receipt}
            tooltip={t('tooltip_ticket_promedio')}
          />
          <MiniCard
            title={t('mejor_zona')}
            value={bestDistrict}
            icon={MapPin}
            tooltip={t('tooltip_mejor_zona')}
          />
          <MiniCard
            title={t('mejor_dia')}
            value={bestDay || '—'}
            icon={Calendar}
            tooltip={t('tooltip_mejor_dia')}
          />
          <MiniCard
            title={t('hora_pico')}
            value={peakHour != null ? `${peakHour} h` : '—'}
            icon={Clock3}
            tooltip={t('tooltip_mejor_hora')}
          />
          <MiniCard
            title={t('leads_recuperables')}
            value={metrics.notBought > 0 ? metrics.notBought : '—'}
            icon={RefreshCw}
            tooltip={t('tooltip_retargeting')}
          />
        </div>
      )}
    </Card>
  );
}
