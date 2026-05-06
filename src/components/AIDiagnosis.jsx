import { useState } from 'react';
import { Sparkles, Brain, AlertCircle, Zap, TrendingUp, DollarSign, Settings, RefreshCw } from 'lucide-react';
import { Card } from './ui';
import { Button } from './ui';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { callOpenRouter, buildDiagnosisPrompt } from '../api/openrouter';
import { estimateCost, projectMonthlyCost, costPerLead, costPerConversion, formatCostUSD } from '../utils/aiCostEstimator';
import { AI_MODELS } from '../utils/constants';

const insightIcons = { 0: '🎯', 1: '⚡', 2: '📈' };

function CostPanel({ costData, leadsCount, conversionCount }) {
  if (!costData) return null;

  const monthly = projectMonthlyCost(costData.totalCost);
  const perLead = costPerLead(costData.totalCost, leadsCount);
  const perConv = costPerConversion(costData.totalCost, conversionCount);

  const rows = [
    { label: 'Tokens usados', value: `${costData.totalTokens.toLocaleString()} (${costData.inputTokens.toLocaleString()} in / ${costData.outputTokens.toLocaleString()} out)` },
    { label: 'Costo de este análisis', value: formatCostUSD(costData.totalCost) },
    { label: 'Proyección mensual (1 análisis/día)', value: formatCostUSD(monthly) },
    { label: 'Costo por lead analizado', value: formatCostUSD(perLead) },
    { label: 'Costo por conversión lograda', value: perConv ? formatCostUSD(perConv) : '—' },
  ];

  return (
    <div className="mt-4 p-4 bg-dark-700/50 rounded-card border border-dark-600">
      <p className="text-xs text-dark-400 font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <DollarSign className="w-3 h-3" /> ROI de la IA
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between items-baseline gap-2">
            <span className="text-xs text-dark-400">{r.label}</span>
            <span className="text-xs font-mono text-gray-300 shrink-0">{r.value}</span>
          </div>
        ))}
      </div>
      {perConv !== null && costData.totalCost > 0 && (
        <p className="mt-3 text-xs text-accent-green">
          ROI: si una conversión vale ${leadsCount > 0 ? '...' : '0'} → el análisis paga su costo {perConv ? `en ${(1/perConv).toFixed(0)}x` : ''}
        </p>
      )}
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

export default function AIDiagnosis({ metrics, advancedMetrics, funnelData, alerts }) {
  const { businessContext } = useBusinessContext();
  const [result, setResult] = useState(null);
  const [costData, setCostData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasKey = Boolean(businessContext?.openrouterKey);
  const selectedModel = businessContext?.aiModel || AI_MODELS[0].id;
  const modelName = AI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel;

  const runDiagnosis = async () => {
    if (!hasKey) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCostData(null);

    try {
      const { systemPrompt, userPrompt } = buildDiagnosisPrompt({
        metrics,
        businessContext,
        funnelData,
        alerts,
        advancedMetrics,
      });

      const response = await callOpenRouter({
        model: selectedModel,
        systemPrompt,
        userPrompt,
        openrouterKey: businessContext.openrouterKey,
      });

      const parsed = JSON.parse(response.content);
      setResult(parsed);
      setCostData(estimateCost(response.usage, selectedModel));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Conteo de conversiones para el cálculo de ROI
  const conversionCount = metrics?.scheduled || 0;

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
          <p className="text-sm text-dark-400 mb-4">
            Genera 3 insights accionables por sesión usando TOC + benchmarks de tu vertical y país.
          </p>
          <p className="text-xs text-dark-500">
            Ve a <span className="text-accent-orange">Ajustes → IA & OpenRouter</span> para configurar tu API key.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-orange/10">
            <Brain className="w-5 h-5 text-accent-orange" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-100">Diagnóstico IA</h3>
            <p className="text-xs text-dark-400">{modelName}</p>
          </div>
        </div>
        <Button onClick={runDiagnosis} loading={isLoading} disabled={isLoading} size="sm">
          {isLoading ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analizando...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Analizar ahora</>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/30 rounded-card text-sm text-error mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado inicial — sin análisis aún */}
      {!result && !isLoading && !error && (
        <div className="p-8 text-center text-dark-500">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Haz clic en "Analizar ahora" para generar insights basados en tus datos actuales.</p>
          <p className="text-xs mt-2 opacity-60">Cada análisis aplica Teoría de Restricciones para identificar el cuello de botella real.</p>
        </div>
      )}

      {/* Cargando */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-3 text-accent-orange">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Consultando al modelo y generando diagnóstico...</span>
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && !isLoading && (
        <div className="space-y-5 animate-in">
          {/* Cuello de botella — el bloque más importante según TOC */}
          <div className="p-4 bg-accent-orange/8 border border-accent-orange/30 rounded-card">
            <p className="text-xs text-accent-orange font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Cuello de botella identificado (TOC)
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

          {/* Nota estratégica adicional */}
          {result.strategic_note && (
            <div className="p-3 bg-dark-700/30 border border-dark-600 rounded-card">
              <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Nota estratégica</p>
              <p className="text-sm text-gray-300">{result.strategic_note}</p>
            </div>
          )}

          {/* Panel de costos */}
          <CostPanel
            costData={costData}
            leadsCount={metrics?.totalLeads || 0}
            conversionCount={conversionCount}
          />
        </div>
      )}
    </Card>
  );
}
