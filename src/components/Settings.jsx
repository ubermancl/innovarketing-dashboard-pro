import { useState, useEffect } from 'react';
import { Save, X, Bot, Building2, Wrench, AlertCircle, CheckCircle2, Eye, EyeOff, ChevronDown, Database, Copy } from 'lucide-react';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { useInstallerConfig } from '../hooks/useInstallerConfig';
import { Button, Input, Select, Card } from './ui';
import { AI_MODELS } from '../utils/constants';

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
  { value: 'CLP', locale: 'es-CL', label: 'CLP — Peso chileno' },
  { value: 'PEN', locale: 'es-PE', label: 'PEN — Sol peruano' },
  { value: 'MXN', locale: 'es-MX', label: 'MXN — Peso mexicano' },
  { value: 'COP', locale: 'es-CO', label: 'COP — Peso colombiano' },
  { value: 'ARS', locale: 'es-AR', label: 'ARS — Peso argentino' },
  { value: 'EUR', locale: 'es-ES', label: 'EUR — Euro' },
];

const RECS_SCHEMA = [
  { col: 'Titulo', type: 'Single line text', desc: 'Título de la recomendación' },
  { col: 'Dato', type: 'Single line text', desc: 'Dato que sustenta el insight' },
  { col: 'Accion', type: 'Long text', desc: 'Acción concreta a tomar' },
  { col: 'Tipo', type: 'Single line text', desc: 'cuello_botella | insight | nota_estrategica' },
  { col: 'Sesion_ID', type: 'Single line text', desc: 'Agrupa registros de un análisis' },
  { col: 'Modelo_IA', type: 'Single line text', desc: 'Modelo de IA utilizado' },
  { col: 'Estado', type: 'Single line text', desc: 'Pendiente | Aceptada | En Progreso | Implementada | Rechazada' },
  { col: 'Nota_Cliente', type: 'Long text', desc: 'Comentarios del cliente' },
  { col: 'Tokens_Sesion', type: 'Number', desc: 'Tokens usados en el análisis' },
  { col: 'Costo_Sesion', type: 'Decimal', desc: 'Costo USD del análisis' },
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

function IATab({ local, setLocal, testResult, onTest, isTesting }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-dark-700/50 rounded-card border border-dark-600 text-sm text-dark-400 leading-relaxed">
        La API key se guarda solo en tu navegador (localStorage). Nunca sale de tu dispositivo excepto para hacer análisis — se envía al servidor solo por la duración de cada llamada.
      </div>

      <div className="relative">
        <Input
          label="API Key de OpenRouter"
          type={showKey ? 'text' : 'password'}
          value={local.openrouterKey}
          onChange={e => setLocal(p => ({ ...p, openrouterKey: e.target.value }))}
          placeholder="sk-or-..."
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-9 text-dark-400 hover:text-gray-300 transition-colors"
        >
          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <Select
        label="Modelo de IA"
        value={local.aiModel}
        onChange={e => setLocal(p => ({ ...p, aiModel: e.target.value }))}
        options={AI_MODELS.map(m => ({ value: m.id, label: m.name }))}
      />

      <div className="rounded-card border border-dark-700 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-dark-700/50 text-dark-400">
              <th className="text-left p-3">Modelo</th>
              <th className="text-right p-3">Input /M tokens</th>
              <th className="text-right p-3">Output /M tokens</th>
              <th className="text-right p-3">~Costo/análisis</th>
            </tr>
          </thead>
          <tbody>
            {AI_MODELS.map((m) => {
              const estCost = (1200 * m.inputPricePerM / 1_000_000) + (500 * m.outputPricePerM / 1_000_000);
              return (
                <tr key={m.id} className={`border-t border-dark-700 ${local.aiModel === m.id ? 'bg-accent-orange/5' : ''}`}>
                  <td className="p-3 text-gray-300 flex items-center gap-2">
                    {local.aiModel === m.id && <span className="w-1.5 h-1.5 rounded-full bg-accent-orange" />}
                    {m.name}
                  </td>
                  <td className="p-3 text-right text-dark-400">${m.inputPricePerM || '0'}</td>
                  <td className="p-3 text-right text-dark-400">${m.outputPricePerM || '0'}</td>
                  <td className="p-3 text-right text-accent-green font-mono">{estCost === 0 ? 'Gratis' : `$${estCost.toFixed(4)}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
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
            <CheckCircle2 className="w-4 h-4" /> Conexión exitosa
          </span>
        )}
        {testResult && testResult !== 'ok' && (
          <span className="flex items-center gap-1.5 text-sm text-error">
            <AlertCircle className="w-4 h-4" /> {testResult}
          </span>
        )}
      </div>
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

function InstaladorTab({ local, setLocal, isLoading }) {
  const [showMapping, setShowMapping] = useState(false);

  if (isLoading) {
    return <div className="py-8 text-center text-dark-400 text-sm">Cargando configuración del servidor...</div>;
  }

  const setField = (key, value) => setLocal(p => ({ ...p, [key]: value }));
  const setMapping = (field, value) => setLocal(p => ({
    ...p,
    field_mapping: { ...p.field_mapping, [field]: value },
  }));

  const currencyOpt = CURRENCIES.find(c => c.value === local.currency);

  return (
    <div className="space-y-5">
      <div className="p-4 bg-accent-orange/8 border border-accent-orange/20 rounded-card text-xs text-dark-400 leading-relaxed">
        Esta configuración se guarda en el servidor. Cámbiala desde el dashboard sin necesitar acceso SSH.
      </div>

      {/* Datos del cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre del cliente (interno)"
          value={local.client_name || ''}
          onChange={e => setField('client_name', e.target.value)}
          placeholder="Ej: Clínica NutraSalud"
        />
        <Select
          label="Moneda"
          value={local.currency || 'USD'}
          onChange={e => {
            const c = CURRENCIES.find(x => x.value === e.target.value);
            setLocal(p => ({ ...p, currency: e.target.value, currency_locale: c?.locale || 'es-419' }));
          }}
          options={CURRENCIES.map(c => ({ value: c.value, label: c.label }))}
        />
      </div>

      {/* URLs NocoDB */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-dark-400" /> Conexión NocoDB
        </h4>
        <Input
          label="URL tabla Leads (endpoint completo /api/v1/db/data/...)"
          value={local.nocodb_leads_url || ''}
          onChange={e => setField('nocodb_leads_url', e.target.value)}
          placeholder="https://crm.ejemplo.com/api/v1/db/data/noco/.../md_..."
        />
        <div>
          <Input
            label="URL tabla Recomendaciones IA"
            value={local.nocodb_recs_url || ''}
            onChange={e => setField('nocodb_recs_url', e.target.value)}
            placeholder="https://crm.ejemplo.com/api/v1/db/data/noco/.../md_..."
          />
          {local.nocodb_recs_url && (
            <p className="text-xs text-accent-green mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Historial IA activo
            </p>
          )}
          {!local.nocodb_recs_url && (
            <p className="text-xs text-dark-500 mt-1">Sin URL → el historial IA no estará disponible</p>
          )}
        </div>
      </div>

      {/* Schema helper */}
      <SchemaHelper />

      {/* Mapeo de campos */}
      <Collapsible title="Mapeo de campos NocoDB (avanzado)">
        <p className="text-xs text-dark-400 mb-4 leading-relaxed">
          Si los nombres de columnas en tu tabla NocoDB son distintos a los valores por defecto, cámbialos aquí.
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

  // Sync localInstaller once the server config loads
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
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-openrouter-key': local.openrouterKey },
      });
      setTestResult(res.ok ? 'ok' : `Error ${res.status}`);
    } catch (e) {
      setTestResult(e.message);
    } finally {
      setIsTesting(false);
    }
  };

  const isSaving = isSavingInstaller;

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
            <IATab local={local} setLocal={setLocal} testResult={testResult} onTest={testConnection} isTesting={isTesting} />
          )}
          {activeTab === 'instalador' && (
            <InstaladorTab local={localInstaller} setLocal={setLocalInstaller} isLoading={isLoadingInstaller && !configSynced} />
          )}
        </div>

        <div className="px-6 py-4 border-t border-dark-700 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={isSaving} disabled={isSaving}>
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
