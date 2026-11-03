import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { UserProfile } from '../types';

const LOCAL_STORAGE_USER_KEY = 'sintonia_local_user';
const LOCAL_STORAGE_USERS_DB = 'sintonia_local_users_db';

// Listeners for auth state changes
type AuthCallback = (user: UserProfile | null) => void;
const authListeners: Set<AuthCallback> = new Set();

let currentProfile: UserProfile | null = null;

// Normalize email
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Subscribe to auth state
export function onAuthProfileChanged(callback: AuthCallback): () => void {
  authListeners.add(callback);
  callback(currentProfile);

  if (isFirebaseConfigured && auth) {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const profile = await fetchOrCreateFirebaseProfile(fbUser);
        currentProfile = profile;
        authListeners.forEach(cb => cb(profile));
      } else {
        currentProfile = null;
        authListeners.forEach(cb => cb(null));
      }
    });
    return () => {
      authListeners.delete(callback);
      unsubscribe();
    };
  } else {
    // Check local storage for sandbox user
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        currentProfile = JSON.parse(saved);
        callback(currentProfile);
      } catch {
        currentProfile = null;
      }
    }
    return () => {
      authListeners.delete(callback);
    };
  }
}

async function fetchOrCreateFirebaseProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not initialized');
  const userRef = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    // Keep emailVerified up to date with Firebase Auth
    return {
      ...data,
      emailVerified: fbUser.emailVerified
    };
  } else {
    const newProfile: UserProfile = {
      uid: fbUser.uid,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario',
      email: fbUser.email || '',
      emailVerified: fbUser.emailVerified,
      photoURL: fbUser.photoURL || 'avatar_1',
      createdAt: Date.now(),
      preferences: {
        theme: 'dark',
        soundEnabled: true
      }
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

// 1. REGISTER
export async function registerUser(
  emailRaw: string,
  password: string,
  displayName: string
): Promise<UserProfile> {
  const email = normalizeEmail(emailRaw);

  if (isFirebaseConfigured && auth && db) {
    // Firebase Auth natively ensures email uniqueness
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    await updateProfile(fbUser, { displayName });
    await sendEmailVerification(fbUser);

    const newProfile: UserProfile = {
      uid: fbUser.uid,
      displayName,
      email,
      emailVerified: false,
      photoURL: 'avatar_1',
      createdAt: Date.now(),
      preferences: {
        theme: 'dark',
        soundEnabled: true
      }
    };

    await setDoc(doc(db, 'users', fbUser.uid), newProfile);
    currentProfile = newProfile;
    authListeners.forEach(cb => cb(newProfile));
    return newProfile;
  } else {
    // Local Sandbox Mode: Check email uniqueness
    const usersDb: Record<string, { password: string; profile: UserProfile }> = 
      JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_DB) || '{}');

    if (usersDb[email]) {
      const err = new Error('Esta dirección de correo ya tiene una cuenta registrada.');
      (err as any).code = 'auth/email-already-in-use';
      throw err;
    }

    const uid = 'user_' + Math.random().toString(36).substring(2, 9);
    const newProfile: UserProfile = {
      uid,
      displayName,
      email,
      emailVerified: false, // Starts unverified to test verification screen
      photoURL: 'avatar_1',
      createdAt: Date.now(),
      preferences: {
        theme: 'dark',
        soundEnabled: true
      }
    };

    usersDb[email] = { password, profile: newProfile };
    localStorage.setItem(LOCAL_STORAGE_USERS_DB, JSON.stringify(usersDb));
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newProfile));

    currentProfile = newProfile;
    authListeners.forEach(cb => cb(newProfile));
    return newProfile;
  }
}

// 2. LOGIN
export async function loginUser(emailRaw: string, password: string): Promise<UserProfile> {
  const email = normalizeEmail(emailRaw);

  if (isFirebaseConfigured && auth && db) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchOrCreateFirebaseProfile(userCredential.user);
    currentProfile = profile;
    authListeners.forEach(cb => cb(profile));
    return profile;
  } else {
    const usersDb: Record<string, { password: string; profile: UserProfile }> = 
      JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_DB) || '{}');

    const record = usersDb[email];
    if (!record || record.password !== password) {
      const err = new Error('Correo electrónico o contraseña incorrectos.');
      (err as any).code = 'auth/invalid-credential';
      throw err;
    }

    currentProfile = record.profile;
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(record.profile));
    authListeners.forEach(cb => cb(record.profile));
    return record.profile;
  }
}

// 3. LOGOUT
export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  } else {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  }
  currentProfile = null;
  authListeners.forEach(cb => cb(null));
}

// 4. PASSWORD RESET
export async function sendPasswordReset(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  if (isFirebaseConfigured && auth) {
    await sendPasswordResetEmail(auth, email);
  } else {
    // Local simulation
    const usersDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_DB) || '{}');
    if (!usersDb[email]) {
      const err = new Error('No existe ninguna cuenta asociada a este correo.');
      (err as any).code = 'auth/user-not-found';
      throw err;
    }
  }
}

// 5. RESEND VERIFICATION EMAIL
export async function resendVerification(): Promise<void> {
  if (isFirebaseConfigured && auth && auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  } else {
    console.log('Simulated verification email resent to:', currentProfile?.email);
  }
}

// 6. CHECK VERIFICATION STATUS
export async function checkVerificationStatus(): Promise<boolean> {
  if (isFirebaseConfigured && auth && auth.currentUser) {
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    if (verified && currentProfile) {
      currentProfile = { ...currentProfile, emailVerified: true };
      authListeners.forEach(cb => cb(currentProfile));
    }
    return verified;
  } else {
    // In local sandbox, simulate verification confirmation
    if (currentProfile) {
      currentProfile = { ...currentProfile, emailVerified: true };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(currentProfile));
      
      // Update in users db
      const usersDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_DB) || '{}');
      if (usersDb[currentProfile.email]) {
        usersDb[currentProfile.email].profile.emailVerified = true;
        localStorage.setItem(LOCAL_STORAGE_USERS_DB, JSON.stringify(usersDb));
      }
      
      authListeners.forEach(cb => cb(currentProfile));
    }
    return true;
  }
}

// 7. UPDATE PROFILE
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  if (!currentProfile) throw new Error('No user is signed in');

  const updated: UserProfile = {
    ...currentProfile,
    ...updates,
    preferences: {
      ...currentProfile.preferences,
      ...(updates.preferences || {})
    }
  };

  if (isFirebaseConfigured && auth && db && auth.currentUser) {
    if (updates.displayName) {
      await updateProfile(auth.currentUser, { displayName: updates.displayName });
    }
    await setDoc(doc(db, 'users', currentProfile.uid), updated, { merge: true });
  } else {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
    const usersDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_DB) || '{}');
    if (usersDb[updated.email]) {
      usersDb[updated.email].profile = updated;
      localStorage.setItem(LOCAL_STORAGE_USERS_DB, JSON.stringify(usersDb));
    }
  }

  currentProfile = updated;
  authListeners.forEach(cb => cb(updated));
  return updated;
}

// 8. DELETE ACCOUNT
export async function deleteCurrentUserAccount(): Promise<void> {
  if (!currentProfile) throw new Error('No user is signed in');

  if (isFirebaseConfigured && auth && db && auth.currentUser) {
    const uid = currentProfile.uid;
    await deleteDoc(doc(db, 'users', uid));
    await deleteUser(auth.currentUser);
  } else {
    const email = currentProfile.email;
    const usersDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_DB) || '{}');
    delete usersDb[email];
    localStorage.setItem(LOCAL_STORAGE_USERS_DB, JSON.stringify(usersDb));
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  }

  currentProfile = null;
  authListeners.forEach(cb => cb(null));
}
