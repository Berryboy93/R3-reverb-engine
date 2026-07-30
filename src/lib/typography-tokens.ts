/**
 * R3 v4 Typography Token System - Phase 1
 * Font Families: Inter (UI) + JetBrains Mono (Code)
 * Scale: Major Third (1.2x multiplier)
 */

export const FONT_FAMILIES = {
  inter: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif`,
  jetbrainsMono: `"JetBrains Mono", "Courier New", monospace`,
  system: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
} as const;

export const FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export type FontWeightKey = keyof typeof FONT_WEIGHTS;

export const TYPE_SCALE = {
  xs: { size: 11, lineHeight: 1.4, letterSpacing: 0.02 },
  sm: { size: 13, lineHeight: 1.5, letterSpacing: 0.01 },
  base: { size: 16, lineHeight: 1.6, letterSpacing: 0 },
  lg: { size: 19, lineHeight: 1.6, letterSpacing: 0 },
  xl: { size: 23, lineHeight: 1.4, letterSpacing: -0.01 },
  "2xl": { size: 28, lineHeight: 1.3, letterSpacing: -0.02 },
  "3xl": { size: 33, lineHeight: 1.2, letterSpacing: -0.02 },
  "4xl": { size: 40, lineHeight: 1.1, letterSpacing: -0.03 },
} as const;

export type TypeScaleKey = keyof typeof TYPE_SCALE;

export interface TypeScaleValue {
  size: number;
  lineHeight: number;
  letterSpacing: number;
}

export const SEMANTIC_TYPOGRAPHY = {
  heroDisplay: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE["4xl"].size}px`,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: TYPE_SCALE["4xl"].lineHeight,
    letterSpacing: `${TYPE_SCALE["4xl"].letterSpacing}em`,
  },
  h1: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE["4xl"].size}px`,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: TYPE_SCALE["4xl"].lineHeight,
    letterSpacing: `${TYPE_SCALE["4xl"].letterSpacing}em`,
  },
  h2: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE["3xl"].size}px`,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: TYPE_SCALE["3xl"].lineHeight,
    letterSpacing: `${TYPE_SCALE["3xl"].letterSpacing}em`,
  },
  h3: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE["2xl"].size}px`,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: TYPE_SCALE["2xl"].lineHeight,
    letterSpacing: `${TYPE_SCALE["2xl"].letterSpacing}em`,
  },
  h4: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.xl.size}px`,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: TYPE_SCALE.xl.lineHeight,
    letterSpacing: `${TYPE_SCALE.xl.letterSpacing}em`,
  },
  h5: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.lg.size}px`,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: TYPE_SCALE.lg.lineHeight,
    letterSpacing: `${TYPE_SCALE.lg.letterSpacing}em`,
  },
  h6: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.base.size}px`,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: TYPE_SCALE.base.lineHeight,
    letterSpacing: `${TYPE_SCALE.base.letterSpacing}em`,
  },
  bodyLarge: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.lg.size}px`,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: TYPE_SCALE.lg.lineHeight,
    letterSpacing: `${TYPE_SCALE.lg.letterSpacing}em`,
  },
  body: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.base.size}px`,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: TYPE_SCALE.base.lineHeight,
    letterSpacing: `${TYPE_SCALE.base.letterSpacing}em`,
  },
  bodySmall: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.sm.size}px`,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: TYPE_SCALE.sm.lineHeight,
    letterSpacing: `${TYPE_SCALE.sm.letterSpacing}em`,
  },
  label: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.sm.size}px`,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: TYPE_SCALE.sm.lineHeight,
    letterSpacing: `${TYPE_SCALE.sm.letterSpacing}em`,
    textTransform: "uppercase",
  },
  caption: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.xs.size}px`,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: TYPE_SCALE.xs.lineHeight,
    letterSpacing: `${TYPE_SCALE.xs.letterSpacing}em`,
  },
  code: {
    fontFamily: FONT_FAMILIES.jetbrainsMono,
    fontSize: `${TYPE_SCALE.sm.size}px`,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: TYPE_SCALE.sm.lineHeight,
    letterSpacing: `${TYPE_SCALE.sm.letterSpacing}em`,
  },
  codeBlock: {
    fontFamily: FONT_FAMILIES.jetbrainsMono,
    fontSize: `${TYPE_SCALE.sm.size}px`,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: 1.7,
    letterSpacing: `${TYPE_SCALE.sm.letterSpacing}em`,
  },
  button: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.base.size}px`,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: TYPE_SCALE.base.lineHeight,
    letterSpacing: `${TYPE_SCALE.base.letterSpacing}em`,
  },
  buttonSmall: {
    fontFamily: FONT_FAMILIES.inter,
    fontSize: `${TYPE_SCALE.sm.size}px`,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: TYPE_SCALE.sm.lineHeight,
    letterSpacing: `${TYPE_SCALE.sm.letterSpacing}em`,
  },
} as const;

export type SemanticTypographyKey = keyof typeof SEMANTIC_TYPOGRAPHY;

export interface TypographyStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: string;
  textTransform?: string;
}

export function generateTypographyCSSVariables(): string {
  const vars: string[] = [];
  Object.entries(FONT_FAMILIES).forEach(([key, value]) => {
    vars.push(`--font-${key}: ${value}`);
  });
  Object.entries(TYPE_SCALE).forEach(([key, value]) => {
    vars.push(`--type-${key}-size: ${value.size}px`);
    vars.push(`--type-${key}-lh: ${value.lineHeight}`);
    vars.push(`--type-${key}-ls: ${value.letterSpacing}em`);
  });
  Object.entries(FONT_WEIGHTS).forEach(([key, value]) => {
    vars.push(`--weight-${key}: ${value}`);
  });
  return vars.join("; ") + ";";
}

export function checkLineLength(widthPx: number, fontSizePx: number): {
  characters: number;
  isReadable: boolean;
  recommendation: string;
} {
  const charsPerLine = Math.round(widthPx / (fontSizePx * 0.5));
  const isReadable = charsPerLine >= 45 && charsPerLine <= 75;
  return {
    characters: charsPerLine,
    isReadable,
    recommendation: isReadable
      ? "✓ Optimal line length"
      : charsPerLine < 45
        ? "⚠ Too narrow"
        : "⚠ Too wide",
  };
}

export function isReadableSpacing(lineHeightMultiplier: number, fontSizePx: number): boolean {
  const threshold = fontSizePx > 18 ? 1.3 : 1.5;
  return lineHeightMultiplier >= threshold;
}

export function validateTypographySystem(): void {
  console.log("[Typography] Accessibility Audit:");
  Object.entries(TYPE_SCALE).forEach(([key, value]) => {
    const compliant = isReadableSpacing(value.lineHeight, value.size);
    const status = compliant ? "✓" : "✗";
    console.log(`  ${status} ${key}: ${value.size}px @ ${value.lineHeight} line-height`);
  });
}

export function getTypographyStyle(key: SemanticTypographyKey): React.CSSProperties {
  const style = SEMANTIC_TYPOGRAPHY[key];
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    textTransform: style.textTransform as any,
  };
}

export function getTypeScale(key: TypeScaleKey): TypeScaleValue {
  return TYPE_SCALE[key];
}

export function getFontFamily(family: keyof typeof FONT_FAMILIES): string {
  return FONT_FAMILIES[family];
}

