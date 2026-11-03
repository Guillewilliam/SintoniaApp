import React, { useState } from 'react';
import { isFirebaseConfigured } from '../firebase/config';
import { X, ExternalLink, Key } from 'lucide-react';

export const FirebaseStatusBanner: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isFirebaseConfigured || dismissed) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-slate-100/90 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-slate-900/60 border-b border-indigo-200/80 dark:border-indigo-500/20 px-4 py-2.5 text-xs text-indigo-950 dark:text-indigo-200 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>
              <strong>Modo de pruebas local activo:</strong> Puedes jugar, invitar y probar todas las pantallas. Para conectar la sincronización en la nube gratuita de Firebase:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[11px] transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            >
              Ver guía Firebase (0 €)
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-slate-800 dark:text-slate-100 shadow-2xl space-y-4">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl border border-indigo-200 dark:border-indigo-500/30">
                  <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conectar Firebase Gratuito (Plan Spark 0 €)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Guía paso a paso para sincronización en tiempo real</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                  <span>1. Crear proyecto gratuito en Firebase</span>
                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 text-[11px] text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    Abrir consola <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Inicia sesión con tu cuenta de Google, pulsa «Añadir proyecto» (p. ej. <em>sintonia-pwa</em>) y deja el plan gratuito «Spark» (0 €).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                  2. Activar Authentication y Cloud Firestore
                </div>
                <ul className="text-slate-500 dark:text-slate-400 text-xs space-y-1 list-disc list-inside">
                  <li>En <strong>Authentication</strong>: Habilita el proveedor <strong>«Correo electrónico/contraseña»</strong>.</li>
                  <li>En <strong>Firestore Database</strong>: Pulsa «Crear base de datos» en modo producción.</li>
                  <li>En <strong>Reglas</strong> de Firestore: Pega el contenido del archivo <code className="text-indigo-600 dark:text-indigo-300 font-mono">firestore.rules</code> que ya está creado en este proyecto.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                  3. Obtener credenciales web y pegarlas en el archivo .env
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">
                  En la rueda de engranaje (Configuración del proyecto) &gt; General &gt; Tus apps &gt; Añadir app web. Copia las claves en tu archivo <code className="text-indigo-600 dark:text-indigo-300 font-mono">.env</code>:
                </p>
                <pre className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-emerald-700 dark:text-emerald-400 overflow-x-auto border border-slate-200 dark:border-slate-800">
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=sintonia-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sintonia-app
VITE_FIREBASE_STORAGE_BUCKET=sintonia-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Cerrar y continuar probando
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
