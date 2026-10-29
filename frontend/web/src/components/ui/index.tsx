import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-[var(--accent-primary)] text-[var(--accent-on-primary)] hover:bg-[var(--accent-hover)] font-semibold shadow-[var(--shadow-bevel)]",
  secondary: "border border-border bg-secondary text-foreground hover:bg-accent font-medium",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary font-medium",
  danger: "border border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)] font-medium hover:opacity-90",
};

export function Button({ variant = "primary", size = "md", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return (
    <button
      {...p}
      className={cx("inline-flex items-center justify-center gap-2 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed", size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm", variants[variant], className)}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-bevel)]", className)}>{children}</div>;
}

type Tone = "primary" | "success" | "warning" | "danger" | "muted";
const tones: Record<Tone, string> = {
  primary: "bg-[var(--accent-muted)] text-[var(--accent-primary)] border-[var(--accent-primary)]/30",
  success: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]",
  danger: "bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]",
  muted: "bg-secondary text-muted-foreground border-border",
};
export function Badge({ tone = "primary", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider", tones[tone])}>{children}</span>;
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</span>;
}

const field = "w-full rounded-md border border-[var(--input)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--border-focus,var(--ring))] focus:outline-none focus:ring-1 focus:ring-ring";
export function Input({ label, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <input {...p} className={cx(field, className)} />
    </label>
  );
}
export function Select({ label, className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <select {...p} className={cx(field, className)}>{children}</select>
    </label>
  );
}
export { cx };
