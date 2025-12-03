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
  shadows,
  animation,
  componentStyles,
  layout,
  nutritionColors,
  mealTypeColors,
};

export type Theme = typeof theme;
export default theme;
