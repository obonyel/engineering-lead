/**
 * Sahara Mzansi — Design System Tokens (Extracted from Stitch Screens 01–08)
 * Primary Theme: Warm Terracotta, Desert Sand & Espresso (`Plus Jakarta Sans`).
 */

export const SaharaColors = {
  background: "#FFF8F5",
  surface: "#FFF8F5",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#FAF2EE",
  surfaceContainer: "#F4ECE8",
  surfaceContainerHigh: "#EEE7E3",
  surfaceContainerHighest: "#E9E1DD",

  primary: "#944516",
  primaryContainer: "#B35D2C",
  primaryFixed: "#FFDBCB",
  onPrimary: "#FFFFFF",
  onPrimaryFixed: "#341100",

  secondary: "#9B4500",
  secondaryContainer: "#FD8A42",
  secondaryFixed: "#FFDBCA",
  onSecondary: "#FFFFFF",
  onSecondaryFixed: "#331200",

  tertiary: "#904821",
  tertiaryContainer: "#AF5F36",
  onTertiary: "#FFFFFF",

  onBackground: "#1E1B19",
  onSurface: "#1E1B19",
  onSurfaceVariant: "#55433B",
  outline: "#887369",
  outlineVariant: "#DBC1B6",

  success: "#10B981",
  successContainer: "#D1FAE5",
  warning: "#D97706",
  warningContainer: "#FEF3C7",
  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
  onError: "#FFFFFF",
} as const;

export const SaharaSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  gutterMobile: 16,
} as const;

export const SaharaRadii = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
