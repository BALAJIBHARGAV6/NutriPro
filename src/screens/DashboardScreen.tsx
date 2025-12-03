import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { professionalAIService, Meal, DayPlan } from '../services/professionalAIService';
import { isSupabaseConfigured } from '../config/supabase';

interface DashboardScreenProps {
  user: User;
  onMealPress: (meal: Meal) => void;
  onAddToMeals: (meal: Meal) => void;
  onNavigateToRecipes: () => void;
  onNavigateToExercise: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  onMealPress,
  onAddToMeals,
  onNavigateToRecipes,
  onNavigateToExercise,
}) => {
  const [suggestedPlan, setSuggestedPlan] = useState<DayPlan | null>(null); // AI suggestions
  const [myMeals, setMyMeals] = useState<Meal[]>([]); // Added meals
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [addedMealTypes, setAddedMealTypes] = useState<Set<string>>(new Set());
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  const calorieTarget = calculateCalorieTarget();

  function calculateCalorieTarget(): number {
    const bmr = user.gender === 'male'
      ? 88.362 + (13.397 * user.weight) + (4.799 * user.height) - (5.677 * user.age)
      : 447.593 + (9.247 * user.weight) + (3.098 * user.height) - (4.330 * user.age);
    
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    
    return Math.round(bmr * (multipliers[user.exerciseLevel] || 1.55));
  }

  const getUserProfile = () => ({
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Load added meals from Supabase first, fallback to local storage
      let todayMyMeals: Meal[] = [];
      if (isSupabaseConfigured) {
        try {
          todayMyMeals = await databaseService.getMyMeals(today);
          console.log('📥 Dashboard: Loaded', todayMyMeals.length, 'meals from Supabase');
        } catch (error) {
          console.log('Supabase failed, using local storage');
          todayMyMeals = await storageService.getMyMealsToday(user.id);
        }
      } else {
        todayMyMeals = await storageService.getMyMealsToday(user.id);
      }
      
      setMyMeals(todayMyMeals);
      
      // Track which meal types are already added
      const addedTypes = new Set(todayMyMeals.map(m => m.mealType));
      setAddedMealTypes(addedTypes);
      
      // Always generate fresh AI suggestions
      await generateSuggestions(addedTypes);
      
      // Load nutrition totals
      await loadDailyTotals();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async (addedTypes: Set<string>) => {
    try {
      const profile = getUserProfile();
      const generatedPlan = await professionalAIService.generateDayPlan(profile);
      setSuggestedPlan(generatedPlan);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const regenerateMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (addedMealTypes.has(mealType)) return; // Don't regenerate if already added
    
    setRegenerating(true);
    try {
      const profile = getUserProfile();
      const newMeal = await professionalAIService.generatePersonalizedMeal(mealType, profile);
      
      setSuggestedPlan(prev => {
        if (!prev) return prev;
        if (mealType === 'snack') {
          return { ...prev, snacks: [newMeal] };
        }
        return { ...prev, [mealType]: newMeal };
      });
    } catch (error) {
      console.error('Error regenerating meal:', error);
    } finally {
      setRegenerating(false);
    }
  };

  const loadDailyTotals = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get logs from Supabase first
    let logs: any[] = [];
    if (isSupabaseConfigured) {
      try {
        logs = await databaseService.getDailyLogs(today);
      } catch (error) {
        // Fallback to local
        const localTotals = await storageService.getDailyNutritionTotals(user.id, today);
        setDailyTotals(localTotals);
        return;
      }
    } else {
      const localTotals = await storageService.getDailyNutritionTotals(user.id, today);
      setDailyTotals(localTotals);
      return;
    }
    
    // Calculate totals from logs
    const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    logs.forEach(log => {
      if (log.nutrition_consumed) {
        totals.calories += log.nutrition_consumed.calories || 0;
        totals.protein += log.nutrition_consumed.protein || 0;
        totals.carbs += log.nutrition_consumed.carbs || 0;
        totals.fats += log.nutrition_consumed.fats || 0;
      }
    });
    setDailyTotals(totals);
  };

  const handleAddToMeals = async (meal: Meal) => {
    try {
      await storageService.addMealToLog(user.id, meal);
      
      // Add to my meals list
      setMyMeals(prev => [...prev, meal]);
      
      // Mark this meal type as added
      setAddedMealTypes(prev => new Set([...prev, meal.mealType]));
      
      await loadDailyTotals();
      onAddToMeals(meal);
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Regenerate suggestions for non-added meal types
    await generateSuggestions(addedMealTypes);
    await loadDailyTotals();
    setRefreshing(false);
  };

  const getHealthTip = (): string => {
    const tips: Record<string, string[]> = {
      'Diabetes': [
        'Eat breakfast within 1 hour of waking to stabilize blood sugar.',
        'Choose complex carbs over simple sugars for steady energy.',
        'Include protein with every meal to slow glucose absorption.',
      ],
      'Hypertension': [
        'Limit sodium intake to less than 2,300mg daily.',
        'Include potassium-rich foods like bananas and spinach.',
        'Reduce caffeine intake to help manage blood pressure.',
      ],
      'default': [
        'Stay hydrated! Aim for 8 glasses of water daily.',
        'Include vegetables in every meal for essential nutrients.',
        'Combine nutrition with regular exercise for best results.',
      ],
    };

    const userDisease = user.diseases?.[0] || 'default';
    const diseaseTips = tips[userDisease] || tips['default'];
    return diseaseTips[Math.floor(Math.random() * diseaseTips.length)];
  };

  // Render a SUGGESTED meal card (AI generated, can be regenerated)
  const renderSuggestedMealCard = (meal: Meal | undefined, title: string, icon: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!meal) return null;
    if (addedMealTypes.has(mealType)) return null; // Don't show suggestion if already added
    
    return (
      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealHeaderLeft}>
            <Text style={styles.mealIcon}>{icon}</Text>
            <Text style={styles.mealTitle}>{title}</Text>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>🤖 AI</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.regenerateBtn}
            onPress={() => regenerateMeal(mealType)}
            disabled={regenerating}
          >
            <Text style={styles.regenerateBtnText}>{regenerating ? '⏳' : '🔄 New'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.mealContent}>
          <Text style={styles.mealEmoji}>{meal.emoji || meal.imageEmoji || '🍽️'}</Text>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.mealMacros}>
              {meal.calories} cal | P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
            </Text>
          </View>
        </View>
        
        <View style={styles.mealActions}>
          <TouchableOpacity
            style={styles.viewRecipeBtn}
            onPress={() => onMealPress(meal)}
          >
            <Text style={styles.viewRecipeBtnText}>View Recipe</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addMealBtn}
            onPress={() => handleAddToMeals(meal)}
          >
            <Text style={styles.addMealBtnText}>+ Add to My Meals</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render an ADDED meal card (from My Meals)
  const renderAddedMealCard = (meal: Meal, title: string, icon: string) => {
    return (
      <View style={[styles.mealCard, styles.addedMealCard]}>
        <View style={styles.mealHeader}>
          <View style={styles.mealHeaderLeft}>
            <Text style={styles.mealIcon}>{icon}</Text>
            <Text style={styles.mealTitle}>{title}</Text>
            <View style={styles.addedTag}>
              <Text style={styles.addedTagText}>✓ My Meal</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.mealContent}>
          <Text style={styles.mealEmoji}>{meal.emoji || meal.imageEmoji || '🍽️'}</Text>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.mealMacros}>
              {meal.calories} cal | P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.viewRecipeBtnFull}
          onPress={() => onMealPress(meal)}
        >
          <Text style={styles.viewRecipeBtnText}>View Full Recipe</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Get meal by type from myMeals
  const getAddedMeal = (mealType: string): Meal | undefined => {
    return myMeals.find(m => m.mealType === mealType);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#84C225" />
        <Text style={styles.loadingText}>Creating your personalized plan...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>👤 Welcome, {user.fullName}!</Text>
            <Text style={styles.streakText}>Streak: 🔥 {user.streak || 0} days</Text>
          </View>
        </View>

        {/* Today's Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>📊 TODAY'S OVERVIEW</Text>
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dailyTotals.calories}</Text>
              <Text style={styles.statLabel}>/ {calorieTarget} cal</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min((dailyTotals.calories / calorieTarget) * 100, 100)}%` }
                ]} 
              />
            </View>
          </View>
          <View style={styles.macroRow}>
            <Text style={styles.macroText}>P: {dailyTotals.protein}g</Text>
            <Text style={styles.macroText}>C: {dailyTotals.carbs}g</Text>
            <Text style={styles.macroText}>F: {dailyTotals.fats}g</Text>
          </View>
        </View>

        {/* My Meals Section - Show added meals first */}
        {myMeals.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>🍽️ MY MEALS TODAY</Text>
            {getAddedMeal('breakfast') && renderAddedMealCard(getAddedMeal('breakfast')!, 'BREAKFAST', '🍳')}
            {getAddedMeal('lunch') && renderAddedMealCard(getAddedMeal('lunch')!, 'LUNCH', '🍱')}
            {getAddedMeal('snack') && renderAddedMealCard(getAddedMeal('snack')!, 'SNACKS', '🍎')}
            {getAddedMeal('dinner') && renderAddedMealCard(getAddedMeal('dinner')!, 'DINNER', '🍽️')}
          </View>
        )}

        {/* AI Suggestions Section - Show suggestions for meal types not yet added */}
        {(!addedMealTypes.has('breakfast') || !addedMealTypes.has('lunch') || !addedMealTypes.has('dinner') || !addedMealTypes.has('snack')) && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>🤖 AI SUGGESTIONS</Text>
            <Text style={styles.sectionSubtext}>Tap "🔄 New" for different options</Text>
            {renderSuggestedMealCard(suggestedPlan?.breakfast, 'BREAKFAST', '🍳', 'breakfast')}
            {renderSuggestedMealCard(suggestedPlan?.lunch, 'LUNCH', '🍱', 'lunch')}
            {renderSuggestedMealCard(suggestedPlan?.snacks?.[0], 'SNACKS', '🍎', 'snack')}
            {renderSuggestedMealCard(suggestedPlan?.dinner, 'DINNER', '🍽️', 'dinner')}
          </View>
        )}

        {/* Exercise Section */}
        <View style={styles.exerciseCard}>
          <Text style={styles.sectionTitle}>💪 TODAY'S EXERCISE</Text>
          <Text style={styles.exerciseTitle}>Morning Cardio - 30 minutes</Text>
          <Text style={styles.exerciseItem}>• Brisk Walking: 15 mins</Text>
          <Text style={styles.exerciseItem}>• Cycling: 15 mins</Text>
          <TouchableOpacity style={styles.startWorkoutBtn} onPress={onNavigateToExercise}>
            <Text style={styles.startWorkoutBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Health Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.sectionTitle}>💡 HEALTH TIP</Text>
          <Text style={styles.tipText}>{getHealthTip()}</Text>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#84C225',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  streakText: {
    fontSize: 14,
    color: '#E8F5D9',
    marginTop: 4,
  },
  overviewCard: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  overviewStats: {
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#84C225',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#84C225',
    borderRadius: 4,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  macroText: {
    fontSize: 14,
    color: '#666',
  },
  mealCard: {
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
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mealMacros: {
    fontSize: 12,
    color: '#666',
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewRecipeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#84C225',
    borderRadius: 8,
    marginRight: 8,
  },
  viewRecipeBtnText: {
    textAlign: 'center',
    color: '#84C225',
    fontWeight: '600',
  },
  addMealBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#84C225',
    borderRadius: 8,
    marginLeft: 8,
  },
  addMealBtnDisabled: {
    backgroundColor: '#E8F5D9',
  },
  addMealBtnText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
  addMealBtnTextDisabled: {
    color: '#2E7D32',
  },
  exerciseCard: {
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
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  exerciseItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  startWorkoutBtn: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  startWorkoutBtnText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  tipCard: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  // New styles for My Meals vs AI Suggestions
  sectionContainer: {
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  aiTagText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '600',
  },
  addedTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  addedTagText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  regenerateBtn: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  regenerateBtnText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  addedMealCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  viewRecipeBtnFull: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});

export default DashboardScreen;
