import type { APIRoute } from 'astro';
import { initializeFirebase, saveLeadToFirestore } from '../../lib/firebase-config';

// Make this endpoint server-rendered
export const prerender = false;

// Inicializar Firebase
let firebaseInitialized = false;

async function ensureFirebaseInitialized() {
  if (!firebaseInitialized) {
    try {
      initializeFirebase();
      firebaseInitialized = true;
      console.log('✅ Firebase inicializado para lead API');
    } catch (error) {
      console.error('❌ Error inicializando Firebase en lead API:', error);
      // No fallar si Firebase no funciona, solo loggearlo
    }
  }
}

export const POST: APIRoute = async ({ request }) => {
  console.log('🚀 API /lead POST iniciado');
  
  try {
    // Verificar Content-Type
    const contentType = request.headers.get('content-type');
    console.log('📋 Content-Type recibido:', contentType);
    
    // Validar que sea JSON
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Content-Type inválido:', contentType);
      return new Response(JSON.stringify({
        success: false,
        message: 'Content-Type debe ser application/json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el body como texto primero para debugging
    const bodyText = await request.text();
    console.log('📄 Body recibido (longitud):', bodyText.length);
    console.log('📄 Body recibido (primeros 200 chars):', bodyText.substring(0, 200));
    
    if (!bodyText || bodyText.trim() === '') {
      console.error('❌ Body vacío');
      return new Response(JSON.stringify({
        success: false,
        message: 'El cuerpo de la petición está vacío'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Intentar parsear JSON con manejo de errores
    let jsonData;
    try {
      jsonData = JSON.parse(bodyText);
      console.log('📝 Datos JSON parseados:', Object.keys(jsonData));
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      console.error('❌ Body problemático:', bodyText);
      return new Response(JSON.stringify({
        success: false,
        message: 'JSON inválido en el cuerpo de la petición',
        details: parseError.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TEST: Crear datos mínimos para identificar el problema
    const leadData: any = {
      name: jsonData.name ? String(jsonData.name).trim() : 'Test Name',
      email: jsonData.email ? String(jsonData.email).trim() : 'test@test.com',
      type: 'normal',
      source: 'Test API Lead'
    };

    // Agregar timestamp COMO STRING en lugar de Timestamp objeto
    leadData.timestamp = new Date().toISOString();
    leadData.ip = String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');
    leadData.userAgent = String(request.headers.get('user-agent') || 'unknown');

    // Solo agregar campos opcionales si tienen valor
    if (jsonData.phone) {
      leadData.phone = String(jsonData.phone).trim();
    }
    if (jsonData.message) {
      leadData.message = String(jsonData.message).trim();
    }

    console.log('💾 Datos SIMPLIFICADOS Lead para Firestore:', leadData);
    console.log('🔍 Tipos de datos:', Object.entries(leadData).map(([k, v]) => `${k}: ${typeof v}`));

    // Validaciones básicas
    if (!leadData.name || !leadData.email) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Nombre y email son obligatorios'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Guardar en Firestore y obtener el ID del documento
    let documentId: string | null = null;
    let firebaseSaved = false;
    
    try {
      await ensureFirebaseInitialized();
      console.log('📤 Enviando a Firestore...');
      documentId = await saveLeadToFirestore(leadData);
      if (documentId) {
        firebaseSaved = true;
        console.log('✅ Lead guardado en Firestore con ID:', documentId);
      }
    } catch (error) {
      console.error('❌ Error guardando en Firestore:', error);
      console.error('❌ Stack trace completo:', error.stack);
      // Continuar sin Firebase si hay error
      documentId = `temp-${Date.now()}`;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensaje enviado correctamente. Te contactaremos pronto.',
      details: {
        firebase: firebaseSaved,
        documentId: documentId
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error procesando formulario:', error);
    console.error('❌ Stack trace completo:', error.stack);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
