import { useLanguage } from '../../hooks/useLanguage';

// Estados CRM con colores para dark theme
const CRM_STATE_COLORS = {
  'Nuevo Lead': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'En Conversación': 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  'Precalificado': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  'Descalificado': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  'Link Enviado': 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  'Agendado': 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
  'Asistió': 'bg-green-500/20 text-green-400 border border-green-500/30',
  'No Asistió': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  'Compró': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'No Compró': 'bg-red-500/20 text-red-400 border border-red-500/30',
  'Cliente Activo': 'bg-green-600/20 text-green-300 border border-green-500/30',
  'Plan Terminado': 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  'Recompró': 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30',
  'Canceló Cita': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Requiere Humano': 'bg-red-600/20 text-red-300 border border-red-500/30 animate-pulse',
};

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variants = {
    default: 'bg-dark-600 text-gray-300 border border-dark-500',
    primary: 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30',
    secondary: 'bg-accent-magenta/20 text-accent-magenta border border-accent-magenta/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

// Badge específico para estados CRM. `state` siempre es la clave real en
// español (viene de NocoDB), se traduce solo lo que se muestra.
export const CRMBadge = ({ state, size = 'md' }) => {
  const { statusLabel } = useLanguage();
  const stateColor = CRM_STATE_COLORS[state] || 'bg-dark-600 text-gray-300 border border-dark-500';
  const label = statusLabel(state);

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${stateColor}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      `}
    >
      {label}
    </span>
  );
};

// Badge específico para estados de agendamiento
export const SchedulingBadge = ({ state, size = 'md' }) => {
  const colors = {
    'Pendiente': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Agendado': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'Reprogramado': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'Confirmado': 'bg-green-500/20 text-green-400 border border-green-500/30',
    'Cancelado': 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  const stateColor = colors[state] || 'bg-dark-600 text-gray-300 border border-dark-500';

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${stateColor}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      `}
    >
      {state}
    </span>
  );
};

export default Badge;
