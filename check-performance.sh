#!/bin/bash

# Script para verificar optimizaciones de CSS y medición de performance
echo "🚀 Verificando optimizaciones de CSS..."

# Verificar tamaños de archivos CSS generados
echo "📊 Tamaños de archivos CSS:"
find dist -name "*.css" -type f -exec ls -lh {} \; | awk '{print $5 "\t" $9}'

echo ""
echo "📦 Archivos JavaScript generados:"
find dist -name "*.js" -type f -exec ls -lh {} \; | awk '{print $5 "\t" $9}'

echo ""
echo "✅ Verificaciones de optimización:"

# Verificar si hay CSS crítico inline
if grep -q "Critical CSS" dist/index.html 2>/dev/null; then
    echo "✅ CSS crítico está inline"
else
    echo "⚠️  CSS crítico no encontrado inline"
fi

# Verificar preload de recursos
if grep -q "rel=\"preload\"" dist/index.html 2>/dev/null; then
    echo "✅ Recursos críticos tienen preload"
else
    echo "⚠️  Falta preload de recursos críticos"
fi

# Verificar DNS prefetch
if grep -q "dns-prefetch" dist/index.html 2>/dev/null; then
    echo "✅ DNS prefetch configurado"
else
    echo "⚠️  DNS prefetch no configurado"
fi

# Verificar compresión
if grep -q "Cache-Control" public/_headers 2>/dev/null; then
    echo "✅ Headers de cache configurados"
else
    echo "⚠️  Headers de cache faltantes"
fi

echo ""
echo "🎯 Recomendaciones adicionales:"
echo "1. Verificar que el CSS se carga de forma asíncrona"
echo "2. Comprobar que las fuentes tienen display=swap"
echo "3. Revisar que los scripts de terceros estén diferidos"
echo "4. Asegurar que las imágenes críticas tienen loading=eager"

echo ""
echo "📈 Para medir la mejora real, usa herramientas como:"
echo "- Lighthouse (Chrome DevTools)"
echo "- WebPageTest.org"
echo "- GTmetrix"
