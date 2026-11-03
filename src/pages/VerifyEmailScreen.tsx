import { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { sendEmailVerification } from 'firebase/auth';
import { checkVerificationStatus } from '../services/authService';

export const VerifyEmailScreen = ({ onVerified }: { onVerified: () => void }) => {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Comprobación silenciosa cada 4 segundos consultando a Firebase
  useEffect(() => {
    const interval = setInterval(async () => {
      const isVerified = await checkVerificationStatus();
      if (isVerified) onVerified();
    }, 4000);
    return () => clearInterval(interval);
  }, [onVerified]);

  const handleManualCheck = async () => {
    const isVerified = await checkVerificationStatus();
    if (isVerified) {
      onVerified();
    } else {
      setError('Firebase indica que el correo aún no está verificado. Revisa tu bandeja de entrada.');
    }
  };

  const handleResend = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMessage('Correo de verificación reenviado. Revisa tu bandeja.');
        setError('');
      }
    } catch (err: any) {
      setError(`Error al reenviar: ${err.message}`);
    }
  };

  return (
    <div className="verify-screen">
      <h2>Verifica tu correo</h2>
      <p>Hemos enviado un enlace de confirmación. No podrás acceder hasta confirmarlo.</p>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <button onClick={handleManualCheck}>Ya he verificado mi correo</button>
      <button onClick={handleResend} className="secondary">Reenviar correo de verificación</button>
    </div>
  );
};