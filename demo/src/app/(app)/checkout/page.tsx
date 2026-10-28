"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, cx, Input } from "@/components/ui";
import { formatZAR } from "@/lib/products";
import { DELIVERY, useStore, type DeliveryMethod } from "@/lib/store";

const STEPS = [["address", "Address"], ["delivery", "Delivery"], ["payment", "Payment"]] as const;

export default function CheckoutPage() {
  const { summary, checkout, updateCheckout, placeOrder, order } = useStore();
  const { step, address, delivery } = checkout;
  const [card, setCard] = useState({ name: "Thandi Demo", number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" });
  const [err, setErr] = useState("");

  if (step === "done" && order) {
    return (
      <div className="mx-auto max-w-xl space-y-4" data-testid="confirmation">
        <Card className="space-y-2 border-[var(--success-border)] bg-[var(--success-bg)] text-center shadow-[0_0_18px_-3px_var(--success-border)]">
          <p className="text-4xl">✅</p>
          <h1 className="text-2xl font-bold text-[var(--success)]">Payment successful</h1>
          <p className="font-mono text-sm">Order {order.id} · paid {formatZAR(order.total)} · card •••• {order.cardLast4}</p>
          <p className="text-xs text-muted-foreground">Mock payment — no money moved.</p>
        </Card>
        <Card className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Order summary</p>
          {order.lines.map(({ product, qty }) => <div key={product.id} className="flex justify-between text-sm"><span>{qty}× {product.name}</span><span className="font-mono">{formatZAR(product.price * qty)}</span></div>)}
          <div className="flex justify-between border-t border-border pt-2 font-mono text-sm"><span>Delivery ({DELIVERY[order.delivery].label})</span><span>{order.shipping ? formatZAR(order.shipping) : "Free"}</span></div>
          <div className="flex justify-between font-mono font-semibold"><span>Total</span><span className="text-primary">{formatZAR(order.total)}</span></div>
          <p className="text-xs text-muted-foreground">{order.address.fullName}, {order.address.street}, {order.address.city} {order.address.postalCode}</p>
        </Card>
        <Link href="/products" onClick={() => updateCheckout({ step: "address" })}><Button className="w-full">Continue shopping</Button></Link>
      </div>
    );
  }

  if (summary.lines.length === 0) {
    return <Card className="mx-auto max-w-md space-y-3 py-10 text-center"><p className="text-muted-foreground">Nothing to check out — your cart is empty.</p><Link href="/products"><Button>Browse products</Button></Link></Card>;
  }

  const setAddr = (k: keyof typeof address, v: string) => updateCheckout({ address: { ...address, [k]: v } });
  const idx = STEPS.findIndex(([k]) => k === step);

  const pay = () => {
    const digits = card.number.replace(/\s/g, "");
    if (!/^\d{16}$/.test(digits)) return setErr("Enter a 16-digit card number (use 4242 4242 4242 4242).");
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return setErr("Expiry must be MM/YY.");
    if (!/^\d{3}$/.test(card.cvc)) return setErr("CVC must be 3 digits.");
    setErr("");
    placeOrder(digits.slice(-4));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Secure checkout</p>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      </div>
      <ol className="flex gap-2" aria-label="Checkout steps">
        {STEPS.map(([k, label], i) => (
          <li key={k} className={cx("flex-1 rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-wider", i === idx ? "border-primary bg-accent text-primary" : i < idx ? "border-[var(--success-border)] text-[var(--success)]" : "border-border text-muted-foreground")}>{i + 1}. {label}</li>
        ))}
      </ol>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="space-y-4">
          {step === "address" && (
            <>
              <h2 className="font-semibold">Delivery address</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Full name" value={address.fullName} onChange={(e) => setAddr("fullName", e.target.value)} />
                <Input label="Phone" value={address.phone} onChange={(e) => setAddr("phone", e.target.value)} />
                <Input label="Street" className="sm:col-span-2" value={address.street} onChange={(e) => setAddr("street", e.target.value)} />
                <Input label="City" value={address.city} onChange={(e) => setAddr("city", e.target.value)} />
                <Input label="Postal code" value={address.postalCode} onChange={(e) => setAddr("postalCode", e.target.value)} />
              </div>
              <Button disabled={!address.fullName || !address.street || !address.city} onClick={() => updateCheckout({ step: "delivery" })}>Continue to delivery</Button>
            </>
          )}
          {step === "delivery" && (
            <>
              <h2 className="font-semibold">Delivery method</h2>
              <div className="space-y-2">
                {(Object.keys(DELIVERY) as DeliveryMethod[]).map((m) => (
                  <label key={m} className={cx("flex cursor-pointer items-center gap-3 rounded-md border p-3", delivery === m ? "border-primary bg-accent" : "border-border")}>
                    <input type="radio" name="delivery" checked={delivery === m} onChange={() => updateCheckout({ delivery: m })} className="accent-[var(--accent-primary)]" />
                    <span className="flex-1"><span className="block text-sm font-medium">{DELIVERY[m].label}</span><span className="font-mono text-xs text-muted-foreground">{DELIVERY[m].eta}</span></span>
                    <span className="font-mono text-sm">{DELIVERY[m].price ? formatZAR(DELIVERY[m].price) : "Free"}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2"><Button variant="secondary" onClick={() => updateCheckout({ step: "address" })}>Back</Button><Button onClick={() => updateCheckout({ step: "payment" })}>Continue to payment</Button></div>
            </>
          )}
          {step === "payment" && (
            <>
              <div className="flex items-center justify-between"><h2 className="font-semibold">Payment</h2><Badge tone="warning">Mock — no real charge</Badge></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Name on card" className="sm:col-span-2" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                <Input label="Card number" className="sm:col-span-2 font-mono" inputMode="numeric" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                <Input label="Expiry (MM/YY)" className="font-mono" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                <Input label="CVC" className="font-mono" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
              </div>
              {err && <p role="alert" className="font-mono text-xs text-[var(--danger)]">{err}</p>}
              <div className="flex gap-2"><Button variant="secondary" onClick={() => updateCheckout({ step: "delivery" })}>Back</Button><Button onClick={pay}>Pay {formatZAR(summary.total)}</Button></div>
            </>
          )}
        </Card>
        <Card className="h-fit space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Order summary</p>
          {summary.lines.map(({ product, qty }) => <div key={product.id} className="flex justify-between text-sm"><span className="truncate">{qty}× {product.name}</span><span className="font-mono">{formatZAR(product.price * qty)}</span></div>)}
          <div className="space-y-1 border-t border-border pt-2 font-mono text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatZAR(summary.subtotal)}</span></div>
            <div className="flex justify-between"><span>{DELIVERY[delivery].label}</span><span>{summary.shipping ? formatZAR(summary.shipping) : "Free"}</span></div>
            <div className="flex justify-between text-sm font-semibold text-foreground"><span>Total</span><span className="text-primary">{formatZAR(summary.total)}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
