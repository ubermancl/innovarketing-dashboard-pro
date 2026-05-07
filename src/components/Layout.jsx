import { Toaster } from 'react-hot-toast';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Contenido principal — margen izquierdo igual al ancho del sidebar en desktop */}
      <div className="lg:pl-56" id="dashboard-print-root">
        {children}
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1928',
            color: '#F3F4F6',
            border: '1px solid #222136',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#1A1928' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#1A1928' } },
        }}
      />
    </div>
  );
}
