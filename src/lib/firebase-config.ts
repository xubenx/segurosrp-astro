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

// Función para sanitizar datos antes de guardar en Firestore
function sanitizeDataForFirestore(data: any): any {
  console.log('🧹 Sanitizando datos para Firestore:', data);
  const sanitized: any = {};
  const issues: string[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      // Firestore no permite undefined, convertir a null
      sanitized[key] = null;
      issues.push(`${key}: undefined -> null`);
    } else if (value === '') {
      // Convertir strings vacíos a null también
      sanitized[key] = null;
      issues.push(`${key}: empty string -> null`);
    } else if (typeof value === 'string') {
      // Limpiar strings y validar que no sean solo espacios
      const trimmed = value.trim();
      sanitized[key] = trimmed === '' ? null : trimmed;
      if (trimmed === '') {
        issues.push(`${key}: whitespace-only string -> null`);
      }
    } else if (value instanceof Date) {
      // Las fechas son válidas en Firestore
      sanitized[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursivamente sanitizar objetos anidados
      sanitized[key] = sanitizeDataForFirestore(value);
    } else {
      // Para otros tipos (number, boolean, null), mantener el valor
      sanitized[key] = value;
    }
  }
  
  if (issues.length > 0) {
    console.log('🔧 Sanitización aplicada:', issues);
  }
  console.log('✨ Datos sanitizados:', sanitized);
  
  return sanitized;
}

export async function saveLeadToFirestore(leadData: any): Promise<string> {
  try {
    if (!db) {
      throw new Error('Firebase no está inicializado');
    }

    console.log('📥 Datos originales recibidos en saveLeadToFirestore:', leadData);

    // Sanitizar los datos antes de guardar
    const sanitizedData = sanitizeDataForFirestore(leadData);
    
    const finalData = {
      ...sanitizedData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('🎯 Datos finales a enviar a Firestore:', finalData);

    const leadsCollection = collection(db, 'leads');
    const docRef = await addDoc(leadsCollection, finalData);

    console.log('✅ Lead guardado en Firestore con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error guardando en Firestore:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
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
