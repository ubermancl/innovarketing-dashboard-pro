import { useState } from 'react';
import { Sparkles, Brain, AlertCircle, Zap, TrendingUp, DollarSign, RefreshCw, CheckCircle2, Info } from 'lucide-react';
import { Card, Button } from './ui';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { callOpenRouter, buildDiagnosisPrompt } from '../api/openrouter';
import { estimateCost, projectMonthlyCost, costPerLead, costPerConversion, formatCostUSD } from '../utils/aiCostEstimator';
import { AI_MODELS } from '../utils/constants';

const insightIcons = { 0: '🎯', 1: '⚡', 2: '📈' };

// Repara JSON-ish con problemas comunes de modelos open-source
function repairJSON(s) {
  return s
    .replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null')
    .replace(/,\s*([\]}])/g, '$1')   // trailing commas
    .replace(/(['"])?([a-zA-Z_]\w*)(['"])?\s*:/g, '"$2":'); // unquoted keys
}

// Extrae JSON aunque el modelo añada texto extra, markdown o tenga errores menores
function extractJSON(text) {
  if (!text) throw new Error('Respuesta vacía del modelo. Prueba con Claude Haiku o GPT-4o Mini.');
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  // 1. JSON puro
  let r = tryParse(text);
  if (r) return r;
  // 2. JSON puro reparado
  r = tryParse(repairJSON(text));
  if (r) return r;
  // 3. De bloque ```json ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) {
    r = tryParse(fence[1]) || tryParse(repairJSON(fence[1]));
    if (r) return r;
  }
  // 4. Primer objeto JSON en el texto
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) {
    r = tryParse(obj[0]) || tryParse(repairJSON(obj[0]));
    if (r) return r;
  }
  throw new Error('El modelo no generó JSON válido. Modelos recomendados: Claude Haiku, GPT-4o Mini, Grok.');
}

// Modelos verificados como compatibles con el diagnóstico
const VERIFIED_IDS = new Set([
  'anthropic/claude-3-haiku', 'anthropic/claude-3.5-haiku', 'anthropic/claude-3.5-haiku-20241022',
  'anthropic/claude-3-sonnet', 'anthropic/claude-3.5-sonnet', 'anthropic/claude-3.5-sonnet-20241022',
  'anthropic/claude-3-opus', 'anthropic/claude-opus-4', 'anthropic/claude-sonnet-4',
  'openai/gpt-4o-mini', 'openai/gpt-4o', 'openai/chatgpt-4o-latest',
  'x-ai/grok-3', 'x-ai/grok-3-mini', 'x-ai/grok-4', 'x-ai/grok-4-0709',
  'deepseek/deepseek-chat', 'deepseek/deepseek-r1',
  'google/gemini-flash-1.5', 'google/gemini-flash-2.0',
]);

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

  const hasKey = Boolean(businessContext?.openrouterKey);
  const selectedModel = businessContext?.aiModel || AI_MODELS[0].id;
  const modelName = AI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel.split('/').pop();

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
        model: selectedModel,
        systemPrompt,
        userPrompt,
        openrouterKey: businessContext.openrouterKey,
      });

      const parsed = extractJSON(response.content);
      const cd = estimateCost(response.usage, selectedModel);
      setResult(parsed);
      setCostData(cd);

      if (recsConfigured && onSaveSession) {
        setIsSaving(true);
        const sessionId = await onSaveSession({
          bottleneck: parsed.bottleneck,
          insights: parsed.insights,
          strategic_note: parsed.strategic_note,
          model: response.model || selectedModel,
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
              {modelName} · {DATE_FILTER_LABELS[dateFilter] || 'período seleccionado'}
              {recsConfigured && <span className="text-accent-green"> · historial activo</span>}
            </p>
          </div>
        </div>

        <Button onClick={runDiagnosis} loading={isLoading} disabled={isLoading || isSaving} size="sm">
          {isLoading
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analizando...</>
            : <><Sparkles className="w-3.5 h-3.5" /> Analizar ahora</>
          }
        </Button>
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
