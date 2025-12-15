// NutriPro Professional Design System - Modern Green & White Theme

export const colors = {
  // Primary Colors (BigBasket Green)
  primary: '#84C225',
  primaryDark: '#6BA31E',
  primaryLight: '#9ED43A',
  primaryPale: '#E8F5D9',
  primaryMint: '#B8E063',
  primarySoft: '#D4EDA0',
  
  // Accent Colors
  accent: '#D9F99D',
  accentLime: '#84CC16',
  
  // Status Colors
  success: '#059669',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Background & Surface
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceLight: '#F3F4F6',
  surfaceCard: '#FFFFFF',
  
  // Text Colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textDark: '#1F2937',
  textMedium: '#4B5563',
  textLight: '#9CA3AF',
  
  // Nutrition Colors
  calories: '#F97316',
  protein: '#10B981',
  carbs: '#3B82F6',
  fats: '#F59E0B',
  fiber: '#14B8A6',
  sugar: '#EC4899',
  water: '#06B6D4',
  
  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#10B981',
  divider: '#E5E7EB',
  
  // States
  disabled: '#D1D5DB',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.85)',
  
  // Glass Effect
  glass: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  glassLight: 'rgba(255, 255, 255, 0.9)',
  glassDark: 'rgba(255, 255, 255, 0.6)',
  
  // Shadows
  shadowSoft: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  shadowStrong: 'rgba(0, 0, 0, 0.12)',
  greenGlow: 'rgba(16, 185, 129, 0.15)',
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
  // Font Families - Uses system fonts (SF Pro on iOS, Roboto on Android)
  fontFamily: {
    primary: 'System',
    heading: 'System',
    numbers: 'System',
  },
  
  // Modern Font Sizes - Based on Apple/Google HIG
  fontSize: {
    // Micro text (labels, badges)
    micro: 10,
    xs: 11,
    // Body text
    sm: 13,
    base: 15,
    md: 16,
    // Subheadings
    lg: 17,
    xl: 19,
    // Headings
    '2xl': 22,
    '3xl': 26,
    '4xl': 32,
    // Display/Hero
    '5xl': 40,
    '6xl': 48,
  },
  
  // Font Weights - Optimized for readability
  fontWeight: {
    light: '300' as '300',
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
    extrabold: '800' as '800',
  },
  
  // Line Heights - Modern spacing
  lineHeight: {
    none: 1,
    tight: 1.15,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
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
    shadowRadius: 12,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  greenGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  topBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
  
  // Easing functions for React Native Animated
  easing: {
    // Standard easing - for most transitions
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Bounce - for playful interactions
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    // Elastic - for attention-grabbing animations
    elastic: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    // Enter - for elements entering the screen
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    // Exit - for elements leaving the screen
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

// Component-specific styles
export const componentStyles = {
  // Card styles
  card: {
    default: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.soft,
    },
    elevated: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.medium,
    },
    outlined: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
  },
  
  // Button styles
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
  },
  
  // Input styles
  input: {
    default: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    focused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    error: {
      borderColor: colors.error,
      borderWidth: 2,
    },
  },
  
  // Tab bar styles
  tabBar: {
    container: {
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingVertical: spacing.xs,
      ...shadows.soft,
    },
    activeTab: {
      color: colors.primary,
    },
    inactiveTab: {
      color: colors.textLight,
    },
  },
};

// Professional Text Styles - Used by top apps (Airbnb, Uber, Apple)
export const textStyles = {
  // Display - Large hero text
  displayLarge: {
    fontSize: 48,
    fontWeight: '800' as '800',
    lineHeight: 52,
    letterSpacing: -1,
  },
  displayMedium: {
    fontSize: 40,
    fontWeight: '700' as '700',
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  displaySmall: {
    fontSize: 32,
    fontWeight: '700' as '700',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  
  // Headings
  h1: {
    fontSize: 26,
    fontWeight: '700' as '700',
    lineHeight: 32,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as '700',
    lineHeight: 28,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 19,
    fontWeight: '600' as '600',
    lineHeight: 24,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600' as '600',
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as '400',
    lineHeight: 24,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as '400',
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as '400',
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  
  // Labels & Captions
  label: {
    fontSize: 13,
    fontWeight: '500' as '500',
    lineHeight: 18,
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as '500',
    lineHeight: 14,
    letterSpacing: 0.3,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as '400',
    lineHeight: 16,
    letterSpacing: 0.2,
    color: colors.textMuted,
  },
  
  // Buttons
  buttonLarge: {
    fontSize: 17,
    fontWeight: '600' as '600',
    lineHeight: 22,
    letterSpacing: 0,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as '600',
    lineHeight: 20,
    letterSpacing: 0,
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: '600' as '600',
    lineHeight: 18,
    letterSpacing: 0,
  },
  
  // Numbers (for stats, prices, etc.)
  numberLarge: {
    fontSize: 32,
    fontWeight: '800' as '800',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  number: {
    fontSize: 22,
    fontWeight: '700' as '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  numberSmall: {
    fontSize: 17,
    fontWeight: '600' as '600',
    lineHeight: 22,
    letterSpacing: 0,
  },
  
  // Overline (small uppercase labels)
  overline: {
    fontSize: 11,
    fontWeight: '600' as '600',
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as 'uppercase',
    color: colors.textMuted,
  },
};

// Layout constants
export const layout = {
  screenPadding: spacing.md,
  cardGap: spacing.sm,
  sectionGap: spacing.lg,
  maxContentWidth: 600,
};

// Nutrition color mapping
export const nutritionColors = {
  calories: colors.calories,
  protein: colors.protein,
  carbs: colors.carbs,
  fats: colors.fats,
  fiber: colors.fiber,
};

// Meal type colors
export const mealTypeColors = {
  breakfast: '#FF9800',
  lunch: '#4CAF50',
  dinner: '#2196F3',
  snack: '#9C27B0',
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  textStyles,
  shadows,
  animation,
  componentStyles,
  layout,
  nutritionColors,
  mealTypeColors,
};

export type Theme = typeof theme;
export default theme;
