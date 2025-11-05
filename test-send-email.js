#!/usr/bin/env node

/**
 * Script para probar la API de envío de emails
 * Uso: node test-send-email.js email@ejemplo.com
 */

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('❌ Error: Debes proporcionar un email');
  console.log('📝 Uso: node test-send-email.js email@ejemplo.com');
  process.exit(1);
}

const email = args[0];

// Validar formato de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.log('❌ Error: Formato de email inválido');
  process.exit(1);
}

async function testEmailAPI() {
  try {
    console.log(`📧 Enviando email de prueba a: ${email}`);
    console.log('⏳ Procesando...\n');

    const response = await fetch('http://localhost:4321/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ ¡Email enviado correctamente!');
      console.log(`📬 Destinatario: ${email}`);
      console.log('📝 Revisa tu bandeja de entrada y carpeta de spam');
    } else {
      console.log('❌ Error al enviar email:');
      console.log(`💬 Mensaje: ${data.message}`);
      if (data.error) {
        console.log(`🔍 Detalle: ${data.error}`);
      }
    }

  } catch (error) {
    console.log('❌ Error de conexión:');
    console.log(`💬 ${error.message}`);
    console.log('\n🔧 Asegúrate de que:');
    console.log('   1. El servidor Astro esté ejecutándose (npm run dev)');
    console.log('   2. Las variables de entorno estén configuradas correctamente');
    console.log('   3. La API esté disponible en http://localhost:4321/api/send-email');
  }
}

// Verificar si fetch está disponible (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ Error: Este script requiere Node.js 18+ o superior');
  console.log('💡 También puedes usar: npx node --experimental-fetch test-send-email.js');
  process.exit(1);
}

testEmailAPI();