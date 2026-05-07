import { useState, useEffect } from 'react';
import { Save, X, Bot, Building2, Wrench, AlertCircle, CheckCircle2, Trash2, ChevronDown, Database, Copy } from 'lucide-react';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { useInstallerConfig } from '../hooks/useInstallerConfig';
import { Button, Input, Select } from './ui';

const TABS = [
  { id: 'negocio', label: 'Contexto del Negocio', icon: Building2 },
  { id: 'ia', label: 'IA & OpenRouter', icon: Bot },
  { id: 'instalador', label: 'Instalador', icon: Wrench },
];

const VERTICALS = [
  { value: 'clinica', label: 'Clínica / Salud' },
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'academia', label: 'Academia / Educación' },
  { value: 'retail', label: 'Retail / Comercio' },
  { value: 'agencia', label: 'Agencia / Servicios' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'otro', label: 'Otro' },
];

const CURRENCIES = [
  { value: 'USD', locale: 'es-419', label: 'USD — Dólar' },
  { value: 'CLP', locale: 'es-CL',  label: 'CLP — Peso chileno' },
  { value: 'PEN', locale: 'es-PE',  label: 'PEN — Sol peruano' },
  { value: 'MXN', locale: 'es-MX',  label: 'MXN — Peso mexicano' },
  { value: 'COP', locale: 'es-CO',  label: 'COP — Peso colombiano' },
  { value: 'ARS', locale: 'es-AR',  label: 'ARS — Peso argentino' },
  { value: 'EUR', locale: 'es-ES',  label: 'EUR — Euro' },
];

const RECS_SCHEMA = [
  { col: 'Titulo',       type: 'Single line text', desc: 'Título de la recomendación' },
  { col: 'Dato',         type: 'Single line text', desc: 'Dato que sustenta el insight' },
  { col: 'Accion',       type: 'Long text',         desc: 'Acción concreta a tomar' },
  { col: 'Tipo',         type: 'Single line text', desc: 'cuello_botella | insight | nota_estrategica' },
  { col: 'Sesion_ID',    type: 'Single line text', desc: 'Agrupa registros de un análisis' },
  { col: 'Modelo_IA',    type: 'Single line text', desc: 'Modelo de IA utilizado' },
  { col: 'Estado',       type: 'Single line text', desc: 'Pendiente | Aceptada | En Progreso | Implementada | Rechazada' },
  { col: 'Nota_Cliente', type: 'Long text',         desc: 'Comentarios del cliente' },
  { col: 'Tokens_Sesion',type: 'Number',            desc: 'Tokens usados en el análisis' },
  { col: 'Costo_Sesion', type: 'Decimal',           desc: 'Costo USD del análisis' },
];

const AD_PLATFORMS = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'YouTube'];

function Toggle({ label, checked, onChange, description }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-gray-200">{label}</p>
        {description && <p className="text-xs text-dark-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-accent-orange' : 'bg-dark-600'
        }`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}

function CheckboxGroup({ label, options, selected, onChange }) {
  const toggle = (value) => {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    onChange(next);
  };
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 text-xs rounded-button border transition-colors ${
              selected.includes(opt)
                ? 'border-accent-orange bg-accent-orange/15 text-accent-orange'
                : 'border-dark-600 bg-dark-700 text-dark-400 hover:border-dark-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-dark-700 rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-dark-700/30 transition-colors text-left"
      >
        <span className="text-sm text-gray-300 font-medium">{title}</span>
        <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-2 border-t border-dark-700">{children}</div>}
    </div>
  );
}

function LogoUpload({ logoUrl, onChange }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [info, setInfo] = useState('');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    if (file.size > 5 * 1024 * 1024) {
      setStatus('error');
      setInfo(`Imagen demasiado grande (${fileSizeMB} MB). Máximo 5 MB.`);
      e.target.value = '';
      return;
    }

    setStatus('loading');
    setInfo('');

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setStatus('error');
      setInfo('No se pudo leer la imagen. Prueba con otro archivo.');
      e.target.value = '';
    };

    img.onload = () => {
      const SIZE = 96;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onChange(dataUrl);
      setStatus('ok');
      setInfo(`${file.name} · ${img.width}×${img.height}px · ${fileSizeMB} MB → recortado a 96×96`);
      e.target.value = '';
    };

    img.src = objectUrl;
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">Logo del sidebar</label>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-orange flex items-center justify-center shrink-0 overflow-hidden border border-dark-600">
          {logoUrl
            ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
            : <span className="text-white text-sm font-bold">?</span>
          }
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === 'loading'}
            className="px-3 py-1.5 text-xs bg-dark-700 border border-dark-600 rounded-button text-gray-300 hover:border-dark-500 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Procesando...' : logoUrl ? 'Cambiar imagen' : 'Subir imagen'}
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={() => { onChange(''); setStatus(null); setInfo(''); }}
              className="px-3 py-1.5 text-xs bg-dark-700 border border-dark-600 rounded-button text-error/70 hover:text-error hover:border-error/30 transition-colors"
            >
              Quitar
            </button>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
      </div>

      {/* Feedback */}
      {status === 'ok' && (
        <p className="text-xs text-accent-green mt-1.5 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> {info}
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-error mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {info}
        </p>
      )}
      {!status && (
        <p className="text-xs text-dark-500 mt-1.5">PNG, JPG o WebP · máx 5 MB · cualquier tamaño (se recorta al centro automáticamente)</p>
      )}
    </div>
  );
}

function NegocioTab({ local, setLocal }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre del negocio"
          value={local.businessName}
          onChange={e => setLocal(p => ({ ...p, businessName: e.target.value }))}
          placeholder="Ej: Clínica NutraSalud"
        />
        <Select
          label="Vertical del negocio"
          value={local.vertical}
          onChange={e => setLocal(p => ({ ...p, vertical: e.target.value }))}
          options={[{ value: '', label: 'Selecciona...' }, ...VERTICALS]}
        />
        <Input
          label="Iniciales del logo (2 letras)"
          value={local.logoInitials || ''}
          onChange={e => setLocal(p => ({ ...p, logoInitials: e.target.value.slice(0, 2).toUpperCase() }))}
          placeholder="Ej: NC (auto si vacío)"
        />
        <LogoUpload
          logoUrl={local.logoUrl || ''}
          onChange={url => setLocal(p => ({ ...p, logoUrl: url }))}
        />
        <Input
          label="País"
          value={local.country}
          onChange={e => setLocal(p => ({ ...p, country: e.target.value }))}
          placeholder="Ej: Chile"
        />
        <Input
          label="Ciudad principal"
          value={local.city}
          onChange={e => setLocal(p => ({ ...p, city: e.target.value }))}
          placeholder="Ej: Santiago"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Modelo de negocio"
          value={local.businessModel}
          onChange={e => setLocal(p => ({ ...p, businessModel: e.target.value }))}
          options={[
            { value: '', label: 'Selecciona...' },
            { value: 'B2B', label: 'B2B — Vende a empresas' },
            { value: 'B2C', label: 'B2C — Vende a personas' },
            { value: 'Mixto', label: 'Mixto' },
          ]}
        />
        <Select
          label="Canal principal de captación"
          value={local.mainChannel}
          onChange={e => setLocal(p => ({ ...p, mainChannel: e.target.value }))}
          options={[
            { value: '', label: 'Selecciona...' },
            { value: 'organico', label: 'Orgánico (SEO, Redes)' },
            { value: 'pagado', label: 'Pagado (Ads)' },
            { value: 'referidos', label: 'Referidos' },
            { value: 'mixto', label: 'Mixto' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Ticket promedio (USD)"
          type="number"
          value={local.avgTicket}
          onChange={e => setLocal(p => ({ ...p, avgTicket: e.target.value }))}
          placeholder="500"
        />
        <Input
          label="Meta mensual de facturación (USD)"
          type="number"
          value={local.monthlyGoal}
          onChange={e => setLocal(p => ({ ...p, monthlyGoal: e.target.value }))}
          placeholder="10000"
        />
        <Input
          label="Tamaño del equipo"
          type="number"
          value={local.teamSize}
          onChange={e => setLocal(p => ({ ...p, teamSize: e.target.value }))}
          placeholder="3"
        />
      </div>

      <div className="border-t border-dark-700 pt-4 space-y-4">
        <Toggle
          label="¿El servicio es recurrente/suscripción?"
          checked={local.recurring}
          onChange={v => setLocal(p => ({ ...p, recurring: v }))}
          description="Plan mensual, membresía, retainer, etc."
        />
        {local.recurring && (
          <Input
            label="Tiempo promedio de vida del cliente (meses)"
            type="number"
            value={local.avgClientLifetime}
            onChange={e => setLocal(p => ({ ...p, avgClientLifetime: e.target.value }))}
            placeholder="6"
          />
        )}
      </div>

      <div className="border-t border-dark-700 pt-4 space-y-4">
        <Input
          label="Inversión mensual en publicidad (USD, opcional)"
          type="number"
          value={local.monthlyAdSpend}
          onChange={e => setLocal(p => ({ ...p, monthlyAdSpend: e.target.value }))}
          placeholder="1000"
        />
        <CheckboxGroup
          label="Plataformas de ads activas"
          options={AD_PLATFORMS}
          selected={local.adPlatforms || []}
          onChange={v => setLocal(p => ({ ...p, adPlatforms: v }))}
        />
      </div>
    </div>
  );
}

function IATab({ local, setLocal, testResult, onTest, isTesting, models, keyExpired }) {
  const [editingKey, setEditingKey] = useState(!local.openrouterKey);
  const [modelSearch, setModelSearch] = useState('');

  // Auto-refresh model list every 60 s once loaded
  useEffect(() => {
    if (!models.length || !local.openrouterKey) return;
    const timer = setInterval(onTest, 60_000);
    return () => clearInterval(timer);
  }, [models.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const maskedKey = local.openrouterKey
    ? `••••••••••••••••••••${local.openrouterKey.slice(-6)}`
    : '';

  const filteredModels = models.filter(m => {
    const q = modelSearch.toLowerCase();
    if (!q) return true;
    if (q === 'free') return m.free;
    return m.id.toLowerCase().includes(q) || (m.name || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="p-4 bg-dark-700/50 rounded-card border border-dark-600 text-sm text-dark-400 leading-relaxed">
        La API key se guarda solo en tu navegador (localStorage). Nunca sale de tu dispositivo excepto para hacer análisis — se envía al servidor solo por la duración de cada llamada.
      </div>

      {keyExpired && (
        <div className="flex items-center gap-3 p-3 rounded-card bg-error/10 border border-error/30 text-error text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          La API key expiró o es inválida. Límpiala e ingresa una nueva.
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">API Key de OpenRouter</label>
        {editingKey ? (
          <div className="flex gap-2">
            <input
              className="flex-1 bg-dark-700 border border-dark-600 rounded-button px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-orange placeholder:text-dark-500"
              type="password"
              value={local.openrouterKey}
              onChange={e => setLocal(p => ({ ...p, openrouterKey: e.target.value }))}
              placeholder="sk-or-..."
              autoFocus
            />
            {local.openrouterKey && (
              <button
                type="button"
                onClick={() => setEditingKey(false)}
                className="px-3 py-2 text-xs bg-dark-700 border border-dark-600 rounded-button text-gray-300 hover:border-dark-500 transition-colors whitespace-nowrap"
              >
                Cancelar
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-dark-700 border border-dark-600 rounded-button px-3 py-2">
            <span className="flex-1 font-mono text-sm text-dark-400 tracking-wider">{maskedKey}</span>
            <button
              type="button"
              onClick={() => { setLocal(p => ({ ...p, openrouterKey: '' })); setEditingKey(true); }}
              className="p-1 text-dark-500 hover:text-error transition-colors"
              title="Limpiar y cambiar API key"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="secondary"
          onClick={onTest}
          loading={isTesting}
          disabled={!local.openrouterKey || isTesting}
        >
          Probar conexión
        </Button>
        {testResult === 'ok' && (
          <span className="flex items-center gap-1.5 text-sm text-accent-green">
            <CheckCircle2 className="w-4 h-4" /> Conexión exitosa · {models.length} modelos disponibles
          </span>
        )}
        {testResult && testResult !== 'ok' && (
          <span className="flex items-center gap-1.5 text-sm text-error">
            <AlertCircle className="w-4 h-4" /> {testResult}
          </span>
        )}
      </div>

      {models.length > 0 && (
        <div className="space-y-3">
          <input
            className="w-full bg-dark-700 border border-dark-600 rounded-button px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-orange placeholder:text-dark-500"
            placeholder='Buscar modelo... (escribe "free" para gratuitos)'
            value={modelSearch}
            onChange={e => setModelSearch(e.target.value)}
          />
          <div className="rounded-card border border-dark-700 overflow-hidden">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-dark-800">
                  <tr className="text-dark-400">
                    <th className="text-left p-2.5">Modelo</th>
                    <th className="text-right p-2.5 hidden sm:table-cell">In /M tok</th>
                    <th className="text-right p-2.5 hidden sm:table-cell">Out /M tok</th>
                    <th className="text-right p-2.5">~Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map(m => {
                    const estCost = (1200 * m.inputPricePerM / 1_000_000) + (500 * m.outputPricePerM / 1_000_000);
                    const isSelected = local.aiModel === m.id;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setLocal(p => ({ ...p, aiModel: m.id }))}
                        className={`border-t border-dark-700/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-accent-orange/10' : 'hover:bg-dark-700/40'
                        }`}
                      >
                        <td className="p-2.5 text-gray-300">
                          <div className="flex items-center gap-2 min-w-0">
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent-orange shrink-0" />}
                            <span className="truncate">{m.name || m.id}</span>
                            {m.free && (
                              <span className="shrink-0 px-1.5 py-0.5 text-[10px] rounded bg-accent-green/15 text-accent-green">GRATIS</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-right text-dark-400 hidden sm:table-cell">${m.inputPricePerM.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-dark-400 hidden sm:table-cell">${m.outputPricePerM.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-accent-green">
                          {estCost === 0 ? 'Gratis' : `$${estCost.toFixed(4)}`}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredModels.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-dark-500">Sin resultados para "{modelSearch}"</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-dark-500">
            Click en una fila para seleccionar el modelo. Lista actualizada automáticamente cada 60 s.
            {local.aiModel && (
              <span className="ml-2 text-dark-400">
                Seleccionado: <span className="text-gray-300 font-mono">{local.aiModel}</span>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function NocoTokenField({ token, setToken }) {
  const [editing, setEditing] = useState(!token);
  const masked = token ? `••••••••••••••••••••${token.slice(-6)}` : '';

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">Token NocoDB (API key)</label>
      {editing ? (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-dark-700 border border-dark-600 rounded-button px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-orange placeholder:text-dark-500"
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Tu token xc-... de NocoDB"
            autoFocus
          />
          {token && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-2 text-xs bg-dark-700 border border-dark-600 rounded-button text-gray-300 hover:border-dark-500 transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-dark-700 border border-dark-600 rounded-button px-3 py-2">
          <span className="flex-1 font-mono text-sm text-dark-400 tracking-wider">{masked}</span>
          <button
            type="button"
            onClick={() => { setToken(''); setEditing(true); }}
            className="p-1 text-dark-500 hover:text-error transition-colors"
            title="Limpiar y cambiar token"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
      <p className="text-xs text-dark-500 mt-1">Se guarda en tu navegador — nunca se envía al servidor de forma permanente.</p>
    </div>
  );
}

function InstaladorTab({ token, setToken, local, setLocal, isLoading }) {
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [connectError, setConnectError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const connected = bases.length > 0;

  const connect = async () => {
    if (!token || !local.nocodb_base_url) return;
    setIsConnecting(true);
    setConnectError(null);
    setBases([]);
    setTables([]);
    try {
      const res = await fetch('/api/nocodb/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-nocodb-token': token },
        body: JSON.stringify({ base_url: local.nocodb_base_url }),
      });
      const data = await res.json();
      if (!res.ok) { setConnectError(data.error || `Error ${res.status}`); return; }
      setBases(data.bases || []);
      // Si solo hay una base, la seleccionamos automáticamente
      if (data.bases?.length === 1) {
        const baseId = data.bases[0].id;
        setLocal(p => ({ ...p, nocodb_base_id: baseId }));
        fetchTables(baseId, local.nocodb_base_url, token);
      }
    } catch (e) {
      setConnectError(e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchTables = async (baseId, baseUrl, tok) => {
    if (!baseId) return;
    setIsLoadingTables(true);
    setTables([]);
    try {
      const params = new URLSearchParams({ base_url: baseUrl || local.nocodb_base_url });
      const res = await fetch(`/api/nocodb/bases/${baseId}/tables?${params}`, {
        credentials: 'include',
        headers: { 'x-nocodb-token': tok || token },
      });
      const data = await res.json();
      if (res.ok) setTables(data.tables || []);
    } catch (e) { console.error(e); }
    finally { setIsLoadingTables(false); }
  };

  const handleBaseChange = (baseId) => {
    setLocal(p => ({ ...p, nocodb_base_id: baseId, nocodb_leads_table_id: '', nocodb_recs_table_id: '' }));
    fetchTables(baseId);
  };

  const testManual = async () => {
    if (!token || !local.nocodb_base_url || !local.nocodb_leads_table_id) return;
    setIsTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/nocodb/test', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-nocodb-token': token },
        body: JSON.stringify({ base_url: local.nocodb_base_url, table_id: local.nocodb_leads_table_id }),
      });
      const data = await res.json();
      setTestResult(res.ok ? 'ok' : (data.error || `Error ${res.status}`));
    } catch (e) { setTestResult(e.message); }
    finally { setIsTesting(false); }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-dark-400 text-sm">Cargando configuración del servidor...</div>;
  }

  const setField = (key, value) => setLocal(p => ({ ...p, [key]: value }));
  const setMapping = (field, value) => setLocal(p => ({
    ...p, field_mapping: { ...p.field_mapping, [field]: value },
  }));

  return (
    <div className="space-y-5">
      <div className="p-4 bg-accent-orange/8 border border-accent-orange/20 rounded-card text-xs text-dark-400 leading-relaxed">
        La configuración de la tabla se guarda en el servidor. El token solo vive en tu navegador.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nombre del cliente (interno)" value={local.client_name || ''} onChange={e => setField('client_name', e.target.value)} placeholder="Ej: Clínica NutraSalud" />
        <Select
          label="Moneda"
          value={local.currency || 'USD'}
          onChange={e => { const c = CURRENCIES.find(x => x.value === e.target.value); setLocal(p => ({ ...p, currency: e.target.value, currency_locale: c?.locale || 'es-419' })); }}
          options={CURRENCIES.map(c => ({ value: c.value, label: c.label }))}
        />
      </div>

      {/* Credencial NocoDB */}
      <div className="space-y-4 border border-dark-700 rounded-card p-4">
        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-dark-400" /> Credencial NocoDB
        </h4>

        <NocoTokenField token={token} setToken={v => { setToken(v); setBases([]); setTables([]); setConnectError(null); }} />

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Host"
              value={local.nocodb_base_url || ''}
              onChange={e => { setField('nocodb_base_url', e.target.value); setBases([]); setTables([]); setConnectError(null); }}
              placeholder="https://crm.ejemplo.com"
            />
          </div>
          <Button variant="secondary" onClick={connect} loading={isConnecting} disabled={!token || !local.nocodb_base_url || isConnecting}>
            Conectar
          </Button>
        </div>

        {/* Error con instrucción clara si es 403 */}
        {connectError && (
          <div className="p-3 rounded-card bg-error/10 border border-error/20 text-xs text-error space-y-1">
            <p className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{connectError}</p>
            {connectError.includes('permisos') && (
              <p className="text-dark-400 ml-5">En NocoDB: <span className="text-gray-300">Cuenta → Ajustes → API Tokens → crear token nuevo</span> (no desde dentro de una base)</p>
            )}
            <button type="button" onClick={() => setManualMode(true)} className="ml-5 text-accent-orange hover:underline">
              Ingresar IDs manualmente →
            </button>
          </div>
        )}

        {/* Base selector */}
        {connected && (
          <Select
            label="Base de datos"
            value={local.nocodb_base_id || ''}
            onChange={e => handleBaseChange(e.target.value)}
            options={[{ value: '', label: 'Selecciona una base...' }, ...bases.map(b => ({ value: b.id, label: b.title }))]}
          />
        )}

        {/* Table selectors */}
        {isLoadingTables && <p className="text-xs text-dark-400">Cargando tablas...</p>}
        {tables.length > 0 && !isLoadingTables && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Tabla de Leads"
              value={local.nocodb_leads_table_id || ''}
              onChange={e => setField('nocodb_leads_table_id', e.target.value)}
              options={[{ value: '', label: 'Selecciona...' }, ...tables.map(t => ({ value: t.id, label: t.title }))]}
            />
            <Select
              label="Tabla Recomendaciones IA (opcional)"
              value={local.nocodb_recs_table_id || ''}
              onChange={e => setField('nocodb_recs_table_id', e.target.value)}
              options={[{ value: '', label: 'Ninguna' }, ...tables.map(t => ({ value: t.id, label: t.title }))]}
            />
          </div>
        )}

        {/* Status */}
        {local.nocodb_leads_table_id && (
          <p className="text-xs text-accent-green flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Leads configurados{local.nocodb_recs_table_id ? ' · Recomendaciones configuradas' : ''}
          </p>
        )}

        {/* Modo manual — fallback cuando el token es de base */}
        {!connected && (
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            className="text-xs text-dark-400 hover:text-gray-300 transition-colors"
          >
            {manualMode ? '↑ Ocultar IDs manuales' : '¿Token de base? Ingresa IDs manualmente →'}
          </button>
        )}

        {manualMode && !connected && (
          <div className="space-y-3 pt-1 border-t border-dark-700/50">
            <div className="space-y-1">
              <Input
                label="ID de tabla — Leads"
                value={local.nocodb_leads_table_id || ''}
                onChange={e => { setField('nocodb_leads_table_id', e.target.value); setTestResult(null); }}
                placeholder="mpbgjqphs0yncva"
              />
              <p className="text-xs text-dark-500">
                En NocoDB → abre la tabla → URL:{' '}
                <span className="font-mono">/api/v2/tables/<span className="text-accent-orange">ESTE_ID</span>/records</span>
              </p>
            </div>
            <Input
              label="ID de tabla — Recomendaciones IA (opcional)"
              value={local.nocodb_recs_table_id || ''}
              onChange={e => setField('nocodb_recs_table_id', e.target.value)}
              placeholder="md_xxxxxxxxxxxx"
            />
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={testManual} loading={isTesting} disabled={!token || !local.nocodb_base_url || !local.nocodb_leads_table_id || isTesting}>
                Probar conexión
              </Button>
              {testResult === 'ok' && <span className="flex items-center gap-1.5 text-sm text-accent-green"><CheckCircle2 className="w-4 h-4" /> OK</span>}
              {testResult && testResult !== 'ok' && <span className="text-sm text-error">{testResult}</span>}
            </div>
          </div>
        )}
      </div>

      <SchemaHelper />

      <Collapsible title="Mapeo de campos NocoDB (avanzado)">
        <p className="text-xs text-dark-400 mb-4 leading-relaxed">
          Si los nombres de columnas en tu tabla son distintos a los valores por defecto, cámbialos aquí.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(local.field_mapping || {}).map(([key, val]) => (
            <div key={key}>
              <label className="block text-xs text-dark-500 mb-1">{key}</label>
              <input
                className="w-full bg-dark-700 border border-dark-600 rounded text-xs text-gray-300 px-3 py-2 focus:outline-none focus:border-accent-orange"
                value={val}
                onChange={e => setMapping(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

function SchemaHelper() {
  const [copied, setCopied] = useState(false);
  const names = RECS_SCHEMA.map(r => r.col).join(', ');
  const copy = () => {
    navigator.clipboard.writeText(names).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Collapsible title="Esquema de la tabla de recomendaciones (NocoDB)">
      <p className="text-xs text-dark-400 mb-3 leading-relaxed">
        Crea una tabla nueva en NocoDB con estas columnas exactamente. Los nombres son sensibles a mayúsculas.
      </p>
      <div className="rounded border border-dark-700 overflow-hidden mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-dark-700/50">
              <th className="text-left p-2 text-dark-400">Columna</th>
              <th className="text-left p-2 text-dark-400">Tipo NocoDB</th>
              <th className="text-left p-2 text-dark-400 hidden sm:table-cell">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {RECS_SCHEMA.map(r => (
              <tr key={r.col} className="border-t border-dark-700/50">
                <td className="p-2 font-mono text-accent-orange">{r.col}</td>
                <td className="p-2 text-gray-400">{r.type}</td>
                <td className="p-2 text-dark-400 hidden sm:table-cell">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-gray-300 transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        {copied ? 'Copiado' : 'Copiar nombres de columnas'}
      </button>
    </Collapsible>
  );
}

export default function Settings({ onClose }) {
  const { businessContext, saveBusinessContext } = useBusinessContext();
  const { config: installerConfig, isLoading: isLoadingInstaller, saveConfig, isSaving: isSavingInstaller } = useInstallerConfig();

  const [activeTab, setActiveTab] = useState('negocio');
  const [local, setLocal] = useState({ ...businessContext });
  const [localInstaller, setLocalInstaller] = useState({ ...installerConfig });
  const [configSynced, setConfigSynced] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [models, setModels] = useState([]);
  const [keyExpired, setKeyExpired] = useState(false);

  useEffect(() => {
    if (!isLoadingInstaller && !configSynced) {
      setLocalInstaller({ ...installerConfig });
      setConfigSynced(true);
    }
  }, [isLoadingInstaller, installerConfig, configSynced]);

  const handleSave = async () => {
    if (activeTab === 'instalador') {
      const ok = await saveConfig(localInstaller);
      if (ok) {
        // Guarda el token NocoDB en localStorage (igual que el token de OpenRouter)
        saveBusinessContext({ nocodbToken: local.nocodbToken });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } else {
      saveBusinessContext({ ...local, onboardingComplete: true });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose?.(); }, 1000);
    }
  };

  const testConnection = async () => {
    if (!local.openrouterKey) return;
    setIsTesting(true);
    setTestResult(null);
    setKeyExpired(false);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-openrouter-key': local.openrouterKey },
      });
      if (res.status === 401) {
        setKeyExpired(true);
        setTestResult('API key inválida o expirada');
      } else if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        setTestResult('ok');
      } else {
        setTestResult(`Error ${res.status}`);
      }
    } catch (e) {
      setTestResult(e.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-2xl h-full bg-dark-800 border-l border-dark-700 flex flex-col shadow-2xl animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-gray-100">Ajustes del Dashboard</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-dark-700 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-accent-orange text-accent-orange'
                  : 'border-transparent text-dark-400 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'negocio' && <NegocioTab local={local} setLocal={setLocal} />}
          {activeTab === 'ia' && (
            <IATab
              local={local}
              setLocal={setLocal}
              testResult={testResult}
              onTest={testConnection}
              isTesting={isTesting}
              models={models}
              keyExpired={keyExpired}
            />
          )}
          {activeTab === 'instalador' && (
            <InstaladorTab
              token={local.nocodbToken || ''}
              setToken={v => setLocal(p => ({ ...p, nocodbToken: v }))}
              local={localInstaller}
              setLocal={setLocalInstaller}
              isLoading={isLoadingInstaller && !configSynced}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-dark-700 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={isSavingInstaller} disabled={isSavingInstaller}>
            {saved
              ? <><CheckCircle2 className="w-4 h-4 text-accent-green" /> Guardado</>
              : <><Save className="w-4 h-4" /> Guardar ajustes</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
