import React, { useState } from 'react';
import { UserProfile, InviteCode, Connection } from '../types';
import { getInviteByCode, acceptInviteCode } from '../services/connectionService';
import { X, KeyRound, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EnterCodeModalProps {
  user: UserProfile;
  onClose: () => void;
  onConnectionCreated: (connection: Connection) => void;
}

export const EnterCodeModal: React.FC<EnterCodeModalProps> = ({
  user,
  onClose,
  onConnectionCreated
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preview state before final confirmation
  const [previewInvite, setPreviewInvite] = useState<InviteCode | null>(null);

  const handleFormatCode = (input: string) => {
    let clean = input.toUpperCase().replace(/\s+/g, '');
    setCode(clean);
    setError(null);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Por favor, introduce el código de invitación.');
      return;
    }

    // Auto-prefix SINT- if omitted
    let formattedCode = code.trim().toUpperCase();
    if (!formattedCode.startsWith('SINT-') && formattedCode.length <= 6) {
      formattedCode = `SINT-${formattedCode}`;
    }

    setLoading(true);
    setError(null);
    try {
      const invite = await getInviteByCode(formattedCode);
      if (!invite) {
        setError('No encontramos ninguna invitación con este código. Revisa las letras y números.');
        return;
      }

      if (invite.status === 'revoked') {
        setError('Este código de invitación fue cancelado por la persona que lo generó.');
        return;
      }

      if (invite.status === 'expired' || Date.now() > invite.expiresAt) {
        setError('Este código ha caducado. Pídele a tu contacto que genere uno nuevo.');
        return;
      }

      if (invite.status === 'accepted') {
        setError('Este código ya ha sido utilizado.');
        return;
      }

      if (invite.creatorUid === user.uid) {
        setError('No puedes usar tu propio código para conectarte contigo mismo.');
        return;
      }

      setPreviewInvite(invite);
    } catch (err: any) {
      setError(err.message || 'Error al validar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmConnection = async () => {
    if (!previewInvite) return;
    setLoading(true);
    setError(null);
    try {
      const newConnection = await acceptInviteCode(previewInvite.id, user);
      
      // Celebrate with confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      onConnectionCreated(newConnection);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al aceptar la conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-slate-800 dark:text-slate-100 shadow-2xl transition-all duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Introducir Código</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Acepta la invitación de tu pareja o amigo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!previewInvite ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pega o escribe el código de 6-8 caracteres que has recibido (ejemplo: <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">SINT-9K4P</code>).
            </p>

            <div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => handleFormatCode(e.target.value)}
                placeholder="SINT-XXXX"
                className="w-full text-center font-mono text-xl sm:text-2xl font-bold tracking-widest uppercase bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white rounded-2xl py-4 px-3 outline-none shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Comprobar código</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center shadow-inner">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>¡Invitación encontrada!</span>
              </span>

              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-md my-2">
                {previewInvite.creatorDisplayName.charAt(0).toUpperCase()}
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {previewInvite.creatorDisplayName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {previewInvite.creatorEmail}
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
              Al confirmar, se creará una conexión 1 a 1 totalmente privada entre vosotros. Ninguna otra persona podrá acceder a vuestras sesiones ni respuestas.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewInvite(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Volver
              </button>

              <button
                type="button"
                onClick={handleConfirmConnection}
                disabled={loading}
                className="flex-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Conectando...' : 'Confirmar y Conectar'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
