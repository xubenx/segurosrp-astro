// Rate Limiter para protección contra bots y spam
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store en memoria para el rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuración del rate limiting
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 3, // Máximo 3 requests por minuto por IP
  message: 'Demasiadas solicitudes. Por favor, espera un momento antes de intentar de nuevo.',
};

// Función para limpiar entradas expiradas (ejecutar periódicamente)
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
};

// Limpiar entradas cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Extrae la IP real del request, considerando proxies y CDNs
 */
export function getClientIP(request: Request): string {
  // Headers comunes donde se almacena la IP real
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');  
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  const xClientIP = request.headers.get('x-client-ip');
  
  // Priorizar en orden de confiabilidad
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) {
    // x-forwarded-for puede contener múltiples IPs: "client, proxy1, proxy2"
    return forwardedFor.split(',')[0].trim();
  }
  if (xClientIP) return xClientIP;
  
  // Fallback para desarrollo local
  return '127.0.0.1';
}

/**
 * Verifica si una IP ha excedido el rate limit
 * @param ip - Dirección IP del cliente
 * @returns { allowed: boolean, resetTime?: number }
 */
export function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  // Si no hay entrada o ha expirado, crear nueva
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs
    });
    
    return { 
      allowed: true, 
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs
    };
  }
  
  // Si está dentro del límite, incrementar contador
  if (entry.count < RATE_LIMIT_CONFIG.maxRequests) {
    entry.count++;
    rateLimitStore.set(ip, entry);
    
    return { 
      allowed: true, 
      remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }
  
  // Límite excedido
  return { 
    allowed: false, 
    resetTime: entry.resetTime,
    remaining: 0
  };
}

/**
 * Middleware de rate limiting para APIs de Astro
 * @param request - Request de Astro
 * @returns Response si está limitado, null si puede continuar
 */
export function rateLimitMiddleware(request: Request): Response | null {
  const ip = getClientIP(request);
  const result = checkRateLimit(ip);
  
  console.log(`🔍 Rate limit check for IP ${ip}:`, result);
  
  if (!result.allowed) {
    const resetInSeconds = Math.ceil((result.resetTime! - Date.now()) / 1000);
    
    console.log(`🚫 Rate limit exceeded for IP ${ip}. Reset in ${resetInSeconds}s`);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: RATE_LIMIT_CONFIG.message,
        retryAfter: resetInSeconds
      }),
      { 
        status: 429, // Too Many Requests
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': resetInSeconds.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining!.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime!).toISOString()
        }
      }
    );
  }
  
  // Request permitido, retornar null para continuar
  return null;
}

/**
 * Función para obtener estadísticas del rate limiter (útil para debugging)
 */
export function getRateLimitStats() {
  return {
    totalIPs: rateLimitStore.size,
    entries: Array.from(rateLimitStore.entries()).map(([ip, entry]) => ({
      ip,
      count: entry.count,
      resetTime: new Date(entry.resetTime).toISOString(),
      remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count
    }))
  };
}