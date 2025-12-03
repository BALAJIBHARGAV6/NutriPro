import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { Recipe } from '../../types/database';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  onFavoriteToggle?: () => void;
  showFavorite?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  onFavoriteToggle,
  showFavorite = true,
}) => {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {recipe.image_url ? (
        <Image
          source={{ uri: recipe.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderEmoji}>🍽️</Text>
        </View>
      )}
      
      {showFavorite && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoriteToggle}
        >
          <Text style={styles.favoriteIcon}>
            {recipe.is_favorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.content}>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⏱️ {totalTime} min</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>👥 {recipe.servings}</Text>
          </View>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        
        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}
        
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.calories }]}>
              {recipe.nutrition_info.calories}
            </Text>
            <Text style={styles.nutritionLabel}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.protein }]}>
              {recipe.nutrition_info.protein}g
            </Text>
            <Text style={styles.nutritionLabel}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.carbs }]}>
              {recipe.nutrition_info.carbs}g
            </Text>
            <Text style={styles.nutritionLabel}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.fats }]}>
              {recipe.nutrition_info.fats}g
            </Text>
            <Text style={styles.nutritionLabel}>fats</Text>
          </View>
        </View>
        
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface RecipeCardCompactProps {
  title: string;
  calories: number;
  prepTime: number;
  cookTime: number;
  imageUrl?: string | null;
  onPress?: () => void;
}

export const RecipeCardCompact: React.FC<RecipeCardCompactProps> = ({
  title,
  calories,
  prepTime,
  cookTime,
  imageUrl,
  onPress,
}) => {
  const totalTime = prepTime + cookTime;
  
  return (
    <TouchableOpacity
      style={styles.compactCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.compactImage} resizeMode="cover" />
      ) : (
        <View style={styles.compactImagePlaceholder}>
          <Text>🍽️</Text>
        </View>
      )}
      <View style={styles.compactContent}>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.compactMeta}>
          <Text style={styles.compactMetaText}>⏱️ {totalTime}min</Text>
          <Text style={styles.compactMetaText}>🔥 {calories}cal</Text>
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
  image: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    ...shadows.sm,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  content: {
    padding: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  nutritionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  
  // Compact styles
  compactCard: {
    width: 160,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  compactImage: {
    width: '100%',
    height: 100,
  },
  compactImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContent: {
    padding: spacing.sm,
  },
  compactTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  compactMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  compactMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});

export default RecipeCard;
