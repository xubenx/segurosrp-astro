import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

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
    if (value === undefined || value === null) {
      // Omitir campos undefined o null completamente
      issues.push(`${key}: omitido (undefined/null)`);
      continue;
    } else if (typeof value === 'string') {
      // Limpiar strings y omitir si están vacíos
      const trimmed = value.trim();
      if (trimmed === '') {
        issues.push(`${key}: omitido (string vacío)`);
        continue;
      }
      sanitized[key] = trimmed;
    } else if (value instanceof Date) {
      // TEST: Convertir Date a string ISO en lugar de Firestore Timestamp
      sanitized[key] = value.toISOString();
    } else if (typeof value === 'object' && value !== null) {
      // Recursivamente sanitizar objetos anidados
      const sanitizedNested = sanitizeDataForFirestore(value);
      // Solo agregar si el objeto anidado tiene contenido
      if (Object.keys(sanitizedNested).length > 0) {
        sanitized[key] = sanitizedNested;
      } else {
        issues.push(`${key}: omitido (objeto vacío)`);
      }
    } else {
      // Para otros tipos (number, boolean), mantener el valor
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

    console.log('📥 Datos originales recibidos en saveLeadToFirestore:', JSON.stringify(leadData, null, 2));

    // Validar que no hay valores undefined antes de sanitizar
    const hasUndefined = Object.entries(leadData).some(([key, value]) => value === undefined);
    if (hasUndefined) {
      console.error('🚨 ALERTA: Datos contienen valores undefined:', 
        Object.entries(leadData).filter(([key, value]) => value === undefined)
      );
    }

    // Sanitizar los datos antes de guardar
    const sanitizedData = sanitizeDataForFirestore(leadData);
    
    // TEST: Usar timestamps como strings en lugar de Timestamp objects
    const finalData = {
      ...sanitizedData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('🎯 Datos finales a enviar a Firestore:', JSON.stringify(finalData, null, 2));
    
    // Validación adicional de tipos de datos
    for (const [key, value] of Object.entries(finalData)) {
      if (value === undefined) {
        console.error(`🚨 ERROR: Campo '${key}' es undefined en datos finales`);
        throw new Error(`Campo '${key}' no puede ser undefined`);
      }
      if (typeof value === 'string' && value.includes('\u0000')) {
        console.error(`🚨 ERROR: Campo '${key}' contiene caracteres null`);
        throw new Error(`Campo '${key}' contiene caracteres inválidos`);
      }
    }

    console.log('✅ Validación de datos previa exitosa');
    
    const leadsCollection = collection(db, 'leads');
    const docRef = await addDoc(leadsCollection, finalData);

    console.log('✅ Lead guardado en Firestore con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error guardando en Firestore:', error);
    console.error('❌ Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    
    // Log adicional para debug
    console.error('❌ Datos que causaron el error:', JSON.stringify(leadData, null, 2));
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
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Status actualizado en Firestore:', documentId, status);
  } catch (error) {
    console.error('❌ Error actualizando status en Firestore:', error);
    throw error;
  }
}
