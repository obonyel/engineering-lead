/**
 * Android Emulator (`10.0.2.2`) & Cloud Run runtime configuration (ADR-001, ADR-002).
 */

export const MobileConfig = {
  demoMode: (process.env.EXPO_PUBLIC_DEMO_MODE ?? "true") === "true",
  // Inside the Android Emulator VM, 10.0.2.2 routes to host machine localhost
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:8000",
  copilotRuntimeUrl:
    process.env.EXPO_PUBLIC_COPILOT_RUNTIME_URL ?? "http://10.0.2.2:8200/api/copilotkit",
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;
