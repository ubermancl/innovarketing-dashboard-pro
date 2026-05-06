import { useState } from 'react';
import { Save, X, Bot, Building2, ChevronRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { Button, Input, Select, Card } from './ui';
import { AI_MODELS } from '../utils/constants';

const TABS = [
  { id: 'negocio', label: 'Contexto del Negocio', icon: Building2 },
  { id: 'ia', label: 'IA & OpenRouter', icon: Bot },
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

      {/* Tabla de precios */}
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
            {AI_MODELS.map((m, i) => {
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

export default function Settings({ onClose }) {
  const { businessContext, saveBusinessContext } = useBusinessContext();
  const [activeTab, setActiveTab] = useState('negocio');
  const [local, setLocal] = useState({ ...businessContext });
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    saveBusinessContext({ ...local, onboardingComplete: true });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose?.(); }, 1000);
  };

  const testConnection = async () => {
    if (!local.openrouterKey) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${local.openrouterKey}` },
      });
      setTestResult(res.ok ? 'ok' : `Error ${res.status}`);
    } catch (e) {
      setTestResult(e.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel slide-over */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-dark-800 border-l border-dark-700 flex flex-col shadow-2xl animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-gray-100">Ajustes del Dashboard</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-700">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'negocio' && <NegocioTab local={local} setLocal={setLocal} />}
          {activeTab === 'ia' && (
            <IATab local={local} setLocal={setLocal} testResult={testResult} onTest={testConnection} isTesting={isTesting} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-700 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>
            {saved ? <CheckCircle2 className="w-4 h-4 text-accent-green" /> : <Save className="w-4 h-4" />}
            {saved ? 'Guardado' : 'Guardar ajustes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
