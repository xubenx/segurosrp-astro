import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// Configuración del transporter de Zoho Mail
const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(import.meta.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS,
  },
});

// Template HTML del email de confirmación
const getEmailTemplate = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirmación de Solicitud</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <div>
    <table bgcolor="#ffffff" width="100%" align="center" style="background-color: rgb(255, 255, 255); margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: Arial, sans-serif; color: rgb(51, 51, 51)">
        <tbody>
            <tr>
                <td style="padding: 15px 20px">
                    <table bgcolor="#00305c" width="100%" style="background-color: rgb(0, 48, 92); width: 100%; border-spacing: 0">
                        <tbody>
                            <tr>
                                <td width="50%" style="padding: 10px 15px; width: 50%" align="left">
                                    <img style="border: 0; max-width: 130px; display: block" width="130" alt="Logo Seguros Monterrey New York Life" src="https://segurosrp.com/nyl-white.png">
                                </td>
                                <td width="50%" style="padding: 10px 15px; width: 50%" align="right">
                                    <img style="border: 0; max-width: 110px; display: block" width="110" alt="Logo Despacho" src="https://segurosrp.com/rp_blancos_flip.png">
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" bgcolor="#ffffff" style="padding: 40px 30px 40px 30px; background-color: rgb(255, 255, 255); text-align: center">
                    <h1 style="margin: 0 0 15px 0; font-size: 28px; font-weight: bold; color: rgb(0, 51, 102)">
                        Hemos recibido tu solicitud
                        <br>
                    </h1>
                    <p style="margin: 0px; line-height: 1.6;">
                        <span class="colour" style="color:rgb(85, 85, 85)">
                            <span class="size" style="font-size: 18px; margin: 0px; line-height: 1.6;">
                                Gracias por tu interés. Uno de nuestros asesores especializados te contactará muy pronto para brindarte la información que necesitas.
                            </span>
                        </span>
                        <br>
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding: 0; font-size: 0; line-height: 0">
                    <img style="border: 0; width: 100%; max-width: 600px; height: auto; display: block" alt="Nuestros asesores te contactarán" src="https://segurosrp.com/principal_tiny.png">
                </td>
            </tr>
            <tr>
                <td align="center" bgcolor="#ffffff" style="background-color: rgb(255, 255, 255); padding: 40px 30px; text-align: center">
                    <p style="margin: 0px 0px 25px; line-height: 1.6;">
                        <span class="colour" style="color:rgb(85, 85, 85)">
                            <span class="size" style="font-size: 16px; margin: 0px 0px 25px; line-height: 1.6;">
                                Si prefieres contacto inmediato, puedes escribirnos directamente.
                            </span>
                        </span>
                        <br>
                    </p>
                    <a target="_blank" style="background-color: rgb(37, 211, 102); color: rgb(255, 255, 255); text-decoration: none; padding: 15px 30px; border-radius: 50px; font-size: 18px; font-weight: bold; display: inline-block" href="https://wa.me/524461354113">
                        Contactar por WhatsApp
                    </a>
                    <p style="margin: 20px 0px 0px;">
                        <span class="colour" style="color:rgb(136, 136, 136)">
                            <span class="size" style="font-size: 14px; margin: 20px 0px 0px;">
                                Tel: +52 446 135 4113
                            </span>
                        </span>
                        <br>
                    </p>
                </td>
            </tr>
            <tr>
                <td align="center" bgcolor="#ededed" style="background-color: rgb(237, 237, 237); padding: 20px 30px; text-align: center">
                    <p style="margin: 0px;">
                        <span class="colour" style="color:rgb(85, 85, 85)">
                            <b>
                                <span class="size" style="font-size: 14px; margin: 0px;">
                                    Seguros Monterrey New York Life
                                </span>
                            </b>
                        </span>
                        <br>
                    </p>
                    <p style="margin: 5px 0px 10px;">
                        <span class="colour" style="color:rgb(85, 85, 85)">
                            <span class="size" style="font-size: 13px; margin: 5px 0px 10px;">
                                Despacho Ramírez y Plascencia
                            </span>
                        </span>
                        <br>
                    </p>
                    <p style="margin: 0px;">
                        <span class="colour" style="color:rgb(136, 136, 136)">
                            <span class="size" style="font-size: 12px; margin: 0px;">
                                © 2026 segurosrp.com - Todos los derechos reservados.
                            </span>
                        </span>
                        <br>
                    </p>
                </td>
            </tr>
        </tbody>
    </table>
  </div>
</body>
</html>
`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    // Validar que se proporcione el email
    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'El email es requerido',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Formato de email inválido',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Configurar el email
    const mailOptions = {
      from: `"Seguros Monterrey New York Life" <${import.meta.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Confirmación de Solicitud - Seguros Monterrey New York Life',
      html: getEmailTemplate(),
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado correctamente',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error enviando email:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor al enviar el email',
        error: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: 'API para envío de emails de confirmación. Use método POST con { "email": "usuario@ejemplo.com" }',
      endpoints: {
        POST: '/api/send-email',
        body: { email: 'string (requerido)' }
      }
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
