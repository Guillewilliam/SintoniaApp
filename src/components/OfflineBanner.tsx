import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-500/95 text-slate-950 px-4 py-2 text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>Estás sin conexión a Internet. Las respuestas se sincronizarán en cuanto vuelva la red.</span>
    </div>
  );
};
