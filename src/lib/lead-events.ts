/**
 * dataLayer payloads for form submits.
 * Campaign events keep their name and fields. Every other form uses lead_form
 * so one GTM trigger can cover the rest of the site.
 */

const RESERVED_PREFIXES = ['asesores_', 'segubeca_', 'vidamujer_'] as const;

export function isReservedLeadEvent(name: string): boolean {
  return RESERVED_PREFIXES.some((prefix) => name.startsWith(prefix));
}

export function formDataLayerPayload(
  trackingEvent: string,
  page: string,
  section: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  if (isReservedLeadEvent(trackingEvent)) {
    return { ...extra, event: trackingEvent };
  }
  return {
    ...extra,
    event: 'lead_form',
    event_category: 'conversion',
    event_label: trackingEvent,
    page,
    section,
  };
}
