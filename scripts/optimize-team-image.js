/**
 * Script para optimizar la imagen de asesores
 * Genera múltiples versiones optimizadas: desktop, tablet, mobile y tiny
 * 
 * Uso:
 *   1. Coloca la imagen original como: public/equipo-asesores.png o .jpg
 *   2. Ejecuta: node scripts/optimize-team-image.js
 *   3. Se generarán versiones optimizadas en /public
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const INPUT_FILE = "equipo-asesores"; // sin extensión
const OUTPUT_PREFIX = "equipo-asesores";
const PUBLIC_DIR = path.resolve(__dirname, "../public");

// Versiones a generar
const VERSIONS = [
  {
    name: "desktop",
    width: 1200,
    quality: 85,
    description: "Versión desktop full HD"
  },
  {
    name: "tablet",
    width: 800,
    quality: 80,
    description: "Versión tablet y landscape mobile"
  },
  {
    name: "mobile",
    width: 600,
    quality: 75,
    description: "Versión mobile portrait"
  },
  {
    name: "tiny",
    width: 400,
    quality: 70,
    description: "Versión preview/placeholder"
  }
];

// Buscar archivo de entrada
function findInputFile() {
  const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
  
  for (const ext of extensions) {
    const filePath = path.join(PUBLIC_DIR, `${INPUT_FILE}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  return null;
}

// Optimizar imagen en múltiples versiones
async function optimizeTeamImage() {
  console.log("🚀 Iniciando optimización de imagen del equipo de asesores...\n");
  
  const inputPath = findInputFile();
  
  if (!inputPath) {
    console.error("❌ Error: No se encontró la imagen de entrada.");
    console.error(`   Coloca tu imagen como: ${PUBLIC_DIR}/${INPUT_FILE}.png o .jpg`);
    process.exit(1);
  }
  
  console.log(`📁 Imagen encontrada: ${path.basename(inputPath)}`);
  
  // Obtener metadata de la imagen original
  const metadata = await sharp(inputPath).metadata();
  console.log(`   Dimensiones originales: ${metadata.width}x${metadata.height}`);
  console.log(`   Formato: ${metadata.format}`);
  console.log(`   Tamaño: ${(fs.statSync(inputPath).size / 1024).toFixed(2)} KB\n`);
  
  // Generar cada versión
  for (const version of VERSIONS) {
    const outputName = `${OUTPUT_PREFIX}_${version.name}.webp`;
    const outputPath = path.join(PUBLIC_DIR, outputName);
    
    try {
      const info = await sharp(inputPath)
        .resize({
          width: version.width,
          height: Math.round((version.width / metadata.width) * metadata.height),
          fit: 'cover',
          position: 'center'
        })
        .webp({
          quality: version.quality,
          effort: 6 // Mayor compresión (0-6)
        })
        .toFile(outputPath);
      
      const savedSize = (info.size / 1024).toFixed(2);
      const originalSize = (fs.statSync(inputPath).size / 1024);
      const reduction = ((1 - info.size / fs.statSync(inputPath).size) * 100).toFixed(1);
      
      console.log(`✅ ${version.name.toUpperCase()} (${version.width}px)`);
      console.log(`   → ${outputName}`);
      console.log(`   → ${savedSize} KB (${reduction}% reducción)`);
      console.log(`   → ${version.description}\n`);
      
    } catch (err) {
      console.error(`❌ Error al generar versión ${version.name}:`, err.message);
    }
  }
  
  // Generar versión PNG optimizada para fallback (solo desktop)
  console.log("📦 Generando versión PNG de respaldo...");
  const pngOutputPath = path.join(PUBLIC_DIR, `${OUTPUT_PREFIX}.png`);
  
  try {
    const info = await sharp(inputPath)
      .resize({
        width: 1200,
        fit: 'cover'
      })
      .png({
        quality: 80,
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toFile(pngOutputPath);
    
    console.log(`✅ PNG generado: ${(info.size / 1024).toFixed(2)} KB\n`);
  } catch (err) {
    console.error(`❌ Error al generar PNG:`, err.message);
  }
  
  // Resumen final
  console.log("=" .repeat(60));
  console.log("✨ OPTIMIZACIÓN COMPLETADA");
  console.log("=" .repeat(60));
  console.log("\n📋 Archivos generados en /public:");
  console.log(`   • ${OUTPUT_PREFIX}_desktop.webp  (1200px - HD)`);
  console.log(`   • ${OUTPUT_PREFIX}_tablet.webp   (800px - Tablets)`);
  console.log(`   • ${OUTPUT_PREFIX}_mobile.webp   (600px - Móviles)`);
  console.log(`   • ${OUTPUT_PREFIX}_tiny.webp     (400px - Placeholder)`);
  console.log(`   • ${OUTPUT_PREFIX}.png           (Fallback PNG)`);
  
  console.log("\n🔧 Ejemplo de uso en Astro:");
  console.log(`
import { Image } from "astro:assets";

<!-- Imagen responsiva optimizada -->
<picture>
  <source 
    media="(min-width: 1024px)" 
    srcset="/equipo-asesores_desktop.webp"
    type="image/webp"
  />
  <source 
    media="(min-width: 768px)" 
    srcset="/equipo-asesores_tablet.webp"
    type="image/webp"
  />
  <source 
    media="(max-width: 767px)" 
    srcset="/equipo-asesores_mobile.webp"
    type="image/webp"
  />
  <img 
    src="/equipo-asesores.png" 
    alt="Equipo de asesores Seguros Monterrey New York Life"
    loading="lazy"
    decoding="async"
    width="1200"
    height="800"
  />
</picture>

<!-- O usando Image component de Astro -->
<Image 
  src="/equipo-asesores_desktop.webp"
  alt="Equipo de asesores certificados"
  width={1200}
  height={800}
  format="webp"
  quality={85}
  loading="lazy"
  decoding="async"
/>
  `);
  
  console.log("\n💡 Tips de implementación:");
  console.log("   • Usa fetchpriority='high' solo si es la imagen hero");
  console.log("   • Agrega loading='lazy' para imágenes below-the-fold");
  console.log("   • Considera usar blur placeholder con tiny version");
  console.log("   • Especifica width/height para evitar CLS\n");
}

// Ejecutar
optimizeTeamImage().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
