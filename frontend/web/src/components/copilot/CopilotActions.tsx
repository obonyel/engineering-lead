"use client";

// Agentic UI: everything the in-app copilot can read and do.
//  - useCopilotReadable → exposes live app state to the model
//  - useCopilotAction   → tools the model can call; `render` draws generative UI in the chat
//  - renderAndWaitForResponse → human-in-the-loop approval before placing an order
import { useRouter } from "next/navigation";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CATEGORIES, filterProducts, findProduct, formatZAR, PRODUCTS, type Category } from "@/lib/products";
import { DELIVERY, useStore, type DeliveryMethod } from "@/lib/store";
import { ApprovalCard, ChatCartSummary, ChatProductCards, OrderSummaryCard, PaymentConfirmation, Thinking } from "./GenUI";

const DEMO_CARD_LAST4 = "4242";

export function CopilotActions() {
  const store = useStore();
  const router = useRouter();

  // ---------- readables ----------
  useCopilotReadable({ description: "The signed-in user", value: { name: "Thandi Demo", email: store.user } });
  useCopilotReadable({
    description: "Full product catalogue (id, name, category, price in ZAR, rating, stock)",
    value: PRODUCTS.map(({ id, name, category, price, rating, stock }) => ({ id, name, category, price, rating, stock })),
  });
  useCopilotReadable({ description: "Current product list filters on the products page", value: store.filter });
  useCopilotReadable({
    description: "Current shopping cart contents and totals (ZAR)",
    value: { items: store.summary.lines.map((l) => ({ id: l.product.id, name: l.product.name, qty: l.qty, price: l.product.price })), subtotal: store.summary.subtotal, shipping: store.summary.shipping, total: store.summary.total },
  });
  useCopilotReadable({ description: "Checkout progress", value: { step: store.checkout.step, delivery: store.checkout.delivery, address: store.checkout.address, deliveryOptions: DELIVERY } });
  useCopilotReadable({ description: "Most recently placed order, if any", value: store.order ? { id: store.order.id, total: store.order.total } : null });

  // ---------- actions ----------
  useCopilotAction({
    name: "searchProducts",
    description: "Search/filter the product catalogue. Also updates the filters on the products page and navigates there. Use for any browsing request.",
    parameters: [
      { name: "query", type: "string", description: "Free-text search, e.g. 'headphones'", required: false },
      { name: "category", type: "string", description: `One of: All, ${CATEGORIES.join(", ")}`, required: false },
      { name: "maxPrice", type: "number", description: "Maximum price in ZAR", required: false },
      { name: "sort", type: "string", description: "featured | price-asc | price-desc | rating", required: false },
    ],
    handler: async ({ query, category, maxPrice, sort }) => {
      const f = {
        query: query ?? "",
        category: (CATEGORIES.includes(category as Category) ? category : "All") as Category | "All",
        maxPrice: maxPrice ?? null,
        sort: (["price-asc", "price-desc", "rating"].includes(sort ?? "") ? sort : "featured") as "featured" | "price-asc" | "price-desc" | "rating",
      };
      store.setFilter(f);
      router.push("/products");
      const hits = filterProducts(f);
      return { count: hits.length, products: hits.map((p) => ({ id: p.id, name: p.name, price: p.price, category: p.category })) };
    },
    render: ({ status, args }) => {
      if (status !== "complete") return <Thinking label="Searching catalogue" />;
      const hits = filterProducts({ query: args.query ?? "", category: (CATEGORIES.includes(args.category as Category) ? args.category : "All") as Category | "All", maxPrice: args.maxPrice ?? null, sort: (["price-asc", "price-desc", "rating"].includes(args.sort ?? "") ? args.sort : "featured") as "rating" });
      return <ChatProductCards products={hits} title={`${hits.length} result${hits.length === 1 ? "" : "s"}`} />;
    },
  });

  useCopilotAction({
    name: "addToCart",
    description: "Add a product to the cart by product id or name.",
    parameters: [
      { name: "product", type: "string", description: "Product id (e.g. p1) or name", required: true },
      { name: "quantity", type: "number", description: "Quantity, default 1", required: false },
    ],
    handler: async ({ product, quantity }) => {
      const p = store.addToCart(findProduct(product)?.id ?? product, quantity ?? 1);
      return p ? `Added ${quantity ?? 1} × ${p.name} to the cart.` : `No product matches "${product}".`;
    },
    render: ({ status }) => (status === "complete" ? <ChatCartSummary note="Added to cart" /> : <Thinking label="Adding to cart" />),
  });

  useCopilotAction({
    name: "removeFromCart",
    description: "Remove a product from the cart by product id or name.",
    parameters: [{ name: "product", type: "string", description: "Product id or name", required: true }],
    handler: async ({ product }) => {
      const p = store.removeFromCart(product);
      return p ? `Removed ${p.name} from the cart.` : `No product matches "${product}".`;
    },
    render: ({ status }) => (status === "complete" ? <ChatCartSummary note="Removed from cart" /> : <Thinking label="Updating cart" />),
  });

  useCopilotAction({
    name: "showCart",
    description: "Show the user's cart summary in the chat.",
    parameters: [],
    handler: async () => ({ items: store.summary.lines.map((l) => `${l.qty} × ${l.product.name}`), subtotal: formatZAR(store.summary.subtotal) }),
    render: ({ status }) => (status === "complete" ? <ChatCartSummary /> : <Thinking label="Loading cart" />),
  });

  useCopilotAction({
    name: "startCheckout",
    description: "Begin checkout: navigates to the checkout page, optionally choosing a delivery method, and shows the order summary. Does NOT place the order.",
    parameters: [{ name: "deliveryMethod", type: "string", description: "standard | express | collect", required: false }],
    handler: async ({ deliveryMethod }) => {
      if (!store.getSummary().lines.length) return "The cart is empty — add items before checking out.";
      const patch = { step: "address" as const, ...(deliveryMethod && deliveryMethod in DELIVERY ? { delivery: deliveryMethod as DeliveryMethod } : {}) };
      store.updateCheckout(patch);
      router.push("/checkout");
      return "Checkout started. The user must review address and payment on the checkout page, or ask you to place the order.";
    },
    render: ({ status }) => (status === "complete" ? <OrderSummaryCard /> : <Thinking label="Starting checkout" />),
  });

  useCopilotAction({
    name: "placeOrder",
    description: "Place the order and pay with the saved demo card. SENSITIVE: always requires explicit user approval in the chat. Only call when the user asked to buy/pay/place the order.",
    parameters: [],
    renderAndWaitForResponse: ({ status, respond }) => {
      const s = store.summary;
      if (status === "complete" && store.order) return <><PaymentConfirmation order={store.order} /><OrderSummaryCard order={store.order} /></>;
      if (status === "complete") return <p className="font-mono text-xs text-muted-foreground">Order not placed.</p>;
      return (
        <ApprovalCard
          status={status}
          title={`Place order for ${formatZAR(s.total)}?`}
          detail={<>{s.count} item(s) · {DELIVERY[store.checkout.delivery].label} · saved card •••• {DEMO_CARD_LAST4}. This is a mock payment.</>}
          confirmLabel="Approve & pay"
          onApprove={() => {
            if (!s.lines.length) return respond?.("The cart is empty; nothing was ordered.");
            const order = store.placeOrder(DEMO_CARD_LAST4);
            router.push("/checkout");
            respond?.(order ? `APPROVED. Order ${order.id} placed, total ${formatZAR(order.total)}.` : "Order failed.");
          }}
          onReject={() => respond?.("The user declined. No order was placed.")}
        />
      );
    },
  });

  useCopilotAction({
    name: "showOrderConfirmation",
    description: "Show the payment confirmation and order summary for the latest placed order.",
    parameters: [],
    handler: async () => (store.order ? `Order ${store.order.id}` : "No order has been placed yet."),
    render: ({ status }) => {
      if (status !== "complete") return <Thinking label="Loading order" />;
      return store.order ? (<><PaymentConfirmation order={store.order} /><OrderSummaryCard order={store.order} /></>) : <p className="text-sm">No order yet.</p>;
    },
  });

  return null;
}
