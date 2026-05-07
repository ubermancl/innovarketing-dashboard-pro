import { useState, useEffect, useRef } from 'react';
import { Sparkles, Brain, AlertCircle, Zap, TrendingUp, DollarSign, RefreshCw, CheckCircle2, Info, ChevronDown, Bot, X } from 'lucide-react';
import { Card, Button } from './ui';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { callOpenRouter, buildDiagnosisPrompt } from '../api/openrouter';
import { estimateCost, projectMonthlyCost, costPerLead, costPerConversion, formatCostUSD } from '../utils/aiCostEstimator';
import { AI_MODELS } from '../utils/constants';

const insightIcons = { 0: '🎯', 1: '⚡', 2: '📈' };

// Extrae JSON aunque el modelo lo envuelva en ```json ... ``` o añada texto extra
function extractJSON(text) {
  if (!text) throw new Error('Respuesta vacía del modelo');
  try { return JSON.parse(text); } catch {}
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  throw new Error('El modelo no devolvió JSON válido. Prueba con otro modelo o reintenta.');
}

const DATE_FILTER_LABELS = {
  today:  'Hoy',
  week:   'Esta semana',
  last7:  'Últimos 7 días',
  month:  'Este mes',
  last30: 'Últimos 30 días',
  last90: 'Últimos 90 días',
  all:    'Registro histórico completo',
  custom: 'Período personalizado',
};

function CostPanel({ costData, leadsCount, conversionCount }) {
  if (!costData) return null;
  const monthly = projectMonthlyCost(costData.totalCost);
  const perLead = costPerLead(costData.totalCost, leadsCount);
  const perConv = costPerConversion(costData.totalCost, conversionCount);

  const rows = [
    { label: 'Tokens usados', value: `${costData.totalTokens.toLocaleString()} (${costData.inputTokens.toLocaleString()} in / ${costData.outputTokens.toLocaleString()} out)` },
    { label: 'Costo de este análisis', value: formatCostUSD(costData.totalCost) },
    { label: 'Proyección mensual (1/día)', value: formatCostUSD(monthly) },
    { label: 'Costo por lead analizado', value: formatCostUSD(perLead) },
    { label: 'Costo por conversión', value: perConv ? formatCostUSD(perConv) : '—' },
  ];

  return (
    <div className="mt-4 p-4 bg-dark-700/50 rounded-card border border-dark-600">
      <p className="text-xs text-dark-400 font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <DollarSign className="w-3 h-3" /> ROI del análisis IA
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between items-baseline gap-2">
            <span className="text-xs text-dark-400">{r.label}</span>
            <span className="text-xs font-mono text-gray-300 shrink-0">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ insight, index }) {
  return (
    <div className="p-4 bg-dark-700/50 rounded-card border border-dark-600 hover:border-accent-orange/30 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{insightIcons[index] || '💡'}</span>
        <h4 className="text-sm font-semibold text-gray-100 leading-snug">{insight.title}</h4>
      </div>
      <p className="text-xs text-dark-400 mb-2 leading-relaxed">
        <span className="text-accent-orange font-medium">Dato: </span>{insight.data}
      </p>
      <div className="flex items-start gap-2 p-2.5 bg-accent-orange/8 rounded-button border border-accent-orange/20">
        <Zap className="w-3 h-3 text-accent-orange shrink-0 mt-0.5" />
        <p className="text-xs text-gray-300 leading-relaxed">{insight.action}</p>
      </div>
    </div>
  );
}

function DiagnosisInfo() {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(v => !v)}
        className="text-dark-500 hover:text-dark-300 transition-colors"
        aria-label="¿Qué analiza?"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute left-5 top-0 z-30 w-72 p-3 bg-dark-800 border border-dark-600 rounded-card shadow-xl text-xs text-gray-300 leading-relaxed">
          <p className="font-semibold text-gray-100 mb-1.5">¿Qué analiza el Diagnóstico IA?</p>
          <p className="mb-1.5">Toma las métricas del período seleccionado en el filtro de fecha (leads, conversión, embudo, alertas) y aplica la <span className="text-accent-orange font-medium">Teoría de Restricciones (TOC)</span> para identificar el cuello de botella principal que limita tus resultados.</p>
          <p className="mb-1.5">Genera <span className="text-accent-cyan font-medium">3 acciones priorizadas</span> con evidencia concreta y una nota estratégica de contexto.</p>
          <p className="text-dark-400">Si NocoDB está configurado, incluye el historial de análisis anteriores para evitar repetir recomendaciones ya implementadas.</p>
        </div>
      )}
    </div>
  );
}

function ModelPicker({ modelId, onSelect, openrouterKey }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dynamicModels, setDynamicModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dropdownRef = useRef(null);

  const allModels = dynamicModels.length > 0 ? dynamicModels : AI_MODELS;
  const current = allModels.find(m => m.id === modelId) || { id: modelId, name: modelId.split('/').pop(), free: false };

  const fetchModels = async () => {
    if (loaded || loading || !openrouterKey) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-openrouter-key': openrouterKey },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.models?.length) setDynamicModels(data.models);
      }
    } catch {}
    setLoading(false);
    setLoaded(true);
  };

  const handleOpen = () => {
    setOpen(v => !v);
    if (!loaded) fetchModels();
  };

  // Cerrar al hacer clic afuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!dropdownRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = allModels.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    (search.toLowerCase() === 'free' || search.toLowerCase() === 'gratis' ? m.free : false)
  );

  const formatPrice = (m) => {
    if (m.free) return <span className="text-accent-green text-xs font-medium">GRATIS</span>;
    const price = (m.inputPricePerM || 0).toFixed(3);
    return <span className="text-dark-500 text-xs">${price}/M</span>;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs bg-dark-700 border border-dark-600 rounded-button px-2.5 py-1.5 text-gray-300 hover:border-dark-500 transition-colors max-w-[220px]"
        title="Cambiar modelo de IA"
      >
        <Bot className="w-3 h-3 text-dark-400 shrink-0" />
        <span className="truncate">{current.name || current.id.split('/').pop()}</span>
        {current.free && <span className="text-accent-green text-xs shrink-0">·G</span>}
        <ChevronDown className={`w-3 h-3 text-dark-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-8 left-0 z-40 w-80 bg-dark-800 border border-dark-700 rounded-card shadow-2xl">
          {/* Search */}
          <div className="p-2 border-b border-dark-700 flex items-center gap-2">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Buscar modelo... ("gratis" para gratuitos)'
              className="flex-1 bg-dark-700 border border-dark-600 rounded px-2.5 py-1.5 text-xs text-gray-300 placeholder:text-dark-500 focus:outline-none focus:border-accent-orange"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-dark-500 hover:text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-dark-400 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando modelos...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <p className="text-center py-4 text-xs text-dark-500">Sin resultados</p>
            )}
            {!loading && filtered.map(m => (
              <button
                key={m.id}
                onClick={() => { onSelect(m.id); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-dark-700 transition-colors ${
                  m.id === modelId ? 'bg-accent-orange/10' : ''
                }`}
              >
                <div className="min-w-0 mr-2">
                  <p className={`text-xs font-medium truncate ${m.id === modelId ? 'text-accent-orange' : 'text-gray-200'}`}>
                    {m.name || m.id.split('/').pop()}
                  </p>
                  <p className="text-xs text-dark-500 truncate">{m.id}</p>
                </div>
                <div className="shrink-0">{formatPrice(m)}</div>
              </button>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-dark-700">
            <p className="text-xs text-dark-500">{loaded ? `${allModels.length} modelos · cambio solo para este análisis` : 'Conecta tu key para ver todos los modelos'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIDiagnosis({
  metrics, advancedMetrics, funnelData, alerts,
  historyForPrompt, recsConfigured, onSaveSession,
  dateFilter,
}) {
  const { businessContext } = useBusinessContext();
  const [result, setResult] = useState(null);
  const [costData, setCostData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState(null);
  const [error, setError] = useState(null);
  // Modelo seleccionado localmente — no persiste en businessContext
  const [localModel, setLocalModel] = useState(businessContext?.aiModel || AI_MODELS[0].id);

  const hasKey = Boolean(businessContext?.openrouterKey);

  const runDiagnosis = async () => {
    if (!hasKey) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCostData(null);
    setSavedSessionId(null);

    try {
      const { systemPrompt, userPrompt } = buildDiagnosisPrompt({
        metrics, businessContext, funnelData, alerts, advancedMetrics,
        historyForPrompt: recsConfigured ? historyForPrompt : null,
      });

      const response = await callOpenRouter({
        model: localModel,
        systemPrompt,
        userPrompt,
        openrouterKey: businessContext.openrouterKey,
      });

      const parsed = extractJSON(response.content);
      const cd = estimateCost(response.usage, localModel);
      setResult(parsed);
      setCostData(cd);

      if (recsConfigured && onSaveSession) {
        setIsSaving(true);
        const sessionId = await onSaveSession({
          bottleneck: parsed.bottleneck,
          insights: parsed.insights,
          strategic_note: parsed.strategic_note,
          model: response.model || localModel,
          usage: response.usage,
          costData: cd,
        });
        setSavedSessionId(sessionId);
        setIsSaving(false);
      }
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasKey) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent-orange/10">
            <Brain className="w-5 h-5 text-accent-orange" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-100">Diagnóstico IA</h3>
            <p className="text-xs text-dark-400">Teoría de Restricciones aplicada a tus datos</p>
          </div>
        </div>
        <div className="p-6 text-center border border-dark-600 rounded-card bg-dark-700/30">
          <Brain className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-gray-300 font-medium mb-2">Conecta tu API key para activar el Diagnóstico IA</p>
          <p className="text-sm text-dark-400 mb-2">3 insights accionables por sesión · Teoría de Restricciones · Historial en NocoDB</p>
          <p className="text-xs text-dark-500">Ajustes → IA & OpenRouter</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-accent-orange/10 shrink-0">
            <Brain className="w-5 h-5 text-accent-orange" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-gray-100">Diagnóstico IA</h3>
              <DiagnosisInfo />
            </div>
            <p className="text-xs text-dark-400">
              {DATE_FILTER_LABELS[dateFilter] || 'período seleccionado'}
              {recsConfigured && <span className="text-accent-green"> · historial activo</span>}
            </p>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          <ModelPicker
            modelId={localModel}
            onSelect={setLocalModel}
            openrouterKey={businessContext.openrouterKey}
          />
          <Button onClick={runDiagnosis} loading={isLoading} disabled={isLoading || isSaving} size="sm">
            {isLoading
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analizando...</>
              : <><Sparkles className="w-3.5 h-3.5" /> Analizar ahora</>
            }
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/30 rounded-card text-sm text-error mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!result && !isLoading && !error && (
        <div className="p-8 text-center text-dark-500">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Haz clic en "Analizar ahora" para generar insights basados en tus datos.</p>
          {recsConfigured && (
            <p className="text-xs mt-2 opacity-60">Los resultados se guardarán automáticamente en NocoDB.</p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-3 text-accent-orange">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Consultando historial y generando diagnóstico...</span>
          </div>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-5 animate-in">
          {/* Cuello de botella — TOC */}
          <div className="p-4 bg-accent-orange/8 border border-accent-orange/30 rounded-card">
            <p className="text-xs text-accent-orange font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Cuello de botella (TOC)
            </p>
            <h4 className="text-base font-bold text-gray-100 mb-1">{result.bottleneck?.title}</h4>
            <p className="text-sm text-gray-300 leading-relaxed mb-2">{result.bottleneck?.description}</p>
            <p className="text-xs text-dark-400 italic">Evidencia: {result.bottleneck?.evidence}</p>
          </div>

          {/* 3 insights */}
          <div>
            <p className="text-xs text-dark-400 uppercase tracking-wide mb-3">3 Acciones Prioritarias</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(result.insights || []).slice(0, 3).map((insight, i) => (
                <InsightCard key={i} insight={insight} index={i} />
              ))}
            </div>
          </div>

          {result.strategic_note && (
            <div className="p-3 bg-dark-700/30 border border-dark-600 rounded-card">
              <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Nota estratégica</p>
              <p className="text-sm text-gray-300">{result.strategic_note}</p>
            </div>
          )}

          {recsConfigured && (
            <div className="flex items-center gap-2 text-xs">
              {isSaving && <><RefreshCw className="w-3 h-3 animate-spin text-dark-400" /><span className="text-dark-400">Guardando en NocoDB...</span></>}
              {savedSessionId && <><CheckCircle2 className="w-3 h-3 text-accent-green" /><span className="text-accent-green">Guardado en NocoDB</span></>}
            </div>
          )}

          <CostPanel
            costData={costData}
            leadsCount={metrics?.totalLeads || 0}
            conversionCount={metrics?.scheduled || 0}
          />
        </div>
      )}
    </Card>
  );
}
