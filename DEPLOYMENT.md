# Guía de Deploy — Innovarketing Dashboard Pro v2.0

> Stack: React + Vite · Express · NocoDB · Docker · EasyPanel
> Instalado y configurado 100% desde el dashboard — sin SSH después del deploy inicial.

---

## Prerequisitos

- Repo en GitHub: `ubermancl/innovarketing-dashboard-pro` (público)
- VPS con EasyPanel + Docker instalado
- Instancia NocoDB del cliente con la tabla de leads lista
- API Token de NocoDB del cliente

---

## Paso 1 — Crear el servicio en EasyPanel

1. EasyPanel → **New Service** → **App**
2. En **Fuente** seleccionar **GitHub**
3. Completar:
   - **Propietario**: `ubermancl`
   - **Repositorio**: `innovarketing-dashboard-pro`
   - **Rama**: `main`
   - **Ruta de compilación**: `/` (dejar con la barra)
4. En **Compilación** seleccionar **Dockerfile**
   - **Nombre**: `Dockerfile`
   - **Ruta**: `/Dockerfile`
5. Guardar

---

## Paso 2 — Variables de entorno

En la pestaña **Entorno** agregar:

```
NOCODB_API_TOKEN=<token xc-token del NocoDB del cliente>
DASHBOARD_PASSWORD=<contraseña de acceso para el cliente>
JWT_SECRET=<cadena aleatoria mínimo 32 caracteres>
NODE_ENV=production
PORT=3000
```

> **Generar JWT_SECRET seguro:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> **NOCODB_API_URL no es necesario** — la URL de la tabla se configura desde el dashboard en Ajustes → Instalador.

---

## Paso 3 — Volumen persistente

En la pestaña **Almacenamiento** → **Puntos de montaje** → **Montaje de volumen**:

- **Nombre**: `appdata` (solo letras y números, sin guiones)
- **Ruta**: `/app/data`

Este volumen guarda la configuración del instalador (URLs NocoDB, nombre del cliente, moneda) entre deploys. Sin él se pierde al rebuildar.

---

## Paso 4 — Dominio

En la pestaña **Dominios**:

1. Agregar el dominio del cliente (ej: `demo.innovarketing.com`)
2. Marcar como **principal**
3. En el DNS del cliente crear registro tipo **A**:
   - **Host**: `demo` (o el subdominio elegido)
   - **Valor**: IP del VPS
   - **TTL**: 3600

EasyPanel gestiona el SSL (Let's Encrypt) automáticamente.

---

## Paso 5 — Implementar

Clic en **Implementar**. El build tarda ~2-3 minutos. Seguir los logs hasta ver:

```
🟠 Innovarketing Dashboard Pro
   Puerto: 3000 | Modo: production
   Cliente: (sin configurar)
   Leads: ⚠️  Configura en Ajustes → Instalador
   Recomendaciones: ⚠️  Configura en Ajustes → Instalador
```

---

## Paso 6 — Configuración inicial desde el dashboard

1. Abrir el dominio configurado
2. Login con la `DASHBOARD_PASSWORD` del paso 2
3. Ir a **Ajustes** (ícono esquina superior derecha) → pestaña **Instalador**
4. Completar:
   - **Nombre del cliente**: nombre interno del negocio
   - **Moneda**: la del país del cliente
   - **URL tabla Leads**: endpoint completo de NocoDB `/api/v2/tables/.../records`
   - **URL tabla Recomendaciones IA** (opcional): si ya creaste la tabla en NocoDB
5. Guardar — el dashboard carga los datos inmediatamente

> **Cómo obtener la URL de la tabla NocoDB:**
> NocoDB → abrir la tabla → Details → REST APIs → copiar la URL que termina en `/records`

---

## Paso 7 — Tabla de recomendaciones IA (opcional)

Si el cliente usará el Diagnóstico IA con historial, crear una tabla nueva en su NocoDB con estas columnas exactas:

| Columna | Tipo NocoDB |
|---------|-------------|
| Titulo | Single line text |
| Dato | Single line text |
| Accion | Long text |
| Tipo | Single line text |
| Sesion_ID | Single line text |
| Modelo_IA | Single line text |
| Estado | Single line text |
| Nota_Cliente | Long text |
| Tokens_Sesion | Number |
| Costo_Sesion | Decimal |

Luego pegar la URL de esa tabla en Ajustes → Instalador → URL tabla Recomendaciones IA.

---

## Paso 8 — Configuración del cliente (Ajustes → Contexto del Negocio)

El cliente completa desde su navegador (se guarda en localStorage):
- Nombre del negocio, vertical, país, ciudad
- Ticket promedio, meta mensual, tamaño del equipo
- Plataformas de ads, inversión mensual

Y en **IA & OpenRouter**:
- API Key de OpenRouter (se guarda solo en su navegador)
- Modelo de IA preferido

---

## Checklist de instalación

```
[ ] Servicio creado en EasyPanel (GitHub → main → Dockerfile)
[ ] Variables de entorno configuradas (4 variables mínimas)
[ ] Volumen persistente montado en /app/data (nombre: appdata)
[ ] Dominio configurado + DNS apuntando a la IP del VPS
[ ] Implementar → build exitoso
[ ] Login probado con DASHBOARD_PASSWORD
[ ] Ajustes → Instalador → URL tabla Leads guardada
[ ] Health check: https://dominio/api/health responde { "status": "ok" }
[ ] Dashboard carga datos del CRM del cliente
[ ] (Opcional) Tabla recomendaciones creada en NocoDB y URL configurada
[ ] (Opcional) Cliente configuró su API key de OpenRouter
```

---

## Diagnóstico de errores comunes

| Error | Causa probable | Solución |
|-------|---------------|----------|
| "Error al cargar datos" | URL de leads incorrecta o token inválido | Ajustes → Instalador → revisar URL y token |
| Login no funciona | DASHBOARD_PASSWORD mal copiada | Revisar variable en EasyPanel → Entorno |
| Página en blanco | Error en el build | Ver logs en EasyPanel → Deployments |
| "NOCODB_API_TOKEN no configurado" | Falta la variable en EasyPanel | Agregar NOCODB_API_TOKEN en Entorno → Reimplementar |
| Config se pierde al reimplementar | Volumen no montado | Verificar montaje en /app/data |
| Diagnóstico IA no guarda historial | URL recomendaciones no configurada | Ajustes → Instalador → URL tabla Recomendaciones |

---

## Deploy para cliente NutraClinic (referencia)

```
Dominio:             demo.innovarketing.com
NOCODB_API_TOKEN:    ikSwEjVGYEmOinLPhweaIn7VSHQCcBeOz8br9UG-
URL tabla leads:     https://crm.nutraclinic.pe/api/v2/tables/mpbgjqphs0yncva/records
DASHBOARD_PASSWORD:  nutraclinic2026
```

---

*Innovarketing Dashboard Pro — Javier Vrandečić · [innovarketing.com](https://innovarketing.com)*
