import { useState } from 'react';
import { LayoutDashboard, BarChart2, Brain, Table2, Settings, LogOut, Wifi, WifiOff, Menu, X, RefreshCw } from 'lucide-react';
import { useBusinessContext } from '../hooks/useBusinessContext';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'analytics', label: 'Análisis',     icon: BarChart2 },
  { id: 'ai',        label: 'IA & Historial', icon: Brain },
  { id: 'tabla',     label: 'Leads',        icon: Table2 },
];

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onClick(item.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-all ${
        active
          ? 'bg-accent-orange text-white shadow-sidebar-glow'
          : 'text-dark-400 hover:text-gray-200 hover:bg-dark-600/50'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{item.label}</span>
    </button>
  );
}

export default function Sidebar({
  activeView, onViewChange,
  isOnline, lastUpdated,
  isRefreshing, onRefresh,
  onOpenSettings, onLogout,
}) {
  const { businessContext } = useBusinessContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = businessContext?.businessName || 'Dashboard Pro';
  const logoUrl = businessContext?.logoUrl || '';
  const logoColor = businessContext?.logoColor || '#F97316';
  const initials = businessContext?.logoInitials ||
    (businessContext?.businessName
      ? businessContext.businessName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'IK');

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
            style={{ backgroundColor: logoUrl ? undefined : logoColor }}
          >
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
              : <span className="text-white text-sm font-bold">{initials}</span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-100 truncate">{displayName}</p>
            <p className="text-xs text-dark-400">Dashboard Pro</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => (
          <NavItem
            key={item.id}
            item={item}
            active={activeView === item.id}
            onClick={(id) => { onViewChange(id); setMobileOpen(false); }}
          />
        ))}
      </nav>

      {/* Status + actions */}
      <div className="px-3 py-4 border-t border-dark-700/50 space-y-1">
        {/* Online status */}
        <div className="flex items-center gap-2 px-3 py-2 text-xs">
          {isOnline
            ? <><Wifi className="w-3.5 h-3.5 text-accent-green" /><span className="text-accent-green">Online</span></>
            : <><WifiOff className="w-3.5 h-3.5 text-error" /><span className="text-error">Offline</span></>
          }
          {lastUpdated && (
            <span className="text-dark-400 ml-auto truncate">
              {new Date(lastUpdated).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-button text-sm text-dark-400 hover:text-gray-200 hover:bg-dark-600/50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Actualizando...' : 'Actualizar datos'}</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-button text-sm text-dark-400 hover:text-gray-200 hover:bg-dark-600/50 transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Ajustes</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-button text-sm text-dark-400 hover:text-error hover:bg-error/5 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-dark-500">
          por{' '}
          <a href="https://innovarketing.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent-orange transition-colors">
            Innovarketing.com
          </a>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-button bg-dark-sidebar border border-dark-700/60 text-dark-400 hover:text-gray-200 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-dark-sidebar border-r border-dark-700/50 transform transition-transform duration-200 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded text-dark-400 hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-dark-sidebar border-r border-dark-700/50 z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
