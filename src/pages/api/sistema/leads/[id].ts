import type { APIRoute } from 'astro';
import { isLeadStatus } from '../../../../lib/leads';
import { addLeadFollowup, getLead, updateLeadFields } from '../../../../lib/leads-store';

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ success: false, message: 'Falta el id' }, 400);
  const lead = await getLead(id);
  if (!lead) return json({ success: false, message: 'Lead no encontrado' }, 404);
  return json({ success: true, lead });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ success: false, message: 'Falta el id' }, 400);
  try {
    const body = await request.json();
    if (typeof body.followup === 'string' && body.followup.trim()) {
      const lead = await addLeadFollowup(id, body.followup, body.author || 'equipo');
      return json({ success: true, lead });
    }
    const patch: Record<string, unknown> = {};
    if (isLeadStatus(body.status)) patch.status = body.status;
    if (typeof body.notes === 'string') patch.notes = body.notes;
    if (typeof body.name === 'string') patch.name = body.name;
    if (typeof body.email === 'string') patch.email = body.email;
    if (typeof body.phone === 'string') patch.phone = body.phone;
    const lead = await updateLeadFields(id, patch);
    return json({ success: true, lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar';
    return json({ success: false, message }, 400);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
