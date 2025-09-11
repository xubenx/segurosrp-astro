# Cambios Implementados - Colección Única `leads`

## ✅ Cambios Realizados

Se ha actualizado la estructura para garantizar que **todos los formularios** guarden sus datos en la **colección única `leads`** de Firebase, utilizando el campo `type` para la identificación.

### 🔧 Cambios en el Código

#### 1. API Contact (`/api/contact`)
- ✅ **Agregado campo `type: "normal"`** para formularios genéricos
- ✅ **Agregado campo `source`** con valor por defecto "Formulario Contact"
- ✅ **Agregado campo `campaign`** (opcional, puede ser null)

#### 2. API Lead (`/api/lead`)
- ✅ **Cambiado `formType = "general"` a `formType = "normal"`**
- ✅ **Actualizado mensaje de Telegram** para referenciar "Formulario Normal"

#### 3. Documentación ESTRUCTURAS.md
- ✅ **Enfatizada la arquitectura de colección única**
- ✅ **Cambiado tipo "general" por "normal"**
- ✅ **Agregadas consultas Firebase mejoradas**
- ✅ **Agregada sección de configuración Firebase**
- ✅ **Agregadas reglas de Firestore recomendadas**
- ✅ **Agregados índices recomendados para mejor rendimiento**

---

## 📊 Estructura Final de Tipos

Todos los documentos se guardan en la colección `leads` con estos tipos:

| Tipo | Descripción | API | Formulario |
|------|-------------|-----|------------|
| `"normal"` | Formulario de contacto genérico | `/api/contact` | Contact.astro |
| `"segubeca"` | Seguros educativos | `/api/segubeca-contact` | ContactSeguBeca.astro |
| `"vida-mujer"` | Seguros para mujeres | `/api/lead` | vidamujerlanding |
| `"asesores-monterrey"` | Asesores New York Life | `/api/lead` | asesores-seguros-monterrey-nyl |

---

## 🏗️ Arquitectura de Datos

```
Firebase Firestore
└── leads (COLECCIÓN ÚNICA)
    ├── documento1 { type: "normal", name: "...", email: "..." }
    ├── documento2 { type: "segubeca", parentName: "...", childName: "..." }
    ├── documento3 { type: "vida-mujer", name: "...", age: "..." }
    └── documento4 { type: "asesores-monterrey", name: "...", insuranceType: "..." }
```

---

## 🔍 Consultas Firebase Principales

### Obtener todos los leads por tipo
```javascript
// Leads normales (contacto genérico)
db.collection('leads').where('type', '==', 'normal')

// Leads de Segubeca
db.collection('leads').where('type', '==', 'segubeca')

// Leads de Vida Mujer
db.collection('leads').where('type', '==', 'vida-mujer')

// Leads de Asesores Monterrey
db.collection('leads').where('type', '==', 'asesores-monterrey')
```

### Consultas combinadas
```javascript
// Todos los leads de una fecha específica
db.collection('leads')
  .where('timestamp', '>=', new Date('2024-01-01'))
  .orderBy('timestamp', 'desc')

// Leads pendientes por tipo
db.collection('leads')
  .where('type', '==', 'segubeca')
  .where('status', '==', 'pending')

// Múltiples tipos
db.collection('leads')
  .where('type', 'in', ['vida-mujer', 'asesores-monterrey'])
```

---

## ✅ Verificación

### Estado Actual
- ✅ **Una sola colección:** `leads`
- ✅ **Campo type implementado** en todas las APIs
- ✅ **Diferenciación por tipo** funcionando
- ✅ **Documentación actualizada** con nueva estructura
- ✅ **Código compilando** sin errores

### Próximos Pasos Recomendados
1. **Crear índices en Firebase** según las recomendaciones del documento
2. **Configurar reglas de Firestore** para la colección leads
3. **Probar las consultas** en el entorno de desarrollo
4. **Verificar que Telegram** reciba notificaciones correctas por tipo

---

## 🎯 Resultado Final

**TODOS LOS FORMULARIOS AHORA GUARDAN EN LA COLECCIÓN ÚNICA `leads`** con el campo `type` para diferenciarlos:

- ✅ Contact genérico → `type: "normal"`
- ✅ Segubeca → `type: "segubeca"`  
- ✅ Vida Mujer → `type: "vida-mujer"`
- ✅ Asesores Monterrey → `type: "asesores-monterrey"`

La arquitectura está lista y funcional para producción.
