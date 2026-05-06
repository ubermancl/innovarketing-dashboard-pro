# Innovarketing Dashboard Pro — Arquitectura

## Visión general

Dashboard B2B multi-cliente para visualizar y analizar leads de CRMs NocoDB. Diseñado para desplegarse en VPS con Docker + EasyPanel en menos de 10 minutos.

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | React 18 + Vite | SPA rápida, HMR en dev, bundle pequeño |
| Estilos | Tailwind CSS v3 | Dark theme sin CSS custom, utilidades tipadas |
| Gráficos | Recharts | Componentes React nativos, sin deps pesadas |
| Backend | Express.js (ESM) | Proxy ligero — no hay lógica de negocio en el server |
| Datos | NocoDB (externo) | CRM open-source usado por los clientes de Innovarketing |
| IA | OpenRouter (externo) | Acceso multi-modelo con una sola API key |
| Auth | JWT en cookie httpOnly | Sin sessions en servidor, stateless |
| Seguridad | helmet + express-rate-limit | Headers HTTP + protección brute-force |

## Estructura de archivos

```
server/
  index.js            — Express server: auth, proxy NocoDB, proxy OpenRouter

src/
  api/
    client.js         — Fetch wrapper con manejo de errores
    openrouter.js     — Proxy OpenRouter + builder del prompt de diagnóstico

  components/
    AIDiagnosis.jsx   — Diagnóstico IA via OpenRouter (TOC + insights + costos)
    AdvancedMetrics.jsx — Métricas de velocidad de pipeline y patrones
    Alerts.jsx        — Alertas urgentes del CRM (requiere humano, citas sin confirmar)
    Cards.jsx         — KPIs principales + operacionales (2 filas de 6)
    Charts.jsx        — Funnel, pipeline, tendencias, distribuciones
    Header.jsx        — Filtros de fecha, PDF, refresh, ajustes, logout
    Insights.jsx      — Señales automáticas del CRM (sin IA, reglas basadas en datos)
    Layout.jsx        — Shell con gradiente ambiental y footer
    Login.jsx         — Pantalla de acceso por contraseña
    Settings.jsx      — Panel de ajustes: contexto del negocio + OpenRouter
    Table.jsx         — Tabla de leads con búsqueda y filtros

  config/
    client.js         — Branding por defecto (se sobreescribe desde businessContext)

  hooks/
    useAuth.jsx       — Contexto de autenticación JWT
    useBusinessContext.js — Contexto del negocio + API key IA (localStorage)
    useLeads.js       — Fetch + cache + filtros de leads desde el backend
    useStats.js       — Cálculo de todas las métricas derivadas de los leads

  utils/
    aiCostEstimator.js — Cálculo de costos de llamadas a la IA por modelo
    calculations.js    — Todas las funciones puras de análisis de datos
    constants.js       — Paleta de colores, modelos IA, estados CRM, fields
    formatters.js      — Formateo de números, fechas, monedas
```

## Flujo de datos

```
NocoDB → GET /api/leads (autenticado) → useLeads → useStats → componentes
                                                              ↑
                                          businessContext (localStorage)

OpenRouter → POST /api/ai/diagnose (autenticado + key en header) → AIDiagnosis
```

## Decisiones de diseño

### Por qué el backend no almacena la API key de OpenRouter
La key viaja en el header `x-openrouter-key` por HTTPS. El backend la usa y la descarta. El cliente la guarda en localStorage. Esto hace que cada instalación del dashboard sea independiente — el dueño del dashboard controla su propio presupuesto de IA.

### Por qué el onboarding es en localStorage y no en la DB
El dashboard es para un único usuario por instalación. No hay multi-tenancy. LocalStorage es suficiente, no requiere migración, y funciona offline.

### Por qué dos filas de KPIs (Cards.jsx)
La primera fila son métricas de volumen (¿cuánto está entrando?). La segunda son métricas de calidad (¿qué pasa con lo que entra?). Separar las capas evita que un número grande tape una alerta operacional crítica.

### Por qué Insights.jsx y AIDiagnosis.jsx son componentes separados
- `Insights.jsx`: reglas determinísticas, sin costo, sin latencia. Siempre disponibles.
- `AIDiagnosis.jsx`: llamada al LLM, tiene costo y latencia. Opcional, bajo demanda.

### Por qué usar `response_format: { type: 'json_object' }` en OpenRouter
Garantiza que el modelo devuelva JSON parseable. Sin esto, el modelo puede envolver el JSON en markdown (```json...```), lo que rompe el parse.

## Cómo agregar nuevos KPIs

1. Agregar la función de cálculo en `src/utils/calculations.js`
2. Exportarla en `src/hooks/useStats.js`
3. Pasarla como prop en `src/App.jsx`
4. Renderizarla en `src/components/Cards.jsx` o en un nuevo componente

## Cómo conectar nuevas fuentes de datos

1. Agregar un nuevo endpoint en `server/index.js` (siguiendo el patrón del proxy NocoDB)
2. Crear un hook `useXxx.js` en `src/hooks/` que consuma el endpoint
3. Agregar variables de entorno necesarias en `.env.example`

## Despliegue en EasyPanel

1. Crear app en EasyPanel → tipo "Dockerfile"
2. Conectar el repositorio
3. Agregar las variables de entorno del `.env.example` en el panel de EasyPanel
4. Mapear el puerto 3000
5. Deploy — el Dockerfile hace el build en dos etapas (builder + production)

Tiempo estimado desde cero: 8-10 minutos.
