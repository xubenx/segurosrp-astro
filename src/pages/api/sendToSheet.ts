import type { APIRoute } from 'astro';
import { google } from 'googleapis';
import { config } from 'dotenv';
import { rateLimitMiddleware } from '../../lib/rate-limiter';

// Cargar variables de entorno
config();

// ---- CONFIGURACIÓN DE TU HOJA ----
const GOOGLE_SHEET_ID = '1RMrJ3Tl5xj4XXvzBFWj1mS3fH9FUD9XqD0GO_eGdP-U';
const GOOGLE_SHEET_NAME = 'LEADS'; // Correcto, ya lo ajustaste
// ----------------------------------

export const POST: APIRoute = async ({ request }) => {
  // Verificar rate limiting antes de procesar
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  // 1. Obtener credenciales
  const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  // 2. Verificar credenciales
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error('❌ Variables de entorno de Google no configuradas');
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error de configuración del servidor' 
      }),
      { status: 500 }
    );
  }

  try {
    // 3. Obtener datos del frontend
    // El frontend sigue enviando 'message', pero ya no lo usaremos
    const body = await request.json();
    const { name, email, phone, message } = body;

    // 4. Validar datos mínimos
    if (!name || !email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nombre y Email son campos obligatorios' 
        }),
        { status: 400 }
      );
    }

    // 5. Generar la fecha de registro
    const fechaActual = new Date().toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 6. Configurar la autenticación
    const auth = new google.auth.JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // 7. Crear instancia de Sheets
    const sheets = google.sheets({ version: 'v4', auth });

    // 8. Obtener datos existentes para encontrar la primera fila vacía
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${GOOGLE_SHEET_NAME}!A:E`,
    });

    const existingRows = getResponse.data.values || [];
    
    // 9. Encontrar la primera fila completamente vacía después de los encabezados
    let targetRow = 2; // Empezar desde la fila 2 (después de los encabezados)
    
    for (let i = 1; i < existingRows.length; i++) { // Empezar desde índice 1 (fila 2)
      const row = existingRows[i];
      // Verificar si las columnas B, C, D, E están vacías (saltamos la columna A que es el ID)
      const isRowEmpty = !row || (
        (!row[1] || row[1].trim() === '') && // Columna B: Fecha
        (!row[2] || row[2].trim() === '') && // Columna C: Nombre
        (!row[3] || row[3].trim() === '') && // Columna D: Teléfono
        (!row[4] || row[4].trim() === '')    // Columna E: Email
      );
      
      if (isRowEmpty) {
        targetRow = i + 1; // +1 porque los índices de array empiezan en 0 pero las filas en 1
        break;
      }
      targetRow = i + 2; // Si no hay fila vacía, usar la siguiente después de la última con datos
    }

    // 10. Preparar los datos (solo para las columnas B-E, saltando la columna A del ID)
    const newRowData = [
      fechaActual,    // Columna B: Fecha
      name,           // Columna C: Nombre
      phone || '',    // Columna D: Teléfono
      email           // Columna E: Correo Electrónico
    ];

    // 11. Definir el rango específico (solo columnas B-E de la fila objetivo)
    const targetRange = `${GOOGLE_SHEET_NAME}!B${targetRow}:E${targetRow}`;

    // 12. Enviar los datos a Google Sheets en la fila específica
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: targetRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRowData],
      },
    });

    console.log(`✅ Datos guardados exitosamente en Google Sheets en la fila ${targetRow}`);

    // 11. Responder con éxito
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Datos guardados en Google Sheet' 
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error al escribir en Google Sheets:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error interno del servidor al escribir en la hoja' 
      }),
      { status: 500 }
    );
  }
};