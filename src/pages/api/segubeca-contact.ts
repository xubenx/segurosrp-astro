import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { initializeFirebase, saveLeadToFirestore } from '../../lib/firebase-config';

// Inicializar Firebase
let firebaseInitialized = false;

async function ensureFirebaseInitialized() {
  if (!firebaseInitialized) {
    try {
      initializeFirebase();
      firebaseInitialized = true;
      console.log('✅ Firebase inicializado para Segubeca API');
    } catch (error) {
      console.error('❌ Error inicializando Firebase en Segubeca API:', error);
      throw error;
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

// Función para enviar notificación a Telegram con botón de WhatsApp personalizado
async function sendTelegramNotification(leadData: any, documentId: string) {
  const message = `🎓 *NUEVO LEAD - SEGUBECA*

👨‍👩‍👧‍👦 *Padre/Madre:* ${leadData.parentName}
🧒 *Hijo/a:* ${leadData.childName}
👤 *Edad padre/madre:* ${leadData.parentAge} años
👶 *Edad hijo/a:* ${leadData.childAge} años
💰 *Ahorro mensual deseado:* ${leadData.monthlySavings}
📧 *Email:* ${leadData.email}
📱 *WhatsApp:* ${leadData.whatsapp}

📅 *Fecha:* ${new Date().toLocaleString('es-MX')}
📊 *Estado:* 🟡 Pendiente
🔗 *Fuente:* Segubeca Landing
🆔 *ID:* ${documentId}`;

  // Crear mensaje personalizado para WhatsApp
  const whatsappMessage = encodeURIComponent(
    `Hola ${leadData.parentName}, gracias por contactarnos y pensar en el futuro de tu hijo/a ${leadData.childName}. 

Somos especialistas en seguros educativos y queremos ayudarte a asegurar que ${leadData.childName} tenga garantizada su educación universitaria.

Basado en tu consulta sobre ahorrar ${leadData.monthlySavings} mensuales, tenemos el plan perfecto para tu familia.

¿Cuándo podríamos agendar una cita para mostrarte las mejores opciones para ${leadData.childName}?

Saludos,
Equipo Segubeca - Seguros RP`
  );

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "💬 Contactar por WhatsApp",
          url: `https://wa.me/52${leadData.whatsapp}?text=${whatsappMessage}`
        }
      ],
      [
        {
          text: "✅ Marcar como Revisado",
          callback_data: `review_${documentId}`
        },
        {
          text: "📞 Contactado",
          callback_data: `contacted_${documentId}`
        }
      ],
      [
        {
          text: "❌ Cerrar Lead",
          callback_data: `close_${documentId}`
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
      const errorData = await response.text();
      throw new Error(`Error al enviar a Telegram: ${response.statusText} - ${errorData}`);
    }

    const result = await response.json();
    console.log('✅ Mensaje enviado a Telegram:', result);
    return true;
  } catch (error) {
    console.error('❌ Error enviando notificación a Telegram:', error);
    throw error;
  }
}

// Función para enviar email de confirmación al cliente
async function sendClientEmail(leadData: any) {
  const subject = `🎓 ¡Gracias por confiar en nosotros para asegurar el futuro de ${leadData.childName}! - Segubeca`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #145995 0%, #0f1f32 100%); padding: 30px; text-align: center; position: relative;">
        <h1 style="color: #FFDE59; margin: 0; font-size: 2rem;">🎓 Segubeca</h1>
        <p style="color: #FFDE59; margin: 10px 0 0 0;">Asegurando el futuro educativo de tus hijos</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #145995;">¡Hola ${leadData.parentName}!</h2>
        
        <p style="color: #333; line-height: 1.6;">
          Gracias por contactarnos para asegurar el futuro educativo de <strong>${leadData.childName}</strong>. 
          Nuestro equipo de asesores especialistas en seguros educativos se pondrá en contacto contigo 
          en las próximas <strong>24 horas</strong> para diseñar el plan perfecto para tu familia.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFDE59;">
          <h3 style="color: #145995; margin-top: 0;">📋 Resumen de tu consulta:</h3>
          <p style="margin: 5px 0;"><strong>👨‍👩‍👧‍👦 Padre/Madre:</strong> ${leadData.parentName}</p>
          <p style="margin: 5px 0;"><strong>🧒 Hijo/a:</strong> ${leadData.childName}</p>
          <p style="margin: 5px 0;"><strong>👤 Tu edad:</strong> ${leadData.parentAge} años</p>
          <p style="margin: 5px 0;"><strong>👶 Edad de ${leadData.childName}:</strong> ${leadData.childAge} años</p>
          <p style="margin: 5px 0;"><strong>💰 Ahorro mensual deseado:</strong> ${leadData.monthlySavings}</p>
          <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${leadData.email}</p>
          <p style="margin: 5px 0;"><strong>📱 WhatsApp:</strong> ${leadData.whatsapp}</p>
        </div>

        <div style="background: linear-gradient(135deg, #FFDE59, #FFD700); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #145995; margin-top: 0;">🎯 ¿Sabías que...?</h3>
          <p style="color: #145995; margin: 0; font-weight: 600;">
            El costo de una carrera universitaria puede llegar hasta $2,350,000 MXN. 
            Con Segubeca, puedes asegurar que ${leadData.childName} tenga garantizado su futuro educativo.
          </p>
        </div>
        
        <p style="color: #333; line-height: 1.6;">
          Mientras tanto, puedes contactarnos directamente:
        </p>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #145995; margin-top: 0;">📞 Contacto Directo</h4>
          <p style="margin: 5px 0;">📱 WhatsApp: <a href="https://wa.me/524425958912?text=Hola,%20me%20interesa%20Segubeca%20para%20${leadData.childName}" style="color: #25D366; text-decoration: none; font-weight: bold;">+52 (442) 595 8912</a></p>
          <p style="margin: 5px 0;">☎️ Teléfono: <a href="tel:+524425958912" style="color: #145995;">+52 (442) 595 8912</a></p>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
          © ${new Date().getFullYear()} Segubeca - Seguros RP. El futuro educativo de ${leadData.childName} está asegurado.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Segubeca - Seguros RP" <${process.env.FROM_EMAIL}>`,
    to: leadData.email,
    subject: subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmación enviado al cliente');
    return true;
  } catch (error) {
    console.error('❌ Error enviando email al cliente:', error);
    throw error;
  }
}

// Función para enviar email interno
async function sendInternalEmail(leadData: any) {
  const subject = '🎓 NUEVO LEAD SEGUBECA - Seguros Educativos';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #145995, #FFDE59); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎓 NUEVO LEAD SEGUBECA</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #145995;">Detalles del Cliente - Seguros Educativos</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">👨‍👩‍👧‍👦 Padre/Madre:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.parentName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">🧒 Hijo/a:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.childName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">👤 Edad padre/madre:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.parentAge} años</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">👶 Edad hijo/a:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.childAge} años</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">💰 Ahorro mensual:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.monthlySavings}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">📧 Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">📱 WhatsApp:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.whatsapp}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">📅 Fecha:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString('es-MX')}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background: #fff; border-radius: 5px; border-left: 4px solid #FFDE59;">
          <p style="margin: 0; color: #666;">
            <strong>Acción requerida:</strong> Contactar al cliente en las próximas 24 horas para asesoría sobre Segubeca.
          </p>
        </div>

        <div style="margin-top: 15px; padding: 15px; background: #e6f2ff; border-radius: 5px; border-left: 4px solid #145995;">
          <p style="margin: 0; color: #145995; font-weight: bold;">
            💡 Este lead es específico de SEGUBECA - Seguros Educativos. 
            El cliente busca asegurar el futuro educativo de ${leadData.childName}.
          </p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Sistema Segubeca" <${process.env.FROM_EMAIL}>`,
    to: process.env.RECIPIENT_EMAIL,
    subject: subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email interno enviado');
    return true;
  } catch (error) {
    console.error('❌ Error enviando email interno:', error);
    throw error;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🎓 Procesando formulario de Segubeca...');
    
    const jsonData = await request.json();
    console.log('📋 Datos recibidos:', jsonData);
    
    // Crear objeto de lead con los datos de Segubeca
    const leadData = {
      parentName: jsonData.parentName?.toString().trim(),
      childName: jsonData.childName?.toString().trim(),
      parentAge: jsonData.parentAge?.toString().trim(),
      childAge: jsonData.childAge?.toString().trim(),
      monthlySavings: jsonData.monthlySavings?.toString().trim(),
      email: jsonData.email?.toString().trim(),
      whatsapp: jsonData.whatsapp?.toString().trim(),
      source: 'Segubeca Landing',
      campaign: 'Seguros Educativos',
      type: 'segubeca',
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    // Validaciones
    if (!leadData.parentName || !leadData.childName || !leadData.parentAge || 
        !leadData.childAge || !leadData.monthlySavings || !leadData.email || !leadData.whatsapp) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Todos los campos son obligatorios para Segubeca'
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
        error: 'Email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar WhatsApp (debe ser exactamente 10 dígitos)
    if (leadData.whatsapp.length !== 10 || !/^\d{10}$/.test(leadData.whatsapp)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El número de WhatsApp debe tener exactamente 10 dígitos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar edades
    const parentAge = parseInt(leadData.parentAge);
    const childAge = parseInt(leadData.childAge);
    
    if (parentAge < 18 || parentAge > 80) {
      return new Response(JSON.stringify({
        success: false,
        error: 'La edad del padre/madre debe estar entre 18 y 80 años'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (childAge < 0 || childAge > 17) {
      return new Response(JSON.stringify({
        success: false,
        error: 'La edad del hijo/a debe estar entre 0 y 17 años'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Validaciones pasadas');

    // Inicializar Firebase y guardar en Firestore
    let documentId: string | null = null;
    try {
      console.log('🔥 Inicializando Firebase...');
      await ensureFirebaseInitialized();
      
      console.log('💾 Guardando en Firestore...');
      documentId = await saveLeadToFirestore(leadData);
      
      if (documentId) {
        console.log('✅ Lead guardado en Firestore con ID:', documentId);
      } else {
        throw new Error('No se pudo obtener el ID del documento');
      }
    } catch (error) {
      console.error('❌ Error con Firebase:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error al guardar en la base de datos'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enviar notificaciones
    try {
      console.log('📧 Enviando notificaciones...');
      
      const [clientEmailResult, internalEmailResult, telegramResult] = await Promise.allSettled([
        sendClientEmail(leadData),
        sendInternalEmail(leadData),
        sendTelegramNotification(leadData, documentId!)
      ]);

      console.log('📊 Resultados de notificaciones:', {
        clientEmail: clientEmailResult.status,
        internalEmail: internalEmailResult.status,
        telegram: telegramResult.status
      });

      // Si Telegram falla, es crítico
      if (telegramResult.status === 'rejected') {
        console.error('❌ Error crítico en Telegram:', telegramResult.reason);
        throw new Error('Error enviando notificación a Telegram');
      }

    } catch (error) {
      console.error('❌ Error enviando notificaciones:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error enviando notificaciones'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🎉 Proceso completado exitosamente');

    return new Response(JSON.stringify({
      success: true,
      message: `¡Perfecto! Nuestro asesor especializado en seguros educativos te contactará en las próximas 24 horas para diseñar el plan ideal para ${leadData.childName}.`,
      documentId: documentId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error general procesando formulario de Segubeca:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
