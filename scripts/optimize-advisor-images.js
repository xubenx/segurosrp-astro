import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const advisorImages = [
  { input: 'asesor_1.webp', output: 'asesor_1_small.webp' },
  { input: 'asesor_2.webp', output: 'asesor_2_small.webp' },
  { input: 'asesor_3.webp', output: 'asesor_3_small.webp' }
];

async function optimizeAdvisorImages() {
  console.log('🖼️  Optimizando imágenes de asesores...\n');

  for (const { input, output } of advisorImages) {
    const inputPath = join(publicDir, input);
    const outputPath = join(publicDir, output);

    try {
      await sharp(inputPath)
        .resize(80, 80, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(outputPath);

      console.log(`✅ Optimizada: ${input} → ${output} (80x80px)`);
    } catch (error) {
      console.error(`❌ Error procesando ${input}:`, error.message);
    }
  }

  console.log('\n✨ ¡Optimización completada!');
}

optimizeAdvisorImages().catch(console.error);
