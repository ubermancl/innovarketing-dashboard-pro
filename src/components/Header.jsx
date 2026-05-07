import { useState, useRef } from 'react';
import { Calendar, X, FileDown, Loader2, ChevronDown } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from './ui';

const DATE_FILTERS = [
  { value: 'today',  label: 'Hoy' },
  { value: 'week',   label: 'Esta semana' },
  { value: 'last7',  label: 'Últimos 7 días' },
  { value: 'month',  label: 'Este mes' },
  { value: 'last30', label: 'Últimos 30 días' },
  { value: 'custom', label: 'Personalizado' },
];

function DateInput({ value, onChange, placeholder }) {
  const inputRef = useRef(null);
  const formatDisplay = (d) => {
    if (!d) return placeholder || 'DD/MM/AAAA';
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
    const fmt = (d) => format(d, 'd MMM', { locale: es });
    switch (dateFilter) {
      case 'today':  return format(now, "d 'de' MMM yyyy", { locale: es });
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
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          return `${fmt(new Date(customDateRange.start))} — ${fmt(new Date(customDateRange.end))}`;
        }
        return 'Personalizado';
      default: return 'Este mes';
    }
  };

  const currentLabel = DATE_FILTERS.find(f => f.value === dateFilter)?.label || 'Este mes';

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
    dashboard: 'Resumen',
    analytics: 'Análisis',
    ai: 'IA & Historial',
    tabla: 'Tabla de Leads',
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
              <DateInput value={tempStart} onChange={e => setTempStart(e.target.value)} placeholder="Desde" />
              <span className="text-dark-400 text-xs">→</span>
              <DateInput value={tempEnd} onChange={e => setTempEnd(e.target.value)} placeholder="Hasta" />
              <button onClick={applyCustom} className="px-3 py-1.5 bg-accent-orange text-white text-xs rounded-button hover:bg-accent-orange/90 transition-colors">
                Aplicar
              </button>
              <button onClick={() => setShowCustomPicker(false)} className="text-dark-400 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PDF */}
          <button
            onClick={exportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 rounded-button bg-dark-700 border border-dark-600 text-sm text-gray-300 hover:border-dark-500 transition-colors disabled:opacity-50"
            title="Exportar PDF"
          >
            {isExporting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <FileDown className="w-3.5 h-3.5" />
            }
            <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* Backdrop para cerrar el dropdown de fecha */}
      {showDateMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowDateMenu(false)} />
      )}
    </header>
  );
}
