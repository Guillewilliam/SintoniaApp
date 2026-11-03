import React, { useState } from 'react';
import { UserProfile } from '../types';
import { updateUserProfile, deleteCurrentUserAccount } from '../services/authService';
import { X, User, Check, ShieldAlert, LogOut } from 'lucide-react';

interface UserProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onLogout: () => void;
}

const AVATARS = [
  { id: 'avatar_1', color: 'from-indigo-500 to-purple-600', emoji: '✨' },
  { id: 'avatar_2', color: 'from-rose-500 to-pink-600', emoji: '💖' },
  { id: 'avatar_3', color: 'from-amber-500 to-orange-600', emoji: '🔥' },
  { id: 'avatar_4', color: 'from-emerald-500 to-teal-600', emoji: '🌿' },
  { id: 'avatar_5', color: 'from-blue-500 to-cyan-600', emoji: '🌊' },
  { id: 'avatar_6', color: 'from-purple-500 to-violet-700', emoji: '🔮' }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onLogout
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [selectedAvatar, setSelectedAvatar] = useState(user.photoURL || 'avatar_1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    setMessage(null);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        photoURL: selectedAvatar
      });
      setMessage('¡Perfil actualizado con éxito!');
      setTimeout(() => setMessage(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteCurrentUserAccount();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la cuenta.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-slate-800 dark:text-slate-100 shadow-2xl space-y-5 transition-all duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mi Perfil y Ajustes</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs text-center font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Avatar selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Elige tu avatar
            </label>
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`relative w-11 h-11 rounded-full bg-gradient-to-tr ${av.color} flex items-center justify-center text-lg shadow-md transition-all cursor-pointer ${
                    selectedAvatar === av.id ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>{av.emoji}</span>
                  {selectedAvatar === av.id && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center shadow text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre de usuario visible
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Correo electrónico (Identificador de cuenta)
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs rounded-xl px-4 py-2.5 cursor-not-allowed font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Vinculado de forma única a tu UID: <span className="font-mono">{user.uid.slice(0, 8)}...</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Cerrar sesión</span>
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2 text-[11px] text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors text-center cursor-pointer"
            >
              Eliminar mi cuenta
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>¿Estás completamente seguro?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                Se eliminarán permanentemente tu perfil, invitaciones y accesos a sesiones. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Sí, eliminar cuenta
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
