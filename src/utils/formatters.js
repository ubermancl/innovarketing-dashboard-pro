import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Formateadores multi-cliente. La moneda y locale se pueden parametrizar
// en el futuro desde businessContext — por ahora usan es-419 (español latino).

export function formatNumber(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-419').format(value);
}

export function formatCurrency(value) {
  if (value === null || value === undefined) return '-';
  // USD por defecto — la moneda real depende del contexto del negocio
  return new Intl.NumberFormat('es-419', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatear porcentaje
 * 0.156 -> 15.6%
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formatear fecha completa
 * "19 Feb 2026, 3:45pm"
 */
export function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return '-';
    return format(date, "d MMM yyyy, h:mma", { locale: es }).toLowerCase();
  } catch {
    return '-';
  }
}

/**
 * Formatear fecha corta
 * "19 Feb 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return '-';
    return format(date, "d MMM yyyy", { locale: es });
  } catch {
    return '-';
  }
}

/**
 * Formatear hora
 * "3:45pm"
 */
export function formatTime(timeString) {
  if (!timeString) return '-';
  try {
    // Si es solo hora (HH:mm), crear fecha con esa hora
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, "h:mma", { locale: es }).toLowerCase();
    }
    const date = typeof timeString === 'string' ? parseISO(timeString) : timeString;
    if (!isValid(date)) return timeString;
    return format(date, "h:mma", { locale: es }).toLowerCase();
  } catch {
    return timeString || '-';
  }
}

/**
 * Formatear fecha relativa
 * "hace 2 horas", "ayer"
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return '-';
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return '-';
  }
}

/**
 * Formatear número de teléfono
 * +51987654321 -> +51 987 654 321
 */
export function formatPhone(phone) {
  if (!phone) return '-';
  const cleaned = phone.toString().replace(/\D/g, '');

  // Formato peruano +51 XXX XXX XXX
  if (cleaned.length === 11 && cleaned.startsWith('51')) {
    return `+51 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  // Formato local 9XX XXX XXX
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  // Si tiene + al inicio
  if (phone.startsWith('+')) {
    return phone;
  }

  return phone;
}

/**
 * Formatear nombre (capitalizar)
 */
export function formatName(name) {
  if (!name) return '-';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncar texto
 */
export function truncate(text, maxLength = 30) {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Formatear cambio porcentual con flecha
 * 0.15 -> "↑ 15%", -0.10 -> "↓ 10%"
 */
export function formatChange(value) {
  if (value === null || value === undefined || isNaN(value)) return null;
  const percent = Math.abs(value * 100).toFixed(1);
  if (value > 0) return { text: `↑ ${percent}%`, positive: true };
  if (value < 0) return { text: `↓ ${percent}%`, positive: false };
  return { text: '0%', positive: null };
}

/**
 * Obtener día de la semana en español
 */
export function getDayName(date) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

/**
 * Obtener hora del día (para análisis)
 */
export function getHourOfDay(dateString) {
  if (!dateString) return null;
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return null;
    return date.getHours();
  } catch {
    return null;
  }
}
