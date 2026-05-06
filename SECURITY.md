# Innovarketing Dashboard Pro — Security

## Fixes aplicados (v2.0)

### 1. JWT_SECRET sin default inseguro

**Antes:** `const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'`

**Después:** El servidor llama `process.exit(1)` si `JWT_SECRET` no está definido o tiene menos de 32 caracteres.

**Por qué importa:** Un JWT firmado con un secret conocido puede ser forjado. Cualquier atacante puede generar tokens válidos si conoce el secret por defecto. En producción, esto da acceso completo al dashboard sin contraseña.

---

### 2. DASHBOARD_PASSWORD sin default 'admin'

**Antes:** `const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin'`

**Después:** El servidor llama `process.exit(1)` si `DASHBOARD_PASSWORD` no está en `.env`.

**Por qué importa:** 'admin' es la contraseña más escaneada por bots en internet. Un dashboard expuesto sin contraseña fuerte es comprometido en horas.

---

### 3. Rate limiting en el endpoint de login

**Implementación:** `express-rate-limit` — máximo 5 intentos por IP en 15 minutos.

**Por qué importa:** Sin rate limiting, un atacante puede intentar millones de contraseñas por segundo (brute force). Con 5 intentos por IP/15min, atacar una contraseña de 8 caracteres llevaría siglos.

---

### 4. Headers de seguridad HTTP con Helmet

**Implementación:** `helmet` añade ~15 headers en cada respuesta.

Headers más importantes que agrega:
- `X-Frame-Options: DENY` — previene clickjacking
- `X-Content-Type-Options: nosniff` — previene MIME sniffing
- `Strict-Transport-Security` — fuerza HTTPS
- `X-XSS-Protection: 0` — deshabilita el XSS auditor roto de IE
- `Content-Security-Policy` — restringe orígenes de scripts/estilos

**Por qué importa:** Sin estos headers, browsers modernos dan más superficie de ataque. Son 3 líneas de código y cubren la mayoría del OWASP Top 10 relacionado con headers.

---

### 5. Rate limiting en el endpoint de IA

**Implementación:** Máximo 20 análisis por IP por hora.

**Por qué importa:** La API key de OpenRouter tiene costo. Sin límite, un atacante que robe la sesión (cookie) podría generar miles de llamadas en segundos, generando una factura inesperada.

---

## Consideraciones para producción

- Usar siempre HTTPS (EasyPanel lo maneja automáticamente con Let's Encrypt)
- Generar `JWT_SECRET` con `openssl rand -base64 32`
- Nunca commitear `.env` al repositorio (ya está en `.gitignore`)
- La API key de OpenRouter se guarda en el browser del cliente (localStorage) — no en el servidor
- Rotar el `JWT_SECRET` invalida todas las sesiones activas (usuarios deben re-login)
