import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, addDoc, doc, updateDoc } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function initializeFirebase() {
  // Solo inicializar si no hay apps existentes
  if (getApps().length === 0) {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('🔥 Firebase inicializado correctamente');
  } else {
    app = getApps()[0];
    db = getFirestore(app);
    console.log('🔥 Firebase ya estaba inicializado');
  }
}

export function getFirestoreInstance(): Firestore {
  if (!db) {
    throw new Error('Firebase no está inicializado. Llama a initializeFirebase() primero.');
  }
  return db;
}

export async function saveLeadToFirestore(leadData: any): Promise<string> {
  try {
    if (!db) {
      throw new Error('Firebase no está inicializado');
    }

    const leadsCollection = collection(db, 'leads');
    const docRef = await addDoc(leadsCollection, {
      ...leadData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Lead guardado en Firestore con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error guardando en Firestore:', error);
    throw error;
  }
}

export async function updateLeadStatus(documentId: string, status: string): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firebase no está inicializado');
    }

    const leadRef = doc(db, 'leads', documentId);
    await updateDoc(leadRef, {
      status: status,
      updatedAt: new Date()
    });

    console.log('✅ Status actualizado en Firestore:', documentId, status);
  } catch (error) {
    console.error('❌ Error actualizando status en Firestore:', error);
    throw error;
  }
}
