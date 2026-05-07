# Guía de Deploy — Innovarketing Dashboard Pro v2.0
### Panel de control visual para el stack Nivel 2 (Agente WhatsApp IA)

> **Contexto:** Este dashboard se instala como capa de visualización sobre el CRM NocoDB  
> del cliente que ya tiene el stack Nivel 2 funcionando (n8n + NocoDB + Chatwoot + WhatsApp).  
> No reemplaza ninguna pieza del stack — solo lee los datos del CRM y los presenta con métricas, gráficos y diagnóstico IA.

---

## Prerequisitos

Antes de instalar este dashboard el cliente debe tener:

- [ ] NocoDB corriendo con la tabla CRM de leads creada (Nivel 2 — Lección 2.3)
- [ ] API Token de NocoDB disponible (Settings → API Tokens)
- [ ] URL del endpoint de la tabla de leads (`/api/v2/tables/.../records`)
- [ ] VPS con EasyPanel + Docker instalado
- [ ] Dominio o subdominio apuntando a la IP del VPS

---

## Paso 1 — Crear el servicio en EasyPanel

1. EasyPanel → **New Service** → **App**
2. **Fuente** → **GitHub**
   - Propietario: `ubermancl`
   - Repositorio: `innovarketing-dashboard-pro`
   - Rama: `main`
   - Ruta de compilación: `/`
3. **Compilación** → **Dockerfile**
   - Nombre: `Dockerfile`
   - Ruta: `/Dockerfile`
4. Guardar

---

## Paso 2 — Variables de entorno

Pestaña **Entorno**:

```
NOCODB_API_TOKEN=<token del NocoDB del cliente>
DASHBOARD_PASSWORD=<contraseña que usará el cliente para entrar>
JWT_SECRET=<cadena aleatoria mínimo 32 caracteres>
NODE_ENV=production
PORT=3000
```

**Cómo generar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Dónde obtener NOCODB_API_TOKEN:**
NocoDB del cliente → Team & Settings → API Tokens → copiar o crear uno nuevo

> La URL de la tabla de leads NO va aquí — se configura desde el dashboard mismo en el Paso 6.

---

## Paso 3 — Volumen persistente

Pestaña **Almacenamiento** → **Montaje de volumen**:

- **Nombre**: `appdata`
- **Ruta**: `/app/data`

Este volumen guarda la configuración del instalador entre deploys (URLs del CRM, nombre del cliente, moneda). Sin él se pierde al actualizar.

---

## Paso 4 — Dominio

Pestaña **Dominios**:

1. Agregar subdominio (ej: `dashboard.clinicademo.com`)
2. Marcar como principal
3. En el DNS del cliente: registro tipo **A** apuntando a la IP del VPS

EasyPanel genera el certificado SSL automáticamente.

---

## Paso 5 — Implementar

Clic en **Implementar**. El build tarda ~2-3 minutos.

El build fue exitoso cuando los logs muestran:
```
🟠 Innovarketing Dashboard Pro
   Puerto: 3000 | Modo: production
```

---

## Paso 6 — Primera configuración (tab Instalador)

1. Abrir el dominio del dashboard
2. Login con la `DASHBOARD_PASSWORD` del Paso 2
3. Clic en el ícono de ajustes (esquina superior derecha)
4. Ir a la pestaña **Instalador**
5. Completar:
   - **Nombre del cliente**: nombre interno del negocio
   - **Moneda**: moneda del país del cliente (CLP, PEN, USD, etc.)
   - **URL tabla Leads**: endpoint completo del NocoDB
     ```
     https://crm.cliente.com/api/v2/tables/TABLA_ID/records
     ```
   - **URL tabla Recomendaciones IA**: (ver Paso 7, puede dejarse vacío por ahora)
6. Guardar → el dashboard carga los datos del CRM inmediatamente

**Cómo obtener la URL de la tabla:**
NocoDB → abrir tabla CRM → ícono `</>` (Details) → REST APIs → copiar URL que termina en `/records`

---

## Paso 7 — Tabla de recomendaciones IA (opcional)

Permite que el Diagnóstico IA guarde cada análisis en NocoDB y lleve historial de recomendaciones por sesión.

Crear una tabla nueva en el NocoDB del cliente con estas columnas exactas:

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

## Paso 8 — Configuración del cliente

El cliente completa desde su propio navegador (se guarda localmente):

**Ajustes → Contexto del Negocio:**
- Nombre, vertical, país, ciudad, modelo de negocio
- Ticket promedio, meta mensual de facturación, tamaño del equipo
- Plataformas de ads e inversión mensual

**Ajustes → IA & OpenRouter:**
- API Key de OpenRouter (gratis registrarse, Claude Haiku cuesta ~$0.001/análisis)
- Modelo de IA preferido

Con esto activado el cliente puede ejecutar diagnósticos IA con Teoría de Restricciones sobre sus propios datos del CRM.

---

## Checklist completo

```
[ ] Stack Nivel 2 del cliente ya funcionando (NocoDB con datos de leads)
[ ] Servicio creado en EasyPanel (GitHub → main → /Dockerfile)
[ ] Variables de entorno: NOCODB_API_TOKEN, DASHBOARD_PASSWORD, JWT_SECRET, NODE_ENV, PORT
[ ] Volumen persistente montado: nombre=appdata, ruta=/app/data
[ ] Dominio configurado + DNS apuntando a la IP del VPS
[ ] Implementar → build exitoso
[ ] Login con DASHBOARD_PASSWORD funciona
[ ] Ajustes → Instalador → URL tabla Leads guardada → datos cargan
[ ] Health check OK: https://dominio/api/health → { "status": "ok" }
[ ] (Opcional) Tabla recomendaciones creada y URL configurada
[ ] (Opcional) Cliente configuró su API key de OpenRouter
```

---

## Errores comunes

| Error en pantalla | Causa | Solución |
|-------------------|-------|----------|
| "Error al cargar datos" | URL de leads incorrecta o token inválido | Ajustes → Instalador → revisar URL y token |
| Login no funciona | DASHBOARD_PASSWORD mal copiada | EasyPanel → Entorno → corregir y reimplementar |
| Página en blanco | Error en el build | EasyPanel → Deployments → ver logs |
| Config se pierde al actualizar | Volumen no montado | Verificar montaje appdata en /app/data |
| Diagnóstico IA no guarda | URL recomendaciones vacía | Ajustes → Instalador → agregar URL tabla recomendaciones |

---

## Referencia — NutraClinic (primer deploy, mayo 2026)

```
Dominio:            demo.innovarketing.com
NOCODB_API_TOKEN:   ikSwEjVGYEmOinLPhweaIn7VSHQCcBeOz8br9UG-
URL tabla leads:    https://crm.nutraclinic.pe/api/v2/tables/mpbgjqphs0yncva/records
DASHBOARD_PASSWORD: nutraclinic2026
```

---

*Innovarketing Dashboard Pro — Javier Vrandečić · [innovarketing.com](https://innovarketing.com)*
