import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, DailyLog } from '../types';
import { storageService } from '../services/storageService';
import { professionalAIService, Meal, UserProfile } from '../services/professionalAIService';

interface MealsTrackerScreenProps {
  user: User;
  onViewDetails: (log: DailyLog) => void;
}

const MealsTrackerScreen: React.FC<MealsTrackerScreenProps> = ({
  user,
  onViewDetails,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    mealsCount: 0,
  });
  const [weeklyData, setWeeklyData] = useState<boolean[]>([]);
  
  // Recipe variations state
  const [showVariationsModal, setShowVariationsModal] = useState(false);
  const [selectedMealForVariations, setSelectedMealForVariations] = useState<DailyLog | null>(null);
  const [recipeVariations, setRecipeVariations] = useState<Meal[]>([]);
  const [loadingVariations, setLoadingVariations] = useState(false);

  const calorieTarget = calculateCalorieTarget();

  function calculateCalorieTarget(): number {
    const bmr = user.gender === 'male'
      ? 88.362 + (13.397 * user.weight) + (4.799 * user.height) - (5.677 * user.age)
      : 447.593 + (9.247 * user.weight) + (3.098 * user.height) - (4.330 * user.age);
    
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    
    return Math.round(bmr * (multipliers[user.exerciseLevel] || 1.55));
  }

  useEffect(() => {
    loadDailyData();
    loadWeeklyData();
  }, [selectedDate]);

  const loadDailyData = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const logs = await storageService.getDailyLogs(user.id, dateStr);
    
    // Remove duplicates by meal_type (keep only the latest)
    const uniqueLogs = logs.reduce((acc: DailyLog[], log) => {
      const existingIndex = acc.findIndex(l => l.meal_type === log.meal_type);
      if (existingIndex === -1) {
        acc.push(log);
      } else {
        // Keep the newer one
        if (new Date(log.created_at) > new Date(acc[existingIndex].created_at)) {
          acc[existingIndex] = log;
        }
      }
      return acc;
    }, []);
    
    setDailyLogs(uniqueLogs);
    
    const totals = await storageService.getDailyNutritionTotals(user.id, dateStr);
    setDailyTotals(totals);
  };

  const loadWeeklyData = async () => {
    const weekData: boolean[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const logs = await storageService.getDailyLogs(user.id, dateStr);
      weekData.push(logs.length > 0);
    }
    setWeeklyData(weekData);
  };

  const handleRemoveMeal = async (logId: string) => {
    Alert.alert(
      'Remove Meal',
      'Are you sure you want to remove this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const dateStr = selectedDate.toISOString().split('T')[0];
            await storageService.removeMealFromLog(user.id, dateStr, logId);
            await loadDailyData();
          },
        },
      ]
    );
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMealIcon = (mealType: string): string => {
    const icons: Record<string, string> = {
      breakfast: '🍳',
      lunch: '🍱',
      snack: '🍎',
      dinner: '🍽️',
    };
    return icons[mealType] || '🍽️';
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const progressPercentage = Math.min((dailyTotals.calories / calorieTarget) * 100, 100);

  // Get user profile for AI
  const getUserProfile = (): UserProfile => ({
    name: user.fullName || user.name || 'User',
    age: user.age,
    gender: user.gender,
    weight: user.weight,
    height: user.height,
    goal: user.healthGoals?.[0] || 'maintain',
    activityLevel: user.exerciseLevel,
    dietaryRestrictions: [],
    allergies: user.allergies || [],
    healthConditions: user.diseases || [],
    calorieTarget: calorieTarget,
  });

  // Generate recipe variations for a meal
  const handleShowVariations = async (log: DailyLog) => {
    setSelectedMealForVariations(log);
    setShowVariationsModal(true);
    setLoadingVariations(true);
    
    try {
      const profile = getUserProfile();
      const mealType = log.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack';
      const variations = await professionalAIService.generateRecipesForUser(mealType, profile, 3);
      setRecipeVariations(variations);
    } catch (error) {
      console.error('Error generating variations:', error);
      Alert.alert('Error', 'Could not generate recipe variations. Please try again.');
    } finally {
      setLoadingVariations(false);
    }
  };

  // Replace current meal with a variation
  const handleReplaceWithVariation = async (variation: Meal) => {
    if (!selectedMealForVariations) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Remove old meal
    await storageService.removeMealFromLog(user.id, dateStr, selectedMealForVariations.id);
    
    // Add new variation
    await storageService.addMealToLog(user.id, variation);
    
    // Reload data
    await loadDailyData();
    
    setShowVariationsModal(false);
    Alert.alert('Success', `Replaced with "${variation.name}"!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📅 MY MEALS</Text>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>DAILY SUMMARY</Text>
          <View style={styles.calorieRow}>
            <Text style={styles.calorieText}>
              Total Calories: {dailyTotals.calories} / {calorieTarget}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
          <View style={styles.macroRow}>
            <Text style={styles.macroText}>Protein: {dailyTotals.protein}g</Text>
            <Text style={styles.macroText}>Carbs: {dailyTotals.carbs}g</Text>
            <Text style={styles.macroText}>Fats: {dailyTotals.fats}g</Text>
          </View>
        </View>

        {/* Meal Logs */}
        {dailyLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No meals logged for this day</Text>
            <Text style={styles.emptySubtext}>
              Add meals from the Home page to track your nutrition
            </Text>
          </View>
        ) : (
          dailyLogs.map((log) => (
            <View key={log.id} style={styles.mealLogCard}>
              {/* Meal Header */}
              <View style={styles.mealLogHeader}>
                <Text style={styles.mealLogIcon}>{log.emoji || getMealIcon(log.meal_type)}</Text>
                <View style={styles.mealLogInfo}>
                  <Text style={styles.mealLogType}>
                    {log.meal_type.toUpperCase()} - {formatTime(log.created_at)}
                  </Text>
                  <Text style={styles.mealLogName}>{log.food_name}</Text>
                  {log.description && (
                    <Text style={styles.mealLogDescription} numberOfLines={2}>{log.description}</Text>
                  )}
                </View>
              </View>

              {/* Nutrition Info */}
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{log.nutrition_consumed?.calories || 0}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{log.nutrition_consumed?.protein || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{log.nutrition_consumed?.carbs || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{log.nutrition_consumed?.fats || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Fats</Text>
                </View>
              </View>

              {/* Recipe Details (if available) */}
              {log.ingredients && log.ingredients.length > 0 && (
                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>🛒 Ingredients</Text>
                  {log.ingredients.slice(0, 4).map((ing, idx) => (
                    <Text key={idx} style={styles.ingredientText}>• {ing}</Text>
                  ))}
                  {log.ingredients.length > 4 && (
                    <Text style={styles.moreText}>+{log.ingredients.length - 4} more...</Text>
                  )}
                </View>
              )}

              {log.instructions && log.instructions.length > 0 && (
                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>👨‍🍳 How to Cook</Text>
                  {log.instructions.slice(0, 3).map((step, idx) => (
                    <Text key={idx} style={styles.instructionText}>{idx + 1}. {step}</Text>
                  ))}
                  {log.instructions.length > 3 && (
                    <Text style={styles.moreText}>+{log.instructions.length - 3} more steps...</Text>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.mealLogActions}>
                <TouchableOpacity
                  style={styles.variationsBtn}
                  onPress={() => handleShowVariations(log)}
                >
                  <Text style={styles.variationsBtnText}>🔄 Get Variations</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => onViewDetails(log)}
                >
                  <Text style={styles.viewDetailsBtnText}>Full Recipe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveMeal(log.id)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Weekly View */}
        <View style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>📊 WEEKLY VIEW</Text>
          <View style={styles.weekDays}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <View key={day} style={styles.weekDayItem}>
                <Text style={styles.weekDayText}>{day}</Text>
                <Text style={styles.weekDayStatus}>
                  {weeklyData[index] ? '✓' : '✗'}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakText}>
              Current Streak: 🔥 {user.streak || 0} days
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Recipe Variations Modal */}
      <Modal
        visible={showVariationsModal}
        animationType="slide"
        onRequestClose={() => setShowVariationsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              🔄 Recipe Variations for {selectedMealForVariations?.meal_type.toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => setShowVariationsModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Choose a different recipe to replace "{selectedMealForVariations?.food_name}"
          </Text>

          <ScrollView style={styles.variationsList}>
            {loadingVariations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Generating AI recipe variations...</Text>
              </View>
            ) : (
              recipeVariations.map((variation) => (
                <View key={variation.id} style={styles.variationCard}>
                  <View style={styles.variationHeader}>
                    <Text style={styles.variationEmoji}>{variation.emoji || '🍽️'}</Text>
                    <View style={styles.variationInfo}>
                      <Text style={styles.variationName}>{variation.name}</Text>
                      <Text style={styles.variationDesc}>{variation.description}</Text>
                      <Text style={styles.variationMacros}>
                        {variation.calories} cal | P: {variation.protein}g | C: {variation.carbs}g | F: {variation.fats}g
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.replaceBtn}
                    onPress={() => handleReplaceWithVariation(variation)}
                  >
                    <Text style={styles.replaceBtnText}>Replace with this</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#84C225',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  dateArrow: {
    padding: 8,
  },
  dateArrowText: {
    fontSize: 24,
    color: '#2E7D32',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
  },
  calorieRow: {
    marginBottom: 8,
  },
  calorieText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#84C225',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  mealLogCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealLogIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  mealLogInfo: {
    flex: 1,
  },
  mealLogType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  mealLogName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  mealLogCalories: {
    fontSize: 14,
    color: '#84C225',
    fontWeight: '500',
  },
  mealLogActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewDetailsBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#84C225',
    borderRadius: 6,
    marginRight: 8,
  },
  viewDetailsBtnText: {
    textAlign: 'center',
    color: '#84C225',
    fontWeight: '500',
  },
  removeBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 6,
    marginLeft: 8,
  },
  removeBtnText: {
    textAlign: 'center',
    color: '#F44336',
    fontWeight: '500',
  },
  weeklyCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 16,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekDayItem: {
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weekDayStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  streakInfo: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
  },
  // Variations button styles
  variationsBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    marginRight: 8,
  },
  variationsBtnText: {
    textAlign: 'center',
    color: '#1976D2',
    fontWeight: '500',
    fontSize: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2E7D32',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  modalClose: {
    fontSize: 24,
    color: 'white',
    paddingLeft: 16,
  },
  modalSubtitle: {
    padding: 16,
    fontSize: 14,
    color: '#666',
    backgroundColor: 'white',
  },
  variationsList: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  variationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  variationHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  variationEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  variationInfo: {
    flex: 1,
  },
  variationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  variationDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  variationMacros: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  replaceBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
  },
  replaceBtnText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  // Nutrition grid styles
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  // Recipe section styles
  recipeSection: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  recipeSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    paddingLeft: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    lineHeight: 18,
  },
  moreText: {
    fontSize: 12,
    color: '#2E7D32',
    fontStyle: 'italic',
    marginTop: 4,
  },
  mealLogDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
  },
});

export default MealsTrackerScreen;
