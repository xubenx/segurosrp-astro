import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../lib/blog-collection';
import { SITE_URL } from '../lib/blog';

const BASE = `# SegurosRP — Ramírez & Plascencia
> Despacho independiente de asesores certificados de Seguros Monterrey New York Life, con más de 30 años de experiencia. Cobertura en todo México (nacional), no limitada a una ciudad. Oficinas en Santiago de Querétaro, Qro. y Celaya, Gto.; el resto del país se atiende por videollamada y WhatsApp. Especialistas en seguro de vida, gastos médicos mayores, planes de retiro y seguros educativos (SeguBeca).

## Sobre el despacho

Ramírez & Plascencia es un despacho de asesores independientes certificados por la Comisión Nacional de Seguros y Fianzas (CNSF), con más de 30 años de experiencia asesorando a familias y empresas en todo México. Comercializamos exclusivamente productos de Seguros Monterrey New York Life, una de las aseguradoras más sólidas de México con respaldo internacional. «Monterrey» es la marca de la aseguradora, no una plaza: el despacho atiende clientes en todo el país.

## Productos que asesoramos

- **Seguro de vida individual**: Imagina Ser, Orvi, Nuevo Plenitud, Vida Mujer, Star Dotal
- **Seguro educativo**: SeguBeca — garantiza la educación de los hijos ante fallecimiento o invalidez del padre/madre
- **Gastos médicos mayores**: Alfa Medical, Alfa Medical Flex, Alfa Medical Internacional
- **Plan de retiro**: Imagina Ser, Nuevo Plenitud — con rendimientos garantizados y componente de protección

## Páginas clave

- [Inicio](${SITE_URL}/): Asesores certificados de Seguros Monterrey New York Life con cobertura en todo México
- [Asesores Seguros Monterrey NYL](${SITE_URL}/asesores-seguros-monterrey-nyl): Asesoría y cotización de vida, salud y educación con asesores certificados
- [Asesores Certificados](${SITE_URL}/asesores-seguros-monterrey/): Información del equipo asesor
- [Contacto](${SITE_URL}/contacto): Teléfono, WhatsApp y oficinas; atención en todo México
- [Diagnóstico patrimonial](${SITE_URL}/diagnostico): Preguntas en 2 minutos y cifra personalizada, sin costo
- [Blog](${SITE_URL}/blog): Guías de seguros de vida, salud, retiro y educación
- [Beneficios del Seguro de Vida](${SITE_URL}/beneficios-seguro-de-vida/): Guía completa de coberturas de vida con FAQ
- [Plan de Retiro](${SITE_URL}/plan-de-retiro-seguros-monterrey/): Planes Imagina Ser y Nuevo Plenitud
- [SeguBeca](${SITE_URL}/seguros-vida/segubeca): Seguro educativo para la universidad de los hijos, con vida e invalidez
- [Vida Mujer](${SITE_URL}/seguros-vida/vida-mujer): Seguro de vida para la mujer, con ahorro y coberturas de salud femenina
- [Seguro de Vida para Mujer](${SITE_URL}/seguro-de-vida-mujer/): Guía de Vida Mujer con preguntas frecuentes
- [Seguros en Querétaro](${SITE_URL}/seguros-monterrey-en-queretaro/): Oficina en Santiago de Querétaro; la asesoría también es nacional
- [Seguros en Celaya](${SITE_URL}/seguros-monterrey-en-celaya-gto/): Oficina en Celaya, Guanajuato; la asesoría también es nacional
- [Alfa Medical](${SITE_URL}/seguros-salud/alfa-medical/): Seguro de gastos médicos con cobertura de maternidad
- [Alfa Medical Flex](${SITE_URL}/seguros-salud/alfa-medical-flex/): GMM con libre elección de hospital
- [Alfa Medical Internacional](${SITE_URL}/seguros-salud/alfa-medical-internacional/): GMM con cobertura mundial
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
- Email: michelle@segurosrp.com
- Querétaro: Nouvalia, Local 106 Planta Baja, Piso 6, Santiago de Querétaro, Qro.
- Celaya: Av. Ferrocarril Central #709, Planta Baja, Local 22, Los Laureles, Celaya, Gto.
- Horario: Lunes a viernes 9:00–18:00

## Redes sociales

- Facebook: https://www.facebook.com/segurosrp/
- Instagram: https://www.instagram.com/ramirezplascencia_/
- LinkedIn: https://www.linkedin.com/company/ramirez-plascencia-despacho-de-seguros/
- YouTube: https://www.youtube.com/channel/UCkQ6zjjpXuHfIrRS1MFFIJA

## Autorización CNSF

Agente de seguros autorizado por la CNSF — José Ramírez Barajas, Cédula H415872, Tipo A (Riesgos personales y familiares), vigente hasta 04/05/2029.
`;

  return new Response(`${BASE}${blogSection}${footer}`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
