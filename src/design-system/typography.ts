/**
 * PharmaControl Typography System
 *
 * Based on iOS Human Interface Guidelines.
 * - Headings: SF Pro Display / system-ui
 * - Body: SF Pro Text / system-ui
 */

export const fontFamily = {
  display:
    "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
  body: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
  mono: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', Menlo, Courier, monospace",
} as const;

export const fontSize = {
  xs: '0.75rem',     // 12px
  sm: '0.8125rem',   // 13px
  base: '0.9375rem', // 15px — iOS default body
  md: '1rem',        // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.75rem',  // 28px
  '4xl': '2.125rem', // 34px
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: '1.2',
  snug: '1.3',
  normal: '1.5',
  relaxed: '1.625',
} as const;

export const letterSpacing = {
  tighter: '-0.02em',
  tight: '-0.01em',
  normal: '0em',
  wide: '0.01em',
} as const;

/**
 * Pre-composed text styles following iOS conventions.
 * Use these in components for consistent typography.
 */
export const textStyles = {
  largeTitle: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  title1: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  title2: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  title3: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  headline: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  callout: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  subheadline: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  footnote: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  caption1: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  caption2: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
} as const;

export type FontFamily = keyof typeof fontFamily;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type TextStyle = keyof typeof textStyles;
