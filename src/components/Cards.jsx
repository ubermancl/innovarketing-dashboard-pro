import {
  Users, MessageCircle, CalendarCheck, TrendingUp, DollarSign, AlertTriangle,
  Clock, Bot, Target, TrendingDown, BarChart3, Zap,
} from 'lucide-react';
import { Card } from './ui';
import { formatNumber, formatCurrency, formatPercent, formatChange } from '../utils/formatters';

// Cada MetricCard tiene una línea de acento superior codificada por color.
// El patrón Linear/Vercel: número grande, label muted arriba, delta abajo.
const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  format = 'number',
  accentColor = 'orange',
  danger = false,
  subtitle = null,
  notConfigured = false,
}) => {
  const formattedValue = notConfigured
    ? '—'
    : format === 'currency' ? formatCurrency(value)
    : format === 'percent' ? formatPercent(value)
    : formatNumber(value);

  const changeData = formatChange(change);

  const accentMap = {
    orange:  { line: 'from-accent-orange to-accent-yellow',   icon: 'bg-accent-orange/10 text-accent-orange'  },
    cyan:    { line: 'from-accent-cyan to-accent-cyan/50',    icon: 'bg-accent-cyan/10 text-accent-cyan'      },
    magenta: { line: 'from-accent-magenta to-accent-magenta/50', icon: 'bg-accent-magenta/10 text-accent-magenta' },
    green:   { line: 'from-accent-green to-accent-green/50',  icon: 'bg-accent-green/10 text-accent-green'   },
    yellow:  { line: 'from-accent-yellow to-accent-yellow/50',icon: 'bg-accent-yellow/10 text-accent-yellow'  },
    purple:  { line: 'from-accent-purple to-accent-purple/50',icon: 'bg-accent-purple/10 text-accent-purple'  },
    red:     { line: 'from-accent-red to-accent-red/50',      icon: 'bg-accent-red/10 text-accent-red'        },
  };

  const col = accentMap[danger ? 'red' : accentColor] || accentMap.orange;

  return (
    <Card
      className={`relative overflow-hidden ${danger && value > 0 ? 'border-error/40' : ''}`}
      padding="md"
      hover
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${col.line}`} />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-dark-400 font-medium uppercase tracking-wide">{title}</p>
          <p className={`text-2xl md:text-3xl font-bold font-mono mt-1.5 ${danger && value > 0 ? 'text-error' : notConfigured ? 'text-dark-500' : 'text-gray-100'}`}>
            {formattedValue}
          </p>
          {subtitle && <p className="text-xs text-dark-400 mt-1">{subtitle}</p>}
          {changeData && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${
              changeData.positive ? 'text-accent-green' :
              changeData.positive === false ? 'text-error' : 'text-dark-400'
            }`}>
              {changeData.text}
              <span className="text-dark-500">vs anterior</span>
            </p>
          )}
          {notConfigured && (
            <p className="text-xs text-dark-500 mt-1">Configura en Ajustes</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ml-3 ${col.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );
};

export default function Cards({ metrics, advancedMetrics, aiVsManual, businessContext }) {
  const {
    totalLeads, inConversacion, newLeads, scheduled,
    conversionRate, revenue, requiresAttention,
    leadsWithoutResponse24h, forecast, cac, changes,
  } = metrics;

  const hasAdSpend = businessContext?.monthlyAdSpend > 0;
  const hasTicket = businessContext?.avgTicket > 0;

  // Margen estimado: solo si hay revenue y ticket promedio configurado
  const marginPct = hasTicket && revenue > 0
    ? Math.max(0, (1 - (parseFloat(businessContext.avgTicket) * 0.4 / parseFloat(businessContext.avgTicket)))) * 100
    : null;

  return (
    <div className="space-y-4">
      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard title="Total Leads" value={totalLeads} icon={Users} accentColor="orange" />
        <MetricCard title="Leads (período)" value={newLeads} change={changes.newLeads} icon={TrendingUp} accentColor="cyan" />
        <MetricCard title="En Conversación" value={inConversacion} icon={MessageCircle} accentColor="purple" />
        <MetricCard title="Citas Agendadas" value={scheduled} change={changes.scheduled} icon={CalendarCheck} accentColor="green" />
        <MetricCard title="Tasa Conversión" value={conversionRate} change={changes.conversionRate} icon={BarChart3} format="percent" accentColor="magenta" />
        <MetricCard title="Revenue Período" value={revenue} change={changes.revenue} icon={DollarSign} format="currency" accentColor="yellow" />
      </div>

      {/* KPIs operacionales */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          title="Sin Respuesta +24h"
          value={leadsWithoutResponse24h}
          icon={Clock}
          danger
        />
        <MetricCard
          title="Requiere Atención"
          value={requiresAttention}
          icon={AlertTriangle}
          danger
        />
        <MetricCard
          title="Atendidos por IA"
          value={aiVsManual ? aiVsManual.ai : 0}
          icon={Bot}
          accentColor="cyan"
          subtitle={aiVsManual ? `${(aiVsManual.aiPct * 100).toFixed(0)}% del total` : null}
          notConfigured={!aiVsManual}
        />
        <MetricCard
          title="CAC Estimado"
          value={cac || 0}
          icon={Target}
          format="currency"
          accentColor="orange"
          notConfigured={!hasAdSpend}
        />
        <MetricCard
          title="Forecast Mes"
          value={forecast}
          icon={Zap}
          format="currency"
          accentColor="green"
          subtitle="Basado en run rate"
        />
        <MetricCard
          title="Margen Estimado"
          value={marginPct ? marginPct / 100 : 0}
          icon={TrendingDown}
          format="percent"
          accentColor="yellow"
          notConfigured={!hasTicket || !revenue}
        />
      </div>
    </div>
  );
}
