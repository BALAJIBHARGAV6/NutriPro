// COMPLETE DESIGN SYSTEM - BigBasket-inspired Green Theme

export const COLORS = {
  // Primary Brand Colors (BigBasket-inspired green)
  primary: '#84C225',
  primaryDark: '#6FA31E',
  primaryLight: '#A8D96E',
  primaryPale: '#E8F5D9',
  
  // Accent Colors
  secondary: '#FF6B35',
  accent: '#FF6B35',
  accentYellow: '#FFC107',
  
  // Neutral Colors
  background: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceLight: '#F5F5F5',
  card: '#FFFFFF',
  border: '#E0E0E0',
  borderLight: '#F5F5F5',
  divider: '#E0E0E0',
  
  // Text Colors
  text: '#1F2937',
  textDark: '#1F2937',
  textSecondary: '#4B5563',
  textMedium: '#4B5563',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  
  // Nutrition Colors
  calories: '#FF6B35',
  protein: '#84C225',
  carbs: '#2196F3',
  fats: '#FFC107',
  
  // Gradients
  primaryGradient: ['#84C225', '#A8D96E'],
  secondaryGradient: ['#FF6B35', '#FFB74D'],
  
  // Shadows
  shadow: {
    soft: 'rgba(0, 0, 0, 0.04)',
    medium: 'rgba(0, 0, 0, 0.08)',
    strong: 'rgba(0, 0, 0, 0.12)',
    light: 'rgba(0, 0, 0, 0.04)',
    dark: 'rgba(0, 0, 0, 0.12)',
  },
  greenGlow: 'rgba(132, 194, 37, 0.15)',
};

export const SIZES = {
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  
  // Spacing
  padding: {
    micro: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    section: 64,
  },
  
  // Border Radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
    round: 50,
  },
};

export const FONTS = {
  primary: 'System',
  heading: 'System',
  numbers: 'System',
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

export const SHADOWS = {
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
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
};

export const ANIMATION = {
  ultraFast: 150,
  fast: 200,
  medium: 300,
  slow: 400,
  extraSlow: 600,
};
