import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { api } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  // Auto-redirect if already logged in
  if (localStorage.getItem('vault_token')) {
    navigate('/home');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/login', {
        code: code.trim(),
        password: requiresPassword ? password.trim() : undefined,
      });
      const { token, room } = res.data;

      localStorage.setItem('vault_token', token);
      localStorage.setItem('vault_room', JSON.stringify(room));

      navigate('/home');
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string; requiresPassword?: boolean } };
      };
      const data = axiosErr.response?.data;
      if (data?.requiresPassword) {
        setRequiresPassword(true);
      }
      setError(data?.error || 'Something went wrong. Try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToCode = () => {
    setRequiresPassword(false);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-6 shadow-lg">
            {requiresPassword ? (
              <KeyRound className="w-8 h-8 text-amber-300 animate-pulse" />
            ) : (
              <Lock className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">File Vault</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {requiresPassword
              ? 'This room is locked. Enter password to unlock.'
              : 'Enter your room code (any letters/numbers)'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={shake ? 'animate-shake' : ''}>
            {!requiresPassword ? (
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Room code (e.g. 1122 or ALPHA)"
                autoFocus
                autoComplete="off"
                className={`w-full px-4 py-3.5 text-gray-900 bg-gray-50 border rounded-xl text-center text-lg font-mono outline-none transition-all duration-200
                  ${error
                    ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100'
                  }`}
              />
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-center text-gray-400 uppercase tracking-wider">
                  Room: <span className="text-gray-900 font-mono">{code}</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter room password..."
                  autoFocus
                  autoComplete="off"
                  className={`w-full px-4 py-3.5 text-gray-900 bg-gray-50 border rounded-xl text-center text-lg font-mono outline-none transition-all duration-200
                    ${error
                      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                    }`}
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm mt-2 text-center animate-fade-in">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim() || (requiresPassword && !password.trim())}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{requiresPassword ? 'Unlock Room' : 'Enter Vault'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {requiresPassword && (
            <button
              type="button"
              onClick={handleResetToCode}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-700 text-center transition-colors"
            >
              ← Use a different room code
            </button>
          )}
        </form>

        {/* Info hint */}
        <p className="text-center text-xs text-gray-400 mt-8 leading-relaxed">
          ✨ Optional room lock with password can be enabled inside any room anytime.
        </p>
      </div>
    </div>
  );
}
