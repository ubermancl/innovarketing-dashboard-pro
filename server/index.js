import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET no definido en .env'); process.exit(1);
}
if (!process.env.DASHBOARD_PASSWORD) {
  console.error('❌ DASHBOARD_PASSWORD no definido en .env'); process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET debe tener al menos 32 caracteres'); process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;

// ==========================================
// INSTALLER CONFIG — archivo server-side persistente
// Separado del .env para que el instalador pueda configurar desde el dashboard
// sin necesitar acceso SSH/EasyPanel después del deploy inicial.
// ==========================================

// En producción Docker montar /app/data como volumen persistente en EasyPanel.
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const CONFIG_PATH = join(DATA_DIR, 'installer.config.json');
mkdirSync(DATA_DIR, { recursive: true });

const DEFAULT_CONFIG = {
  client_name: '',
  currency: 'USD',
  currency_locale: 'es-419',
  nocodb_leads_url: '',
  nocodb_recs_url: '',
  field_mapping: {
    estadoCRM: 'Estado CRM',
    montoVenta: 'Monto Venta Cerrada (PEN)',
    origenLead: 'Origen del Lead',
    ultimaModificacion: 'Última Modificación',
    fechaAgendamiento: 'Fecha de agendamiento',
    nombre: 'Nombre',
    phone: 'Phone',
    email: 'Email',
  },
};

function readConfig() {
  try {
    if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function writeConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

// Resuelve la URL de leads: config file tiene prioridad sobre .env
// Así el instalador puede cambiar la tabla sin SSH
function getLeadsUrl() {
  const cfg = readConfig();
  return cfg.nocodb_leads_url || process.env.NOCODB_API_URL || '';
}

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true, legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  message: { error: 'Límite de análisis IA alcanzado. Espera una hora.' },
  standardHeaders: true, legacyHeaders: false,
});

const authenticateToken = (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('auth_token');
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Helper para proxear requests a NocoDB
async function nocodbRequest(url, method = 'GET', body = null) {
  if (!NOCODB_API_TOKEN) throw new Error('NOCODB_API_TOKEN no configurado en .env');
  const options = {
    method,
    headers: { 'xc-token': NOCODB_API_TOKEN, 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`NocoDB ${response.status}: ${text}`);
  }
  return response.json();
}

// ==========================================
// HEALTH
// ==========================================

app.get('/api/health', (req, res) => {
  const cfg = readConfig();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nocodb_leads: getLeadsUrl() ? 'configured' : 'not_configured',
    nocodb_recs: cfg.nocodb_recs_url ? 'configured' : 'not_configured',
    client: cfg.client_name || 'unnamed',
  });
});

// ==========================================
// AUTENTICACIÓN
// ==========================================

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Contraseña requerida' });
  if (password !== DASHBOARD_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });
  const token = jwt.sign({ authenticated: true, timestamp: Date.now() }, JWT_SECRET, { expiresIn: '24h' });
  res.cookie('auth_token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000,
  });
  res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => res.json({ authenticated: true }));

// ==========================================
// INSTALLER CONFIG
// ==========================================

// Devuelve la config del instalador — sin el token NocoDB (que vive en .env)
app.get('/api/installer/config', authenticateToken, (req, res) => {
  const cfg = readConfig();
  res.json({
    ...cfg,
    nocodb_token_configured: Boolean(NOCODB_API_TOKEN),
    // El env URL original (puede estar vacío si el instalador usa config file)
    env_leads_url: process.env.NOCODB_API_URL || '',
  });
});

app.put('/api/installer/config', authenticateToken, (req, res) => {
  const current = readConfig();
  const allowed = ['client_name', 'currency', 'currency_locale', 'nocodb_leads_url', 'nocodb_recs_url', 'field_mapping'];
  const updates = {};
  allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
  const next = { ...current, ...updates };
  writeConfig(next);
  res.json({ success: true, config: next });
});

// ==========================================
// PROXY LEADS (NocoDB)
// ==========================================

app.get('/api/leads', authenticateToken, async (req, res) => {
  const leadsUrl = getLeadsUrl();
  if (!leadsUrl) return res.status(500).json({ error: 'URL de leads no configurada. Ve a Ajustes → Instalador.' });

  try {
    const url = new URL(leadsUrl);
    url.searchParams.set('limit', req.query.limit || '1000');
    url.searchParams.set('sort', req.query.sort || '-CreatedAt');
    if (req.query.where) url.searchParams.set('where', req.query.where);
    if (req.query.offset) url.searchParams.set('offset', req.query.offset);
    if (req.query.fields) url.searchParams.set('fields', req.query.fields);

    const data = await nocodbRequest(url.toString());
    res.json({ success: true, timestamp: new Date().toISOString(), count: data.list?.length || 0, pageInfo: data.pageInfo || null, data: data.list || [] });
  } catch (error) {
    res.status(500).json({ error: 'Error conectando a NocoDB (leads)', details: error.message });
  }
});

// ==========================================
// PROXY RECOMENDACIONES (NocoDB)
// ==========================================

app.get('/api/recommendations', authenticateToken, async (req, res) => {
  const cfg = readConfig();
  if (!cfg.nocodb_recs_url) return res.status(404).json({ error: 'Tabla de recomendaciones no configurada. Ve a Ajustes → Instalador.' });

  try {
    const url = new URL(cfg.nocodb_recs_url);
    url.searchParams.set('limit', req.query.limit || '100');
    url.searchParams.set('sort', '-CreatedAt');
    const data = await nocodbRequest(url.toString());
    res.json({ success: true, data: data.list || [], count: data.list?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Error conectando a NocoDB (recomendaciones)', details: error.message });
  }
});

// Crear una o varias recomendaciones (body puede ser un objeto o un array)
app.post('/api/recommendations', authenticateToken, async (req, res) => {
  const cfg = readConfig();
  if (!cfg.nocodb_recs_url) return res.status(404).json({ error: 'Tabla de recomendaciones no configurada.' });

  try {
    // NocoDB v2 acepta array o objeto en el body del POST
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const data = await nocodbRequest(cfg.nocodb_recs_url, 'POST', payload);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Error guardando recomendación', details: error.message });
  }
});

// Actualizar estado de una recomendación (Estado, Nota_Cliente)
// NocoDB v2 bulk PATCH acepta un array con el Id del registro
app.patch('/api/recommendations/:id', authenticateToken, async (req, res) => {
  const cfg = readConfig();
  if (!cfg.nocodb_recs_url) return res.status(404).json({ error: 'Tabla de recomendaciones no configurada.' });

  const { Estado, Nota_Cliente } = req.body;
  const rowId = parseInt(req.params.id, 10);
  if (isNaN(rowId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const update = { Id: rowId };
    if (Estado !== undefined) update.Estado = Estado;
    if (Nota_Cliente !== undefined) update.Nota_Cliente = Nota_Cliente;

    const data = await nocodbRequest(cfg.nocodb_recs_url, 'PATCH', [update]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando recomendación', details: error.message });
  }
});

// ==========================================
// PROXY IA — OpenRouter
// ==========================================

app.post('/api/ai/diagnose', authenticateToken, aiLimiter, async (req, res) => {
  const openrouterKey = req.headers['x-openrouter-key'];
  if (!openrouterKey) return res.status(400).json({ error: 'API key de OpenRouter requerida' });

  const { model, prompt, systemPrompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requerido' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://innovarketing.com',
        'X-Title': 'Innovarketing Dashboard Pro',
      },
      body: JSON.stringify({
        model: model || 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt || 'Eres un consultor experto en ventas.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: 'Error OpenRouter', details: err.error?.message || response.statusText });
    }

    const data = await response.json();
    res.json({ success: true, content: data.choices?.[0]?.message?.content || '', usage: data.usage || {}, model: data.model || model });
  } catch (error) {
    res.status(500).json({ error: 'Error llamando a OpenRouter', details: error.message });
  }
});

// Test de conexión OpenRouter — valida la key sin hacer una llamada de IA completa
app.post('/api/ai/test', authenticateToken, aiLimiter, async (req, res) => {
  const openrouterKey = req.headers['x-openrouter-key'];
  if (!openrouterKey) return res.status(400).json({ error: 'API key requerida' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${openrouterKey}` },
    });
    if (!response.ok) return res.status(response.status).json({ error: `OpenRouter respondió ${response.status}` });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// FRONTEND
// ==========================================

if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

// ==========================================
// START
// ==========================================

app.listen(PORT, () => {
  const cfg = readConfig();
  console.log(`\n🟠 Innovarketing Dashboard Pro`);
  console.log(`   Puerto: ${PORT} | Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Cliente: ${cfg.client_name || '(sin configurar)'}`);
  console.log(`   Leads: ${getLeadsUrl() ? '✅' : '⚠️  Configura en Ajustes → Instalador'}`);
  console.log(`   Recomendaciones: ${cfg.nocodb_recs_url ? '✅' : '⚠️  Configura en Ajustes → Instalador'}`);
  console.log(`   Seguridad: helmet + rate-limit ✅\n`);
});
