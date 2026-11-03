import { db, auth } from '../firebase/config';
import { collection, doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';

export const createInviteCode = async () => {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) throw new Error("Usuario no autenticado o no verificado.");

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const inviteRef = doc(collection(db, 'invites'), code);

  const inviteData = {
    creatorUid: user.uid,
    creatorDisplayName: user.displayName,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending'
  };

  await setDoc(inviteRef, inviteData);
  return code;
};

export const acceptInviteCode = async (code: string) => {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) throw new Error("Usuario no autenticado o no verificado.");

  const inviteRef = doc(db, 'invites', code.toUpperCase());
  const connectionId = `${user.uid}_${Date.now()}`;
  const connectionRef = doc(db, 'connections', connectionId);

  await runTransaction(db, async (transaction) => {
    const inviteDoc = await transaction.get(inviteRef);
    if (!inviteDoc.exists()) throw new Error("El código de invitación no existe.");

    const data = inviteDoc.data();
    if (data.status !== 'pending') throw new Error("La invitación ya fue utilizada o revocada.");
    if (new Date(data.expiresAt) < new Date()) throw new Error("La invitación ha caducado.");
    if (data.creatorUid === user.uid) throw new Error("No puedes usar tu propia invitación.");

    // Marcar invitación como aceptada
    transaction.update(inviteRef, {
      status: 'accepted',
      usedByUid: user.uid,
      connectionId: connectionId
    });

    // Crear la conexión real
    transaction.set(connectionRef, {
      participants: [data.creatorUid, user.uid],
      createdAt: new Date().toISOString(),
      active: true
    });
  });

  return connectionId;
};