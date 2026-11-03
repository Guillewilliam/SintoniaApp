import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { resendVerification, checkVerificationStatus } from '../services/authService';
import { isFirebaseConfigured } from '../firebase/config';
import {
  MailCheck,
  RefreshCw,
  Send,
  LogOut,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VerifyEmailScreenProps {
  user: UserProfile;
  onVerified: () => void;
  onLogout: () => void;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  user,
  onVerified,
  onLogout
}) => {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  // 1. Resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 2. Automated background verification polling every 4 seconds
  useEffect(() => {
    let mounted = true;

    const interval = setInterval(async () => {
      if (isSuccess || checking) return;
      try {
        const verified = await checkVerificationStatus();
        if (verified && mounted) {
          setIsSuccess(true);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
          setMessage('¡Correo verificado con éxito! Accediendo a la aplicación...');
          setTimeout(() => {
            onVerified();
          }, 1200);
        }
      } catch {
        // Silently continue polling
      }
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isSuccess, checking, onVerified]);

  const handleCheck = async () => {
    setError(null);
    setMessage(null);
    setChecking(true);
    try {
      const isVerified = await checkVerificationStatus();
      if (isVerified) {
        setIsSuccess(true);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        setMessage('¡Correo verificado con éxito! Accediendo a la aplicación...');
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        setError(
          'Aún no detectamos la verificación. Abre el correo que te enviamos, haz clic en el enlace de confirmación y vuelve a pulsar aquí.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error al comprobar el estado de verificación.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setMessage(null);
    try {
      await resendVerification();
      setMessage('Te hemos reenviado el correo de verificación. Revisa también tu carpeta de Spam o Correo no deseado.');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Error al reenviar el correo. Espera unos momentos.');
    }
  };

  // Instant sandbox bypass for local testing
  const handleSandboxSimulate = async () => {
    setChecking(true);
    try {
      // In sandbox mode this immediately marks verified
      await checkVerificationStatus();
      setIsSuccess(true);
      confetti({ particleCount: 70, spread: 60 });
      setMessage('¡Simulación completada! Cuenta verificada en modo Sandbox.');
      setTimeout(() => {
        onVerified();
      }, 900);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center transition-all duration-200">
        
        {/* Animated Mail Icon */}
        <div className="relative w-20 h-20 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 animate-pulse-subtle shadow-inner">
          <MailCheck className="w-10 h-10" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
          </span>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
          Verifica tu correo electrónico
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Hemos enviado un enlace de confirmación seguro a:
        </p>

        <div className="inline-block px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm text-indigo-600 dark:text-indigo-300 font-bold mb-4 shadow-sm break-all">
          {user.email}
        </div>

        {/* Listening beacon */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 py-2 px-3 rounded-full border border-slate-200/60 dark:border-slate-800/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Detección automática activa cada 4 segundos</span>
        </div>

        {/* Feedback messages */}
        {message && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2 shadow-sm animate-scaleIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2 text-left shadow-sm animate-scaleIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleCheck}
            disabled={checking || isSuccess}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Comprobando estado...' : 'Ya he pulsado el enlace de mi correo'}</span>
          </button>

          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || checking}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              {resendCooldown > 0
                ? `Reenviar disponible en ${resendCooldown}s`
                : 'Reenviar correo de verificación'}
            </span>
          </button>

          {/* Sandbox helper button if in sandbox mode */}
          {!isFirebaseConfigured && (
            <button
              onClick={handleSandboxSimulate}
              disabled={checking}
              className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>⚡ Validar al instante (Modo Sandbox de prueba)</span>
            </button>
          )}

          {/* Troubleshooting accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowTips(!showTips)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showTips ? 'Ocultar consejos de ayuda' : '¿No recibes el correo? Consejos'}</span>
            </button>

            {showTips && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-400 space-y-2 animate-scaleIn">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Comprueba lo siguiente:</p>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                  <li>Revisa la carpeta de <strong>Spam o Correo no deseado</strong> de tu gestor de correo.</li>
                  <li>En Gmail, comprueba las pestañas <strong>Promociones</strong> y <strong>Notificaciones</strong>.</li>
                  <li>Si escribiste mal tu correo, puedes cerrar sesión abajo y registrarte con la dirección correcta.</li>
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer pt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión o cambiar de cuenta</span>
          </button>
        </div>

      </div>
    </div>
  );
};
