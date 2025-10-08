/**
 * Script para optimizar todas las imágenes de /public/segubecalanding
 * Convierte PNG/JPG a WebP, ajusta tamaño máximo y guarda optimizadas.
 * 
 * Ejecutar con:
 *    node scripts/optimize-images.js
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

// Carpeta de imágenes
const inputDir = path.resolve("public/segubecalanding");
const outputDir = path.resolve("public/segubecalanding_optimized");

// Tamaño máximo por tipo
const maxSizes = {
  hero: 1200,        // imágenes grandes (portadas)
  section: 800,      // imágenes medianas
  icon: 380,         // imágenes pequeñas o íconos
};

// Extensiones soportadas
const validExt = [".jpg", ".jpeg", ".png", ".webp"];

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

async function optimizeImage(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (!validExt.includes(ext)) return;

  // Detectar tipo por nombre
  let size = maxSizes.section;
  if (fileName.includes("hero")) size = maxSizes.hero;
  else if (fileName.includes("icon") || fileName.includes("logo") || fileName.includes("beneficio")) size = maxSizes.icon;

  const outputName = fileName.replace(ext, ".webp");
  const outputPath = path.join(outputDir, outputName);

  try {
    await sharp(filePath)
      .resize({ width: size })
      .webp({ quality: 75 })
      .toFile(outputPath);

    console.log(`✅ ${fileName} optimizada → ${outputName}`);
  } catch (err) {
    console.error(`❌ Error al optimizar ${fileName}:`, err);
  }
}

async function run() {
  const files = fs.readdirSync(inputDir);

  console.log("🚀 Iniciando optimización de imágenes...\n");

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    await optimizeImage(filePath, file);
  }

  console.log("\n✨ Optimización completada. Imágenes guardadas en:");
  console.log(outputDir);
}

run();
