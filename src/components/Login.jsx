import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { Button, Input, Card } from './ui';

export default function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const { businessContext } = useBusinessContext();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    await login(password);
  };

  const displayName = businessContext?.businessName || 'Dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="absolute inset-0 bg-gradient-radial from-accent-orange/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-radial from-accent-orange/3 via-transparent to-transparent translate-x-1/2" />

      <Card className="w-full max-w-md relative" padding="lg">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent-orange to-accent-yellow flex items-center justify-center text-4xl mb-4 shadow-glow-orange">
            🟠
          </div>
          <h1 className="text-2xl font-bold text-gray-100">{displayName}</h1>
          <p className="text-gray-400 mt-1 text-sm">Powered by Innovarketing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-button text-error text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
              placeholder="Ingresa tu contraseña"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isLoading} disabled={!password.trim()}>
            <Lock className="w-4 h-4" />
            Ingresar al Dashboard
          </Button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-8">
          Innovarketing Dashboard Pro
        </p>
      </Card>
    </div>
  );
}
