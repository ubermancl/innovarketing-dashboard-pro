import { useState } from 'react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { useLeads } from './hooks/useLeads';
import { useStats } from './hooks/useStats';
import { useBusinessContext, BusinessContextProvider } from './hooks/useBusinessContext';
import { useInstallerConfig } from './hooks/useInstallerConfig';
import { useRecommendations } from './hooks/useRecommendations';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Header from './components/Header';
import Cards from './components/Cards';
import Alerts from './components/Alerts';
import Charts from './components/Charts';
import AdvancedMetrics from './components/AdvancedMetrics';
import Table from './components/Table';
import Insights from './components/Insights';
import Settings from './components/Settings';
import AIDiagnosis from './components/AIDiagnosis';
import RecommendationsHistory from './components/RecommendationsHistory';
import { LoadingScreen } from './components/ui';
import { SkeletonCard, SkeletonChart, SkeletonTable } from './components/ui/Skeleton';

function Dashboard() {
  const { logout } = useAuth();
  const { businessContext } = useBusinessContext();
  const { recsConfigured } = useInstallerConfig();
  const [showSettings, setShowSettings] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const {
    filteredLeads, allLeads, isLoading, isRefreshing, error, lastUpdated, isOnline,
    refresh, dateFilter, setDateFilter, customDateRange, setCustomDateRange,
    searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    districtFilter, setDistrictFilter, uniqueStatuses, uniqueDistricts,
  } = useLeads();

  const stats = useStats(
    allLeads, dateFilter,
    customDateRange.start, customDateRange.end,
    businessContext,
  );

  const {
    sessions,
    historyForPrompt,
    isLoading: recsLoading,
    notConfigured: recsNotConfigured,
    error: recsError,
    saveSession,
    updateStatus,
    deleteRecord,
    deleteSession,
  } = useRecommendations(recsConfigured);

  if (isLoading && allLeads.length === 0) {
    return <LoadingScreen message="Cargando datos del dashboard..." />;
  }

  return (
    <Layout>
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isOnline={isOnline}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={logout}
      />

      <Header
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customDateRange={customDateRange}
        onCustomDateChange={setCustomDateRange}
        activeView={activeView}
      />

      <main className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        {error && (
          <div className="p-4 glass-card border-error/40 text-error">
            <p className="font-medium">Error al cargar datos</p>
            <p className="text-sm mt-1 text-error/70">{error}</p>
          </div>
        )}

        {!isOnline && (
          <div className="p-3 glass-card border-warning/40 text-warning text-sm">
            Sin conexión — mostrando última información guardada
          </div>
        )}

        {/* ── Vista: Resumen ── */}
        {activeView === 'dashboard' && (
          <>
            {isRefreshing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              </div>
            ) : (
              <Cards
                metrics={stats.metrics}
                advancedMetrics={stats.advancedMetrics}
                aiVsManual={stats.aiVsManual}
                businessContext={businessContext}
              />
            )}
            <Alerts alerts={stats.alerts} />
            <AdvancedMetrics metrics={stats.advancedMetrics} />
            {isRefreshing ? <SkeletonChart /> : (
              <Charts
                funnelData={stats.funnelData}
                pipelineData={stats.pipelineData}
                leadsByDay={stats.leadsByDay}
                appointmentsByDay={stats.appointmentsByDay}
                revenueByWeek={stats.revenueByWeek}
                statusDistribution={stats.statusDistribution}
                districtDistribution={stats.districtDistribution}
                originDistribution={stats.originDistribution}
              />
            )}
            <Insights insights={stats.insights} />
          </>
        )}

        {/* ── Vista: Análisis ── */}
        {activeView === 'analytics' && (
          <>
            <AdvancedMetrics metrics={stats.advancedMetrics} />
            {isRefreshing ? <SkeletonChart /> : (
              <Charts
                funnelData={stats.funnelData}
                pipelineData={stats.pipelineData}
                leadsByDay={stats.leadsByDay}
                appointmentsByDay={stats.appointmentsByDay}
                revenueByWeek={stats.revenueByWeek}
                statusDistribution={stats.statusDistribution}
                districtDistribution={stats.districtDistribution}
                originDistribution={stats.originDistribution}
              />
            )}
            <Insights insights={stats.insights} />
          </>
        )}

        {/* ── Vista: IA & Historial ── */}
        {activeView === 'ai' && (
          <>
            <AIDiagnosis
              metrics={stats.metrics}
              advancedMetrics={stats.advancedMetrics}
              funnelData={stats.funnelData}
              alerts={stats.alerts}
              historyForPrompt={historyForPrompt}
              recsConfigured={recsConfigured}
              onSaveSession={saveSession}
              dateFilter={dateFilter}
            />
            <RecommendationsHistory
              sessions={sessions}
              isLoading={recsLoading}
              notConfigured={recsNotConfigured}
              error={recsError}
              onUpdate={updateStatus}
              onDelete={deleteSession}
              onDeleteRecord={deleteRecord}
            />
          </>
        )}

        {/* ── Vista: Tabla de Leads ── */}
        {activeView === 'tabla' && (
          isRefreshing ? <SkeletonTable rows={5} /> : (
            <Table
              leads={filteredLeads}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              districtFilter={districtFilter}
              onDistrictChange={setDistrictFilter}
              uniqueStatuses={uniqueStatuses}
              uniqueDistricts={uniqueDistricts}
            />
          )
        )}
      </main>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </Layout>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Login />;
  return <Dashboard />;
}

export default function App() {
  return (
    <BusinessContextProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BusinessContextProvider>
  );
}
