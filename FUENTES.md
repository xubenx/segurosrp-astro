# Guía de Fuentes del Proyecto

## Fuentes Configuradas

### 1. **Raleway** - Para Títulos y Subtítulos
- **Títulos (h1, h2)**: Raleway Extranegrita (weight: 800)
- **Subtítulos (h3, h4)**: Raleway Seminegrita (weight: 600)

### 2. **Texta** - Para Cuerpo de Texto
- **Todo el texto del cuerpo**: Texta Light (weight: 300)
- Incluye: párrafos, spans, divs, enlaces, listas, tablas, formularios, botones

## Uso en Tailwind CSS

### Clases de Fuente Disponibles

```html
<!-- Para títulos -->
<h1 class="font-heading font-extrabold">Título Principal</h1>
<h2 class="font-heading font-extrabold">Título Secundario</h2>

<!-- Para subtítulos -->
<h3 class="font-heading font-semibold">Subtítulo</h3>
<h4 class="font-heading font-semibold">Subtítulo Menor</h4>

<!-- Para cuerpo de texto -->
<p class="font-body font-light">Texto del cuerpo</p>
<span class="font-body font-light">Texto inline</span>
```

### Clases de Peso de Fuente

- `font-extrabold` - 800 (Raleway Extranegrita)
- `font-semibold` - 600 (Raleway Seminegrita)
- `font-light` - 300 (Texta Light)

## Fuentes Configuradas en Tailwind

En `tailwind.config.mjs`:

```javascript
fontFamily: {
  'sans': ['Texta', 'Jost', 'system-ui', '-apple-system', 'sans-serif'],
  'heading': ['Raleway', 'system-ui', '-apple-system', 'sans-serif'],
  'body': ['Texta', 'Jost', 'system-ui', '-apple-system', 'sans-serif'],
}
```

## Aplicación Automática

Las fuentes se aplican **automáticamente** a todos los elementos HTML:

- ✅ Todos los `<h1>`, `<h2>`, `<h5>`, `<h6>` → Raleway Extranegrita
- ✅ Todos los `<h3>`, `<h4>` → Raleway Seminegrita
- ✅ Todos los `<p>`, `<span>`, `<div>`, `<a>`, etc. → Texta Light

## Excepción: Página /segubecalanding

La página `/segubecalanding` **mantiene su estilo propio** y **NO** se ve afectada por estas fuentes globales.

Esta página utiliza la fuente **Poppins** según su configuración original.

## Archivos Modificados

1. **`/public/css/fonts.css`** - Definiciones @font-face de Raleway y Jost (locales)
2. **`/public/fonts/`** - Archivos de fuentes descargados:
   - `Raleway-ExtraBold.woff2` (weight 800)
   - `Raleway-SemiBold.woff2` (weight 600)
   - `Jost-Light.woff2` (weight 300)
3. **`/tailwind.config.mjs`** - Configuración de familias de fuentes
4. **`/src/styles/global.css`** - Estilos globales con exclusión de segubecalanding
5. **`/src/pages/segubecalanding/index.astro`** - Atributo data-page para exclusión

## Cómo Cargar Fuentes desde Google Fonts (Opcional)

Si prefieres cargar las fuentes desde Google Fonts en lugar de los archivos locales (ya descargados), puedes agregar esto en el `<head>` de tu layout:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@600;800&family=Jost:wght@300&display=swap" rel="stylesheet">
```

**Nota**: Las fuentes ya están descargadas localmente, lo cual es mejor para el rendimiento.

## Ejemplos de Uso

### Ejemplo 1: Página con Título y Texto
```html
<div class="container">
  <h1>Este es un título</h1>
  <!-- Usa automáticamente Raleway Extranegrita -->
  
  <h3>Este es un subtítulo</h3>
  <!-- Usa automáticamente Raleway Seminegrita -->
  
  <p>Este es el contenido del cuerpo.</p>
  <!-- Usa automáticamente Texta Light -->
</div>
```

### Ejemplo 2: Usando clases de Tailwind
```html
<div class="container">
  <h1 class="text-4xl font-heading font-extrabold">Título Personalizado</h1>
  <p class="text-base font-body font-light">Texto del cuerpo</p>
</div>
```

### Ejemplo 3: Sobrescribir fuentes temporalmente
```html
<!-- Si necesitas usar otra fuente en un elemento específico -->
<p class="font-sans">Este texto usará la fuente sans por defecto</p>
```

## Notas Importantes

1. **Jost** se está usando como alternativa a **Texta** (que es una fuente comercial).
2. Jost es muy similar a Texta en estilo y está disponible gratuitamente desde Google Fonts.
3. Las fuentes están alojadas **localmente** en `/public/fonts/` para mejor rendimiento.
4. Las fuentes se cargan de forma optimizada con `font-display: swap`.
5. La página segubecalanding mantiene sus fuentes Poppins originales.
6. Si más adelante consigues la fuente Texta comercial, solo necesitas:
   - Colocar `Texta-Light.woff2` en `/public/fonts/`
   - Actualizar la ruta en `/public/css/fonts.css`
