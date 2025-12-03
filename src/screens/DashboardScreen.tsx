import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { professionalAIService, Meal, DayPlan } from '../services/professionalAIService';
import { isSupabaseConfigured } from '../config/supabase';
import { colors, shadows, spacing, borderRadius, typography } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // Render a SUGGESTED meal card (AI generated, can be regenerated) - IMPROVED DESIGN
  const renderSuggestedMealCard = (meal: Meal | undefined, title: string, icon: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!meal) return null;
    if (addedMealTypes.has(mealType)) return null;
    
    return (
      <View style={styles.suggestionCard}>
        {/* Card Header with Meal Type */}
        <View style={styles.suggestionHeader}>
          <View style={styles.suggestionTypeContainer}>
            <Text style={styles.suggestionTypeIcon}>{icon}</Text>
            <Text style={styles.suggestionTypeText}>{title}</Text>
          </View>
          <View style={styles.suggestionAIBadge}>
            <Text style={styles.suggestionAIText}>🤖 AI</Text>
          </View>
        </View>
        
        {/* Main Content */}
        <View style={styles.suggestionContent}>
          <View style={styles.suggestionEmojiCircle}>
            <Text style={styles.suggestionEmoji}>{meal.emoji || meal.imageEmoji || '🍽️'}</Text>
          </View>
          <Text style={styles.suggestionName} numberOfLines={2}>{meal.name}</Text>
          
          {/* Nutrition Pills */}
          <View style={styles.suggestionNutrition}>
            <View style={styles.nutritionPillCalories}>
              <Text style={styles.nutritionPillText}>🔥 {meal.calories} cal</Text>
            </View>
          </View>
          
          {/* Macro Row */}
          <View style={styles.suggestionMacroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{meal.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{meal.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{meal.fats}g</Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.suggestionActions}>
          <TouchableOpacity
            style={styles.suggestionViewBtn}
            onPress={() => onMealPress(meal)}
          >
            <Text style={styles.suggestionViewBtnText}>👁️ View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.suggestionAddBtn}
            onPress={() => handleAddToMeals(meal)}
          >
            <Text style={styles.suggestionAddBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        
        {/* Refresh Button */}
        <TouchableOpacity 
          style={styles.suggestionRefresh}
          onPress={() => regenerateMeal(mealType)}
          disabled={regenerating}
        >
          <Text style={styles.suggestionRefreshText}>
            {regenerating ? '⏳ Generating...' : '🔄 New Suggestion'}
          </Text>
        </TouchableOpacity>
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
            <Text style={styles.mealName} numberOfLines={2} ellipsizeMode="tail">{meal.name}</Text>
            <Text style={styles.mealMacros} numberOfLines={1}>
              {meal.calories} cal | P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.viewRecipeBtnFull}
          onPress={() => onMealPress(meal)}
        >
          <Text style={styles.viewRecipeBtnText}>View Recipe</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Get meal by type from myMeals
  const getAddedMeal = (mealType: string): Meal | undefined => {
    return myMeals.find(m => m.mealType === mealType);
  };

  // Circular Progress Component
  const CircularProgress = ({ progress, size = 120, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progressValue = Math.min(progress, 100);
    
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.circularBg, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth }]} />
        <View style={[styles.circularProgress, { 
          width: size, 
          height: size, 
          borderRadius: size / 2, 
          borderWidth: strokeWidth,
          borderColor: colors.primary,
          borderRightColor: 'transparent',
          borderBottomColor: progressValue > 25 ? colors.primary : 'transparent',
          borderLeftColor: progressValue > 50 ? colors.primary : 'transparent',
          borderTopColor: progressValue > 75 ? colors.primary : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }]} />
        <View style={styles.circularCenter}>
          <Text style={styles.circularValue}>{dailyTotals.calories}</Text>
          <Text style={styles.circularLabel}>of {calorieTarget}</Text>
        </View>
      </View>
    );
  };

  // Macro Progress Bar
  const MacroBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroBarHeader}>
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={styles.macroBarValue}>{value}g</Text>
      </View>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Creating your personalized plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{(() => {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) return 'Good Morning';
                if (hour >= 12 && hour < 17) return 'Good Afternoon';
                if (hour >= 17 && hour < 21) return 'Good Evening';
                return 'Good Night';
              })()},</Text>
              <Text style={styles.userName}>{user.fullName || 'User'}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{user.streak || 0}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        {/* Stats Overview Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          
          <View style={styles.statsGrid}>
            {/* Calories Card */}
            <View style={[styles.statsCard, styles.caloriesCard]}>
              <CircularProgress progress={(dailyTotals.calories / calorieTarget) * 100} />
              <Text style={styles.statsCardLabel}>Calories</Text>
            </View>
            
            {/* Macros Card */}
            <View style={[styles.statsCard, styles.macrosCard]}>
              <MacroBar label="Protein" value={dailyTotals.protein} max={Math.round(calorieTarget * 0.25 / 4)} color={colors.protein} />
              <MacroBar label="Carbs" value={dailyTotals.carbs} max={Math.round(calorieTarget * 0.45 / 4)} color={colors.carbs} />
              <MacroBar label="Fats" value={dailyTotals.fats} max={Math.round(calorieTarget * 0.30 / 9)} color={colors.fats} />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onNavigateToRecipes}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>+</Text>
            </View>
            <Text style={styles.quickActionText}>Log Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionBtn, styles.quickActionOutline]} onPress={onNavigateToExercise}>
            <View style={[styles.quickActionIcon, styles.quickActionIconOutline]}>
              <Text style={[styles.quickActionEmoji, { color: colors.primary }]}>♡</Text>
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Exercise</Text>
          </TouchableOpacity>
        </View>

        {/* My Meals Section */}
        {myMeals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Meals Today</Text>
              <View style={styles.mealCount}>
                <Text style={styles.mealCountText}>{myMeals.length} logged</Text>
              </View>
            </View>
            <View style={styles.mealsTimeline}>
              {getAddedMeal('breakfast') && renderAddedMealCard(getAddedMeal('breakfast')!, 'Breakfast', '🍳')}
              {getAddedMeal('lunch') && renderAddedMealCard(getAddedMeal('lunch')!, 'Lunch', '🥗')}
              {getAddedMeal('snack') && renderAddedMealCard(getAddedMeal('snack')!, 'Snack', '🍎')}
              {getAddedMeal('dinner') && renderAddedMealCard(getAddedMeal('dinner')!, 'Dinner', '🍽️')}
            </View>
          </View>
        )}

        {/* AI Suggestions Section */}
        {(!addedMealTypes.has('breakfast') || !addedMealTypes.has('lunch') || !addedMealTypes.has('dinner') || !addedMealTypes.has('snack')) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suggested for You</Text>
              <TouchableOpacity onPress={() => generateSuggestions(addedMealTypes)}>
                <Text style={styles.refreshLink}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtext}>AI-powered recommendations based on your goals</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.suggestionsScroll}
              contentContainerStyle={styles.suggestionsScrollContent}
            >
              {!addedMealTypes.has('breakfast') && suggestedPlan?.breakfast && renderSuggestedMealCard(suggestedPlan.breakfast, 'Breakfast', '🍳', 'breakfast')}
              {!addedMealTypes.has('lunch') && suggestedPlan?.lunch && renderSuggestedMealCard(suggestedPlan.lunch, 'Lunch', '🥗', 'lunch')}
              {!addedMealTypes.has('snack') && suggestedPlan?.snacks?.[0] && renderSuggestedMealCard(suggestedPlan.snacks[0], 'Snack', '🍎', 'snack')}
              {!addedMealTypes.has('dinner') && suggestedPlan?.dinner && renderSuggestedMealCard(suggestedPlan.dinner, 'Dinner', '🍽️', 'dinner')}
            </ScrollView>
          </View>
        )}

        {/* Health Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipTitle}>Daily Tip</Text>
          </View>
          <Text style={styles.tipText}>{getHealthTip()}</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  
  // Header
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  streakBadge: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  streakLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primaryDark,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  
  // Stats Section
  statsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  caloriesCard: {
    flex: 1,
    alignItems: 'center',
  },
  macrosCard: {
    flex: 1.2,
    justifyContent: 'center',
  },
  statsCardLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  
  // Circular Progress
  circularBg: {
    position: 'absolute',
    borderColor: colors.surfaceLight,
  },
  circularProgress: {
    position: 'absolute',
  },
  circularCenter: {
    alignItems: 'center',
  },
  circularValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  circularLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  
  // Macro Bars
  macroBarContainer: {
    marginBottom: spacing.sm,
  },
  macroBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroBarLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  macroBarValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  macroBarTrack: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  quickActionOutline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconOutline: {
    backgroundColor: colors.primaryPale,
  },
  quickActionEmoji: {
    fontSize: 16,
    color: colors.textOnPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textOnPrimary,
  },
  
  // Sections
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  refreshLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  mealCount: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  mealCountText: {
    fontSize: typography.fontSize.xs,
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.medium,
  },
  mealsTimeline: {
    marginTop: spacing.sm,
  },
  suggestionsScroll: {
    marginHorizontal: -spacing.lg,
  },
  suggestionsScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xl,
    paddingBottom: spacing.md,
  },
  
  // Meal Cards
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
    width: SCREEN_WIDTH * 0.75,
    marginRight: spacing.sm,
  },
  addedMealCard: {
    width: '100%',
    marginRight: 0,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  mealTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiTag: {
    backgroundColor: colors.info + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  aiTagText: {
    fontSize: 9,
    color: colors.info,
    fontWeight: typography.fontWeight.semibold,
  },
  addedTag: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  addedTagText: {
    fontSize: 9,
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.semibold,
  },
  regenerateBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  regenerateBtnText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealEmoji: {
    fontSize: 40,
    marginRight: spacing.sm,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  mealMacros: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  mealActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  viewRecipeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  viewRecipeBtnText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  addMealBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addMealBtnText: {
    fontSize: typography.fontSize.sm,
    color: colors.textOnPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  viewRecipeBtnFull: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  
  // Tip Card
  tipCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.primaryPale,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tipIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  tipTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primaryDark,
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  bottomSpacer: {
    height: spacing.xl,
  },
  
  // ========== IMPROVED SUGGESTION CARD STYLES ==========
  suggestionCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    marginRight: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primaryPale,
  },
  suggestionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  suggestionTypeIcon: {
    fontSize: 18,
  },
  suggestionTypeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  suggestionAIBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  suggestionAIText: {
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.medium,
  },
  suggestionContent: {
    padding: spacing.md,
    alignItems: 'center',
  },
  suggestionEmojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  suggestionEmoji: {
    fontSize: 32,
  },
  suggestionName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  suggestionNutrition: {
    marginBottom: spacing.sm,
  },
  nutritionPillCalories: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  nutritionPillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  suggestionMacroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  macroLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  suggestionViewBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  suggestionViewBtnText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  suggestionAddBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  suggestionAddBtnText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.semibold,
  },
  suggestionRefresh: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  suggestionRefreshText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

export default DashboardScreen;
