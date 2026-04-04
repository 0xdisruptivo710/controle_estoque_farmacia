export const tokens = {
  colors: {
    primary: '#0A84FF',
    danger: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    textPrimary: '#1C1C1E',
    textSecondary: '#6E6E73',
    border: '#E5E5EA',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, pill: 9999 },
  shadows: {
    card: '0 2px 12px rgba(0,0,0,0.08)',
    modal: '0 8px 40px rgba(0,0,0,0.16)',
  },
} as const;

export type DesignTokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
export type RadiusToken = keyof typeof tokens.radius;
export type ShadowToken = keyof typeof tokens.shadows;
