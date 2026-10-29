"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { Badge, Button, cx } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useTheme } from "@/components/ThemeProvider";
import { CopilotActions } from "@/components/copilot/CopilotActions";

const NAV = [{ href: "/products", label: "Products" }, { href: "/cart", label: "Cart" }, { href: "/checkout", label: "Checkout" }];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, user, logout, summary } = useStore();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const path = usePathname();
  const [mode, setMode] = useState<string>("");

  useEffect(() => { if (ready && !user) router.replace("/login"); }, [ready, user, router]);
  useEffect(() => { fetch("/api/mode").then((r) => r.json()).then((d) => setMode(d.mode)).catch(() => {}); }, []);

  if (!ready || !user) return <div className="grid min-h-screen place-items-center font-mono text-xs text-muted-foreground pulse">Loading…</div>;

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false} enableInspector={false}>
      <CopilotActions />
      <CopilotSidebar
        defaultOpen
        clickOutsideToClose={false}
        labels={{
          title: "Shopping copilot",
          initial: "Hi Thandi 👋 I can search products, manage your cart and take you through checkout. Try: “show me headphones under R2000”.",
          placeholder: "Ask the copilot…",
        }}
        suggestions={[
          { title: "Find headphones", message: "Show me headphones" },
          { title: "Add smartwatch", message: "Add the Solstice Smartwatch to my cart" },
          { title: "Show cart", message: "Show my cart" },
          { title: "Checkout", message: "Start checkout" },
        ]}
      >
        <div className="min-h-screen">
          <header className="sticky top-0 z-30 border-b border-border bg-[var(--bg-surface)]/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
              <Link href="/products" className="font-mono text-sm font-bold uppercase tracking-wider text-primary">▲ Sahara Market</Link>
              <nav className="flex gap-1">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className={cx("rounded-md px-3 py-1.5 text-sm transition-colors", path === n.href ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground")}>
                    {n.label}
                    {n.href === "/cart" && summary.count > 0 && <span data-testid="cart-count" className="ml-1.5 rounded-full bg-primary px-1.5 font-mono text-[10px] font-bold text-primary-foreground">{summary.count}</span>}
                  </Link>
                ))}
              </nav>
              <div className="ml-auto flex items-center gap-2">
                {mode && <Badge tone={mode === "openai" ? "success" : "warning"}>{mode === "openai" ? "LLM live" : "Demo mode"}</Badge>}
                <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme">{theme === "dark" ? "☾ Dark" : "☀ Light"}</Button>
                <Button variant="secondary" size="sm" onClick={() => { logout(); router.replace("/login"); }}>Sign out</Button>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </div>
      </CopilotSidebar>
    </CopilotKit>
  );
}
