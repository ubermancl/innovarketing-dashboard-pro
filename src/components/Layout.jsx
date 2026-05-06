import { Toaster } from 'react-hot-toast';
import { useBusinessContext } from '../hooks/useBusinessContext';

export default function Layout({ children }) {
  const { businessContext } = useBusinessContext();
  const name = businessContext?.businessName || 'Dashboard';

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Gradiente ambiental sutil — naranja en lugar de cyan/magenta */}
      <div className="fixed inset-0 bg-gradient-radial from-accent-orange/4 via-transparent to-transparent opacity-60 no-print pointer-events-none" />

      <div className="relative z-10" id="dashboard-print-root">
        {children}

        <footer className="mt-8 py-5 border-t border-dark-700/40">
          <div className="footer-screen text-center">
            <p className="text-xs text-dark-500">
              Dashboard elaborado por{' '}
              <a
                href="https://innovarketing.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-400 font-medium hover:text-accent-orange transition-colors"
              >
                Innovarketing.com
              </a>
            </p>
          </div>
          <div className="footer-pdf hidden text-center space-y-1">
            <p className="text-xs text-dark-500">
              Elaborado por{' '}
              <a href="https://innovarketing.com" className="text-accent-orange/70">Innovarketing.com</a>
              {' '}para{' '}
              <span className="text-dark-400 font-medium">{name}</span>
            </p>
            <p className="text-xs text-dark-600">Javier Vrandečić — Consultor en Automatización IA</p>
          </div>
        </footer>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111111',
            color: '#F3F4F6',
            border: '1px solid #252525',
            borderRadius: '8px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#111111' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#111111' } },
        }}
      />
    </div>
  );
}
