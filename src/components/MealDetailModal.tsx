import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Meal } from '../services/professionalAIService';
import { colors, shadows, spacing, borderRadius, textStyles } from '../constants/theme';

interface MealDetailModalProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
  onLog: () => void;
}

const MealDetailModal: React.FC<MealDetailModalProps> = ({
  visible,
  meal,
  onClose,
  onLog,
}) => {
  if (!meal) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>{meal.emoji || '🍽️'}</Text>
              <Text style={styles.modalTitle}>{meal.name}</Text>
              <Text style={styles.modalDesc}>{meal.description}</Text>
            </View>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.fats}g</Text>
                <Text style={styles.nutritionLabel}>Fats</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {meal.ingredients.map((ing, i) => (
                <Text key={i} style={styles.listItem}>• {ing}</Text>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              {meal.instructions.map((step, i) => (
                <Text key={i} style={styles.listItem}>{i + 1}. {step}</Text>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onLog}>
              <Text style={styles.primaryBtnText}>Log This Meal ✓</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.outlineBtn} onPress={onClose}>
              <Text style={styles.outlineBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...shadows.card,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalDesc: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  nutritionGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  nutritionItem: {
    flex: 1,
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  nutritionValue: {
    ...textStyles.number,
    fontSize: 20,
    color: colors.primary,
    marginBottom: 4,
  },
  nutritionLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  listItem: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  buttonContainer: {
    padding: spacing.xl,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.soft,
  },
  primaryBtnText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  outlineBtnText: {
    ...textStyles.button,
    color: colors.textSecondary,
  },
});

export default MealDetailModal;
