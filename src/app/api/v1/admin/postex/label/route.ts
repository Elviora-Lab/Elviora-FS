import { requireAdmin } from '@/server/auth/guards';
import { createHandler } from '@/server/http/handler';
import { getPostExAirwayBill } from '@/server/shipping/postex';

export const runtime = 'nodejs';

/**
 * Stream a PostEx Airway Bill (shipping label) PDF for one or more tracking
 * numbers, e.g. /api/v1/admin/postex/label?tracking=CX-123,CX-456 (max 10).
 * Opens inline so an admin can print it. Admin-only.
 */
export const GET = createHandler(async (req) => {
  await requireAdmin(req);

  const raw = new URL(req.url).searchParams.get('tracking');
  const trackingNumbers = (raw ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (trackingNumbers.length === 0) {
    return new Response('Missing tracking number', { status: 400 });
  }

  try {
    const pdf = await getPostExAirwayBill(trackingNumbers);
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="postex-label-${trackingNumbers[0]}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch label';
    return new Response(message, { status: 502 });
  }
});
