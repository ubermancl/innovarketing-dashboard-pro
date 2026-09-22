import { useState, useRef } from 'react';
import { Calendar, X, FileDown, Loader2, ChevronDown } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Button } from './ui';
import { useLanguage } from '../hooks/useLanguage';

const DATE_FILTER_KEYS = [
  { value: 'today',  key: 'periodo_hoy' },
  { value: 'week',   key: 'periodo_semana' },
  { value: 'last7',  key: 'periodo_last7' },
  { value: 'month',  key: 'periodo_mes' },
  { value: 'last30', key: 'periodo_last30' },
  { value: 'last90', key: 'periodo_last90' },
  { value: 'all',    key: 'periodo_all' },
  { value: 'custom', key: 'periodo_custom' },
];

function DateInput({ value, onChange, placeholder }) {
  const inputRef = useRef(null);
  const formatDisplay = (d) => {
    if (!d) return placeholder || 'DD/MM/YYYY';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };
  return (
    <div
      className="relative flex items-center gap-1.5 bg-dark-700 border border-dark-600 rounded px-2 py-1.5 cursor-pointer hover:border-dark-500 transition-colors min-w-[110px]"
      onClick={() => inputRef.current?.showPicker?.()}
    >
      <span className="text-xs text-gray-300 select-none">{formatDisplay(value)}</span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
    </div>
  );
}

export default function Header({
  dateFilter, onDateFilterChange,
  customDateRange, onCustomDateChange,
  activeView,
}) {
  const { t, lang, setLang } = useLanguage();
  const dateLocale = lang === 'es' ? es : enUS;
  const DATE_FILTERS = DATE_FILTER_KEYS.map(f => ({ value: f.value, label: t(f.key) }));
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleFilterSelect = (value) => {
    setShowDateMenu(false);
    if (value === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      onDateFilterChange(value);
    }
  };

  const applyCustom = () => {
    if (tempStart && tempEnd) {
      onCustomDateChange({ start: new Date(tempStart), end: new Date(tempEnd) });
      onDateFilterChange('custom');
      setShowCustomPicker(false);
    }
  };

  const periodLabel = () => {
    const now = new Date();
    const fmt = (d) => format(d, 'd MMM', { locale: dateLocale });
    switch (dateFilter) {
      case 'today':  return format(now, lang === 'es' ? "d 'de' MMM yyyy" : "MMM d, yyyy", { locale: dateLocale });
      case 'week': {
        const s = startOfWeek(now, { weekStartsOn: 1 });
        const e = endOfWeek(now, { weekStartsOn: 1 });
        return `${fmt(s)} — ${fmt(e)}`;
      }
      case 'last7': return `${fmt(subDays(now, 6))} — ${fmt(now)}`;
      case 'month': {
        const s = startOfMonth(now);
        const e = endOfMonth(now);
        return `${fmt(s)} — ${fmt(e)}`;
      }
      case 'last30': return `${fmt(subDays(now, 29))} — ${fmt(now)}`;
      case 'last90': return `${fmt(subDays(now, 89))} — ${fmt(now)}`;
      case 'all': return t('todo_registro');
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          return `${fmt(new Date(customDateRange.start))} — ${fmt(new Date(customDateRange.end))}`;
        }
        return t('periodo_custom');
      default: return t('periodo_mes');
    }
  };

  const currentLabel = DATE_FILTERS.find(f => f.value === dateFilter)?.label || t('periodo_mes');

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('dashboard-print-root');
      if (!element) return;
      const [h2c, jspdf] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await h2c.default(element, {
        scale: 1.5, backgroundColor: '#0E0D16', logging: false,
        useCORS: true, allowTaint: true, windowWidth: 1920,
        ignoreElements: el => el.classList.contains('no-print') || el.classList.contains('fixed'),
      });
      const { jsPDF } = jspdf;
      const pageW = 297, pageH = 210;
      const imgH = (canvas.height / canvas.width) * pageW;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/jpeg', 0.88);
      let yOffset = 0, remaining = imgH, page = 0;
      while (remaining > 0) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageW, imgH);
        yOffset += pageH; remaining -= pageH; page++;
      }
      pdf.save(`dashboard-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const VIEW_LABELS = {
    dashboard: t('view_resumen'),
    analytics: t('nav_analisis'),
    ai: t('nav_ia_historial'),
    tabla: t('view_tabla'),
  };

  return (
    <header className="sticky top-0 z-20 bg-dark-900/95 backdrop-blur-md border-b border-dark-700/50">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4 lg:pl-6">
        {/* Vista actual */}
        <div className="pl-10 lg:pl-0">
          <h1 className="text-base font-semibold text-gray-100">{VIEW_LABELS[activeView] || 'Dashboard'}</h1>
          <p className="text-xs text-dark-400">{periodLabel()}</p>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 no-print">
          {/* Selector de idioma */}
          <div className="flex items-center bg-dark-700 border border-dark-600 rounded-button overflow-hidden text-xs font-medium">
            <button
              onClick={() => setLang('es')}
              className={`px-2.5 py-2 transition-colors ${lang === 'es' ? 'bg-accent-orange text-white' : 'text-dark-400 hover:text-gray-200'}`}
            >
              ES
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-2 transition-colors ${lang === 'en' ? 'bg-accent-orange text-white' : 'text-dark-400 hover:text-gray-200'}`}
            >
              EN
            </button>
          </div>

          {/* Selector de período */}
          <div className="relative">
            <button
              onClick={() => setShowDateMenu(!showDateMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-button bg-dark-700 border border-dark-600 text-sm text-gray-300 hover:border-dark-500 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-dark-400" />
              <span className="hidden sm:inline">{currentLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-dark-400" />
            </button>

            {showDateMenu && (
              <div className="absolute right-0 top-10 z-30 bg-dark-800 border border-dark-700 rounded-card shadow-xl min-w-[160px]">
                {DATE_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => handleFilterSelect(f.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-card last:rounded-b-card ${
                      dateFilter === f.value
                        ? 'bg-accent-orange/10 text-accent-orange'
                        : 'text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom date range */}
          {showCustomPicker && (
            <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-card px-3 py-2">
              <DateInput value={tempStart} onChange={e => setTempStart(e.target.value)} placeholder={t('desde')} />
              <span className="text-dark-400 text-xs">→</span>
              <DateInput value={tempEnd} onChange={e => setTempEnd(e.target.value)} placeholder={t('hasta')} />
              <button onClick={applyCustom} className="px-3 py-1.5 bg-accent-orange text-white text-xs rounded-button hover:bg-accent-orange/90 transition-colors">
                {t('aplicar')}
              </button>
              <button onClick={() => setShowCustomPicker(false)} className="text-dark-400 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PDF — solo en vistas con datos visuales */}
          {(activeView === 'dashboard' || activeView === 'analytics') && (
            <button
              onClick={exportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 rounded-button bg-dark-700 border border-dark-600 text-sm text-gray-300 hover:border-dark-500 transition-colors disabled:opacity-50"
              title={t('exportar_pdf')}
            >
              {isExporting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <FileDown className="w-3.5 h-3.5" />
              }
              <span className="hidden sm:inline">{isExporting ? t('exportando') : 'PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Backdrop para cerrar el dropdown de fecha */}
      {showDateMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowDateMenu(false)} />
      )}
    </header>
  );
}
