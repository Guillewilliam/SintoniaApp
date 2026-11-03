import { useState } from 'react';
import { acceptInviteCode } from '../services/connectionService';

export const EnterCodeModal = ({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: (connectionId: string) => void;
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    try {
      const connectionId = await acceptInviteCode(code.trim().toUpperCase());
      onSuccess(connectionId);
    } catch (err: any) {
      setError(err.message || 'Código no válido o caducado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Vincular Cuenta</h2>
        <p>Introduce el código de invitación de tu pareja:</p>

        {error && <p className="error">{error}</p>}

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej: A1B2C3"
          maxLength={6}
          style={{ textTransform: 'uppercase', width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />

        <div className="modal-actions">
          <button onClick={handleAccept} disabled={loading || !code.trim()}>
            {loading ? 'Verificando...' : 'Vincular'}
          </button>
          <button onClick={onClose} className="secondary" style={{ marginLeft: '0.5rem' }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};