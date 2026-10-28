"use client";

// Generative-UI components rendered *inside the chat* by CopilotKit action `render`s.
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { DELIVERY, useStore, type Order } from "@/lib/store";
import { formatZAR, type Product } from "@/lib/products";

export function Thinking({ label }: { label: string }) {
  return <p className="pulse font-mono text-xs text-muted-foreground">▸ {label}…</p>;
}

export function ChatProductCards({ products, title }: { products: Product[]; title?: string }) {
  const { addToCart } = useStore();
  if (!products.length) return <Card>No products matched.</Card>;
  return (
    <div className="my-2 space-y-2">
      {title && <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>}
      {products.slice(0, 6).map((p) => (
        <Card key={p.id} className="flex items-center gap-3 p-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-secondary text-2xl">{p.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{p.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{p.category} · ★ {p.rating}</p>
            <p className="font-mono text-sm font-semibold text-primary">{formatZAR(p.price)}</p>
          </div>
          <Button size="sm" onClick={() => addToCart(p.id)}>Add</Button>
        </Card>
      ))}
      {products.length > 6 && <p className="font-mono text-xs text-muted-foreground">+{products.length - 6} more on the products page</p>}
    </div>
  );
}

export function ChatCartSummary({ note }: { note?: string }) {
  const { summary, setQty, removeFromCart } = useStore();
  return (
    <Card className="my-2 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Your cart</p>
        <Badge tone="primary">{summary.count} items</Badge>
      </div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {summary.lines.length === 0 && <p className="text-sm text-muted-foreground">Your cart is empty.</p>}
      {summary.lines.map(({ product, qty }) => (
        <div key={product.id} className="flex items-center gap-2 text-sm">
          <span>{product.emoji}</span>
          <span className="min-w-0 flex-1 truncate">{product.name}</span>
          <button aria-label="decrease" className="cursor-pointer rounded border border-border px-1.5 font-mono" onClick={() => setQty(product.id, qty - 1)}>−</button>
          <span className="font-mono text-xs">{qty}</span>
          <button aria-label="increase" className="cursor-pointer rounded border border-border px-1.5 font-mono" onClick={() => setQty(product.id, qty + 1)}>+</button>
          <button aria-label="remove" className="cursor-pointer text-xs text-[var(--danger)]" onClick={() => removeFromCart(product.id)}>✕</button>
        </div>
      ))}
      <div className="flex justify-between border-t border-border pt-2 font-mono text-sm font-semibold"><span>Subtotal</span><span className="text-primary">{formatZAR(summary.subtotal)}</span></div>
      {summary.lines.length > 0 && <Link href="/cart" className="font-mono text-xs text-primary underline">Open cart →</Link>}
    </Card>
  );
}

export function OrderSummaryCard({ order }: { order?: Order | null }) {
  const { summary, checkout } = useStore();
  const lines = order ? order.lines : summary.lines;
  const subtotal = order ? order.subtotal : summary.subtotal;
  const shipping = order ? order.shipping : summary.shipping;
  const total = order ? order.total : summary.total;
  const addr = order ? order.address : checkout.address;
  const del = DELIVERY[order ? order.delivery : checkout.delivery];
  return (
    <Card className="my-2 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{order ? `Order ${order.id}` : "Order summary"}</p>
        {order ? <Badge tone="success">Placed</Badge> : <Badge tone="warning">Pending</Badge>}
      </div>
      {lines.map(({ product, qty }) => (
        <div key={product.id} className="flex justify-between text-sm"><span className="truncate">{qty}× {product.name}</span><span className="font-mono">{formatZAR(product.price * qty)}</span></div>
      ))}
      <div className="space-y-1 border-t border-border pt-2 font-mono text-xs text-muted-foreground">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatZAR(subtotal)}</span></div>
        <div className="flex justify-between"><span>{del.label}</span><span>{shipping ? formatZAR(shipping) : "Free"}</span></div>
        <div className="flex justify-between text-sm font-semibold text-foreground"><span>Total</span><span className="text-primary">{formatZAR(total)}</span></div>
      </div>
      <p className="text-xs text-muted-foreground">Ship to {addr.fullName}, {addr.street}, {addr.city} {addr.postalCode} · {del.eta}</p>
    </Card>
  );
}

export function PaymentConfirmation({ order }: { order: Order }) {
  return (
    <Card className="my-2 border-[var(--success-border)] bg-[var(--success-bg)] text-center">
      <p className="text-3xl">✅</p>
      <p className="font-semibold text-[var(--success)]">Payment confirmed</p>
      <p className="font-mono text-xs text-muted-foreground">Order {order.id} · card •••• {order.cardLast4}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{formatZAR(order.total)}</p>
    </Card>
  );
}

/** Human-in-the-loop approval card for sensitive actions. */
export function ApprovalCard({ title, detail, confirmLabel, onApprove, onReject, status }: { title: string; detail: React.ReactNode; confirmLabel: string; onApprove: () => void; onReject: () => void; status: string }) {
  const pending = status === "executing";
  return (
    <Card className="my-2 space-y-3 border-[var(--warning-border)]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Approval required</p>
        <Badge tone="warning">{pending ? "Awaiting you" : "Resolved"}</Badge>
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="text-sm text-muted-foreground">{detail}</div>
      {pending && (
        <div className="flex gap-2">
          <Button size="sm" onClick={onApprove}>{confirmLabel}</Button>
          <Button size="sm" variant="secondary" onClick={onReject}>Cancel</Button>
        </div>
      )}
    </Card>
  );
}
