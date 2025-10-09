/**
 * Script para generar versiones móviles optimizadas de las imágenes
 * Esto reduce el peso de descarga en dispositivos móviles
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SEGUBECA_DIR = path.join(PUBLIC_DIR, 'segubecalanding_optimized');

// Definir las imágenes y sus tamaños móviles óptimos
const imagesToOptimize = [
  // Hero image - Mobile: 380px
  {
    input: path.join(SEGUBECA_DIR, 'hero.webp'),
    outputs: [
      { width: 380, suffix: '_mobile', quality: 75 },
      { width: 600, suffix: '_tablet', quality: 75 }
    ]
  },
  // Logos de universidades - Mobile: 280px
  {
    input: path.join(SEGUBECA_DIR, 'anahuac.webp'),
    outputs: [
      { width: 280, suffix: '_mobile', quality: 75 },
      { width: 348, suffix: '_tablet', quality: 75 }
    ]
  },
  {
    input: path.join(SEGUBECA_DIR, 'panamericana.webp'),
    outputs: [
      { width: 280, suffix: '_mobile', quality: 75 },
      { width: 348, suffix: '_tablet', quality: 75 }
    ]
  },
  {
    input: path.join(SEGUBECA_DIR, 'tec.webp'),
    outputs: [
      { width: 280, suffix: '_mobile', quality: 75 },
      { width: 348, suffix: '_tablet', quality: 75 }
    ]
  },
  // Imágenes de beneficios - Mobile: 160px
  {
    input: path.join(SEGUBECA_DIR, 'beneficio_1.webp'),
    outputs: [
      { width: 160, suffix: '_mobile', quality: 70 },
      { width: 186, suffix: '_tablet', quality: 70 }
    ]
  },
  {
    input: path.join(SEGUBECA_DIR, 'beneficio_2.webp'),
    outputs: [
      { width: 160, suffix: '_mobile', quality: 70 },
      { width: 186, suffix: '_tablet', quality: 70 }
    ]
  },
  {
    input: path.join(SEGUBECA_DIR, 'beneficio_3.webp'),
    outputs: [
      { width: 160, suffix: '_mobile', quality: 70 },
      { width: 186, suffix: '_tablet', quality: 70 }
    ]
  },
  {
    input: path.join(SEGUBECA_DIR, 'beneficio_4.webp'),
    outputs: [
      { width: 160, suffix: '_mobile', quality: 70 },
      { width: 186, suffix: '_tablet', quality: 70 }
    ]
  },
  // Imágenes de pasos - Mobile: 340px
  {
    input: path.join(SEGUBECA_DIR, 'paso_1.webp'),
    outputs: [
      { width: 340, suffix: '_mobile', quality: 70 },
      { width: 380, suffix: '_tablet', quality: 70 }
    ]
  },
  {
    input: path.join(SEGUBECA_DIR, 'paso_2.webp'),
    outputs: [
      { width: 340, suffix: '_mobile', quality: 70 },
      { width: 380, suffix: '_tablet', quality: 70 }
    ]
  },
  {
    input: path.join(SEGUBECA_DIR, 'paso_3.webp'),
    outputs: [
      { width: 340, suffix: '_mobile', quality: 70 },
      { width: 380, suffix: '_tablet', quality: 70 }
    ]
  },
  {
    input: path.join(SEGUBECA_DIR, 'paso_4.webp'),
    outputs: [
      { width: 340, suffix: '_mobile', quality: 70 },
      { width: 380, suffix: '_tablet', quality: 70 }
    ]
  }
];

// Logo PNG
const rp_blancos_flip = {
  input: path.join(PUBLIC_DIR, 'rp_blancos_flip.png'),
  outputs: [
    { width: 128, suffix: '_mobile', quality: 85, format: 'webp' },
    { width: 144, suffix: '_tablet', quality: 85, format: 'webp' }
  ]
};

async function optimizeImage(imageConfig) {
  const { input, outputs } = imageConfig;
  
  if (!fs.existsSync(input)) {
    console.warn(`⚠️  Imagen no encontrada: ${input}`);
    return;
  }

  console.log(`\n📸 Procesando: ${path.basename(input)}`);
  
  for (const output of outputs) {
    const { width, suffix, quality, format } = output;
    const ext = format || path.extname(input);
    const outputPath = input.replace(ext, `${suffix}${ext}`);
    
    try {
      const image = sharp(input);
      const metadata = await image.metadata();
      
      // Solo redimensionar si la imagen es más grande
      if (metadata.width > width) {
        await image
          .resize(width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality })
          .toFile(outputPath);
        
        const stats = fs.statSync(outputPath);
        const originalStats = fs.statSync(input);
        const saved = ((originalStats.size - stats.size) / 1024).toFixed(2);
        
        console.log(`  ✅ ${path.basename(outputPath)} - ${(stats.size / 1024).toFixed(2)} KB (ahorrado: ${saved} KB)`);
      } else {
        console.log(`  ⏭️  ${path.basename(input)} ya es más pequeña que ${width}px, omitiendo...`);
      }
    } catch (error) {
      console.error(`  ❌ Error procesando ${path.basename(input)}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando optimización de imágenes móviles...\n');
  
  // Verificar que sharp esté instalado
  try {
    require.resolve('sharp');
  } catch (e) {
    console.error('❌ Sharp no está instalado. Ejecuta: npm install sharp --save-dev');
    process.exit(1);
  }
  
  // Procesar todas las imágenes
  for (const imageConfig of imagesToOptimize) {
    await optimizeImage(imageConfig);
  }
  
  // Procesar el logo PNG especial
  await optimizeImage(rp_blancos_flip);
  
  console.log('\n✨ ¡Optimización completada!\n');
}

main().catch(console.error);
