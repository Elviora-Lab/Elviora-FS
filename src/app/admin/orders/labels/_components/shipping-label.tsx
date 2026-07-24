import { siteConfig } from '@/config/site';

import { formatDate, formatMoney, shadeLabel } from '@/utils/format';

/**
 * Shipping label — designed for a standard 4×6 inch thermal label
 * (≈ 100×150 mm). Each label is its own printable page; the parent
 * container forces a page break between labels.
 *
 * Content follows the convention used by Pakistani courier integrations
 * (TCS, Leopards, M&P) — recipient prominent, order ref + COD callout
 * top-right, sender / return small at the top.
 */
export type LabelOrder = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  totalAmount: number;
  currency: string;
  notes: string | null;
  shippingFullName: string | null;
  shippingPhone: string | null;
  shippingCountry: string | null;
  shippingCity: string | null;
  shippingArea: string | null;
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingPostalCode: string | null;
  items: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    quantity: number;
  }>;
  shipments: Array<{
    courierName: string;
    trackingNumber: string | null;
  }>;
  payments: Array<{
    paymentMethod: string;
    paymentStatus: string;
  }>;
};

export function ShippingLabel({ order }: { order: LabelOrder }) {
  const from = siteConfig.shippingFrom;
  const isCod = order.payments.some((p) => p.paymentMethod === 'COD');
  const tracking = order.shipments[0];

  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const recipientLines = [
    order.shippingAddressLine1,
    order.shippingAddressLine2,
    [order.shippingCity, order.shippingArea].filter(Boolean).join(', '),
    [order.shippingPostalCode, order.shippingCountry].filter(Boolean).join(' '),
  ].filter(Boolean) as string[];

  const senderLine = `${from.addressLine1}${from.addressLine2 ? `, ${from.addressLine2}` : ''}, ${from.city} ${from.postalCode}, ${from.country}`;

  return (
    <article className="label-page font-sans">
      {/* Header — sender + order ref */}
      <header className="flex items-start justify-between border-b border-black/80 pb-2">
        <div className="text-[10pt] leading-tight">
          <div className="text-[8pt] uppercase tracking-[0.18em] text-black/55">From</div>
          <div className="font-semibold">{siteConfig.name.toUpperCase()}</div>
          <div className="text-[9pt]">{senderLine}</div>
          <div className="text-[9pt]">{from.phone}</div>
        </div>
        <div className="text-right">
          <div className="text-[8pt] uppercase tracking-[0.18em] text-black/55">Order</div>
          <div className="font-mono text-[13pt] font-semibold tabular-nums">
            {order.orderNumber}
          </div>
          <div className="text-[9pt] text-black/70">{formatDate(order.createdAt)}</div>
        </div>
      </header>

      {/* COD pill */}
      {isCod ? (
        <div className="my-3 inline-block border-2 border-black px-3 py-1 text-[12pt] font-bold uppercase tracking-[0.16em]">
          Cash on Delivery — {formatMoney(order.totalAmount, order.currency)}
        </div>
      ) : (
        <div className="my-3 inline-block border border-black/40 px-3 py-1 text-[10pt] uppercase tracking-[0.12em]">
          Prepaid · {order.payments[0]?.paymentMethod ?? '—'}
        </div>
      )}

      {/* Recipient — the visual anchor of the label */}
      <section className="mt-3">
        <div className="text-[8pt] uppercase tracking-[0.18em] text-black/55">To</div>
        <div className="text-[18pt] font-bold leading-tight">{order.shippingFullName ?? '—'}</div>
        {order.shippingPhone ? (
          <div className="text-[12pt] font-semibold">{order.shippingPhone}</div>
        ) : null}
        <address className="mt-1 text-[12pt] not-italic leading-[1.35]">
          {recipientLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </address>
      </section>

      {/* Items summary + tracking */}
      <section className="mt-3 flex items-end justify-between border-t border-black/60 pt-2">
        <div className="flex-1">
          <div className="text-[8pt] uppercase tracking-[0.18em] text-black/55">Items</div>
          <ul className="text-[9pt] leading-snug">
            {order.items.slice(0, 4).map((item) => (
              <li key={item.id}>
                {item.quantity}× {item.productName}
                {shadeLabel(item.variantName) ? ` · ${shadeLabel(item.variantName)}` : ''}
              </li>
            ))}
            {order.items.length > 4 ? (
              <li className="italic">+ {order.items.length - 4} more</li>
            ) : null}
          </ul>
          <div className="mt-1 text-[8pt] text-black/55">
            {order.items.length} SKU{order.items.length === 1 ? '' : 's'} · {itemCount} pieces
          </div>
        </div>

        <div className="ml-3 max-w-[55%] text-right">
          {tracking?.trackingNumber ? (
            <>
              <div className="text-[8pt] uppercase tracking-[0.18em] text-black/55">
                {tracking.courierName} · Tracking
              </div>
              <div className="font-mono text-[12pt] tabular-nums">{tracking.trackingNumber}</div>
              <Barcode value={tracking.trackingNumber} />
            </>
          ) : (
            <>
              <div className="text-[8pt] uppercase tracking-[0.18em] text-black/55">Ref</div>
              <div className="font-mono text-[12pt] tabular-nums">{order.orderNumber}</div>
              <Barcode value={order.orderNumber} />
            </>
          )}
        </div>
      </section>

      {order.notes ? (
        <div className="mt-2 border-t border-dashed border-black/40 pt-1 text-[8pt] italic">
          Note: {order.notes}
        </div>
      ) : null}

      <footer className="mt-2 flex justify-between text-[7pt] uppercase tracking-[0.18em] text-black/55">
        <span>{siteConfig.tagline}</span>
        <span>elviora.com</span>
      </footer>
    </article>
  );
}

/**
 * Visual barcode placeholder — solid vertical bars derived from the
 * tracking string's char codes. Not scan-grade Code-128 — for true
 * scannability swap in a real barcode lib (e.g. jsbarcode) on the server.
 */
function Barcode({ value }: { value: string }) {
  // Deterministic stripe widths so the same value renders the same bars.
  const bars = Array.from(value).flatMap((ch, i) => {
    const code = ch.charCodeAt(0);
    return [
      { w: 1 + (code % 3), key: `b${i}` },
      { w: 1 + ((code >> 2) % 2), key: `s${i}` },
    ];
  });
  return (
    <div className="mt-1 flex h-[36px] items-end justify-end gap-[1px]">
      {bars.map((b, i) => (
        <span
          key={b.key}
          style={{
            width: `${b.w}px`,
            height: '100%',
            background: i % 2 === 0 ? 'black' : 'transparent',
          }}
        />
      ))}
    </div>
  );
}
