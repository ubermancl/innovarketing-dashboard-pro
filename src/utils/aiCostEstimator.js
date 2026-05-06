import { AI_MODELS } from './constants';

// Calcula el costo de una llamada a la IA en USD
export function estimateCost(usage, modelId) {
  const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];
  const inputTokens = usage?.prompt_tokens || 0;
  const outputTokens = usage?.completion_tokens || 0;

  const inputCost = (inputTokens / 1_000_000) * model.inputPricePerM;
  const outputCost = (outputTokens / 1_000_000) * model.outputPricePerM;
  const totalCost = inputCost + outputCost;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputCost,
    outputCost,
    totalCost,
    modelName: model.name,
  };
}

// Proyecta el costo mensual si el usuario hace un análisis por día
export function projectMonthlyCost(costPerCall) {
  return costPerCall * 30;
}

// Costo por lead analizado
export function costPerLead(totalCost, leadsCount) {
  if (!leadsCount || leadsCount === 0) return 0;
  return totalCost / leadsCount;
}

// Costo por conversión lograda
export function costPerConversion(totalCost, conversions) {
  if (!conversions || conversions === 0) return null;
  return totalCost / conversions;
}

// Formatea USD con precisión adecuada
export function formatCostUSD(amount) {
  if (amount === 0) return '$0.000';
  if (amount < 0.001) return `$${amount.toFixed(6)}`;
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}
