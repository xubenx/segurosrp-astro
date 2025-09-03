#!/bin/bash
# Build script específico para Vercel

echo "🚀 Iniciando build para Vercel..."

# Limpiar directorio de build anterior
rm -rf dist/

# Instalar dependencias asegurando versiones correctas
npm ci

# Build del proyecto
npm run build

# Verificar que los archivos CSS se generaron
if [ -d "dist/_astro" ]; then
    echo "✅ Archivos CSS generados correctamente:"
    ls -la dist/_astro/*.css
else
    echo "❌ Error: No se encontraron archivos CSS"
    exit 1
fi

echo "✅ Build completado exitosamente"
