"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { formatZAR } from "@/lib/products";
import { useStore } from "@/lib/store";

export default function CartPage() {
  const { summary, setQty, removeFromCart, clearCart } = useStore();
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Basket</p>
        <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>
      </div>
      {summary.lines.length === 0 ? (
        <Card className="space-y-3 py-10 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link href="/products"><Button>Browse products</Button></Link>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {summary.lines.map(({ product, qty }) => (
              <Card key={product.id} className="flex items-center gap-4" >
                <span className="grid h-16 w-16 place-items-center rounded-md bg-secondary text-3xl">{product.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{product.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{formatZAR(product.price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" aria-label={`Decrease ${product.name}`} onClick={() => setQty(product.id, qty - 1)}>−</Button>
                  <span className="w-6 text-center font-mono text-sm">{qty}</span>
                  <Button variant="secondary" size="sm" aria-label={`Increase ${product.name}`} onClick={() => setQty(product.id, qty + 1)}>+</Button>
                </div>
                <p className="w-24 text-right font-mono font-semibold text-primary">{formatZAR(product.price * qty)}</p>
                <Button variant="danger" size="sm" onClick={() => removeFromCart(product.id)}>Remove</Button>
              </Card>
            ))}
            <Button variant="ghost" size="sm" onClick={clearCart}>Clear cart</Button>
          </div>
          <Card className="h-fit space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Summary</p>
            <div className="flex justify-between text-sm"><span>Subtotal ({summary.count} items)</span><span className="font-mono">{formatZAR(summary.subtotal)}</span></div>
            <p className="text-xs text-muted-foreground">Delivery is calculated at checkout.</p>
            <Link href="/checkout" className="block"><Button className="w-full">Proceed to checkout</Button></Link>
          </Card>
        </div>
      )}
    </div>
  );
}
