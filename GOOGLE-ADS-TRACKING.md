# Google Ads Tracking - Segubeca Landing Page

## Resumen de Implementación

Se han implementado eventos de seguimiento de Google Analytics 4 (GA4) para rastrear conversiones de Google Ads en la landing page de Segubeca.

## Conversiones Implementadas (CPA - Costo por Adquisición)

### 1. `segubeca_form` - Envío de formulario de contacto
**Ubicación:** `/src/components/ContactSeguBeca.astro`  
**Tipo:** Submit lead forms (Secondary action)  
**Valor:** MX$1  
**Cuándo se dispara:** Cuando un usuario completa y envía el formulario de contacto con todos los datos requeridos.

```javascript
window.gtag('event', 'segubeca_form', {
  event_category: 'conversion',
  event_label: 'Segubeca Contact Form Submit',
  value: 1,
  currency: 'MXN'
});
```

**Campos del formulario:**
- Nombre del padre/madre
- Nombre del hijo/a
- Edad del padre/madre
- Edad del hijo/a
- Ahorro mensual deseado
- Email
- WhatsApp

### 2. `segubeca_whatsapp` - Click en botón de WhatsApp
**Ubicación:** `/src/components/ContactSeguBeca.astro`  
**Tipo:** Contact via WhatsApp (Secondary action)  
**Valor:** MX$1  
**Cuándo se dispara:** Cuando un usuario hace clic en el botón "Chatear por WhatsApp" en la sección de contacto.

```javascript
window.gtag('event', 'segubeca_whatsapp', {
  event_category: 'conversion',
  event_label: 'Segubeca WhatsApp Contact',
  value: 1,
  currency: 'MXN'
});
```

**Mensaje predefinido de WhatsApp:**
"Hola, me interesa conocer más sobre Segubeca para asegurar la educación de mi hijo"

---

## Eventos de Engagement (NO son conversiones CPA)

Estos eventos rastrean la interacción del usuario con la página pero **NO cuentan como conversiones** para el CPA.

### 1. `click_cta_hero` - Click en CTA del Hero
**Ubicación:** Sección Hero (parte superior de la página)  
**Botón:** "🎓 Quiero asegurar su educación"

```javascript
window.gtag('event', 'click_cta_hero', {
  event_category: 'engagement',
  event_label: 'Hero CTA - Quiero asegurar su educación',
  button_location: 'hero_section'
});
```

### 2. `click_cta_universities` - Click en CTA de Universidades
**Ubicación:** Sección de universidades participantes  
**Botón:** "🛡️ Proteger su futuro ahora"

```javascript
window.gtag('event', 'click_cta_universities', {
  event_category: 'engagement',
  event_label: 'Universities Section CTA - Proteger su futuro',
  button_location: 'universities_section'
});
```

### 3. `click_cta_steps` - Click en CTA de Pasos
**Ubicación:** Sección "¿Cómo funciona Segubeca?"  
**Botón:** "🚀 Empezar mi plan ahora"

```javascript
window.gtag('event', 'click_cta_steps', {
  event_category: 'engagement',
  event_label: 'Steps Section CTA - Empezar mi plan',
  button_location: 'steps_section'
});
```

### 4. `generate_lead` - Generación de lead (evento adicional)
**Cuándo se dispara:** Al mismo tiempo que `segubeca_form` como evento complementario de tracking.

```javascript
window.gtag('event', 'generate_lead', {
  event_category: 'engagement',
  event_label: 'Segubeca Form',
  form_name: 'Segubeca Contact Form'
});
```

---

## Configuración en Google Ads

### Para crear las conversiones en Google Ads:

1. **Ir a Google Ads → Herramientas y configuración → Medición → Conversiones**

2. **Crear nueva conversión:**
   - Fuente: Google Analytics (GA4)
   - Plataforma: Website
   - Evento GA4: `segubeca_form` o `segubeca_whatsapp`
   - Propiedad GA4: `segurosrp`

3. **Configuración de conversión:**
   - **Nombre:** `segurosrp (web) segubeca_form` o `segurosrp (web) segubeca_whatsapp`
   - **Optimización de acción:** Submit lead forms (Secondary action)
   - **Valor:** Usar el valor de GA4. Si no hay valor, usar MX$1
   - **Recuento:** Every conversion (Cada conversión)
   - **Ventana de conversión:** Recomendado 30 días

---

## Verificación

### Cómo verificar que los eventos se están enviando:

1. **En el navegador (Chrome DevTools):**
   - Abrir DevTools (F12)
   - Ir a la pestaña "Network"
   - Filtrar por "google-analytics" o "collect"
   - Realizar la acción (enviar formulario o hacer clic en WhatsApp)
   - Verificar que se envíe una petición con el evento correspondiente

2. **En Google Analytics 4:**
   - Ir a Informes → Tiempo real
   - Realizar la acción en la página
   - Ver el evento aparecer en tiempo real

3. **Con Google Tag Assistant:**
   - Instalar la extensión Google Tag Assistant
   - Activarla en la página de Segubeca
   - Realizar las acciones
   - Verificar que los eventos se registren correctamente

---

## Archivos Modificados

1. `/src/components/ContactSeguBeca.astro`
   - Agregado evento `segubeca_form` al envío exitoso del formulario
   - Agregado evento `segubeca_whatsapp` al botón de WhatsApp
   - Agregado evento `generate_lead` como tracking adicional

2. `/src/pages/segubecalanding/index.astro`
   - Agregados eventos de engagement a todos los botones CTA
   - Tracking de clicks en botones sin contar como conversión

---

## Flujo de Usuario → Conversión

### Ruta 1: Formulario de Contacto
1. Usuario llega a la landing page
2. Hace clic en cualquier botón CTA → `click_cta_*` (engagement)
3. Completa el formulario
4. Envía el formulario → `segubeca_form` ✅ **CONVERSIÓN**
5. También se dispara → `generate_lead` (engagement adicional)

### Ruta 2: WhatsApp Directo
1. Usuario llega a la landing page
2. Hace scroll hasta la sección de contacto
3. Hace clic en "Chatear por WhatsApp" → `segubeca_whatsapp` ✅ **CONVERSIÓN**
4. Se abre WhatsApp con mensaje predefinido

---

## Notas Importantes

- ✅ Los eventos `segubeca_form` y `segubeca_whatsapp` son las **únicas conversiones** que cuentan para CPA
- ✅ Los eventos de `click_cta_*` son solo para **tracking y análisis de comportamiento**
- ✅ El valor por defecto de cada conversión es **MX$1**
- ✅ Todas las conversiones se cuentan como **"Every conversion"** (cada una cuenta)
- ✅ Los eventos están integrados con **Google Analytics 4 (GA4)**
- ✅ Compatible con **Google Tag Manager (GTM-5C5DGHJC)** ya instalado

---

## Próximos Pasos

1. Verificar en Google Analytics 4 que los eventos se estén registrando
2. Crear las conversiones en Google Ads desde GA4
3. Vincular las conversiones a las campañas de Google Ads
4. Configurar la estrategia de puja basada en conversiones
5. Monitorear y optimizar según el rendimiento

---

**Fecha de implementación:** 9 de octubre de 2025  
**Desarrollador:** GitHub Copilot  
**ID de Google Tag Manager:** GTM-5C5DGHJC  
**ID de Google Analytics 4:** G-Y67F0BJRHL
