"use client";

import { useMemo } from "react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { CATEGORIES, filterProducts, formatZAR, type Category, type ProductFilter } from "@/lib/products";
import { useStore } from "@/lib/store";

export default function ProductsPage() {
  const { filter, setFilter, addToCart, cart } = useStore();
  const items = useMemo(() => filterProducts(filter), [filter]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Catalogue</p>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
      </div>
      <Card className="grid gap-3 sm:grid-cols-4">
        <Input label="Search" placeholder="headphones, lamp…" value={filter.query} onChange={(e) => setFilter({ query: e.target.value })} />
        <Select label="Category" value={filter.category} onChange={(e) => setFilter({ category: e.target.value as Category | "All" })}>
          <option>All</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Input label="Max price (R)" type="number" min={0} placeholder="any" value={filter.maxPrice ?? ""} onChange={(e) => setFilter({ maxPrice: e.target.value ? Number(e.target.value) : null })} />
        <Select label="Sort" value={filter.sort} onChange={(e) => setFilter({ sort: e.target.value as ProductFilter["sort"] })}>
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </Select>
      </Card>
      <p className="font-mono text-xs text-muted-foreground" data-testid="result-count">{items.length} product{items.length === 1 ? "" : "s"}</p>
      {items.length === 0 && <Card className="text-center text-muted-foreground">No products match your filters.</Card>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => {
          const inCart = cart.find((l) => l.productId === p.id)?.qty ?? 0;
          return (
            <Card key={p.id} className="flex flex-col gap-3 transition-colors hover:border-[var(--border-light,var(--ring))]" >
              <div className="grid h-28 place-items-center rounded-md bg-secondary text-5xl">{p.emoji}</div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold leading-tight">{p.name}</h2>
                <Badge tone="muted">{p.category}</Badge>
              </div>
              <p className="flex-1 text-xs text-muted-foreground">{p.description}</p>
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>★ {p.rating}</span>
                <span>{p.stock < 10 ? <Badge tone="warning">Only {p.stock} left</Badge> : `${p.stock} in stock`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-semibold text-primary">{formatZAR(p.price)}</span>
                <Button size="sm" onClick={() => addToCart(p.id)} aria-label={`Add ${p.name} to cart`}>{inCart ? `Add another (${inCart})` : "Add to cart"}</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
