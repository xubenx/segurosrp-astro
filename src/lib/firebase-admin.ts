import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'seguros-rp';

function readServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    const parsed = JSON.parse(raw) as ServiceAccount & { private_key?: string; client_email?: string; project_id?: string };
    const privateKey = String(parsed.privateKey || parsed.private_key || '').replace(/\\n/g, '\n');
    return {
      projectId: parsed.projectId || parsed.project_id || PROJECT_ID,
      clientEmail: parsed.clientEmail || parsed.client_email,
      privateKey,
    };
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) {
    throw new Error(
      'Faltan credenciales de Firebase. En Vercel agrega FIREBASE_SERVICE_ACCOUNT (JSON) o FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.',
    );
  }

  return {
    projectId: PROJECT_ID,
    clientEmail,
    privateKey,
  };
}

export function hasFirebaseAdmin(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
      ((process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) &&
        (process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)),
  );
}

export function getFirestoreDb(): Firestore {
  if (!getApps().length) {
    initializeApp({
      credential: cert(readServiceAccount()),
      projectId: PROJECT_ID,
    });
  }
  return getFirestore();
}
