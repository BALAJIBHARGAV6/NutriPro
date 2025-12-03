import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { Recipe, NutritionInfo } from '../../types/database';

interface MealCardProps {
  title: string;
  description?: string;
  imageUrl?: string | null;
  prepTime?: number;
  cookTime?: number;
  calories?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onPress?: () => void;
  onSwap?: () => void;
  onComplete?: () => void;
  isCompleted?: boolean;
  compact?: boolean;
}

const mealTypeIcons: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

const mealTypeColors: Record<string, string> = {
  breakfast: '#FF9800',
  lunch: '#4CAF50',
  dinner: '#3F51B5',
  snack: '#E91E63',
};

export const MealCard: React.FC<MealCardProps> = ({
  title,
  description,
  imageUrl,
  prepTime,
  cookTime,
  calories,
  mealType,
  onPress,
  onSwap,
  onComplete,
  isCompleted = false,
  compact = false,
}) => {
  const totalTime = (prepTime || 0) + (cookTime || 0);
  
  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, isCompleted && styles.completedCard]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.mealTypeIndicator, { backgroundColor: mealTypeColors[mealType] }]} />
        <View style={styles.compactContent}>
          <Text style={styles.mealTypeLabel}>
            {mealTypeIcons[mealType]} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
          <Text style={[styles.compactTitle, isCompleted && styles.completedText]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.compactMeta}>
            {totalTime > 0 && <Text style={styles.metaText}>{totalTime} min</Text>}
            {calories && <Text style={styles.metaText}>{calories} cal</Text>}
          </View>
        </View>
        {isCompleted && (
          <View style={styles.checkmark}>
            <Text>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.completedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.mealTypeBar, { backgroundColor: mealTypeColors[mealType] }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.mealTypeLabel}>
            {mealTypeIcons[mealType]} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ Done</Text>
            </View>
          )}
        </View>
        
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        )}
        
        <Text style={[styles.title, isCompleted && styles.completedText]} numberOfLines={2}>
          {title}
        </Text>
        
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
        
        <View style={styles.meta}>
          {totalTime > 0 && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{totalTime} min</Text>
            </View>
          )}
          {calories && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🔥</Text>
              <Text style={styles.metaText}>{calories} cal</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actions}>
          {onSwap && (
            <TouchableOpacity style={styles.actionButton} onPress={onSwap}>
              <Text style={styles.actionText}>🔄 Swap</Text>
            </TouchableOpacity>
          )}
          {onComplete && !isCompleted && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={onComplete}
            >
              <Text style={styles.completeText}>✓ Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  completedCard: {
    opacity: 0.7,
  },
  mealTypeBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealTypeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  completedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  completedBadgeText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaIcon: {
    fontSize: typography.fontSize.sm,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  completeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textOnPrimary,
  },
  
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  mealTypeIndicator: {
    width: 4,
  },
  compactContent: {
    flex: 1,
    padding: spacing.sm,
  },
  compactTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginVertical: spacing.xs,
  },
  compactMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.success,
  },
});

export default MealCard;
