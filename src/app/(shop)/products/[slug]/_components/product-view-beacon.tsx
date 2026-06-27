'use client';

import { useEffect, useRef } from 'react';

/**
 * Fires a one-shot "product viewed" beacon on mount. Tracking lives here (not
 * in the server render) so the product page itself can be statically/ISR
 * cached. Best-effort — failures are ignored.
 */
export function ProductViewBeacon({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/v1/products/${slug}/view`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
    }).catch(() => undefined);
  }, [slug]);
  return null;
}
