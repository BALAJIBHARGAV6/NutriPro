import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { createStyles } from '../theme/styles';
import { Meal } from '../services/professionalAIService';

const styles = createStyles(375);

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
          <ScrollView>
            <Text style={styles.modalEmoji}>{meal.emoji || '🍽️'}</Text>
            <Text style={styles.modalTitle}>{meal.name}</Text>
            <Text style={styles.modalDesc}>{meal.description}</Text>
            
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

            <Text style={styles.cardTitle}>Ingredients</Text>
            {meal.ingredients.map((ing, i) => (
              <Text key={i} style={styles.listItem}>• {ing}</Text>
            ))}

            <Text style={styles.cardTitle}>Instructions</Text>
            {meal.instructions.map((step, i) => (
              <Text key={i} style={styles.listItem}>{i + 1}. {step}</Text>
            ))}

            <TouchableOpacity style={styles.primaryBtn} onPress={onLog}>
              <Text style={styles.primaryBtnText}>Log This Meal ✅</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.outlineBtn} onPress={onClose}>
              <Text style={styles.outlineBtnText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default MealDetailModal;
