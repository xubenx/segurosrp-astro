# Landing Page SEM - Asesores Seguros Monterrey New York Life

## 📍 URL de la Landing Page
`https://mnyl.com.mx/asesores-seguros-monterrey-nyl/`

## 🎯 Palabras Clave Objetivo
- **Principal:** "asesores seguros monterrey"
- **Secundarias:** 
  - "seguros monterrey asesores"
  - "new york life monterrey"
  - "seguros vida monterrey"
  - "asesores seguros new york life"
  - "cotizar seguro monterrey"

## 📱 Elementos Optimizados para Conversión

### 1. Hero Section
- **Título principal:** "Asesores Seguros Monterrey New York Life"
- **CTA primario:** "Cotizar Ahora GRATIS"
- **CTA secundario:** "Llamar Asesor" con número directo

### 2. Formulario de Cotización
- **ID:** `#cotizar`
- **Campos capturados:** Nombre, Teléfono, Email, Edad, Tipo de seguro
- **Tracking:** Formulario envía datos a `/api/contact` con source tracking

### 3. Llamadas a la Acción (CTAs)
- **Primario:** Botones naranjas "Cotizar Ahora GRATIS"
- **Secundario:** Botones azules para llamadas telefónicas
- **Teléfono:** +52 (81) 8388-6050

## 🔍 SEO y Tracking

### Meta Tags Optimizados
- **Title:** "Asesores Seguros Monterrey - New York Life | Seguros RP"
- **Description:** "Asesores especializados en seguros Monterrey New York Life. Protección de vida, salud y patrimonio. Cotiza gratis con expertos certificados en seguros."
- **Keywords:** Incluye todas las palabras clave objetivo

### Schema.org Implementado
- **LocalBusiness** para SEO local
- **ProfessionalService** para servicios profesionales
- **Offer** para cotización gratuita

### Tracking de Conversiones
```javascript
// Para implementar en Google Ads
window.trackConversion = function(value = 1.0) {
  gtag('event', 'conversion', {
    'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL',
    'value': value,
    'currency': 'MXN'
  });
};
```

## 📊 Eventos de Conversión para Google Ads

### 1. Conversión Principal - Formulario Completado
- **Trigger:** Envío exitoso del formulario de cotización
- **Valor:** $1.00 MXN (ajustar según LTV del cliente)

### 2. Micro-Conversiones
- **Llamada telefónica:** Click en números de teléfono
- **Scroll al formulario:** Usuario llega a la sección de cotización
- **Tiempo en página:** >2 minutos

## 🎨 Elementos de Confianza

### Testimonios
- 3 testimonios de clientes reales con calificaciones 5 estrellas
- Fotos de perfil y nombres

### Credenciales
- Logo New York Life prominente
- "175+ años de experiencia"
- "Más de 1,000 familias protegidas"

### Asesores
- 3 perfiles de asesores con fotos profesionales
- Especialidades específicas
- Botones directos de contacto

## 📱 Optimización Mobile

### Responsive Design
- Hero section adaptativo
- Formulario optimizado para móvil
- Botones de llamada prominentes en mobile

### Velocidad
- Imágenes optimizadas (.webp)
- CSS/JS minificado
- Lazy loading implementado

## 🎯 Configuración Recomendada para Google Ads

### Tipos de Campaña
1. **Búsqueda:** Palabras clave específicas
2. **Display:** Remarketing para visitantes
3. **Local:** Geo-targeting Monterrey y área metropolitana

### Palabras Clave Negativas
- gratis total
- sin costo
- barato
- low cost

### Extensiones Recomendadas
- **Sitelinks:** /seguros-vida/, /seguros-salud/, /contacto
- **Llamada:** +52 (81) 8388-6050
- **Ubicación:** Oficinas en Monterrey
- **Precio:** "Cotización gratuita"

## 📈 KPIs a Monitorear

### Conversiones
- Formularios completados
- Llamadas telefónicas
- Tiempo en página
- Bounce rate

### Calidad
- Quality Score de palabras clave
- CTR de anuncios
- Costo por conversión

### ROI
- LTV/CAC ratio
- Conversión a cliente
- Revenue por lead

## 🛠️ Próximos Pasos

1. **Configurar Google Ads Conversion Tracking**
   - Reemplazar `AW-CONVERSION_ID/CONVERSION_LABEL` con IDs reales
   - Implementar píxel de Facebook si se usará

2. **A/B Testing**
   - Probar diferentes headlines
   - Variaciones del formulario
   - Diferentes ofertas (consulta vs cotización)

3. **Seguimiento Post-Conversión**
   - Integrar con CRM
   - Email marketing automático
   - Seguimiento telefónico

## 📞 Contacto Técnico
Para modificaciones o optimizaciones adicionales de la landing page, revisar:
- `/src/pages/asesores-seguros-monterrey-nyl/index.astro`
- `/src/components/SEMTracking.astro`
- `/src/pages/api/contact.ts`
