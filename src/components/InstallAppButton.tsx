import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Share, PlusSquare, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if device is iOS (Safari doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    // 3. Capture beforeinstallprompt on supported browsers (Chrome, Edge, Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      // Trigger native browser install prompt
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // Show iOS step-by-step instructions modal
      setShowIosModal(true);
    } else {
      // Generic instructions for desktop / other browsers
      setShowIosModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold ${className}`}>
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>APP Instalada</span>
      </div>
    );
  }

  return (
    <>
      <button
        id="btn-install-app"
        onClick={handleInstallClick}
        className={`group relative inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 active:scale-95 cursor-pointer ${className}`}
        aria-label="Instalar aplicación en tu dispositivo"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-100"></span>
        </span>
        <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
        <span>Instalar APP</span>
      </button>

      {/* Modal with instructions for iOS or desktop browsers without direct prompt */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cómo instalar Sintonía</h3>
                <p className="text-xs text-slate-400">Instálala en tu pantalla de inicio en segundos</p>
              </div>
            </div>

            {isIos ? (
              <div className="space-y-3.5 my-4 text-sm text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs">1</span>
                  <span>Abre esta web desde el navegador <strong>Safari</strong> en tu iPhone o iPad.</span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs">2</span>
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    Toca el botón <strong>Compartir</strong>
                    <Share className="w-4 h-4 text-indigo-400 inline" />
                    en la barra inferior.
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs">3</span>
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    Desliza hacia abajo y elige <strong>Añadir a pantalla de inicio</strong>
                    <PlusSquare className="w-4 h-4 text-indigo-400 inline" />.
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs">4</span>
                  <span>Pulsa <strong>Añadir</strong> arriba a la derecha. ¡Listo!</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 my-4 text-sm text-slate-300">
                <p>
                  Si tu navegador no muestra la ventana automática, puedes instalar la aplicación haciendo clic en el menú del navegador (tres puntos arriba a la derecha) y seleccionando:
                </p>
                <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-center font-semibold text-indigo-300">
                  «Instalar Sintonía» o «Añadir a la pantalla principal»
                </div>
                <p className="text-xs text-slate-400 text-center">
                  También puedes continuar utilizándola directamente en el navegador sin ninguna restricción.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
