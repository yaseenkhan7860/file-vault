import { useState, FormEvent } from 'react';
import { Lock, Unlock, Key, X, Loader2, Check } from 'lucide-react';
import { api } from '../api/client';

interface Props {
  open: boolean;
  isPasswordProtected: boolean;
  onClose: () => void;
  onUpdate: (isProtected: boolean) => void;
}

export default function RoomPasswordModal({
  open,
  isPasswordProtected,
  onClose,
  onUpdate,
}: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const handleSetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/room-password', { password });
      setSuccess('Room password set successfully!');
      setTimeout(() => {
        onUpdate(true);
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/room-password', { remove: true });
      setSuccess('Room password removed!');
      setTimeout(() => {
        onUpdate(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isPasswordProtected ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-700'
            }`}>
              {isPasswordProtected ? <Lock className="w-5 h-5" /> : <Key className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Room Security</h2>
              <p className="text-xs text-gray-400">
                {isPasswordProtected ? 'Room is currently locked' : 'Room has no password'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center text-emerald-600 space-y-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium">{success}</p>
          </div>
        ) : isPasswordProtected ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Anyone who enters this room code will be required to provide the password before viewing or uploading files.
            </p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleRemovePassword}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                <span>Remove Room Password</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed mb-2">
              Add an optional password to lock this room so unauthorized users cannot view its files even if they guess the room code.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New room password..."
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 transition-colors"
              autoFocus
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password..."
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 transition-colors"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Lock Room With Password</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
