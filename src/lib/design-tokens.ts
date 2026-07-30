/**
 * R3 v4 Design Token System - Phase 0
 * Acid-Techno Palette + Theme Integration
 */

export const ACID_TECHNO = {
  cyan: "#00F5FF",
  violet: "#8B5CF6",
  emerald: "#10B981",
  zinc950: "#09090b",
} as const;

export const SEMANTIC_COLORS = {
  primary: ACID_TECHNO.cyan,
  primaryHover: "#00D9E8",
  primaryActive: "#00BCC4",
  primaryInverse: ACID_TECHNO.zinc950,
  secondary: ACID_TECHNO.violet,
  secondaryHover: "#7C3AED",
  secondaryActive: "#6D28D9",
  secondaryInverse: "#FFFFFF",
  success: ACID_TECHNO.emerald,
  successHover: "#059669",
  successInverse: "#FFFFFF",
  warning: "#F59E0B",
  warningHover: "#D97706",
  warningInverse: ACID_TECHNO.zinc950,
  error: "#EF4444",
  errorHover: "#DC2626",
  errorInverse: "#FFFFFF",
  info: ACID_TECHNO.cyan,
  infoHover: "#00D9E8",
  infoInverse: ACID_TECHNO.zinc950,
  background: ACID_TECHNO.zinc950,
  surface: "#0F0F11",
  surfaceAlt: "#151517",
  surfaceElevated: "#1A1A1E",
  textPrimary: "#F8F8FA",
  textSecondary: "#A0A0A8",
  textTertiary: "#68686E",
  textInverse: ACID_TECHNO.zinc950,
  border: "#2A2A2E",
  borderHeavy: "#3A3A3E",
  borderAccent: ACID_TECHNO.cyan,
  borderDisabled: "#1A1A1E",
  focus: ACID_TECHNO.cyan,
  focusRing: `0 0 0 3px ${ACID_TECHNO.zinc950}, 0 0 0 5px ${ACID_TECHNO.cyan}`,
  overlayLight: "rgba(0, 245, 255, 0.1)",
  overlayMedium: "rgba(0, 245, 255, 0.2)",
  overlayDark: "rgba(15, 15, 17, 0.8)",
  overlayDarkest: "rgba(9, 9, 11, 0.95)",
} as const;

export type SemanticColorKey = keyof typeof SEMANTIC_COLORS;
export type AcidTechnoKey = keyof typeof ACID_TECHNO;

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  focusRing: string;
}

export function generateCSSVariables(): string {
  const vars: string[] = [];
  Object.entries(ACID_TECHNO).forEach(([key, value]) => {
    vars.push(`--acid-${key}: ${value}`);
  });
  Object.entries(SEMANTIC_COLORS).forEach(([key, value]) => {
    vars.push(`--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`);
  });
  return vars.join("; ") + ";";
}

export function generateCSSThemeRule(): string {
  return `:root { ${generateCSSVariables()} }`;
}

function getLuminance(hex: string): number {
  const rgb = parseInt(hex.replace("#", ""), 16);
  const r = ((rgb >> 16) & 255) / 255;
  const g = ((rgb >> 8) & 255) / 255;
  const b = (rgb & 255) / 255;
  const luminance = (val: number) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isWCAGCompliant(textColor: string, bgColor: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(textColor, bgColor);
  const threshold = isLargeText ? 3 : 4.5;
  return ratio >= threshold;
}

export function validateColorSystem(): void {
  const checks = [
    { name: "textPrimary on background", text: SEMANTIC_COLORS.textPrimary, bg: SEMANTIC_COLORS.background },
    { name: "textPrimary on primary button", text: SEMANTIC_COLORS.primaryInverse, bg: SEMANTIC_COLORS.primary },
    { name: "textSecondary on secondary button", text: SEMANTIC_COLORS.secondaryInverse, bg: SEMANTIC_COLORS.secondary },
    { name: "error text on surface", text: SEMANTIC_COLORS.error, bg: SEMANTIC_COLORS.surface },
  ];
  checks.forEach(({ name, text, bg }) => {
    const ratio = getContrastRatio(text, bg);
    const compliant = isWCAGCompliant(text, bg);
    const status = compliant ? "✓" : "✗";
    console.log(`[Color] ${status} ${name}: ${ratio.toFixed(2)}:1`);
  });
}

export function getColorToken(key: SemanticColorKey): string {
  return SEMANTIC_COLORS[key];
}

export function getFocusRing(): string {
  return SEMANTIC_COLORS.focusRing;
}

export function getOverlay(opacity: number): string {
  const clamped = Math.max(0, Math.min(1, opacity));
  const alpha = Math.round(clamped * 255);
  return `rgba(${ACID_TECHNO.zinc950.slice(1, 3)}, ${ACID_TECHNO.zinc950.slice(3, 5)}, ${ACID_TECHNO.zinc950.slice(5, 7)}, ${alpha / 255})`;
}

export const DEFAULT_THEME: ThemeColors = {
  primary: SEMANTIC_COLORS.primary,
  secondary: SEMANTIC_COLORS.secondary,
  background: SEMANTIC_COLORS.background,
  surface: SEMANTIC_COLORS.surface,
  textPrimary: SEMANTIC_COLORS.textPrimary,
  textSecondary: SEMANTIC_COLORS.textSecondary,
  border: SEMANTIC_COLORS.border,
  focusRing: SEMANTIC_COLORS.focusRing,
};

