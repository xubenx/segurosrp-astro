import type { APIRoute } from 'astro';
import { emptyLead, filterLeads, isLeadType } from '../../../lib/leads';
import { listLeads, persistLead } from '../../../lib/leads-store';

export const GET: APIRoute = async ({ url }) => {
  try {
    const leads = await listLeads();
    const filtered = filterLeads(leads, {
      q: url.searchParams.get('q') || '',
      status: url.searchParams.get('status') || '',
      perfil: url.searchParams.get('perfil') || '',
      type: url.searchParams.get('type') || '',
    });
    return json({ success: true, leads: filtered, total: leads.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los leads';
    return json({ success: false, message }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const type = isLeadType(body.type) ? body.type : 'manual';
    const lead = await persistLead(
      emptyLead({
        name: body.name || body.nombre,
        email: body.email,
        phone: body.phone || body.telefono || body.whatsapp,
        type,
        source: body.source || 'Manual',
        campaign: body.campaign || '',
        message: body.message || '',
        notes: body.notes || '',
        oferta: body.oferta || '',
      }),
    );
    if (!lead) return json({ success: false, message: 'No se pudo guardar el lead' }, 500);
    return json({ success: true, lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear el lead';
    return json({ success: false, message }, 400);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
