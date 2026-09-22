import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card } from './ui';
import { useLanguage } from '../hooks/useLanguage';

export default function Alerts({ alerts }) {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const errorAlerts = alerts.filter(a => a.type === 'error');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertCircle className="w-5 h-5 text-warning" />
          </div>
          <span className="font-semibold text-gray-100">
            {t('alertas')}
          </span>
          <span className="px-2 py-0.5 bg-dark-600 text-gray-300 text-xs rounded-full">
            {alerts.length}
          </span>
          {errorAlerts.length > 0 && (
            <span className="px-2 py-0.5 bg-error/20 text-error text-xs rounded-full animate-pulse">
              {errorAlerts.length} {errorAlerts.length > 1 ? t('urgentes') : t('urgente')}
            </span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="border-t border-dark-600">
          {/* Alertas de error (urgentes) */}
          {errorAlerts.map((alert, index) => (
            <div
              key={`error-${index}`}
              className="p-4 bg-error/5 border-l-2 border-error flex items-center gap-3"
            >
              <span className="text-lg">{alert.icon}</span>
              <span className="text-sm text-gray-200 font-medium">
                {alert.message}
              </span>
            </div>
          ))}

          {/* Alertas de advertencia */}
          {warningAlerts.map((alert, index) => (
            <div
              key={`warning-${index}`}
              className="p-4 bg-warning/5 border-l-2 border-warning flex items-center gap-3"
            >
              <span className="text-lg">{alert.icon}</span>
              <span className="text-sm text-gray-300">
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
