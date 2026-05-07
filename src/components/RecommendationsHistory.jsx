import { useState } from 'react';
import { History, ChevronDown, CheckCircle2, Clock, XCircle, Zap, AlertTriangle, Loader2, StickyNote, Trash2 } from 'lucide-react';
import { Card } from './ui';
import { formatDateTime } from '../utils/formatters';

const ESTADOS = [
  { value: 'Pendiente',    label: 'Pendiente',    color: 'text-warning bg-warning/10 border-warning/30' },
  { value: 'Aceptada',     label: 'Aceptada',     color: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30' },
  { value: 'En Progreso',  label: 'En Progreso',  color: 'text-accent-orange bg-accent-orange/10 border-accent-orange/30' },
  { value: 'Implementada', label: 'Implementada', color: 'text-accent-green bg-accent-green/10 border-accent-green/30' },
  { value: 'Rechazada',    label: 'Rechazada',    color: 'text-dark-400 bg-dark-700 border-dark-600' },
];

const TIPO_ICONS = {
  cuello_botella: { icon: AlertTriangle, label: 'Cuello de botella', color: 'text-accent-orange' },
  insight:        { icon: Zap,           label: 'Acción',            color: 'text-accent-cyan'   },
  nota_estrategica: { icon: StickyNote,  label: 'Nota estratégica',  color: 'text-dark-400'      },
};

function StatusBadge({ estado }) {
  const e = ESTADOS.find(s => s.value === estado) || ESTADOS[0];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${e.color}`}>
      {e.label}
    </span>
  );
}

function StatusSelector({ id, current, onUpdate, isUpdating }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  const handleSelect = async (value) => {
    setOpen(false);
    await onUpdate(id, value, undefined);
  };

  const handleSaveNote = async () => {
    await onUpdate(id, current, note);
    setShowNote(false);
    setNote('');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          disabled={isUpdating}
          className="flex items-center gap-1 text-xs text-dark-400 hover:text-gray-300 transition-colors"
        >
          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
          Cambiar estado
        </button>
        {open && (
          <div className="absolute top-6 left-0 z-20 bg-dark-800 border border-dark-600 rounded-card shadow-xl min-w-[160px]">
            {ESTADOS.map(e => (
              <button
                key={e.value}
                onClick={() => handleSelect(e.value)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-dark-700 transition-colors first:rounded-t-card last:rounded-b-card"
              >
                <span className={e.color.split(' ')[0]}>{e.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowNote(!showNote)}
        className="text-xs text-dark-500 hover:text-dark-400 transition-colors"
        title="Agregar nota"
      >
        <StickyNote className="w-3 h-3" />
      </button>

      {showNote && (
        <div className="absolute z-10 mt-1 top-full left-0 right-0 bg-dark-800 border border-dark-600 rounded-card p-3 shadow-xl" style={{ minWidth: 260 }}>
          <textarea
            className="w-full bg-dark-700 border border-dark-600 rounded text-xs text-gray-300 p-2 resize-none focus:outline-none focus:border-accent-orange"
            rows={3}
            placeholder="Nota del cliente sobre esta recomendación..."
            value={note}
            onChange={e => setNote(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowNote(false)} className="text-xs text-dark-400 hover:text-gray-300">Cancelar</button>
            <button onClick={handleSaveNote} className="text-xs text-accent-orange hover:text-accent-orange/80 font-medium">Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordRow({ rec, onUpdate, updatingId }) {
  const tipo = TIPO_ICONS[rec.Tipo] || TIPO_ICONS.insight;
  const TypeIcon = tipo.icon;
  const isUpdating = updatingId === rec.Id;

  return (
    <div className={`p-4 border-b border-dark-700/50 last:border-0 ${rec.Estado === 'Implementada' ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <TypeIcon className={`w-4 h-4 shrink-0 mt-0.5 ${tipo.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-gray-200">{rec.Titulo}</span>
            <StatusBadge estado={rec.Estado} />
          </div>
          {rec.Dato && <p className="text-xs text-dark-400 mb-1"><span className="text-accent-orange">Dato:</span> {rec.Dato}</p>}
          {rec.Accion && <p className="text-xs text-gray-400 leading-relaxed">{rec.Accion}</p>}
          {rec.Nota_Cliente && (
            <p className="text-xs text-dark-400 italic mt-1 border-l-2 border-dark-600 pl-2">{rec.Nota_Cliente}</p>
          )}
          <div className="relative mt-2">
            <StatusSelector id={rec.Id} current={rec.Estado} onUpdate={onUpdate} isUpdating={isUpdating} />
          </div>
        </div>
      </div>
    </div>
  );
}

const DONE_STATES = new Set(['Implementada', 'Rechazada']);
const TYPE_ORDER = { cuello_botella: 0, insight: 1, nota_estrategica: 2 };

function SessionGroup({ session, onUpdate, updatingId, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const model = session.records[0]?.Modelo_IA || '';
  const date = session.records[0]?.CreatedAt;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setIsDeleting(true);
    await onDelete(session.sessionId);
    setIsDeleting(false);
  };

  const pendientes = session.records.filter(r => r.Estado === 'Pendiente').length;
  const implementadas = session.records.filter(r => r.Estado === 'Implementada').length;

  // Activos primero (orden por tipo), completados/rechazados al final
  const sortedRecords = [...session.records].sort((a, b) => {
    const aDone = DONE_STATES.has(a.Estado);
    const bDone = DONE_STATES.has(b.Estado);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return (TYPE_ORDER[a.Tipo] ?? 1) - (TYPE_ORDER[b.Tipo] ?? 1);
  });

  return (
    <div className="border border-dark-700 rounded-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-gray-200">
              {date ? formatDateTime(date) : 'Sesión sin fecha'}
            </p>
            <p className="text-xs text-dark-400">
              {model.split('/').pop()} · {session.records.length} registro{session.records.length !== 1 ? 's' : ''}
              {pendientes > 0 && <span className="text-warning ml-2">· {pendientes} pendiente{pendientes !== 1 ? 's' : ''}</span>}
              {implementadas > 0 && <span className="text-accent-green ml-2">· {implementadas} implementada{implementadas !== 1 ? 's' : ''}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title={confirmDelete ? 'Haz clic de nuevo para confirmar' : 'Eliminar sesión'}
            className={`p-1.5 rounded transition-colors ${
              confirmDelete
                ? 'bg-error/20 text-error hover:bg-error/30'
                : 'text-dark-600 hover:text-error hover:bg-error/10'
            }`}
          >
            {isDeleting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />}
          </button>
          <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-dark-700">
          {sortedRecords.map(r => (
            <RecordRow key={r.Id} rec={r} onUpdate={onUpdate} updatingId={updatingId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsHistory({ sessions, isLoading, notConfigured, error, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  if (notConfigured) return null;

  const handleUpdate = async (id, estado, nota) => {
    setUpdatingId(id);
    await onUpdate(id, estado, nota);
    setUpdatingId(null);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-dark-700">
            <History className="w-4 h-4 text-dark-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-100">Historial de Recomendaciones</h3>
          {sessions.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-dark-700 text-dark-400 rounded-full">{sessions.length} sesiones</span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-gray-200 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>
      </div>

      {expanded && (
        <>
          {error && (
            <p className="text-xs text-error/70 mb-3">{error}</p>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-dark-400 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando historial...
            </div>
          )}
          {!isLoading && sessions.length === 0 && (
            <p className="text-sm text-dark-500 py-4 text-center">
              Aún no hay recomendaciones guardadas. Haz tu primer análisis IA.
            </p>
          )}
          {!isLoading && sessions.length > 0 && (
            <div className="space-y-3">
              {sessions.map(s => (
                <SessionGroup key={s.sessionId} session={s} onUpdate={handleUpdate} updatingId={updatingId} onDelete={onDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
