# Innovarketing Dashboard Pro

Dashboard B2B multi-cliente para gestión y análisis de leads desde NocoDB, con diagnóstico IA via OpenRouter. Desarrollado por [Innovarketing.com](https://innovarketing.com).

## Características

- Métricas en tiempo real de leads y conversiones
- Gráficos interactivos (funnel, tendencias, distribución)
- Tabla de leads con búsqueda, filtros y exportación CSV
- Alertas automáticas para leads que requieren atención
- Insights inteligentes basados en datos
- Autenticación segura con JWT httpOnly
- Responsive (mobile, tablet, desktop)
- Conexión a NocoDB protegida vía proxy

## Tecnologías

- **Frontend:** React 18, Vite 5, Tailwind CSS 3
- **Gráficos:** Recharts
- **Tabla:** TanStack Table
- **Backend:** Express.js (proxy + auth)
- **Auth:** JWT con cookies httpOnly

## Instalación

### Requisitos previos

- Node.js 18+
- npm o yarn

### Desarrollo local

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd dashboard
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

4. Configurar las variables de entorno en `.env`:
```env
NOCODB_API_URL=https://tu-nocodb.com/api/v2/tables/TU_TABLE_ID/records
NOCODB_API_TOKEN=tu_token_aqui
DASHBOARD_PASSWORD=tu_contraseña_segura
JWT_SECRET=secreto_aleatorio_32_caracteres
```

5. Iniciar en modo desarrollo:
```bash
npm run dev
```

El frontend estará en `http://localhost:5173` y el backend en `http://localhost:3000`.

## Despliegue con Docker

### Build y ejecutar localmente

```bash
# Build
docker build -t innovarketing-dashboard-pro .

# Ejecutar
docker run -p 3000:3000 \
  -e NOCODB_API_URL=https://tu-nocodb.com/api/v2/tables/TU_TABLE_ID/records \
  -e NOCODB_API_TOKEN=tu_token \
  -e DASHBOARD_PASSWORD=tu_contraseña \
  -e JWT_SECRET=tu_secreto \
  innovarketing-dashboard-pro
```

### Despliegue en EasyPanel

1. Crear nueva aplicación desde Dockerfile
2. Apuntar al repositorio Git
3. Configurar variables de entorno:
   - `NOCODB_API_URL`
   - `NOCODB_API_TOKEN`
   - `DASHBOARD_PASSWORD`
   - `JWT_SECRET`
4. Puerto: 3000
5. Dominio: configurar según necesidad

## Estructura del Proyecto

```
dashboard/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── Dockerfile
├── server/
│   └── index.js         # Express API
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── api/
    │   └── client.js    # Cliente API
    ├── components/
    │   ├── Login.jsx
    │   ├── Header.jsx
    │   ├── Cards.jsx
    │   ├── Alerts.jsx
    │   ├── Charts.jsx
    │   ├── Table.jsx
    │   ├── Insights.jsx
    │   └── ui/          # Componentes reutilizables
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useLeads.js
    │   └── useStats.js
    └── utils/
        ├── formatters.js
        ├── calculations.js
        └── constants.js
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/verify` | Verificar sesión |
| GET | `/api/leads` | Obtener leads |

## Seguridad

- Token de NocoDB solo accesible desde el servidor
- Autenticación con JWT en cookies httpOnly
- Sesiones expiran en 24 horas
- HTTPS obligatorio en producción
- Sin exposición de credenciales en frontend

## Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NOCODB_API_URL` | URL de la API de NocoDB | Sí |
| `NOCODB_API_TOKEN` | Token de autenticación NocoDB | Sí |
| `DASHBOARD_PASSWORD` | Contraseña para acceder | Sí |
| `JWT_SECRET` | Secreto para firmar JWT | Sí |
| `PORT` | Puerto del servidor (default: 3000) | No |

## Soporte

Para reportar problemas o solicitar funcionalidades, crear un issue en el repositorio.

---

Desarrollado por Innovarketing.com
