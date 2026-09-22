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
// `lang` ('es'|'en') controla el idioma en que responde el modelo — el dashboard
// se comparte con clientes internacionales, así que el resultado debe seguir el toggle.
export function buildDiagnosisPrompt({ metrics, businessContext, funnelData, alerts, advancedMetrics, historyForPrompt, lang = 'es' }) {
  const ctx = businessContext || {};
  const m = metrics || {};
  const adv = advancedMetrics || {};
  const en = lang === 'en';

  const funnelText = (funnelData || [])
    .map(s => `  ${s.state}: ${s.count} leads (${s.percentOfTotal?.toFixed(1)}%)`)
    .join('\n');

  const alertsText = (alerts || []).length > 0
    ? alerts.map(a => `  - ${a.message}`).join('\n')
    : (en ? '  No active alerts' : '  Sin alertas activas');

  const historySection = historyForPrompt
    ? (en
      ? `\n## Previous recommendations history\n${historyForPrompt}\n\nInstructions about the history:\n- Do NOT repeat recommendations marked IMPLEMENTED or REJECTED\n- For IN PROGRESS: give follow-up, variations, or progress metrics\n- For PENDING older than 7 days: re-prioritize or replace with justification\n- Focus new insights on areas not yet addressed\n`
      : `\n## Historial de recomendaciones anteriores\n${historyForPrompt}\n\nInstrucciones sobre el historial:\n- NO repitas recomendaciones en estado IMPLEMENTADA o RECHAZADA\n- Para las EN PROGRESO: da seguimiento, variaciones o métricas de avance\n- Para las PENDIENTES con más de 7 días: re-prioriza o reemplaza con justificación\n- Enfoca los nuevos insights en áreas no abordadas aún\n`)
    : '';

  const systemPrompt = en
    ? `You are an expert consultant in B2B/B2C sales and digital marketing performance.
You apply the Theory of Constraints (TOC): identify the ONE real bottleneck before recommending scaling.
Your analysis is honest, actionable, and data-driven. Never assume without evidence.
Respond ALWAYS in valid JSON, in English, with the exact structure requested.`
    : `Eres un consultor experto en performance de ventas y marketing digital B2B/B2C.
Aplicas la Teoría de Restricciones (TOC): identifica el ÚNICO cuello de botella real antes de recomendar escalar.
Tu análisis es honesto, accionable y basado en datos. No hagas suposiciones sin evidencia.
Responde SIEMPRE en JSON válido con la estructura exacta que se te indica.`;

  const userPrompt = en ? `## Business context
- Name: ${ctx.businessName || 'Not configured'}
- Country/City: ${ctx.country || '?'}/${ctx.city || '?'}
- Vertical: ${ctx.vertical || 'Not specified'}
- Model: ${ctx.businessModel || 'Not specified'}
- Average ticket: $${ctx.avgTicket || 0} USD
- Monthly ad spend: $${ctx.monthlyAdSpend || 0} USD
- Ad platforms: ${(ctx.adPlatforms || []).join(', ') || 'none'}
- Monthly goal: $${ctx.monthlyGoal || 0} USD
- Main channel: ${ctx.mainChannel || 'not specified'}
- Team size: ${ctx.teamSize || '?'} people
- Recurring service: ${ctx.recurring ? `Yes, average LTV ${ctx.avgClientLifetime} months` : 'No'}

## Current metrics
- Total leads in CRM: ${m.totalLeads || 0}
- Leads current period: ${m.newLeads || 0}
- Active conversations: ${m.inConversacion || 0}
- Scheduled appointments: ${m.scheduled || 0}
- Conversion rate: ${((m.conversionRate || 0) * 100).toFixed(1)}%
- Revenue period: $${m.revenue || 0}
- Require manual attention: ${m.requiresAttention || 0}
- Leads with no response +24h: ${m.leadsWithoutResponse24h || 0}
- No-show rate: ${((adv.noShowRate || 0) * 100).toFixed(1)}%
- Close rate (attended→purchased): ${((adv.closeRate || 0) * 100).toFixed(1)}%
- Real average ticket: $${(adv.avgTicket || 0).toFixed(0)}
- Estimated CAC: $${m.cac || 'no ad spend data'}
- Month forecast: $${m.forecast || 0}
- Best lead day: ${adv.bestDay || 'no data'}
- Peak hour: ${adv.peakHour || 'no data'}

## Current funnel
${funnelText}

## Active alerts
${alertsText}
${historySection}
---
Analyze this data applying TOC. Identify the bottleneck that most limits growth.
Respond exactly in this JSON (no markdown, pure JSON only), with all text values in English:
{
  "bottleneck": {
    "title": "bottleneck title, max 8 words",
    "description": "explanation of why this is THE limiting factor, with evidence from the data",
    "evidence": "specific metric that proves it"
  },
  "insights": [
    {
      "title": "actionable title, max 8 words",
      "data": "specific data point supporting the insight",
      "action": "concrete action that can be taken this week"
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
  "strategic_note": "a strategic observation that doesn't fit the 3 insights, or null if not applicable"
}` : `## Contexto del negocio
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
