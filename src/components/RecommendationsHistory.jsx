import { useState, useEffect, useRef } from 'react';
import { History, ChevronDown, Zap, AlertTriangle, Loader2, StickyNote, Trash2, X, Bot, CalendarClock } from 'lucide-react';
import { addDays, isPast } from 'date-fns';
import { Card } from './ui';
import { formatDateTime } from '../utils/formatters';
import { useLanguage } from '../hooks/useLanguage';

// Cadencia sugerida entre análisis IA — 7 días es un default razonable para
// este tipo de metricas de negocio, ajustable si el cliente lo pide.
const SUGGESTED_CADENCE_DAYS = 7;

function LastAnalysisBanner({ lastDate, t, lang }) {
  if (!lastDate) return null;
  const next = addDays(new Date(lastDate), SUGGESTED_CADENCE_DAYS);
  const nextIsPast = isPast(next);
  return (
    <div className="flex items-center gap-2 flex-wrap p-3 mb-4 rounded-card bg-dark-700/50 border border-dark-600 text-xs">
      <CalendarClock className="w-3.5 h-3.5 text-dark-400 shrink-0" />
      <span className="text-dark-300">
        <span className="text-dark-400">{t('ultimo_analisis')}:</span>{' '}
        <span className="font-medium text-gray-200">{formatDateTime(lastDate, lang)}</span>
      </span>
      <span className="text-dark-600">·</span>
      <span className={nextIsPast ? 'text-accent-orange' : 'text-dark-300'}>
        <span className="text-dark-400">{t('proximo_analisis_sugerido')}:</span>{' '}
        <span className="font-medium">
          {nextIsPast ? t('hoy') : next.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', { day: 'numeric', month: 'short' })}
        </span>
      </span>
    </div>
  );
}

// `value` siempre en español porque es el dato real guardado en NocoDB
// (rec.Estado). El label de display sí se traduce.
const ESTADOS = [
  { value: 'Pendiente',    color: 'text-warning bg-warning/10 border-warning/30' },
  { value: 'Aceptada',     color: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30' },
  { value: 'En Progreso',  color: 'text-accent-orange bg-accent-orange/10 border-accent-orange/30' },
  { value: 'Implementada', color: 'text-accent-green bg-accent-green/10 border-accent-green/30' },
  { value: 'Rechazada',    color: 'text-dark-400 bg-dark-700 border-dark-600' },
];

const ESTADO_LABELS = {
  es: { Pendiente: 'Pendiente', Aceptada: 'Aceptada', 'En Progreso': 'En Progreso', Implementada: 'Implementada', Rechazada: 'Rechazada' },
  en: { Pendiente: 'Pending', Aceptada: 'Accepted', 'En Progreso': 'In Progress', Implementada: 'Implemented', Rechazada: 'Rejected' },
};

const TIPO_ICONS = {
  cuello_botella:  { icon: AlertTriangle, color: 'text-accent-orange' },
  insight:         { icon: Zap,           color: 'text-accent-cyan'   },
  nota_estrategica:{ icon: StickyNote,    color: 'text-dark-400'      },
};

const COUNTDOWN_SECONDS = 5;

function StatusBadge({ estado }) {
  const { lang } = useLanguage();
  const e = ESTADOS.find(s => s.value === estado) || ESTADOS[0];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${e.color}`}>
      {ESTADO_LABELS[lang]?.[e.value] || e.value}
    </span>
  );
}

// Botón que al hacer clic inicia cuenta regresiva de N segundos.
// Si llega a 0 llama onConfirm. El usuario puede cancelar mientras cuenta.
function CountdownDeleteButton({ onConfirm, isDeleting, label, size = 'session' }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState('idle'); // idle | counting | deleting
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const intervalRef = useRef(null);

  const startCountdown = (e) => {
    e.stopPropagation();
    setPhase('counting');
    setCount(COUNTDOWN_SECONDS);
  };

  const cancel = (e) => {
    e?.stopPropagation();
    clearInterval(intervalRef.current);
    setPhase('idle');
    setCount(COUNTDOWN_SECONDS);
  };

  useEffect(() => {
    if (phase !== 'counting') return;
    intervalRef.current = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(intervalRef.current);
          setPhase('deleting');
          onConfirm();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  if (isDeleting || phase === 'deleting') {
    return (
      <span className="flex items-center gap-1 text-xs text-dark-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        {size === 'session' ? t('eliminando') : ''}
      </span>
    );
  }

  if (phase === 'counting') {
    return (
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        <span className="text-xs text-error font-medium whitespace-nowrap">
          {t('eliminar_en')} {count}s
        </span>
        <button
          onClick={cancel}
          className="flex items-center gap-0.5 text-xs text-dark-400 hover:text-gray-200 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded px-1.5 py-0.5 transition-colors"
        >
          <X className="w-3 h-3" /> {t('cancelar')}
        </button>
      </div>
    );
  }

  // idle
  if (size === 'session') {
    return (
      <button
        onClick={startCountdown}
        title={label || t('eliminar_sesion')}
        className="p-1.5 rounded text-dark-600 hover:text-error hover:bg-error/10 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    );
  }

  // size === 'record'
  return (
    <button
      onClick={startCountdown}
      title={t('eliminar_recomendacion')}
      className="p-1 rounded text-dark-600 hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
    >
      <Trash2 className="w-3 h-3" />
    </button>
  );
}

function StatusSelector({ id, current, onUpdate, isUpdating }) {
  const { t, lang } = useLanguage();
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
          {t('cambiar_estado')}
        </button>
        {open && (
          <div className="absolute top-6 left-0 z-20 bg-dark-800 border border-dark-600 rounded-card shadow-xl min-w-[160px]">
            {ESTADOS.map(e => (
              <button
                key={e.value}
                onClick={() => handleSelect(e.value)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-dark-700 transition-colors first:rounded-t-card last:rounded-b-card"
              >
                <span className={e.color.split(' ')[0]}>{ESTADO_LABELS[lang]?.[e.value] || e.value}</span>
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
            placeholder={t('nota_cliente_placeholder')}
            value={note}
            onChange={e => setNote(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowNote(false)} className="text-xs text-dark-400 hover:text-gray-300">{t('cancelar')}</button>
            <button onClick={handleSaveNote} className="text-xs text-accent-orange hover:text-accent-orange/80 font-medium">{t('guardar')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordRow({ rec, onUpdate, updatingId, onDeleteRecord, deletingRecordId }) {
  const { t } = useLanguage();
  const tipo = TIPO_ICONS[rec.Tipo] || TIPO_ICONS.insight;
  const TypeIcon = tipo.icon;
  const isUpdating = updatingId === rec.Id;
  const isDeleting = deletingRecordId === rec.Id;
  const isDone = rec.Estado === 'Implementada' || rec.Estado === 'Rechazada';

  return (
    <div className={`group p-4 border-b border-dark-700/50 last:border-0 transition-opacity ${isDone ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <TypeIcon className={`w-4 h-4 shrink-0 mt-0.5 ${tipo.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-gray-200">{rec.Titulo}</span>
            <StatusBadge estado={rec.Estado} />
            <div className="ml-auto">
              <CountdownDeleteButton
                size="record"
                isDeleting={isDeleting}
                onConfirm={() => onDeleteRecord(rec.Id)}
              />
            </div>
          </div>
          {rec.Dato && <p className="text-xs text-dark-400 mb-1"><span className="text-accent-orange">{t('dato_label')}:</span> {rec.Dato}</p>}
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

function SessionGroup({ session, onUpdate, updatingId, onDeleteSession, onDeleteRecord, deletingRecordId }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const model = session.records[0]?.Modelo_IA || '';
  const date = session.records[0]?.CreatedAt;

  const pendientes = session.records.filter(r => r.Estado === 'Pendiente').length;
  const implementadas = session.records.filter(r => r.Estado === 'Implementada').length;

  const sortedRecords = [...session.records].sort((a, b) => {
    const aDone = DONE_STATES.has(a.Estado);
    const bDone = DONE_STATES.has(b.Estado);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return (TYPE_ORDER[a.Tipo] ?? 1) - (TYPE_ORDER[b.Tipo] ?? 1);
  });

  const handleDeleteSession = async () => {
    setIsDeleting(true);
    await onDeleteSession(session.sessionId);
    setIsDeleting(false);
  };

  return (
    <div className="border border-dark-700 rounded-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200">
              {date ? formatDateTime(date, lang) : t('sesion_sin_fecha')}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {model && (
                <span className="flex items-center gap-1 text-xs bg-dark-700 border border-dark-600 rounded px-1.5 py-0.5 text-dark-300">
                  <Bot className="w-3 h-3 text-dark-400" />
                  {model.split('/').pop()}
                </span>
              )}
              <span className="text-xs text-dark-500">
                {session.records.length} {session.records.length !== 1 ? t('registros') : t('registro')}
                {pendientes > 0 && <span className="text-warning"> · {pendientes} {t('pendientes_label')}</span>}
                {implementadas > 0 && <span className="text-accent-green"> · {implementadas} {t('implementadas_label')}</span>}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3" onClick={e => e.stopPropagation()}>
          <CountdownDeleteButton
            size="session"
            isDeleting={isDeleting}
            onConfirm={handleDeleteSession}
            label={t('eliminar_analisis_completo')}
          />
          <button
            onClick={e => { e.stopPropagation(); setOpen(!open); }}
            className="p-1"
          >
            <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </button>

      {open && (
        <div className="border-t border-dark-700">
          {sortedRecords.map(r => (
            <RecordRow
              key={r.Id}
              rec={r}
              onUpdate={onUpdate}
              updatingId={updatingId}
              onDeleteRecord={onDeleteRecord}
              deletingRecordId={deletingRecordId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsHistory({ sessions, isLoading, notConfigured, error, onUpdate, onDelete, onDeleteRecord }) {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingRecordId, setDeletingRecordId] = useState(null);

  if (notConfigured) return null;

  const lastDate = sessions[0]?.date || null;

  const handleUpdate = async (id, estado, nota) => {
    setUpdatingId(id);
    await onUpdate(id, estado, nota);
    setUpdatingId(null);
  };

  const handleDeleteRecord = async (id) => {
    setDeletingRecordId(id);
    await onDeleteRecord(id);
    setDeletingRecordId(null);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-dark-700">
            <History className="w-4 h-4 text-dark-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-100">{t('historial_recomendaciones')}</h3>
          {sessions.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-dark-700 text-dark-400 rounded-full">{sessions.length} {t('sesiones')}</span>
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
          {error && <p className="text-xs text-error/70 mb-3">{error}</p>}
          {!isLoading && sessions.length > 0 && <LastAnalysisBanner lastDate={lastDate} t={t} lang={lang} />}
          {isLoading && (
            <div className="flex items-center gap-2 text-dark-400 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('cargando_historial')}
            </div>
          )}
          {!isLoading && sessions.length === 0 && (
            <p className="text-sm text-dark-500 py-4 text-center">
              {t('sin_recomendaciones')}
            </p>
          )}
          {!isLoading && sessions.length > 0 && (
            <div className="space-y-3">
              {sessions.map(s => (
                <SessionGroup
                  key={s.sessionId}
                  session={s}
                  onUpdate={handleUpdate}
                  updatingId={updatingId}
                  onDeleteSession={onDelete}
                  onDeleteRecord={handleDeleteRecord}
                  deletingRecordId={deletingRecordId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
