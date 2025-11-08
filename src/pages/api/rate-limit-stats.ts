import type { APIRoute } from 'astro';
import { getRateLimitStats } from '../../lib/rate-limiter';

// API para ver estadísticas del rate limiter (solo para debugging)
export const GET: APIRoute = async ({ request }) => {
  // En producción, podrías querer agregar autenticación aquí
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  
  // Simple protección para que no cualquiera pueda ver las stats
  if (secret !== 'debug-rate-limit-2024') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const stats = getRateLimitStats();
    
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        rateLimitStats: stats
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};