import { api } from './client';

// Proxy OpenRouter a través del backend.
// La key viaja en el header x-openrouter-key — no se almacena server-side.
export async function callOpenRouter({ model, systemPrompt, userPrompt, openrouterKey }) {
  const response = await fetch('/api/ai/diagnose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-openrouter-key': openrouterKey,
    },
    credentials: 'include',
    body: JSON.stringify({
      model,
      systemPrompt,
      prompt: userPrompt,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Construir el prompt de diagnóstico con métricas + contexto + historial previo.
// El historial evita que la IA repita recomendaciones ya implementadas o rechazadas.
export function buildDiagnosisPrompt({ metrics, businessContext, funnelData, alerts, advancedMetrics, historyForPrompt }) {
  const ctx = businessContext || {};
  const m = metrics || {};
  const adv = advancedMetrics || {};

  const funnelText = (funnelData || [])
    .map(s => `  ${s.state}: ${s.count} leads (${s.percentOfTotal?.toFixed(1)}%)`)
    .join('\n');

  const alertsText = (alerts || []).length > 0
    ? alerts.map(a => `  - ${a.message}`).join('\n')
    : '  Sin alertas activas';

  const historySection = historyForPrompt
    ? `\n## Historial de recomendaciones anteriores\n${historyForPrompt}\n\nInstrucciones sobre el historial:\n- NO repitas recomendaciones en estado IMPLEMENTADA o RECHAZADA\n- Para las EN PROGRESO: da seguimiento, variaciones o métricas de avance\n- Para las PENDIENTES con más de 7 días: re-prioriza o reemplaza con justificación\n- Enfoca los nuevos insights en áreas no abordadas aún\n`
    : '';

  const systemPrompt = `Eres un consultor experto en performance de ventas y marketing digital B2B/B2C.
Aplicas la Teoría de Restricciones (TOC): identifica el ÚNICO cuello de botella real antes de recomendar escalar.
Tu análisis es honesto, accionable y basado en datos. No hagas suposiciones sin evidencia.
Responde SIEMPRE en JSON válido con la estructura exacta que se te indica.`;

  const userPrompt = `## Contexto del negocio
- Nombre: ${ctx.businessName || 'No configurado'}
- País/Ciudad: ${ctx.country || '?'}/${ctx.city || '?'}
- Vertical: ${ctx.vertical || 'No especificado'}
- Modelo: ${ctx.businessModel || 'No especificado'}
- Ticket promedio: $${ctx.avgTicket || 0} USD
- Inversión mensual ads: $${ctx.monthlyAdSpend || 0} USD
- Plataformas ads: ${(ctx.adPlatforms || []).join(', ') || 'ninguna'}
- Meta mensual: $${ctx.monthlyGoal || 0} USD
- Canal principal: ${ctx.mainChannel || 'no especificado'}
- Tamaño equipo: ${ctx.teamSize || '?'} personas
- Servicio recurrente: ${ctx.recurring ? `Sí, LTV promedio ${ctx.avgClientLifetime} meses` : 'No'}

## Métricas actuales
- Total leads en CRM: ${m.totalLeads || 0}
- Leads período actual: ${m.newLeads || 0}
- En conversación activa: ${m.inConversacion || 0}
- Citas agendadas: ${m.scheduled || 0}
- Tasa de conversión: ${((m.conversionRate || 0) * 100).toFixed(1)}%
- Revenue período: $${m.revenue || 0}
- Requieren atención manual: ${m.requiresAttention || 0}
- Leads sin respuesta +24h: ${m.leadsWithoutResponse24h || 0}
- Tasa no-show citas: ${((adv.noShowRate || 0) * 100).toFixed(1)}%
- Tasa de cierre (asistió→compró): ${((adv.closeRate || 0) * 100).toFixed(1)}%
- Ticket promedio real: $${(adv.avgTicket || 0).toFixed(0)}
- CAC estimado: $${m.cac || 'sin dato de ad spend'}
- Forecast del mes: $${m.forecast || 0}
- Mejor día de leads: ${adv.bestDay || 'sin dato'}
- Hora pico: ${adv.peakHour || 'sin dato'}

## Funnel actual
${funnelText}

## Alertas activas
${alertsText}
${historySection}
---
Analiza estos datos aplicando TOC. Identifica el cuello de botella que más limita el crecimiento.
Responde exactamente en este JSON (sin markdown, solo JSON puro):
{
  "bottleneck": {
    "title": "título del cuello de botella en máx 8 palabras",
    "description": "explicación de por qué este es EL limitante, con evidencia de los datos",
    "evidence": "métrica específica que lo demuestra"
  },
  "insights": [
    {
      "title": "título accionable en máx 8 palabras",
      "data": "dato específico que sustenta el insight",
      "action": "acción concreta que puede tomarse esta semana"
    },
    {
      "title": "...",
      "data": "...",
      "action": "..."
    },
    {
      "title": "...",
      "data": "...",
      "action": "..."
    }
  ],
  "strategic_note": "una observación estratégica que no cabe en los 3 insights, o null si no aplica"
}`;

  return { systemPrompt, userPrompt };
}
