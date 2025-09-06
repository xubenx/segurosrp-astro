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
  // Determinar si es un lead de Segubeca o formulario general
  const isSegubeca = leadData.parentName || leadData.childName || leadData.monthlySavings;
  
  let message = '';
  
  if (isSegubeca) {
    message = `🎓 *NUEVO LEAD - SEGUBECA*

👨‍👩‍👧‍👦 *Padre/Madre:* ${leadData.parentName || 'No proporcionado'}
🧒 *Hijo/a:* ${leadData.childName || 'No proporcionado'}
👤 *Edad padre/madre:* ${leadData.parentAge || 'No proporcionado'} años
👶 *Edad hijo/a:* ${leadData.childAge || 'No proporcionado'} años
💰 *Ahorro mensual deseado:* ${leadData.monthlySavings || 'No especificado'}
📧 *Email:* ${leadData.email}
📱 *WhatsApp:* ${leadData.whatsapp || 'No proporcionado'}

📅 *Fecha:* ${new Date().toLocaleString('es-MX')}
📊 *Estado:* 🟡 Pendiente
🔗 *Fuente:* ${leadData.source || 'Segubeca Landing'}
🆔 *ID:* ${documentId}`;
  } else {
    message = `🔔 *NUEVO LEAD - Seguros RP*

👤 *Nombre:* ${leadData.name}
📧 *Email:* ${leadData.email}
📱 *Teléfono:* ${leadData.phone || 'No proporcionado'}
💬 *Mensaje:* ${leadData.message}

📅 *Fecha:* ${new Date().toLocaleString('es-MX')}
📊 *Estado:* 🟡 Pendiente
🆔 *ID:* ${documentId}`;
  }

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
  // Determinar si es un lead de Segubeca
  const isSegubeca = leadData.parentName || leadData.childName || leadData.monthlySavings;
  
  let subject = '';
  let htmlContent = '';
  
  if (isSegubeca) {
    subject = `🎓 ¡Gracias por confiar en nosotros para asegurar el futuro de ${leadData.childName}! - Segubeca`;
    htmlContent = `
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
            ${leadData.whatsapp ? `<p style="margin: 5px 0;"><strong>📱 WhatsApp:</strong> ${leadData.whatsapp}</p>` : ''}
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
  } else {
    subject = '¡Gracias por contactarnos! - Seguros RP';
    htmlContent = `
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
    `;
  }

  const mailOptions = {
    from: `"Seguros RP" <${process.env.FROM_EMAIL}>`,
    to: leadData.email,
    subject: subject,
    html: htmlContent,
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
  // Determinar si es un lead de Segubeca
  const isSegubeca = leadData.parentName || leadData.childName || leadData.monthlySavings;
  
  let subject = '';
  let tableRows = '';
  
  if (isSegubeca) {
    subject = `🎓 NUEVO LEAD SEGUBECA: ${leadData.parentName} para ${leadData.childName}`;
    tableRows = `
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
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">💰 Ahorro mensual deseado:</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.monthlySavings}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">📧 Email:</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td>
      </tr>
      ${leadData.whatsapp ? `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">📱 WhatsApp:</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="https://wa.me/52${leadData.whatsapp}">${leadData.whatsapp}</a></td>
      </tr>` : ''}
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">🔗 Fuente:</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.source || 'Segubeca Landing'}</td>
      </tr>
    `;
  } else {
    subject = `🔔 NUEVO LEAD: ${leadData.name}`;
    tableRows = `
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
    `;
  }

  const mailOptions = {
    from: `"Sistema Seguros RP" <${process.env.FROM_EMAIL}>`,
    to: process.env.RECIPIENT_EMAIL,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${isSegubeca ? 'linear-gradient(135deg, #145995, #FFDE59)' : '#FF6600'}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${isSegubeca ? '🎓 NUEVO LEAD SEGUBECA' : 'NUEVO LEAD RECIBIDO'}</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: ${isSegubeca ? '#145995' : '#00305C'};">Detalles del Cliente</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            ${tableRows}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Fecha:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString('es-MX')}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background: #fff; border-radius: 5px; border-left: 4px solid ${isSegubeca ? '#FFDE59' : '#FF6600'};">
            <p style="margin: 0; color: #666;">
              <strong>Acción requerida:</strong> ${isSegubeca ? 'Contactar al cliente en las próximas 24 horas para asesoría sobre Segubeca' : 'Contactar al cliente en las próximas 24 horas'}.
            </p>
          </div>

          ${isSegubeca ? `
          <div style="margin-top: 15px; padding: 15px; background: #e6f2ff; border-radius: 5px; border-left: 4px solid #145995;">
            <p style="margin: 0; color: #145995; font-weight: bold;">
              💡 Este lead es específico de SEGUBECA - Seguros Educativos. 
              El cliente busca asegurar el futuro educativo de ${leadData.childName}.
            </p>
          </div>
          ` : ''}
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
  try {
    const jsonData = await request.json();
    
    // Detectar si es formulario de Segubeca o formulario general
    const isSegubeca = jsonData.parentName || jsonData.childName || jsonData.monthlySavings;
    
    let leadData: any = {
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    if (isSegubeca) {
      // Formulario de Segubeca
      leadData = {
        ...leadData,
        parentName: jsonData.parentName?.toString().trim(),
        childName: jsonData.childName?.toString().trim(),
        parentAge: jsonData.parentAge?.toString().trim(),
        childAge: jsonData.childAge?.toString().trim(),
        monthlySavings: jsonData.monthlySavings?.toString().trim(),
        email: jsonData.email?.toString().trim(),
        whatsapp: jsonData.whatsapp?.toString().trim(),
        source: jsonData.source?.toString().trim() || 'Segubeca Landing',
        campaign: jsonData.campaign?.toString().trim() || 'Seguros Educativos',
        type: 'segubeca'
      };

      // Validaciones específicas para Segubeca
      if (!leadData.parentName || !leadData.childName || !leadData.parentAge || 
          !leadData.childAge || !leadData.monthlySavings || !leadData.email || !leadData.whatsapp) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Todos los campos son obligatorios para Segubeca'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validar WhatsApp (debe ser exactamente 10 dígitos)
      if (leadData.whatsapp.length !== 10 || !/^\d{10}$/.test(leadData.whatsapp)) {
        return new Response(JSON.stringify({
          success: false,
          message: 'El número de WhatsApp debe tener exactamente 10 dígitos'
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
          message: 'La edad del padre/madre debe estar entre 18 y 80 años'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (childAge < 0 || childAge > 17) {
        return new Response(JSON.stringify({
          success: false,
          message: 'La edad del hijo/a debe estar entre 0 y 17 años'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } else {
      // Formulario general
      leadData = {
        ...leadData,
        name: jsonData.name?.toString().trim(),
        email: jsonData.email?.toString().trim(),
        phone: jsonData.phone?.toString().trim(),
        message: jsonData.message?.toString().trim(),
        type: 'general'
      };

      // Validaciones para formulario general
      if (!leadData.name || !leadData.email || !leadData.message) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Faltan campos obligatorios'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validar email (común para ambos formularios)
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
      documentId = await saveLeadToFirestore(leadData);
      if (documentId) {
        firebaseSaved = true;
        console.log('✅ Lead guardado en Firestore con ID:', documentId);
      }
    } catch (error) {
      console.error('❌ Error guardando en Firestore:', error);
      // Continuar sin Firebase si hay error
      documentId = `temp-${Date.now()}`;
    }

    // Log del estado de Firebase
    console.log('🔥 Estado Firebase:', {
      inicializado: firebaseInitialized,
      guardado: firebaseSaved,
      documentId: documentId,
      tipoFormulario: isSegubeca ? 'Segubeca' : 'General'
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
      documentId: documentId,
      tipo: isSegubeca ? 'Segubeca' : 'General'
    });

    const successMessage = isSegubeca 
      ? `¡Perfecto! Nuestro asesor especializado en seguros educativos te contactará en las próximas 24 horas para diseñar el plan ideal para ${leadData.childName}.`
      : 'Mensaje enviado correctamente. Te contactaremos pronto.';

    return new Response(JSON.stringify({
      success: true,
      message: successMessage,
      details: {
        firebase: firebaseSaved,
        documentId: documentId,
        type: isSegubeca ? 'segubeca' : 'general',
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
