import {
  Users, MessageCircle, CalendarCheck, TrendingUp, DollarSign, AlertTriangle,
  Clock, Bot, Target, Zap, BarChart3, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { formatNumber, formatCurrency, formatPercent, formatChange } from '../utils/formatters';

function MetricCard({ title, value, change, icon: Icon, format = 'number', danger = false, subtitle = null, notConfigured = false }) {
  const formatted = notConfigured
    ? '—'
    : format === 'currency' ? formatCurrency(value)
    : format === 'percent' ? formatPercent(value)
    : formatNumber(value);

  const changeData = formatChange(change);

  return (
    <div className={`glass-card p-4 space-y-3 hover:shadow-card-hover transition-shadow ${
      danger && value > 0 ? 'border-error/30' : ''
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-dark-400 font-medium">{title}</p>
        <Icon className={`w-4 h-4 ${danger && value > 0 ? 'text-error/60' : 'text-dark-500'}`} />
      </div>

      <div>
        <p className={`text-2xl font-bold font-mono tracking-tight ${
          danger && value > 0 ? 'text-error' : notConfigured ? 'text-dark-500' : 'text-gray-100'
        }`}>
          {formatted}
        </p>
        {subtitle && <p className="text-xs text-dark-400 mt-1">{subtitle}</p>}
        {notConfigured && <p className="text-xs text-dark-500 mt-1">Configura en Ajustes</p>}
      </div>

      {changeData && (
        <div className={`flex items-center gap-1 text-xs ${
          changeData.positive ? 'text-accent-green'
          : changeData.positive === false ? 'text-error'
          : 'text-dark-400'
        }`}>
          {changeData.positive === true && <ArrowUpRight className="w-3 h-3" />}
          {changeData.positive === false && <ArrowDownRight className="w-3 h-3" />}
          {changeData.positive === null && <Minus className="w-3 h-3" />}
          <span>{changeData.text}</span>
          <span className="text-dark-500 ml-1">vs anterior</span>
        </div>
      )}
    </div>
  );
}

export default function Cards({ metrics, advancedMetrics, aiVsManual, businessContext }) {
  const {
    totalLeads, inConversacion, newLeads, scheduled,
    conversionRate, revenue, requiresAttention,
    leadsWithoutResponse24h, forecast, cac, changes,
  } = metrics;

  const hasAdSpend = businessContext?.monthlyAdSpend > 0;
  const hasTicket = businessContext?.avgTicket > 0;

  return (
    <div className="space-y-3">
      {/* Fila 1 — métricas principales del embudo */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard title="Total Leads" value={totalLeads} icon={Users} />
        <MetricCard title="Leads (período)" value={newLeads} change={changes?.newLeads} icon={TrendingUp} />
        <MetricCard title="En Conversación" value={inConversacion} icon={MessageCircle} />
        <MetricCard title="Citas Agendadas" value={scheduled} change={changes?.scheduled} icon={CalendarCheck} />
        <MetricCard title="Tasa Conversión" value={conversionRate} change={changes?.conversionRate} icon={BarChart3} format="percent" />
        <MetricCard title="Revenue Período" value={revenue} change={changes?.revenue} icon={DollarSign} format="currency" />
      </div>

      {/* Fila 2 — KPIs operacionales */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard title="Sin Respuesta +24h" value={leadsWithoutResponse24h} icon={Clock} danger />
        <MetricCard title="Requiere Atención" value={requiresAttention} icon={AlertTriangle} danger />
        <MetricCard
          title="Atendidos por IA"
          value={aiVsManual?.ai || 0}
          icon={Bot}
          subtitle={aiVsManual ? `${(aiVsManual.aiPct * 100).toFixed(0)}% del total` : null}
          notConfigured={!aiVsManual}
        />
        <MetricCard
          title="CAC Estimado"
          value={cac || 0}
          icon={Target}
          format="currency"
          notConfigured={!hasAdSpend}
        />
        <MetricCard
          title="Forecast Mes"
          value={forecast}
          icon={Zap}
          format="currency"
          subtitle="Basado en run rate"
        />
        <MetricCard
          title="Ticket Promedio Real"
          value={advancedMetrics?.avgTicket || 0}
          icon={DollarSign}
          format="currency"
          notConfigured={!hasTicket && !advancedMetrics?.avgTicket}
        />
      </div>
    </div>
  );
}
