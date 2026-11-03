import { auth, db } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export const registerUser = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await sendEmailVerification(userCredential.user);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error en registro:", error.message);
    throw new Error(error.message);
  }
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const sendPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const checkVerificationStatus = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    await user.reload();
    await user.getIdToken(true);
    return user.emailVerified;
  } catch (error) {
    return false;
  }
};

export const fetchOrCreateFirebaseProfile = async (user: any) => {
  if (!user || !user.emailVerified) return null;
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const newProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      createdAt: new Date().toISOString()
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
  return snap.data();
};

export const onAuthProfileChanged = (callback: (profile: any) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) {
      const profile = await fetchOrCreateFirebaseProfile(user);
      callback(profile);
    } else {
      callback(null);
    }
  });
};

export const updateUserProfile = async (uid: string, data: any) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
};

export const deleteCurrentUserAccount = async () => {
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    await deleteDoc(doc(db, 'users', uid));
    await deleteUser(user);
  }
};