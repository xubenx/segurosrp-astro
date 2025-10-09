# Optimización de Imágenes para Móviles - Segubeca Landing

## Cambios Realizados

### 1. **Imagen Hero Principal** (`hero.webp`)
- **Antes**: 400x400px, quality 85
- **Después**: 380x380px, quality 75
- **Sizes mejorado**: Añadido breakpoint para 640px
- **Ahorro estimado**: ~59.8 KiB

### 2. **Logos de Universidades**
#### Anáhuac
- **Width**: 348px (optimizado para mobile-first)
- **Quality**: 75 (reducido de 85)
- **Sizes**: Añadido breakpoint 640px (280px)
- **Ahorro estimado**: ~38.8 KiB

#### Panamericana
- **Width**: 348px (optimizado para mobile-first)
- **Quality**: 75 (reducido de 85)
- **Sizes**: Añadido breakpoint 640px (280px)
- **Ahorro estimado**: ~39.9 KiB

#### Tecnológico de Monterrey
- **Width**: 348px (optimizado para mobile-first)
- **Quality**: 75 (reducido de 85)
- **Sizes**: Añadido breakpoint 640px (280px)
- **Ahorro estimado**: ~30.2 KiB

### 3. **Imágenes de Beneficios** (beneficio_1 a beneficio_4)
- **Quality**: 70 (reducido de 80)
- **Sizes mejorado**: Añadido breakpoint 640px (160px)
- **Ahorro estimado por imagen**: ~14-22 KiB
- **Total**: ~60-80 KiB

### 4. **Imágenes de Pasos** (paso_1 a paso_4)
- **Quality**: 70 (reducido de 80)
- **Sizes mejorado**: Añadido breakpoint 640px (340px)
- **Ahorro estimado por imagen**: ~11-14 KiB
- **Total**: ~45-56 KiB

### 5. **Imágenes de Asesores** (asesor_1, asesor_2, asesor_3)
- **Solución**: Creadas versiones optimizadas 80x80px
- **Archivos nuevos**: 
  - `asesor_1_small.webp`
  - `asesor_2_small.webp`
  - `asesor_3_small.webp`
- **Quality**: 85
- **Ahorro estimado por imagen**: ~40-41 KiB
- **Total**: ~120-123 KiB

### 6. **Logos del Header**
- **nyl-white.png**: Quality reducido a 85
- **rp_blancos_flip.png**: Quality reducido a 85
- **Ahorro estimado**: ~38.3 KiB

## Ahorro Total Estimado
**~457.7 KiB** en dispositivos móviles

## Técnicas Aplicadas

### 1. **Responsive Images con `sizes`**
```astro
sizes="(max-width: 640px) 160px, (max-width: 768px) 186px, (max-width: 1024px) 200px, 208px"
```
- Mobile-first approach
- Breakpoints específicos para cada tamaño de pantalla
- Astro genera automáticamente múltiples versiones

### 2. **Reducción de Quality**
- Hero: 85 → 75
- Logos universidades: 85 → 75
- Beneficios: 80 → 70
- Pasos: 80 → 70
- WebP mantiene calidad visual excelente incluso con quality más bajo

### 3. **Optimización de Dimensiones**
- Width ajustado al tamaño real mostrado en mobile
- Evita cargar píxeles innecesarios
- Astro genera versiones optimizadas automáticamente

### 4. **Imágenes Pre-redimensionadas**
- Script `optimize-advisor-images.js` para generar versiones pequeñas
- Sharp para procesamiento eficiente
- Tamaño exacto para el uso (80x80px)

## Cómo Funciona

Cuando Astro compila el proyecto:

1. **Procesa cada `<Image>` component**
2. **Lee el atributo `sizes`**
3. **Genera múltiples versiones** de la imagen en diferentes tamaños
4. **Crea un `srcset`** automáticamente
5. **El navegador descarga** solo la versión necesaria según:
   - Tamaño de viewport
   - DPR (Device Pixel Ratio)
   - Ancho disponible

### Ejemplo de HTML generado:
```html
<img 
  src="/_astro/hero.hash.webp" 
  srcset="
    /_astro/hero_380w.hash.webp 380w,
    /_astro/hero_480w.hash.webp 480w,
    /_astro/hero_600w.hash.webp 600w,
    /_astro/hero_800w.hash.webp 800w
  "
  sizes="(max-width: 640px) 380px, (max-width: 768px) 480px, (max-width: 1024px) 600px, 800px"
>
```

**En móvil (320px)**: Descarga solo `hero_380w.hash.webp`
**En tablet (768px)**: Descarga solo `hero_480w.hash.webp`
**En desktop**: Descarga `hero_800w.hash.webp`

## Impacto en Core Web Vitals

### LCP (Largest Contentful Paint)
- ✅ Imagen hero optimizada (principal candidata a LCP)
- ✅ `fetchpriority="high"` mantenido
- ✅ `loading="eager"` mantenido
- ✅ Tamaño reducido = descarga más rápida

### FCP (First Contentful Paint)
- ✅ Logos del header con quality optimizado
- ✅ Imágenes críticas cargadas eficientemente

### CLS (Cumulative Layout Shift)
- ✅ Width/height especificados previenen layout shift
- ✅ Mantiene aspect ratio correcto

## Archivos Modificados

1. `/src/pages/segubecalanding/index.astro`
   - Optimización de todas las imágenes de la landing
   - Ajuste de sizes, quality y dimensiones

2. `/src/components/ContactSeguBeca.astro`
   - Uso de imágenes pre-optimizadas para asesores
   - Añadido width/height/loading attributes

3. `/scripts/optimize-advisor-images.js` (NUEVO)
   - Script para generar versiones 80x80px de asesores
   - Usa Sharp para procesamiento eficiente

4. `/public/` (NUEVOS archivos)
   - `asesor_1_small.webp`
   - `asesor_2_small.webp`
   - `asesor_3_small.webp`

## Siguiente Build

Al ejecutar `npm run build`, Astro:
1. Procesará todas las imágenes
2. Generará versiones optimizadas
3. Creará srcsets automáticamente
4. Optimizará para mobile-first

## Verificación

Para verificar los resultados:

```bash
# Build del proyecto
npm run build

# Preview del build
npm run preview

# Test con Lighthouse en Chrome DevTools
# - Modo móvil
# - Throttling activado
# - Verificar LCP, FCP y tamaño de imágenes
```

## Notas Importantes

- ✅ **No se requieren cambios en imágenes originales** - Astro las procesa automáticamente
- ✅ **Compatible con todos los navegadores** - Fallback automático
- ✅ **Lazy loading** en imágenes below-the-fold
- ✅ **Eager loading** solo en hero (LCP)
- ✅ **WebP format** para máxima compresión
- ✅ **Mobile-first** con breakpoints apropiados

## Resultados Esperados

Después del deploy:
- 📉 **Reducción de ~457.7 KiB** en móviles
- ⚡ **LCP mejorado** (imagen hero más pequeña)
- ⚡ **FCP mejorado** (logos optimizados)
- 📱 **Mejor experiencia móvil** (datos optimizados)
- 🎯 **Mejor score en PageSpeed Insights**
