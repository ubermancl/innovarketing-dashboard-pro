import { useState } from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';
import { Card } from './ui';

const insightStyles = {
  action:  'border-accent-orange/30 bg-accent-orange/5',
  insight: 'border-accent-green/30 bg-accent-green/5',
  warning: 'border-warning/30 bg-warning/5',
};

// Insights dinámicos del CRM — todos visibles, sin paywall.
// El Diagnóstico IA (OpenRouter) es el nivel premium separado.
export default function Insights({ insights }) {
  const [expanded, setExpanded] = useState(true);

  if (!insights || insights.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent-orange/10">
            <Lightbulb className="w-4 h-4 text-accent-orange" />
          </div>
          <h3 className="text-base font-semibold text-gray-100">Señales del CRM</h3>
          <span className="text-xs px-2 py-0.5 bg-dark-700 text-dark-400 rounded-full">{insights.length}</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-dark-700 transition-colors text-dark-400 hover:text-gray-200"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`p-4 rounded-card border ${insightStyles[insight.type] || 'border-dark-600 bg-dark-700/30'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">{insight.icon}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
