import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { Connection, InviteCode, UserProfile, ConnectionPreferences } from '../types';

const LOCAL_INVITES_KEY = 'sintonia_local_invites';
const LOCAL_CONNECTIONS_KEY = 'sintonia_local_connections';

// Generate a high-entropy 6-character alphanumeric code (e.g. SINT-7K9P)
export function generateInviteCodeString(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // excludes ambiguous chars 0, 1, I, O
  let result = '';
  const randomBytes = new Uint8Array(5);
  window.crypto.getRandomValues(randomBytes);
  for (let i = 0; i < 5; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return `SINT-${result}`;
}

// 1. CREATE INVITE CODE
export async function createInviteCode(
  creator: UserProfile,
  durationHours = 48
): Promise<InviteCode> {
  const code = generateInviteCodeString();
  const now = Date.now();
  const expiresAt = now + durationHours * 3600 * 1000;

  const invite: InviteCode = {
    id: code,
    creatorUid: creator.uid,
    creatorDisplayName: creator.displayName,
    creatorEmail: creator.email,
    creatorPhoto: creator.photoURL,
    createdAt: now,
    expiresAt,
    status: 'pending',
    usedByUid: null,
    usedByName: null,
    connectionId: null
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'invites', code), invite);
  } else {
    const invites: Record<string, InviteCode> = 
      JSON.parse(localStorage.getItem(LOCAL_INVITES_KEY) || '{}');
    invites[code] = invite;
    localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(invites));
    // Trigger local storage event for multi-tab testing
    window.dispatchEvent(new Event('storage'));
  }

  return invite;
}

// 2. GET INVITE BY CODE
export async function getInviteByCode(rawCode: string): Promise<InviteCode | null> {
  const code = rawCode.trim().toUpperCase();

  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, 'invites', code));
    if (!snap.exists()) return null;
    const data = snap.data() as InviteCode;

    // Check expiration
    if (data.status === 'pending' && Date.now() > data.expiresAt) {
      await updateDoc(doc(db, 'invites', code), { status: 'expired' });
      return { ...data, status: 'expired' };
    }
    return data;
  } else {
    const invites: Record<string, InviteCode> = 
      JSON.parse(localStorage.getItem(LOCAL_INVITES_KEY) || '{}');
    const data = invites[code];
    if (!data) return null;

    if (data.status === 'pending' && Date.now() > data.expiresAt) {
      data.status = 'expired';
      invites[code] = data;
      localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(invites));
    }
    return data;
  }
}

// 3. REVOKE INVITE
export async function revokeInviteCode(code: string, creatorUid: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const inviteRef = doc(db, 'invites', code);
    const snap = await getDoc(inviteRef);
    if (snap.exists() && snap.data().creatorUid === creatorUid) {
      await updateDoc(inviteRef, { status: 'revoked' });
    }
  } else {
    const invites: Record<string, InviteCode> = 
      JSON.parse(localStorage.getItem(LOCAL_INVITES_KEY) || '{}');
    if (invites[code] && invites[code].creatorUid === creatorUid) {
      invites[code].status = 'revoked';
      localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(invites));
      window.dispatchEvent(new Event('storage'));
    }
  }
}

// 4. ACCEPT INVITE & CREATE INDEPENDENT CONNECTION
export async function acceptInviteCode(
  rawCode: string,
  currentUser: UserProfile
): Promise<Connection> {
  const invite = await getInviteByCode(rawCode);
  if (!invite) {
    throw new Error('El código introducido no existe. Verifica los caracteres.');
  }

  if (invite.status === 'revoked') {
    throw new Error('Este código de invitación fue cancelado por la persona que lo creó.');
  }

  if (invite.status === 'expired' || Date.now() > invite.expiresAt) {
    throw new Error('Este código de invitación ha caducado. Pide uno nuevo.');
  }

  if (invite.status === 'accepted') {
    throw new Error('Este código ya ha sido utilizado por otra persona.');
  }

  if (invite.creatorUid === currentUser.uid) {
    throw new Error('No puedes conectarte contigo mismo.');
  }

  // Deterministic connection ID between two users
  const sortedUids = [invite.creatorUid, currentUser.uid].sort();
  const connectionId = `conn_${sortedUids[0]}_${sortedUids[1]}`;

  const now = Date.now();
  const connection: Connection = {
    id: connectionId,
    participants: [sortedUids[0], sortedUids[1]] as [string, string],
    participantProfiles: {
      [invite.creatorUid]: {
        uid: invite.creatorUid,
        displayName: invite.creatorDisplayName,
        email: invite.creatorEmail,
        photoURL: invite.creatorPhoto
      },
      [currentUser.uid]: {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL
      }
    },
    createdAt: now,
    updatedAt: now,
    status: 'active',
    preferences: {
      categories: ['pareja', 'amistad', 'profundas', 'diversion'],
      intensity: 'normal'
    },
    activeSessionId: null,
    lastActivity: now,
    totalAnsweredQuestions: 0
  };

  if (isFirebaseConfigured && db) {
    // Check if connection already exists
    const existingSnap = await getDoc(doc(db, 'connections', connectionId));
    if (existingSnap.exists() && existingSnap.data().status === 'active') {
      throw new Error('Ya tienes una conexión activa con esta persona.');
    }

    // Save connection and mark invite accepted
    await setDoc(doc(db, 'connections', connectionId), connection);
    await updateDoc(doc(db, 'invites', invite.id), {
      status: 'accepted',
      usedByUid: currentUser.uid,
      usedByName: currentUser.displayName,
      connectionId
    });
  } else {
    const connections: Record<string, Connection> = 
      JSON.parse(localStorage.getItem(LOCAL_CONNECTIONS_KEY) || '{}');

    if (connections[connectionId] && connections[connectionId].status === 'active') {
      throw new Error('Ya tienes una conexión activa con esta persona.');
    }

    connections[connectionId] = connection;
    localStorage.setItem(LOCAL_CONNECTIONS_KEY, JSON.stringify(connections));

    const invites: Record<string, InviteCode> = 
      JSON.parse(localStorage.getItem(LOCAL_INVITES_KEY) || '{}');
    if (invites[invite.id]) {
      invites[invite.id].status = 'accepted';
      invites[invite.id].usedByUid = currentUser.uid;
      invites[invite.id].usedByName = currentUser.displayName;
      invites[invite.id].connectionId = connectionId;
      localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(invites));
    }
    window.dispatchEvent(new Event('storage'));
  }

  return connection;
}

// 5. SUBSCRIBE TO USER CONNECTIONS (Real-time)
export function subscribeToUserConnections(
  uid: string,
  callback: (connections: Connection[]) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'connections'),
      where('participants', 'array-contains', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const connections: Connection[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Connection;
        if (data.status === 'active') {
          connections.push(data);
        }
      });
      // Sort by last activity
      connections.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
      callback(connections);
    });

    return unsubscribe;
  } else {
    // Local storage listener
    const loadLocal = () => {
      const connectionsMap: Record<string, Connection> = 
        JSON.parse(localStorage.getItem(LOCAL_CONNECTIONS_KEY) || '{}');
      const list = Object.values(connectionsMap).filter(
        c => c.status === 'active' && c.participants.includes(uid)
      );
      list.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
      callback(list);
    };

    loadLocal();
    const handler = () => loadLocal();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

// 6. UPDATE CONNECTION PREFERENCES
export async function updateConnectionPreferences(
  connectionId: string,
  preferences: ConnectionPreferences
): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'connections', connectionId), {
      preferences,
      updatedAt: Date.now()
    });
  } else {
    const connections: Record<string, Connection> = 
      JSON.parse(localStorage.getItem(LOCAL_CONNECTIONS_KEY) || '{}');
    if (connections[connectionId]) {
      connections[connectionId].preferences = preferences;
      connections[connectionId].updatedAt = Date.now();
      localStorage.setItem(LOCAL_CONNECTIONS_KEY, JSON.stringify(connections));
      window.dispatchEvent(new Event('storage'));
    }
  }
}

// 7. DISCONNECT / REMOVE CONNECTION
export async function removeConnection(connectionId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'connections', connectionId), {
      status: 'archived',
      updatedAt: Date.now()
    });
  } else {
    const connections: Record<string, Connection> = 
      JSON.parse(localStorage.getItem(LOCAL_CONNECTIONS_KEY) || '{}');
    if (connections[connectionId]) {
      connections[connectionId].status = 'archived';
      localStorage.setItem(LOCAL_CONNECTIONS_KEY, JSON.stringify(connections));
      window.dispatchEvent(new Event('storage'));
    }
  }
}
