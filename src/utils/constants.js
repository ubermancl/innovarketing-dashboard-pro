// Estados CRM con colores — ajustar según el CRM del cliente
export const CRM_STATES = {
  'Nuevo Lead':       { color: 'bg-blue-500/20 text-blue-400',    priority: 1 },
  'En Conversación':  { color: 'bg-indigo-500/20 text-indigo-400', priority: 2 },
  'Precalificado':    { color: 'bg-purple-500/20 text-purple-400', priority: 3 },
  'Descalificado':    { color: 'bg-dark-600 text-dark-400',        priority: 99 },
  'Link Enviado':     { color: 'bg-cyan-500/20 text-cyan-400',     priority: 4 },
  'Agendado':         { color: 'bg-teal-500/20 text-teal-400',     priority: 5 },
  'Asistió':          { color: 'bg-green-500/20 text-green-400',   priority: 6 },
  'No Asistió':       { color: 'bg-orange-500/20 text-orange-400', priority: 98 },
  'Compró':           { color: 'bg-emerald-500/20 text-emerald-400', priority: 7 },
  'No Compró':        { color: 'bg-red-500/20 text-red-400',       priority: 97 },
  'Cliente Activo':   { color: 'bg-green-600/20 text-green-300',   priority: 8 },
  'Plan Terminado':   { color: 'bg-dark-500/20 text-dark-400',     priority: 9 },
  'Recompró':         { color: 'bg-emerald-600/20 text-emerald-300', priority: 10 },
  'Canceló Cita':     { color: 'bg-amber-500/20 text-amber-400',   priority: 96 },
  'Requiere Humano':  { color: 'bg-red-600/20 text-red-300',       priority: 0 },
};

// Orden del funnel de conversión
export const FUNNEL_ORDER = [
  'En Conversación',
  'Precalificado',
  'Link Enviado',
  'Agendado',
  'Asistió',
  'Compró',
];

// Paleta para gráficos — naranja como color primario
export const CHART_COLORS = [
  '#F97316', // naranja (primario)
  '#10B981', // verde
  '#00D9FF', // cyan
  '#B24BF3', // magenta
  '#FFD93D', // amarillo
  '#EF4444', // rojo
  '#8B5CF6', // púrpura
  '#EC4899', // pink
  '#3B82F6', // azul
  '#14B8A6', // teal
];

// Filtros de fecha disponibles
export const DATE_FILTERS = [
  { value: 'today',  label: 'Hoy' },
  { value: 'week',   label: 'Esta semana' },
  { value: 'last7',  label: 'Últimos 7 días' },
  { value: 'month',  label: 'Este mes' },
  { value: 'last30', label: 'Últimos 30 días' },
  { value: 'custom', label: 'Personalizado' },
];

export const PAGE_SIZES = [10, 25, 50];

// Nombres de campos NocoDB — ajustar si el cliente tiene nombres distintos
export const LEAD_FIELDS = {
  id: 'Id',
  createdAt: 'CreatedAt',
  nombre: 'Nombre',
  phone: 'Phone',
  email: 'Email',
  estadoCRM: 'Estado CRM',
  fechaAgendamiento: 'Fecha de agendamiento',
  confirmoCita: 'Confirmo Cita',
  montoVenta: 'Monto Venta Cerrada (PEN)',
  origenLead: 'Origen del Lead',
  requiereRevision: 'Requiere revisión manual',
  ultimaModificacion: 'Última Modificación',
  tipoAtencion: 'Tipo Atención', // 'IA' | 'Manual' — puede no existir en todos los CRMs
};

// Modelos de IA disponibles en OpenRouter con precios por millón de tokens
export const AI_MODELS = [
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku (Recomendado)',
    inputPricePerM: 0.25,
    outputPricePerM: 1.25,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    inputPricePerM: 0.15,
    outputPricePerM: 0.60,
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
    inputPricePerM: 0.075,
    outputPricePerM: 0.30,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B (Gratis)',
    inputPricePerM: 0,
    outputPricePerM: 0,
  },
];
