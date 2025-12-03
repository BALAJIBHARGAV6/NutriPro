// NutriPlan Design System - BigBasket-inspired Green & White Theme

export const colors = {
  // Primary Colors (BigBasket-inspired green)
  primary: '#84C225',
  primaryDark: '#6FA31E',
  primaryLight: '#A8D96E',
  primaryPale: '#E8F5D9',
  
  // Accent Colors
  accent: '#FF6B35',
  accentYellow: '#FFC107',
  
  // Status Colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  
  // Background & Surface
  background: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceLight: '#F5F5F5',
  
  // Text Colors
  textDark: '#1F2937',
  textMedium: '#4B5563',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  
  // Nutrition Colors
  calories: '#FF6B35',
  protein: '#84C225',
  carbs: '#2196F3',
  fats: '#FFC107',
  fiber: '#26A69A',
  
  // Misc
  border: '#E0E0E0',
  borderLight: '#F5F5F5',
  divider: '#E0E0E0',
  disabled: '#9CA3AF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Shadows
  shadowSoft: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  shadowStrong: 'rgba(0, 0, 0, 0.12)',
  greenGlow: 'rgba(132, 194, 37, 0.15)',
};

export const spacing = {
  micro: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  // Font Families
  fontFamily: {
    primary: 'System',
    heading: 'System',
    numbers: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },
  
  // Font Weights
  fontWeight: {
    light: '300' as '300',
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  greenGlow: {
    shadowColor: '#84C225',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
};

export const animation = {
  // Transition speeds (in ms)
  duration: {
    ultraFast: 150,
    fast: 200,
    medium: 300,
    slow: 400,
    extraSlow: 600,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animation,
};

export type Theme = typeof theme;
export default theme;
