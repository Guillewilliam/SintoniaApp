import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Comprobación estricta de configuración
const isConfigured = Object.values(firebaseConfig).every(value => Boolean(value));

if (!isConfigured) {
  console.error("ERROR CRÍTICO: Faltan variables de entorno de Firebase. La aplicación no puede funcionar.");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// Diagnóstico de conexión (sin exponer datos sensibles)
console.info(`Firebase inicializado correctamente. Proyecto: ${firebaseConfig.projectId}`);