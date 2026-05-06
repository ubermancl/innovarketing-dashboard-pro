import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fail-fast: el servidor no arranca sin secretos explícitos.
// Defaults inseguros en producción son el vector de ataque más común en dashboards internos.
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET no está definido en .env — el servidor no arrancará sin un secreto explícito.');
  process.exit(1);
}
if (!process.env.DASHBOARD_PASSWORD) {
  console.error('❌ DASHBOARD_PASSWORD no está definido en .env — no se permite contraseña vacía o default.');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET debe tener al menos 32 caracteres para ser seguro.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '24h';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;
const NOCODB_API_URL = process.env.NOCODB_API_URL;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;

// helmet añade ~15 headers de seguridad HTTP (XSS, clickjacking, MIME sniffing).
// Configurado para CSP permisiva porque el frontend carga fonts de Google.
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
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser());

// Rate limiting en login: max 5 intentos por IP cada 15 minutos.
// Evita ataques de fuerza bruta contra la contraseña del dashboard.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos de acceso. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting en el endpoint de IA: max 20 análisis por hora por IP.
// Los análisis de IA tienen costo — esto protege contra uso abusivo de la API key.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Límite de análisis IA alcanzado. Espera una hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authenticateToken = (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.clearCookie('auth_token');
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nocodb: NOCODB_API_URL ? 'configured' : 'not_configured',
  });
});

// ==========================================
// AUTENTICACIÓN
// ==========================================

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Contraseña requerida' });
  if (password !== DASHBOARD_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });

  const token = jwt.sign(
    { authenticated: true, timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ authenticated: true });
});

// ==========================================
// PROXY NOCODB
// ==========================================

app.get('/api/leads', authenticateToken, async (req, res) => {
  if (!NOCODB_API_URL || !NOCODB_API_TOKEN) {
    return res.status(500).json({
      error: 'NocoDB no configurado',
      details: 'Configura NOCODB_API_URL y NOCODB_API_TOKEN en .env',
    });
  }

  try {
    const url = new URL(NOCODB_API_URL);
    url.searchParams.set('limit', req.query.limit || '1000');
    url.searchParams.set('sort', req.query.sort || '-CreatedAt');
    if (req.query.where) url.searchParams.set('where', req.query.where);
    if (req.query.offset) url.searchParams.set('offset', req.query.offset);
    if (req.query.fields) url.searchParams.set('fields', req.query.fields);

    const response = await fetch(url.toString(), {
      headers: { 'xc-token': NOCODB_API_TOKEN, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'Error NocoDB', details: errorText });
    }

    const data = await response.json();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: data.list?.length || 0,
      pageInfo: data.pageInfo || null,
      data: data.list || [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Error de conexión con NocoDB', details: error.message });
  }
});

// ==========================================
// PROXY IA — OpenRouter
// ==========================================
// La API key de OpenRouter viene del cliente en el header x-openrouter-key.
// No se almacena en el servidor — el cliente la guarda en localStorage y la envía por sesión.
// El backend actúa como proxy para evitar problemas CORS y exponer la key en el frontend.

app.post('/api/ai/diagnose', authenticateToken, aiLimiter, async (req, res) => {
  const openrouterKey = req.headers['x-openrouter-key'];
  if (!openrouterKey) {
    return res.status(400).json({ error: 'API key de OpenRouter requerida' });
  }

  const { model, prompt, systemPrompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requerido' });

  const selectedModel = model || 'anthropic/claude-3-haiku';

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
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt || 'Eres un consultor experto en ventas y marketing digital.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: 'Error de OpenRouter',
        details: errorData.error?.message || response.statusText,
      });
    }

    const data = await response.json();
    res.json({
      success: true,
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage || {},
      model: data.model || selectedModel,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error llamando a OpenRouter', details: error.message });
  }
});

// ==========================================
// FRONTEND EN PRODUCCIÓN
// ==========================================

if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
  console.log(`\n🟠 Innovarketing Dashboard Pro`);
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   NocoDB: ${NOCODB_API_URL ? '✅ Configurado' : '⚠️  Sin configurar'}`);
  console.log(`   Seguridad: helmet + rate-limit ✅\n`);
});
