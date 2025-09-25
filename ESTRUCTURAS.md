# Estructuras de Datos - Colección Firebase `leads`

Este documento describe las estructuras de datos que se almacenan en la **colección única `leads`** de Firebase para todos los formularios del proyecto Seguros RP. 

## 🏗️ Arquitectura de Datos

**IMPORTANTE:** Todos los formularios guardan sus datos en una **única colección llamada `leads`**. No se crean colecciones separadas. La diferenciación se hace mediante el campo `type`.

## 📋 Estructura Base Común

Todos los documentos en la colección `leads` incluyen estos campos base:

```typescript
interface LeadBase {
  // Metadatos del sistema
  timestamp: Date;              // Fecha y hora del envío
  ip: string;                   // IP del cliente
  userAgent: string;            // Información del navegador
  status: string;               // Estado del lead ('pending' por defecto)
  createdAt: Date;              // Timestamp de Firebase
  updatedAt: Date;              // Última actualización
  
  // Información de seguimiento
  type: string;                 // CAMPO CLAVE: Tipo de formulario (ver tipos específicos)
  source: string;               // Fuente del lead
  campaign?: string;            // Campaña específica (opcional)
}
```

---

## 1. 📞 Formulario Contact Genérico

**Archivo:** `src/components/Contact.astro`  
**API:** `/api/contact`  
**Tipo:** `"normal"`

### Campos del Formulario
```html
<input name="name" type="text" required />
<input name="email" type="email" required />
<input name="phone" type="tel" />
<textarea name="message" required></textarea>
```

### Estructura en Firebase
```typescript
interface ContactLead extends LeadBase {
  type: "normal";
  
  // Campos del cliente
  name: string;                 // Nombre completo (requerido)
  email: string;                // Email (requerido)
  phone: string | null;         // Teléfono (opcional)
  message: string;              // Mensaje (requerido)
  
  // Información de seguimiento
  source: string;               // Ej: "Formulario Contact"
  campaign: string | null;      // Campaña específica (opcional)
}
```

### Ejemplo de Documento
```json
{
  "name": "Juan Pérez",
  "email": "juan.perez@email.com",
  "phone": "4461354113",
  "message": "Me interesa conocer más sobre sus seguros de vida",
  "type": "normal",
  "source": "Formulario Contact",
  "campaign": null,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 2. 🎓 Formulario Segubeca (Seguros Educativos)

**Archivo:** `src/components/ContactSeguBeca.astro`  
**API:** `/api/segubeca-contact`  
**Tipo:** `"segubeca"`

### Campos del Formulario
```html
<input name="parentName" type="text" required />
<input name="childName" type="text" required />
<select name="parentAge" required>
  <option value="18-25">18-25 años</option>
  <option value="26-35">26-35 años</option>
  <option value="36-45">36-45 años</option>
  <option value="46-55">46-55 años</option>
  <option value="56-65">56-65 años</option>
  <option value="66+">Más de 66 años</option>
</select>
<select name="childAge" required>
  <option value="0-2">0-2 años</option>
  <option value="3-5">3-5 años</option>
  <option value="6-9">6-9 años</option>
  <option value="10-12">10-12 años</option>
  <option value="13-15">13-15 años</option>
  <option value="16-17">16-17 años</option>
</select>
<select name="monthlySavings" required>
  <option value="1000-2000">$1,000 - $2,000 MXN</option>
  <option value="2000-3000">$2,000 - $3,000 MXN</option>
  <option value="3000-5000">$3,000 - $5,000 MXN</option>
  <option value="5000-10000">$5,000 - $10,000 MXN</option>
  <option value="10000+">Más de $10,000 MXN</option>
</select>
<input name="email" type="email" required />
<input name="whatsapp" type="tel" required pattern="[0-9]{10}" />
```

### Estructura en Firebase
```typescript
interface SegubecaLead extends LeadBase {
  type: "segubeca";
  
  // Información familiar
  parentName: string;           // Nombre del padre/madre (requerido)
  childName: string;            // Nombre del hijo/a (requerido)
  parentAge: string;            // Edad del padre/madre (requerido)
  childAge: string;             // Edad del hijo/a (requerido)
  
  // Información financiera
  monthlySavings: string;       // Ahorro mensual deseado (requerido)
  
  // Contacto
  email: string;                // Email (requerido)
  whatsapp: string;             // WhatsApp 10 dígitos (requerido)
  
  // Información de seguimiento
  source: "Segubeca Landing";
  campaign: "Seguros Educativos";
}
```

### Ejemplo de Documento
```json
{
  "parentName": "María García",
  "childName": "Sofía García",
  "parentAge": "26-35",
  "childAge": "6-9",
  "monthlySavings": "3000-5000",
  "email": "maria.garcia@email.com",
  "whatsapp": "4461354113",
  "type": "segubeca",
  "source": "Segubeca Landing",
  "campaign": "Seguros Educativos",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 3. 💖 Formulario Vida Mujer

**Archivo:** `src/pages/vidamujerlanding/index.astro`  
**API:** `/api/lead`  
**Tipo:** `"vida-mujer"`

### Campos del Formulario
```html
<input name="name" type="text" required />
<input name="email" type="email" required />
<input name="phone" type="tel" required />
<input name="city" type="text" />
<select name="age" required>
  <option value="">Selecciona tu edad...</option>
  <option>18–24 años</option>
  <option>25–34 años</option>
  <option>35–44 años</option>
  <option>45–54 años</option>
  <option>55+ años</option>
</select>
<select name="contact">
  <option>WhatsApp (Preferido)</option>
  <option>Llamada telefónica</option>
  <option>Email</option>
</select>
<textarea name="notes" placeholder="Mi familia, mi ingreso, etapa de embarazo, mis metas financieras..."></textarea>
<input name="privacy" type="checkbox" required />
```

### Estructura en Firebase
```typescript
interface VidaMujerLead extends LeadBase {
  type: "vida-mujer";
  
  // Información personal
  name: string;                 // Nombre completo (requerido)
  email: string;                // Email (requerido)
  phone: string;                // Teléfono (requerido)
  city: string | null;          // Ciudad (opcional)
  age: string;                  // Rango de edad (requerido)
  
  // Preferencias
  contact: string;              // Preferencia de contacto (opcional)
  notes: string | null;         // Notas adicionales (opcional)
  
  // Información de seguimiento
  source: string;               // Ej: "Vida Mujer Landing"
  campaign: string;             // Ej: "SEM Vida Mujer"
}
```

### Valores Posibles
- **age**: `"18–24 años"`, `"25–34 años"`, `"35–44 años"`, `"45–54 años"`, `"55+ años"`
- **contact**: `"WhatsApp (Preferido)"`, `"Llamada telefónica"`, `"Email"`

### Ejemplo de Documento
```json
{
  "name": "Ana López",
  "email": "ana.lopez@email.com",
  "phone": "4461354113",
  "city": "Querétaro",
  "age": "25–34 años",
  "contact": "WhatsApp (Preferido)",
  "notes": "Estoy embarazada y quiero proteger el futuro de mi bebé",
  "type": "vida-mujer",
  "source": "Vida Mujer Landing",
  "campaign": "SEM Vida Mujer",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 4. 🏢 Formulario Asesores Monterrey NYL

**Archivo:** `src/pages/asesores-seguros-monterrey-nyl/index.astro`  
**API:** `/api/lead`  
**Tipo:** `"asesores-monterrey"`

### Campos del Formulario
```html
<input name="nombre" type="text" required />
<input name="telefono" type="tel" required />
<input name="email" type="email" required />
<select name="edad" required>
  <option value="">Selecciona tu edad</option>
  <option value="18-25">18-25 años</option>
  <option value="26-35">26-35 años</option>
  <option value="36-45">36-45 años</option>
  <option value="46-55">46-55 años</option>
  <option value="56-65">56-65 años</option>
  <option value="65+">Más de 65 años</option>
</select>
<select name="tipoSeguro" required>
  <option value="">Selecciona el tipo de seguro</option>
  <option value="vida">Seguro de Vida</option>
  <option value="salud">Seguro de Salud</option>
  <option value="educativo">Seguro Educativo</option>
  <option value="retiro">Plan de Retiro</option>
  <option value="varios">Varios tipos</option>
</select>
<textarea name="mensaje" placeholder="Cuéntanos sobre tus necesidades específicas..."></textarea>
```

### Estructura en Firebase
```typescript
interface AsesoresTorreyLead extends LeadBase {
  type: "asesores-monterrey";
  
  // Información personal (campos enviados con nombres en español)
  name: string;                 // Mapeado desde 'nombre' (requerido)
  email: string;                // Email (requerido)
  phone: string;                // Mapeado desde 'telefono' (requerido)
  age: string;                  // Mapeado desde 'edad' (requerido)
  
  // Información del seguro
  insuranceType: string;        // Mapeado desde 'tipoSeguro' (requerido)
  message: string;              // Mensaje combinado con edad y tipo + mensaje opcional
  
  // Información de seguimiento
  source: string;               // Ej: "Landing Asesores Monterrey NYL"
  campaign: string;             // Ej: "SEM Google Ads - Asesores Seguros Monterrey"
}
```

### Valores Posibles
- **age**: `"18-25"`, `"26-35"`, `"36-45"`, `"46-55"`, `"56-65"`, `"65+"`
- **insuranceType**: `"vida"`, `"salud"`, `"educativo"`, `"retiro"`, `"varios"`

### Ejemplo de Documento
```json
{
  "name": "Carlos Rodríguez",
  "email": "carlos.rodriguez@email.com",
  "phone": "4461354113",
  "age": "26-35",
  "insuranceType": "vida",
  "message": "Edad: 26-35, Tipo de seguro: vida. Necesito cotización para proteger a mi familia",
  "type": "asesores-monterrey",
  "source": "Landing Asesores Monterrey NYL",
  "campaign": "SEM Google Ads - Asesores Seguros Monterrey",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 📊 Resumen de Tipos de Lead

| Tipo | Formulario | API | Campos Únicos |
|------|------------|-----|---------------|
| `"normal"` | Contact.astro | `/api/contact` | message |
| `"segubeca"` | ContactSeguBeca.astro | `/api/segubeca-contact` | parentName, childName, parentAge, childAge, monthlySavings, whatsapp |
| `"vida-mujer"` | vidamujerlanding | `/api/lead` | city, age, contact, notes |
| `"asesores-monterrey"` | asesores-seguros-monterrey-nyl | `/api/lead` | age, insuranceType, message (combinado) |

---

## 🔍 Consultas Firebase Útiles

### Filtrar por tipo de lead
```javascript
// Obtener solo leads de Segubeca
db.collection('leads').where('type', '==', 'segubeca')

// Obtener leads normales (formulario Contact genérico)
db.collection('leads').where('type', '==', 'normal')

// Obtener leads de formularios específicos
db.collection('leads').where('type', 'in', ['vida-mujer', 'asesores-monterrey'])

// Obtener todos los tipos de leads
db.collection('leads').where('type', 'in', ['normal', 'segubeca', 'vida-mujer', 'asesores-monterrey'])
```

### Filtrar por estado
```javascript
// Leads pendientes
db.collection('leads').where('status', '==', 'pending')

// Leads por fecha
db.collection('leads').where('timestamp', '>=', new Date('2024-01-01'))
```

### Filtrar por fuente/campaña
```javascript
// Leads de una campaña específica
db.collection('leads').where('campaign', '==', 'SEM Vida Mujer')

// Leads de una fuente específica
db.collection('leads').where('source', '==', 'Segubeca Landing')
```

---

## ⚠️ Notas Importantes

1. **Validaciones**: Cada formulario tiene validaciones específicas implementadas en su API correspondiente.

2. **Campos Opcionales**: Los campos marcados como `| null` pueden ser `null` si no se proporcionan.

3. **Mapeo de Campos**: El formulario de Asesores Monterrey envía campos en español (`nombre`, `telefono`, `edad`) pero se mapean a inglés en la estructura de Firebase.

4. **Mensaje Combinado**: En el formulario de Asesores Monterrey, el campo `message` combina la edad, tipo de seguro y mensaje opcional del usuario.

5. **Detección Automática**: La API `/api/lead` detecta automáticamente el tipo de formulario basado en los campos enviados.

6. **Campos Requeridos**: Los campos marcados como "requerido" en el HTML tienen validación tanto en frontend como backend.

Este documento se debe actualizar cada vez que se modifiquen los formularios o se agreguen nuevos campos.

---

## 🔧 Configuración de Firebase

### Colección Única
- **Nombre de la colección:** `leads`
- **Ubicación:** Firebase Firestore
- **Estructura:** Todos los tipos de formularios se almacenan en la misma colección

### Reglas de Firestore (Recomendadas)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leads/{document} {
      // Permitir lectura y escritura autenticada
      allow read, write: if request.auth != null;
      
      // O permitir escritura sin autenticación para los formularios web
      allow write: if true;
      allow read: if request.auth != null;
    }
  }
}
```

### Índices Recomendados
Para mejorar el rendimiento de las consultas, se recomienda crear estos índices compuestos:

1. **Por tipo y fecha:**
   - `type` (Ascending) + `timestamp` (Descending)

2. **Por estado y fecha:**
   - `status` (Ascending) + `timestamp` (Descending)

3. **Por fuente y fecha:**
   - `source` (Ascending) + `timestamp` (Descending)

4. **Índice completo para análisis:**
   - `type` (Ascending) + `status` (Ascending) + `timestamp` (Descending)
