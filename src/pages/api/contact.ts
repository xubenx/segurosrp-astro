import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { initializeFirebase, saveLeadToFirestore } from '../../lib/firebase-config';
import { Timestamp } from 'firebase/firestore';

// Make this endpoint server-rendered
export const prerender = false;

// Inicializar Firebase
let firebaseInitialized = false;

async function ensureFirebaseInitialized() {
  if (!firebaseInitialized) {
    try {
      initializeFirebase();
      firebaseInitialized = true;
      console.log('✅ Firebase inicializado para contact API');
    } catch (error) {
      console.error('❌ Error inicializando Firebase en contact API:', error);
      // No fallar si Firebase no funciona, solo loggearlo
    }
  }
}

// Configurar transporter de Nodemailer para Zoho
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Función para enviar notificación a Telegram con botones interactivos
async function sendTelegramNotification(leadData: any, documentId: string) {
  const message = `🔔 *NUEVO LEAD - Seguros RP*

👤 *Nombre:* ${leadData.name}
📧 *Email:* ${leadData.email}
📱 *Teléfono:* ${leadData.phone || 'No proporcionado'}
💬 *Mensaje:* ${leadData.message}

📅 *Fecha:* ${new Date().toLocaleString('es-MX')}
📊 *Estado:* 🟡 Pendiente
🆔 *ID:* ${documentId}`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "✅ Marcar como Revisado",
          callback_data: "review"
        },
        {
          text: "📞 Contactado",
          callback_data: "contacted"
        }
      ],
      [
        {
          text: "❌ Cerrar Lead",
          callback_data: "close"
        }
      ]
    ]
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }),
    });

    if (!response.ok) {
      throw new Error(`Error al enviar a Telegram: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error enviando notificación a Telegram:', error);
    return false;
  }
}

// Función para enviar email de confirmación al cliente
async function sendClientEmail(leadData: any) {
  const mailOptions = {
    from: `"Seguros RP" <${process.env.FROM_EMAIL}>`,
    to: leadData.email,
    subject: '¡Gracias por contactarnos! - Seguros RP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00305C 0%, #1A75CF 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Seguros RP</h1>
          <p style="color: #FFD700; margin: 10px 0 0 0;">Tu tranquilidad es nuestro compromiso</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #00305C;">¡Hola ${leadData.name}!</h2>
          
          <p style="color: #333; line-height: 1.6;">
            Gracias por contactarnos. Hemos recibido tu mensaje y uno de nuestros asesores especialistas 
            se pondrá en contacto contigo en las próximas <strong>24 horas</strong>.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6600;">
            <h3 style="color: #00305C; margin-top: 0;">Resumen de tu consulta:</h3>
            <p style="margin: 5px 0;"><strong>Nombre:</strong> ${leadData.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${leadData.email}</p>
            ${leadData.phone ? `<p style="margin: 5px 0;"><strong>Teléfono:</strong> ${leadData.phone}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Mensaje:</strong> ${leadData.message}</p>
          </div>
          
          <p style="color: #333; line-height: 1.6;">
            Mientras tanto, puedes contactarnos directamente:
          </p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #00305C; margin-top: 0;">Querétaro</h4>
            <p style="margin: 5px 0;">📍 Nouvalia, Local 106 Planta Baja, Piso 6</p>
            <p style="margin: 5px 0;">📞 <a href="tel:+524425958912" style="color: #FF6600;">+52 (442) 595 8912</a></p>
            
            <h4 style="color: #00305C; margin-top: 15px;">Celaya</h4>
            <p style="margin: 5px 0;">📍 Av. Ferrocarril central #709, Planta baja, Local 22, Los Laureles</p>
            <p style="margin: 5px 0;">📞 <a href="tel:+524616144326" style="color: #FF6600;">+52 (461) 614 4326</a></p>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            © ${new Date().getFullYear()} Seguros RP - Ramírez & Plascencia. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error enviando email al cliente:', error);
    return false;
  }
}

// Función para enviar email interno
async function sendInternalEmail(leadData: any) {
  const mailOptions = {
    from: `"Sistema Seguros RP" <${process.env.FROM_EMAIL}>`,
    to: process.env.RECIPIENT_EMAIL,
    subject: `🔔 NUEVO LEAD: ${leadData.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FF6600; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NUEVO LEAD RECIBIDO</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #00305C;">Detalles del Cliente</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Nombre:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td>
            </tr>
            ${leadData.phone ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Teléfono:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Mensaje:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.message}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Fecha:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString('es-MX')}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background: #fff; border-radius: 5px; border-left: 4px solid #FF6600;">
            <p style="margin: 0; color: #666;">
              <strong>Acción requerida:</strong> Contactar al cliente en las próximas 24 horas.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error enviando email interno:', error);
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  console.log('🚀 API /contact POST iniciado');
  
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
      message: jsonData.message ? String(jsonData.message).trim() : 'Test Message',
      type: 'normal',
      source: 'Test Source'
    };

    // Agregar timestamp COMO STRING en lugar de Timestamp objeto
    leadData.timestamp = new Date().toISOString();
    leadData.ip = String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');
    leadData.userAgent = String(request.headers.get('user-agent') || 'unknown');

    // Solo agregar phone si tiene valor
    if (jsonData.phone && String(jsonData.phone).trim()) {
      leadData.phone = String(jsonData.phone).trim();
    }

    // Solo agregar campaign si tiene valor
    if (jsonData.campaign && String(jsonData.campaign).trim()) {
      leadData.campaign = String(jsonData.campaign).trim();
    }

    console.log('💾 Datos SIMPLIFICADOS para Firestore:', leadData);
    console.log('🔍 Tipos de datos:', Object.entries(leadData).map(([k, v]) => `${k}: ${typeof v}`));

    // Validaciones básicas
    if (!leadData.name || !leadData.email || !leadData.message) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Faltan campos obligatorios'
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
    
    console.log('🔍 Verificando datos antes de guardar en Firestore:');
    console.log('- Datos completos:', JSON.stringify(leadData, null, 2));
    
    // Validación exhaustiva de datos
    const invalidFields: string[] = [];
    for (const [key, value] of Object.entries(leadData)) {
      if (value === undefined) {
        invalidFields.push(`${key}: undefined`);
      } else if (value === null) {
        invalidFields.push(`${key}: null`);
      } else if (typeof value === 'string' && value.includes('\u0000')) {
        invalidFields.push(`${key}: contiene caracteres null`);
      } else if (typeof value === 'string' && value.length === 0) {
        invalidFields.push(`${key}: string vacío`);
      }
    }
    
    if (invalidFields.length > 0) {
      console.error('🚨 Campos potencialmente problemáticos:', invalidFields);
    } else {
      console.log('✅ Todos los campos parecen válidos');
    }
    
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
      console.error('❌ Stack trace:', error.stack);
      // Continuar sin Firebase si hay error
      documentId = `temp-${Date.now()}`;
    }

    // Log del estado de Firebase
    console.log('🔥 Estado Firebase:', {
      inicializado: firebaseInitialized,
      guardado: firebaseSaved,
      documentId: documentId
    });

    // Enviar emails y notificación a Telegram en paralelo
    const [clientEmailSent, internalEmailSent, telegramSent] = await Promise.allSettled([
      sendClientEmail(leadData),
      sendInternalEmail(leadData),
      sendTelegramNotification(leadData, documentId || 'no-id')
    ]);

    console.log('Resultados:', {
      clientEmail: clientEmailSent.status === 'fulfilled' ? clientEmailSent.value : false,
      internalEmail: internalEmailSent.status === 'fulfilled' ? internalEmailSent.value : false,
      telegram: telegramSent.status === 'fulfilled' ? telegramSent.value : false,
      firebase: firebaseSaved,
      documentId: documentId
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensaje enviado correctamente. Te contactaremos pronto.',
      details: {
        firebase: firebaseSaved,
        documentId: documentId,
        notifications: {
          email: clientEmailSent.status === 'fulfilled' ? clientEmailSent.value : false,
          telegram: telegramSent.status === 'fulfilled' ? telegramSent.value : false
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error procesando formulario:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};