import { useState } from 'react';
import { createInviteCode } from '../services/connectionService';

export const CreateInviteModal = ({ onClose }: { onClose: () => void }) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const code = await createInviteCode();
      setInviteCode(code);
    } catch (err: any) {
      setError(err.message || 'Error al generar la invitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Crear Invitación</h2>
        {error && <p className="error">{error}</p>}

        {!inviteCode ? (
          <>
            <p>Genera un código para invitar a tu pareja.</p>
            <button onClick={handleCreateInvite} disabled={loading}>
              {loading ? 'Generando...' : 'Generar Código'}
            </button>
          </>
        ) : (
          <>
            <p>Tu código de invitación es:</p>
            <h3 className="invite-code">{inviteCode}</h3>
            <p>Compártelo con tu pareja para que lo introduzca en su cuenta.</p>
          </>
        )}

        <button onClick={onClose} className="secondary" style={{ marginTop: '1rem' }}>Cerrar</button>
      </div>
    </div>
  );
};