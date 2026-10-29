"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { DEMO_USER, useStore } from "@/lib/store";

export default function LoginPage() {
  const { login, user, ready } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_USER.email);
  const [password, setPassword] = useState(DEMO_USER.password);
  const [error, setError] = useState("");

  useEffect(() => { if (ready && user) router.replace("/products"); }, [ready, user, router]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm space-y-5 p-6 shadow-[var(--shadow-hud)]">
        <div className="space-y-2">
          <Badge>Demo environment</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Sahara Market</h1>
          <p className="text-sm text-muted-foreground">Sign in to shop with your AI copilot. Credentials are prefilled — this is fake auth.</p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (login(email, password)) router.replace("/products");
            else setError("Invalid demo credentials.");
          }}
        >
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <p role="alert" className="font-mono text-xs text-[var(--danger)]">{error}</p>}
          <Button type="submit" className="w-full">Sign in</Button>
        </form>
      </Card>
    </main>
  );
}
