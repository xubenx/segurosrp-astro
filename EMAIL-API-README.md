# 📧 API de Envío de Emails - Seguros Monterrey

Esta API permite enviar emails de confirmación con un template personalizado usando Zoho Mail.

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Luego edita el archivo `.env` con tus credenciales de Zoho Mail:

```env
# SMTP Configuration for Email (Zoho Mail)
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=contacto@segurosrp.com
SMTP_PASS=tu-contraseña-de-aplicacion
FROM_EMAIL=contacto@segurosrp.com
RECIPIENT_EMAIL=contacto@segurosrp.com
```

### 2. Obtener Contraseña de Aplicación de Zoho

1. Inicia sesión en [Zoho Mail](https://mail.zoho.com)
2. Ve a **Configuración** → **Seguridad** → **Contraseñas de aplicación**
3. Genera una nueva contraseña de aplicación
4. Usa esta contraseña en la variable `SMTP_PASS`

## 🚀 Uso de la API

### Endpoint

```
POST /api/send-email
```

### Cuerpo de la Petición

```json
{
  "email": "usuario@ejemplo.com"
}
```

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Email enviado correctamente"
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos (opcional)"
}
```

## 🧪 Métodos de Prueba

### 1. Navegador Web (Recomendado)

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre en tu navegador:
   ```
   http://localhost:4321/test-email.html
   ```

3. Ingresa tu email y haz clic en "Enviar Email de Prueba"

### 2. Script de Node.js

```bash
node test-send-email.js tu-email@ejemplo.com
```

### 3. cURL (Terminal)

```bash
curl -X POST http://localhost:4321/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-email@ejemplo.com"}'
```

### 4. JavaScript/Fetch

```javascript
async function enviarEmail(email) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Email enviado correctamente');
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}

// Uso
enviarEmail('usuario@ejemplo.com');
```

## 📧 Template del Email

El email incluye:
- ✅ Header con logos corporativos
- 📝 Mensaje de confirmación personalizado
- 🖼️ Imagen corporativa
- 📞 Botón de WhatsApp para contacto
- 📋 Footer con información de la empresa

## ⚠️ Solución de Problemas

### Error: "Property 'env' does not exist on type 'ImportMeta'"

Asegúrate de que el archivo `src/env.d.ts` contenga:

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SMTP_HOST: string;
  readonly SMTP_PORT: string;
  readonly SMTP_USER: string;
  readonly SMTP_PASS: string;
  readonly FROM_EMAIL: string;
  readonly RECIPIENT_EMAIL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Error de Autenticación SMTP

1. Verifica que la contraseña de aplicación esté correcta
2. Asegúrate de usar la contraseña de aplicación, no tu contraseña normal
3. Verifica que el email en `SMTP_USER` sea correcto

### Email no llega

1. Revisa la carpeta de spam/correo no deseado
2. Verifica que el email de destino sea válido
3. Revisa los logs del servidor para errores

### Error de Conexión

1. Verifica que el servidor esté ejecutándose: `npm run dev`
2. Confirma que la URL sea correcta: `http://localhost:4321`
3. Revisa que las variables de entorno estén configuradas

## 📝 Logs y Debugging

Los errores se registran en la consola del servidor. Para ver logs detallados:

```bash
npm run dev
```

Luego revisa la terminal donde ejecutas el servidor para ver los logs.

## 🔒 Seguridad

- ✅ Las variables de entorno nunca se exponen al cliente
- ✅ Validación de formato de email
- ✅ Manejo de errores seguro
- ✅ Rate limiting recomendado para producción

## 📚 Integración en tu Aplicación

Para integrar en formularios existentes:

```javascript
// En tu formulario
document.getElementById('miFormulario').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert('¡Email enviado! Revisa tu bandeja de entrada.');
  } else {
    alert('Error: ' + result.message);
  }
});
```