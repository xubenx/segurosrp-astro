import type { APIRoute } from 'astro';
import { initializeFirebase, updateLeadStatus as updateLeadInFirestore, getFirestoreInstance } from '../../lib/firebase-config';

// Inicializar Firebase al cargar el módulo
let firebaseInitialized = false;

async function ensureFirebaseInitialized() {
  if (!firebaseInitialized) {
    try {
      initializeFirebase();
      firebaseInitialized = true;
      console.log('✅ Firebase inicializado para webhook');
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error);
      throw error;
    }
  }
}

// Función para actualizar el estado en Firestore
async function updateLeadStatus(documentId: string, newStatus: string) {
  try {
    await ensureFirebaseInitialized();
    return await updateLeadInFirestore(documentId, newStatus);
  } catch (error) {
    console.error('Error actualizando lead:', error);
    return false;
  }
}

// Función para obtener información del lead
async function getLeadInfo(documentId: string) {
  try {
    await ensureFirebaseInitialized();
    const db = getFirestoreInstance();
    const doc = await db.collection('clientes').doc(documentId).get();
    
    if (doc.exists) {
      return doc.data();
    } else {
      console.log('Lead no encontrado:', documentId);
      return null;
    }
  } catch (error) {
    console.error('Error obteniendo lead:', error);
    return null;
  }
}

// Función para enviar mensaje de confirmación
async function sendConfirmationMessage(chatId: string, messageId: number, leadInfo: any, newStatus: string) {
  const statusEmojis: { [key: string]: string } = {
    'revisado': '✅',
    'contactado': '📞',
    'cerrado': '❌'
  };

  const statusTexts: { [key: string]: string } = {
    'revisado': 'Revisado',
    'contactado': 'Contactado',
    'cerrado': 'Cerrado'
  };

  let updatedMessage = '';
  
  if (leadInfo) {
    // Crear mensaje con información del lead
    updatedMessage = `🔔 *LEAD ACTUALIZADO - Seguros RP*

👤 *Nombre:* ${leadInfo.name}
📧 *Email:* ${leadInfo.email}
📱 *Teléfono:* ${leadInfo.phone || 'No proporcionado'}
💬 *Mensaje:* ${leadInfo.message}

📅 *Fecha:* ${leadInfo.timestamp ? new Date(leadInfo.timestamp.toDate()).toLocaleString('es-MX') : 'No disponible'}
📊 *Estado:* ${statusEmojis[newStatus]} ${statusTexts[newStatus]}
🕐 *Actualizado:* ${new Date().toLocaleString('es-MX')}`;
  } else {
    // Mensaje simplificado sin información del lead
    updatedMessage = `🔔 *LEAD ACTUALIZADO - Seguros RP*

📊 *Estado:* ${statusEmojis[newStatus]} ${statusTexts[newStatus]}
🕐 *Actualizado:* ${new Date().toLocaleString('es-MX')}

✅ Cambio de estado procesado correctamente`;
  }

  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: updatedMessage,
        parse_mode: 'Markdown'
      }),
    });
    return true;
  } catch (error) {
    console.error('Error editando mensaje:', error);
    return false;
  }
}

// Interfaces para Telegram
interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
  };
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: TelegramMessage;
}

interface TelegramUpdate {
  callback_query?: TelegramCallbackQuery;
}

export async function GET() {
  return new Response(JSON.stringify({
    status: 'Telegram Webhook endpoint is working',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request: Request) {
  try {
    console.log('🔄 Webhook recibido');
    
    // Obtener el cuerpo de la petición
    let body: TelegramUpdate;
    const text = await request.text();
    
    console.log('📝 Body raw:', text);
    
    if (!text || text.trim() === '') {
      console.log('⚠️ Body vacío, retornando OK');
      return new Response(JSON.stringify({ status: 'OK', message: 'No data' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.error('❌ Error parsing JSON:', e);
      return new Response(JSON.stringify({ status: 'error', message: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📦 Telegram update:', body);

    // Verificar si es un callback query (botón presionado)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      console.log('🔘 Callback query recibido:', callbackQuery.data);
      
      const statusMap: Record<string, string> = {
        'review': 'revisado',
        'contacted': 'contactado', 
        'close': 'cerrado'
      };
      
      const newStatus = statusMap[callbackQuery.data || ''];
      
      if (newStatus) {
        // Intentar obtener el ID del documento desde el mensaje
        let documentId = null;
        const messageText = callbackQuery.message?.text;
        
        if (messageText) {
          // Buscar el ID del documento en el texto del mensaje
          const docIdMatch = messageText.match(/ID: ([a-zA-Z0-9]+)/);
          if (docIdMatch) {
            documentId = docIdMatch[1];
          }
        }
        
        // Actualizar estado en Firestore si tenemos el ID
        if (documentId) {
          console.log(`📝 Actualizando documento ${documentId} a estado: ${newStatus}`);
          const updateSuccess = await updateLeadStatus(documentId, newStatus);
          
          if (updateSuccess) {
            // Obtener información del lead para mostrar en el mensaje
            const leadInfo = await getLeadInfo(documentId);
            
            // Editar el mensaje para mostrar el nuevo estado
            await sendConfirmationMessage(
              callbackQuery.message?.chat.id.toString() || '',
              callbackQuery.message?.message_id || 0,
              leadInfo,
              newStatus
            );
          }
        } else {
          // Si no hay ID, solo editar el mensaje con confirmación básica
          await sendConfirmationMessage(
            callbackQuery.message?.chat.id.toString() || '',
            callbackQuery.message?.message_id || 0,
            null,
            newStatus
          );
        }
        
        // Responder al callback query
        const answerUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
        await fetch(answerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: `Estado cambiado a: ${newStatus}`,
            show_alert: false
          })
        });
        
        console.log(`✅ Estado actualizado a: ${newStatus}`);
      }
    }

    return new Response(JSON.stringify({ status: 'OK' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error procesando webhook de Telegram:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
