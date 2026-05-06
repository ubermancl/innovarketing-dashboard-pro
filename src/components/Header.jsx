import { useState, useRef } from 'react';
import { RefreshCw, LogOut, Wifi, WifiOff, Calendar, X, Settings, FileDown, Loader2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button, Select } from './ui';
import { formatDateTime } from '../utils/formatters';
import { useBusinessContext } from '../hooks/useBusinessContext';

const DATE_FILTERS = [
  { value: 'today',  label: 'Hoy' },
  { value: 'week',   label: 'Esta Semana' },
  { value: 'last7',  label: 'Últimos 7 días' },
  { value: 'month',  label: 'Este Mes' },
  { value: 'last30', label: 'Últimos 30 días' },
  { value: 'custom', label: 'Personalizado' },
];

const DateInput = ({ value, onChange, placeholder }) => {
  const inputRef = useRef(null);

  const formatDisplay = (isoDate) => {
    if (!isoDate) return placeholder || 'DD/MM/AAAA';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div
      className="relative flex items-center gap-1.5 bg-dark-700 border border-dark-600 rounded px-2 py-1.5 cursor-pointer hover:border-dark-500 transition-colors min-w-[120px]"
      onClick={() => inputRef.current?.showPicker?.()}
    >
      <Calendar className="w-3 h-3 text-accent-cyan shrink-0" />
      <span className="text-sm text-gray-200 select-none">{formatDisplay(value)}</span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
    </div>
  );
};

export default function Header({
  dateFilter,
  onDateFilterChange,
  customDateRange,
  onCustomDateChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
  isOnline,
  onLogout,
  onOpenSettings,
}) {
  const { businessContext } = useBusinessContext();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleDateFilterChange = (value) => {
    if (value === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      onDateFilterChange(value);
    }
  };

  const applyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      onCustomDateChange({
        start: new Date(tempStartDate),
        end: new Date(tempEndDate),
      });
      onDateFilterChange('custom');
      setShowCustomPicker(false);
    }
  };

  const getPeriodLabel = () => {
    const now = new Date();
    const fmt = (d) => format(d, 'd MMM', { locale: es });
    switch (dateFilter) {
      case 'today':
        return format(now, "d MMM yyyy", { locale: es });
      case 'week': {
        const s = startOfWeek(now, { weekStartsOn: 1 });
        const e = endOfWeek(now, { weekStartsOn: 1 });
        return `${fmt(s)} → ${fmt(e)}`;
      }
      case 'last7':
        return `${fmt(subDays(now, 6))} → ${fmt(now)}`;
      case 'month': {
        const s = startOfMonth(now);
        const e = endOfMonth(now);
        return `${fmt(s)} → ${fmt(e)}`;
      }
      case 'last30':
        return `${fmt(subDays(now, 29))} → ${fmt(now)}`;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          return `${fmt(new Date(customDateRange.start))} → ${fmt(new Date(customDateRange.end))}`;
        }
        return 'Personalizado';
      default:
        return 'Este mes';
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('dashboard-print-root');
      if (!element) return;

      const [html2canvasModule, jspdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = jspdfModule;

      const canvas = await html2canvas(element, {
        scale: 1.5,
        backgroundColor: '#0D1117',
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 1920,
        onclone: (clonedDoc) => {
          // Activar versión PDF del footer
          const screenFooter = clonedDoc.querySelector('.footer-screen');
          const pdfFooter = clonedDoc.querySelector('.footer-pdf');
          if (screenFooter) screenFooter.style.display = 'none';
          if (pdfFooter) pdfFooter.style.display = 'block';
          // Eliminar truncate de todos los elementos para evitar cortes de texto
          clonedDoc.querySelectorAll('.truncate').forEach(el => {
            el.classList.remove('truncate');
            el.style.overflow = 'visible';
            el.style.whiteSpace = 'normal';
          });
        },
        ignoreElements: (el) =>
          el.classList.contains('no-print') ||
          el.classList.contains('fixed'),
      });

      const pageW = 297; // A4 landscape mm
      const pageH = 210;
      const imgW = pageW;
      const imgH = (canvas.height / canvas.width) * imgW;

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/jpeg', 0.88);

      let yOffset = 0;
      let remaining = imgH;
      let page = 0;

      while (remaining > 0) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -yOffset, imgW, imgH);
        yOffset += pageH;
        remaining -= pageH;
        page++;
      }

      const dateStr = format(new Date(), 'dd-MM-yyyy');
      const name = CLIENT_CONFIG.name.toLowerCase().replace(/\s+/g, '-');
      pdf.save(`dashboard-${name}-${dateStr}.pdf`);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const displayName = businessContext?.businessName || 'Mi Dashboard';

  return (
    <header className="bg-dark-800/90 backdrop-blur-md border-b border-dark-700 sticky top-0 z-40">
      <div className="px-4 md:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo y título */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-orange to-accent-yellow flex items-center justify-center text-xl overflow-hidden shrink-0 shadow-glow-orange">
              🟠
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-100">{displayName}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-accent-green">
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Online</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-error">
                    <WifiOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Offline</span>
                  </span>
                )}
                <span className="text-dark-500">•</span>
                <span className="text-gray-500">{getPeriodLabel()}</span>
                {lastUpdated && (
                  <>
                    <span className="text-dark-500 hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{formatDateTime(lastUpdated)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2 md:gap-3 flex-wrap no-print">
            {/* Filtro de fecha */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Select
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                options={DATE_FILTERS}
                className="w-44"
              />
            </div>

            {/* Selector de rango personalizado */}
            {showCustomPicker && (
              <div className="flex items-center gap-2 glass-card p-2">
                <DateInput
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  placeholder="Desde"
                />
                <span className="text-gray-500 text-sm">→</span>
                <DateInput
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  placeholder="Hasta"
                />
                <Button size="sm" onClick={applyCustomRange}>
                  Aplicar
                </Button>
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="p-1 hover:bg-dark-600 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}

            {/* Exportar PDF */}
            <Button
              variant="secondary"
              onClick={exportPDF}
              disabled={isExporting}
              title="Exportar dashboard como PDF"
            >
              {isExporting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <FileDown className="w-4 h-4" />
              }
              <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'PDF'}</span>
            </Button>

            {/* Actualizar */}
            <Button
              variant="secondary"
              onClick={onRefresh}
              loading={isRefreshing}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>

            {/* Ajustes */}
            <Button variant="secondary" onClick={onOpenSettings} title="Ajustes del dashboard">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Ajustes</span>
            </Button>

            {/* Salir */}
            <Button variant="ghost" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
