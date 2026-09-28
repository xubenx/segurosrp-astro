import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../lib/blog-collection';
import { SITE_URL } from '../lib/blog';

const BASE = `# SegurosRP — Ramírez & Plascencia
> Despacho independiente de asesores certificados de Seguros Monterrey New York Life en México. Fundado en 1998 en Querétaro. Oficinas en Santiago de Querétaro, Qro. y Celaya, Gto. Servicio nacional por videollamada y WhatsApp. Especialistas en seguro de vida, gastos médicos mayores, planes de retiro y seguros educativos (SeguBeca).

## Sobre el despacho

Ramírez & Plascencia es un despacho de asesores independientes certificados por la Comisión Nacional de Seguros y Fianzas (CNSF), con más de 25 años de experiencia asesorando a familias y empresas en México. Comercializamos exclusivamente productos de Seguros Monterrey New York Life, una de las aseguradoras más sólidas de México con respaldo internacional.

## Productos que asesoramos

- **Seguro de vida individual**: Imagina Ser, Orvi, Nuevo Plenitud, Vida Mujer, Star Dotal
- **Seguro educativo**: SeguBeca — garantiza la educación de los hijos ante fallecimiento o invalidez del padre/madre
- **Gastos médicos mayores**: Alfa Medical, Alfa Medical Flex, Alfa Medical Internacional
- **Plan de retiro**: Imagina Ser, Nuevo Plenitud — con rendimientos garantizados y componente de protección

## Páginas clave

- [Inicio](${SITE_URL}/): Página principal del despacho
- [Blog](${SITE_URL}/blog): Guías de seguros de vida, salud, retiro y educación
- [Beneficios del Seguro de Vida](${SITE_URL}/beneficios-seguro-de-vida/): Guía completa de coberturas de vida con FAQ
- [Plan de Retiro](${SITE_URL}/plan-de-retiro-seguros-monterrey/): Planes Imagina Ser y Nuevo Plenitud
- [Seguros en Querétaro](${SITE_URL}/seguros-monterrey-en-queretaro/): Oficina y servicio local en Querétaro
- [Seguros en Celaya](${SITE_URL}/seguros-monterrey-en-celaya-gto/): Oficina y servicio local en Celaya, Gto.
- [Alfa Medical](${SITE_URL}/seguros-salud/alfa-medical/): Seguro de gastos médicos con cobertura de maternidad
- [Alfa Medical Flex](${SITE_URL}/seguros-salud/alfa-medical-flex/): GMM con libre elección de hospital
- [Alfa Medical Internacional](${SITE_URL}/seguros-salud/alfa-medical-internacional/): GMM con cobertura mundial
- [Seguro de Vida para Mujer](${SITE_URL}/seguro-de-vida-mujer/): Vida Mujer especializado
- [Asesores Certificados](${SITE_URL}/asesores-seguros-monterrey/): Información del equipo asesor
- [Nosotros](${SITE_URL}/nosotros/): Historia, misión y equipo del despacho
`;

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const blogSection =
    posts.length === 0
      ? ''
      : `
## Artículos del blog

${posts
  .map(
    (post) =>
      `- [${post.title}](${SITE_URL}/blog/${post.slug}): ${post.description}`,
  )
  .join('\n')}
`;

  const footer = `
## Contacto y ubicaciones

- Teléfono / WhatsApp: +52 446 135 4113
- Email: info@segurosrp.com
- Querétaro: Nouvalia, Local 106 Planta Baja, Piso 6, Santiago de Querétaro, Qro.
- Celaya: Av. Ferrocarril Central #709, Planta Baja, Local 22, Los Laureles, Celaya, Gto.
- Horario: Lunes a viernes 9:00–18:00

## Redes sociales

- Facebook: https://www.facebook.com/segurosrp/
- Instagram: https://www.instagram.com/ramirezplascencia_/
- LinkedIn: https://www.linkedin.com/company/ramirez-plascencia-despacho-de-seguros/
- YouTube: https://www.youtube.com/channel/UCkQ6zjjpXuHfIrRS1MFFIJA
`;

  return new Response(`${BASE}${blogSection}${footer}`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
