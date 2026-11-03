import React, { useState } from 'react';
import { UserProfile, InviteCode } from '../types';
import { createInviteCode } from '../services/connectionService';
import { X, Copy, Check, Share2, Sparkles, Clock } from 'lucide-react';

interface CreateInviteModalProps {
  user: UserProfile;
  onClose: () => void;
  onInviteCreated?: (invite: InviteCode) => void;
}

export const CreateInviteModal: React.FC<CreateInviteModalProps> = ({
  user,
  onClose,
  onInviteCreated
}) => {
  const [createdInvite, setCreatedInvite] = useState<InviteCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [durationHours, setDurationHours] = useState(48);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const invite = await createInviteCode(user, durationHours);
      setCreatedInvite(invite);
      if (onInviteCreated) onInviteCreated(invite);
    } catch (err: any) {
      setError(err.message || 'Error al generar la invitación.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    if (!createdInvite) return;
    const shareText = `¡Hola! Conéctate conmigo en Sintonía para jugar a responder preguntas juntos. Usa mi código: ${createdInvite.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Conectar en Sintonía',
          text: shareText,
          url: window.location.origin
        });
      } catch (err) {
        copyToClipboard(createdInvite.id);
      }
    } else {
      copyToClipboard(createdInvite.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-slate-800 dark:text-slate-100 shadow-2xl transition-all duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Crear Invitación</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Código único para conectar 1 a 1</p>
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
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {!createdInvite ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Genera un código seguro que podrás enviar a tu pareja o a un amigo. Cuando introduzca este código, se creará un canal de juego privado e independiente entre vosotros dos.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tiempo de validez del código:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '24 horas', hours: 24 },
                  { label: '48 horas', hours: 48 },
                  { label: '7 días', hours: 168 }
                ].map(opt => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setDurationHours(opt.hours)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      durationHours === opt.hours
                        ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Generar código de invitación'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                Tu Código de Invitación
              </span>
              <div className="font-mono text-3xl font-extrabold tracking-widest text-slate-900 dark:text-white selection:bg-indigo-500 selection:text-white">
                {createdInvite.id}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                De un solo uso. Caduca en {durationHours} horas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => copyToClipboard(createdInvite.id)}
                className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar código'}</span>
              </button>

              <button
                onClick={handleShare}
                className="py-3 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-500/20"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Pide a la otra persona que pulse en <strong>«Introducir código»</strong> en su pantalla e ingrese este código para comenzar.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Listo, cerrar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
