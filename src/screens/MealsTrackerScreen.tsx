import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, DailyLog } from '../types';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { professionalAIService, Meal, UserProfile } from '../services/professionalAIService';
import { isSupabaseConfigured } from '../config/supabase';
import { colors, shadows, spacing, borderRadius, typography } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MealsTrackerScreenProps {
  user: User;
  onViewDetails: (log: DailyLog) => void;
  onUpdateUser?: (user: User) => void;
}

const MealsTrackerScreen: React.FC<MealsTrackerScreenProps> = ({
  user,
  onViewDetails,
  onUpdateUser,
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
  
  // Loading state for smooth transitions
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Water intake state
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterTarget, setWaterTarget] = useState(8); // glasses per day
  
  // Day completion state
  const [isDayComplete, setIsDayComplete] = useState(false);
  
  // Recipe variations state
  const [showVariationsModal, setShowVariationsModal] = useState(false);
  const [selectedMealForVariations, setSelectedMealForVariations] = useState<DailyLog | null>(null);
  const [recipeVariations, setRecipeVariations] = useState<Meal[]>([]);
  const [loadingVariations, setLoadingVariations] = useState(false);
  
  // Loading animation
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  
  // Calculate water target based on user's diseases
  useEffect(() => {
    let target = 8; // default 8 glasses
    if (user.diseases) {
      if (user.diseases.includes('Diabetes')) target = 10;
      if (user.diseases.includes('Hypertension')) target = 10;
      if (user.diseases.includes('Kidney Disease')) target = 6;
    }
    setWaterTarget(target);
  }, [user.diseases]);

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

  // Start loading animation
  useEffect(() => {
    if (isLoading) {
      // Spin animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading]);

  useEffect(() => {
    loadDailyData();
    loadWeeklyData();
    loadWaterIntake();
  }, [selectedDate]);
  
  // Load water intake from storage
  const loadWaterIntake = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    try {
      const stored = await storageService.getWaterIntake(user.id, dateStr);
      setWaterIntake(stored || 0);
    } catch (error) {
      setWaterIntake(0);
    }
  };
  
  // Add water glass
  const addWaterGlass = async () => {
    if (waterIntake >= waterTarget) return;
    const newIntake = waterIntake + 1;
    setWaterIntake(newIntake);
    const dateStr = selectedDate.toISOString().split('T')[0];
    await storageService.saveWaterIntake(user.id, dateStr, newIntake);
  };
  
  // Remove water glass
  const removeWaterGlass = async () => {
    if (waterIntake <= 0) return;
    const newIntake = waterIntake - 1;
    setWaterIntake(newIntake);
    const dateStr = selectedDate.toISOString().split('T')[0];
    await storageService.saveWaterIntake(user.id, dateStr, newIntake);
  };
  
  // Mark day as complete and update streak
  const markDayComplete = async () => {
    const mealsComplete = dailyLogs.length >= 3; // At least 3 meals
    const waterComplete = waterIntake >= waterTarget;
    
    if (!mealsComplete || !waterComplete) {
      Alert.alert(
        'Cannot Complete Day',
        `Please complete:\n${!mealsComplete ? '• Log at least 3 meals\n' : ''}${!waterComplete ? `• Drink ${waterTarget} glasses of water` : ''}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsDayComplete(true);
    
    // Update streak in database
    const newStreak = (user.streak || 0) + 1;
    const updatedUser = {
      ...user,
      streak: newStreak,
      longestStreak: Math.max(user.longestStreak || 0, newStreak),
    };
    
    try {
      if (isSupabaseConfigured) {
        await databaseService.updateUserProfile(updatedUser);
      }
      await storageService.saveUser(updatedUser);
      
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      
      Alert.alert(
        '🎉 Day Complete!',
        `Great job! Your streak is now ${newStreak} days!`,
        [{ text: 'Awesome!' }]
      );
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const loadDailyData = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Try to get logs from Supabase first, then fall back to local storage
      let logs: DailyLog[] = [];
      
      if (isSupabaseConfigured) {
        try {
          logs = await databaseService.getDailyLogs(dateStr);
        console.log('📥 Loaded', logs.length, 'meals from Supabase for', dateStr);
      } catch (error) {
        console.log('Failed to load from Supabase, using local storage');
      }
    }
    
    // If no logs from Supabase, try local storage
    if (logs.length === 0) {
      logs = await storageService.getDailyLogs(user.id, dateStr);
      console.log('📥 Loaded', logs.length, 'meals from local storage for', dateStr);
    }
    
    // Remove duplicates by meal_type (keep only the latest)
    const uniqueLogs = logs.reduce((acc: DailyLog[], log) => {
      const existingIndex = acc.findIndex(l => l.meal_type === log.meal_type);
      if (existingIndex === -1) {
        acc.push(log);
      } else {
        // Keep the newer one
        const existingTime = acc[existingIndex].created_at ? new Date(acc[existingIndex].created_at) : new Date(0);
        const newTime = log.created_at ? new Date(log.created_at) : new Date(0);
        if (newTime > existingTime) {
          acc[existingIndex] = log;
        }
      }
      return acc;
    }, []);
    
    setDailyLogs(uniqueLogs);
    
    // Calculate totals from the logs we have
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      mealsCount: uniqueLogs.length,
    };
    
    uniqueLogs.forEach(log => {
      if (log.nutrition_consumed) {
        totals.calories += log.nutrition_consumed.calories || 0;
        totals.protein += log.nutrition_consumed.protein || 0;
        totals.carbs += log.nutrition_consumed.carbs || 0;
        totals.fats += log.nutrition_consumed.fats || 0;
      }
    });
    
    setDailyTotals(totals);
    } catch (error) {
      console.error('Error loading daily data:', error);
    } finally {
      // Ensure minimum 4 second loading for professional feel
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 4000 - elapsedTime);
      setTimeout(() => setIsLoading(false), remainingTime);
    }
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
      
      // Try Supabase first
      let logs: DailyLog[] = [];
      if (isSupabaseConfigured) {
        try {
          logs = await databaseService.getDailyLogs(dateStr);
        } catch (error) {
          logs = await storageService.getDailyLogs(user.id, dateStr);
        }
      } else {
        logs = await storageService.getDailyLogs(user.id, dateStr);
      }
      
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
            
            // Remove from both Supabase and local storage
            if (isSupabaseConfigured) {
              await databaseService.deleteDailyLog(logId);
            }
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

  // Loading screen with animated icons
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingScreen}>
          {/* Professional Loader */}
          <View style={styles.loaderContainer}>
            {/* Outer Ring */}
            <Animated.View style={[styles.loaderRing, { transform: [{ rotate: spin }] }]}>
              <View style={styles.loaderRingGradient} />
            </Animated.View>
            
            {/* Inner Circle with Icon */}
            <View style={styles.loaderInner}>
              <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
                <Text style={styles.loaderIcon}>🍽️</Text>
              </Animated.View>
            </View>
          </View>
          
          {/* Loading Text */}
          <Text style={styles.loadingTitle}>Loading Meals</Text>
          <Text style={styles.loadingSubtitle}>Preparing your nutrition dashboard...</Text>
          
          {/* Animated Progress Dots */}
          <View style={styles.loadingDotsRow}>
            <Animated.View style={[styles.loadingDotAnimated, { opacity: pulseValue }]} />
            <Animated.View style={[styles.loadingDotAnimated, styles.loadingDotDelay1]} />
            <Animated.View style={[styles.loadingDotAnimated, styles.loadingDotDelay2]} />
          </View>
          
          {/* Food Icons Row */}
          <View style={styles.loadingFoodRow}>
            <View style={styles.loadingFoodItem}>
              <Text style={styles.loadingFoodIcon}>🍳</Text>
              <Text style={styles.loadingFoodLabel}>Breakfast</Text>
            </View>
            <View style={styles.loadingFoodItem}>
              <Text style={styles.loadingFoodIcon}>🥗</Text>
              <Text style={styles.loadingFoodLabel}>Lunch</Text>
            </View>
            <View style={styles.loadingFoodItem}>
              <Text style={styles.loadingFoodIcon}>🍎</Text>
              <Text style={styles.loadingFoodLabel}>Snacks</Text>
            </View>
            <View style={styles.loadingFoodItem}>
              <Text style={styles.loadingFoodIcon}>🍲</Text>
              <Text style={styles.loadingFoodLabel}>Dinner</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Meal Tracker</Text>
              <Text style={styles.headerSubtitle}>
                {user.diseases && user.diseases.length > 0 
                  ? `Optimized for ${user.diseases[0]}`
                  : 'Track your daily nutrition'}
              </Text>
            </View>
            <View style={styles.streakBadgeHeader}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakCountHeader}>{user.streak || 0}</Text>
            </View>
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <Text style={styles.dateDayName}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Progress Cards Row */}
        <View style={styles.progressCardsRow}>
          {/* Calories Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressCardIcon}>
              <Text style={styles.progressCardEmoji}>🔥</Text>
            </View>
            <Text style={styles.progressCardValue}>{dailyTotals.calories}</Text>
            <Text style={styles.progressCardLabel}>/ {calorieTarget} cal</Text>
            <View style={styles.miniProgressBar}>
              <View style={[styles.miniProgressFill, { width: `${Math.min(progressPercentage, 100)}%` }]} />
            </View>
          </View>
          
          {/* Water Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressCardIcon}>
              <Text style={styles.progressCardEmoji}>💧</Text>
            </View>
            <Text style={styles.progressCardValue}>{waterIntake}</Text>
            <Text style={styles.progressCardLabel}>/ {waterTarget} glasses</Text>
            <View style={styles.miniProgressBar}>
              <View style={[styles.miniProgressFill, styles.waterFill, { width: `${Math.min((waterIntake / waterTarget) * 100, 100)}%` }]} />
            </View>
          </View>
        </View>

        {/* Water Intake Section */}
        <View style={styles.waterSection}>
          <Text style={styles.sectionTitle}>💧 Daily Water Intake</Text>
          {user.diseases && user.diseases.length > 0 && (
            <Text style={styles.waterRecommendation}>
              Recommended: {waterTarget} glasses for {user.diseases[0]}
            </Text>
          )}
          <View style={styles.waterGlasses}>
            {[...Array(waterTarget)].map((_, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.waterGlass, index < waterIntake && styles.waterGlassFilled]}
                onPress={() => index < waterIntake ? removeWaterGlass() : addWaterGlass()}
              >
                <Text style={styles.waterGlassIcon}>{index < waterIntake ? '💧' : '○'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.waterActions}>
            <TouchableOpacity style={styles.waterBtn} onPress={removeWaterGlass} disabled={waterIntake <= 0}>
              <Text style={styles.waterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.waterCount}>{waterIntake} / {waterTarget}</Text>
            <TouchableOpacity style={[styles.waterBtn, styles.waterBtnAdd]} onPress={addWaterGlass} disabled={waterIntake >= waterTarget}>
              <Text style={[styles.waterBtnText, styles.waterBtnTextAdd]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Macros Summary */}
        <View style={styles.macrosSection}>
          <Text style={styles.sectionTitle}>📊 Nutrition Breakdown</Text>
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.protein }]} />
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{dailyTotals.protein}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.carbs }]} />
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{dailyTotals.carbs}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.fats }]} />
              <Text style={styles.macroLabel}>Fats</Text>
              <Text style={styles.macroValue}>{dailyTotals.fats}g</Text>
            </View>
          </View>
        </View>

        {/* Your Meals Section */}
        <View style={styles.mealsSection}>
          <View style={styles.mealsSectionHeader}>
            <Text style={styles.sectionTitle}>Your Meals</Text>
            <View style={styles.mealsBadge}>
              <Text style={styles.mealsBadgeText}>{dailyLogs.length}/4</Text>
            </View>
          </View>
          
          {dailyLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>🍽️</Text>
              </View>
              <Text style={styles.emptyText}>No meals logged today</Text>
              <Text style={styles.emptySubtext}>
                Add meals from Home to start tracking
              </Text>
            </View>
          ) : (
            dailyLogs.map((log, index) => (
              <View key={log.id} style={styles.mealCardAdvanced}>
                {/* Meal Type Badge */}
                <View style={styles.mealTypeBadge}>
                  <Text style={styles.mealTypeBadgeText}>{log.meal_type.toUpperCase()}</Text>
                </View>
                
                {/* Meal Content */}
                <View style={styles.mealCardContent}>
                  <View style={styles.mealCardLeft}>
                    <View style={styles.mealEmojiContainer}>
                      <Text style={styles.mealCardEmoji}>{log.emoji || getMealIcon(log.meal_type)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.mealCardCenter}>
                    <Text style={styles.mealCardName} numberOfLines={2}>{log.food_name}</Text>
                    <Text style={styles.mealCardTime}>{formatTime(log.created_at)}</Text>
                    
                    {/* Nutrition Pills */}
                    <View style={styles.nutritionPills}>
                      <View style={[styles.nutritionPill, styles.caloriePill]}>
                        <Text style={styles.nutritionPillText}>{log.nutrition_consumed?.calories || 0} cal</Text>
                      </View>
                      <View style={styles.nutritionPill}>
                        <Text style={styles.nutritionPillText}>P {log.nutrition_consumed?.protein || 0}g</Text>
                      </View>
                      <View style={styles.nutritionPill}>
                        <Text style={styles.nutritionPillText}>C {log.nutrition_consumed?.carbs || 0}g</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.mealCardActions}>
                  <TouchableOpacity
                    style={styles.alternativeBtnAdvanced}
                    onPress={() => handleShowVariations(log)}
                  >
                    <Text style={styles.alternativeBtnIcon}>🔄</Text>
                    <Text style={styles.alternativeBtnTextAdvanced}>Alternative</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtnAdvanced}
                    onPress={() => handleRemoveMeal(log.id)}
                  >
                    <Text style={styles.removeBtnIcon}>✕</Text>
                    <Text style={styles.removeBtnTextAdvanced}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* ===== MARK DAY COMPLETE - PROFESSIONAL GREEN BUTTON ===== */}
        <View style={styles.markCompleteSection}>
          <TouchableOpacity
            style={[
              styles.markCompleteBtn,
              (dailyLogs.length >= 3 && waterIntake >= waterTarget) && styles.markCompleteBtnReady,
              isDayComplete && styles.markCompleteBtnDone
            ]}
            onPress={markDayComplete}
            disabled={isDayComplete}
            activeOpacity={0.85}
          >
            {/* Gradient Background Effect */}
            <View style={[
              styles.markCompleteBtnBg,
              (dailyLogs.length >= 3 && waterIntake >= waterTarget) && styles.markCompleteBtnBgReady,
              isDayComplete && styles.markCompleteBtnBgDone
            ]} />
            
            {/* Content */}
            <View style={styles.markCompleteContent}>
              {/* Icon Circle */}
              <View style={[
                styles.markCompleteIcon,
                (dailyLogs.length >= 3 && waterIntake >= waterTarget) && styles.markCompleteIconReady,
                isDayComplete && styles.markCompleteIconDone
              ]}>
                <Text style={styles.markCompleteEmoji}>
                  {isDayComplete ? '🎉' : (dailyLogs.length >= 3 && waterIntake >= waterTarget) ? '✓' : '🎯'}
                </Text>
              </View>
              
              {/* Text Content */}
              <View style={styles.markCompleteTextWrap}>
                <Text style={[
                  styles.markCompleteTitle,
                  (dailyLogs.length >= 3 && waterIntake >= waterTarget) && styles.markCompleteTitleReady,
                  isDayComplete && styles.markCompleteTitleDone
                ]}>
                  {isDayComplete ? '🎊 Day Completed!' : 'Mark Day Complete'}
                </Text>
                {!isDayComplete && (
                  <View style={styles.markCompleteStats}>
                    <View style={styles.markCompleteStat}>
                      <Text style={styles.markCompleteStatIcon}>🍽️</Text>
                      <Text style={styles.markCompleteStatText}>{dailyLogs.length}/3</Text>
                    </View>
                    <View style={styles.markCompleteStatDivider} />
                    <View style={styles.markCompleteStat}>
                      <Text style={styles.markCompleteStatIcon}>💧</Text>
                      <Text style={styles.markCompleteStatText}>{waterIntake}/{waterTarget}</Text>
                    </View>
                  </View>
                )}
              </View>
              
              {/* Arrow/Check */}
              {!isDayComplete && (
                <View style={[
                  styles.markCompleteArrow,
                  (dailyLogs.length >= 3 && waterIntake >= waterTarget) && styles.markCompleteArrowReady
                ]}>
                  <Text style={styles.markCompleteArrowText}>→</Text>
                </View>
              )}
            </View>
            
            {/* Progress Bar */}
            {!isDayComplete && (
              <View style={styles.markCompleteProgress}>
                <View style={[styles.markCompleteProgressFill, { 
                  width: `${Math.min(((dailyLogs.length / 3) * 50) + ((waterIntake / waterTarget) * 50), 100)}%` 
                }]} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ===== WEEKLY PROGRESS - PROFESSIONAL GREEN DESIGN ===== */}
        <View style={styles.weeklySection}>
          {/* Header */}
          <View style={styles.weeklySectionHeader}>
            <View>
              <Text style={styles.weeklySectionTitle}>Weekly Progress</Text>
              <Text style={styles.weeklySectionSubtitle}>Track your consistency</Text>
            </View>
            <View style={styles.weeklyStreakBadge}>
              <Text style={styles.weeklyStreakFire}>🔥</Text>
              <Text style={styles.weeklyStreakCount}>{user.streak || 0}</Text>
              <Text style={styles.weeklyStreakLabel}>day streak</Text>
            </View>
          </View>
          
          {/* Days Grid */}
          <View style={styles.weeklyDaysGrid}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const dayNum = index === 6 ? 0 : index + 1;
              const isToday = new Date().getDay() === dayNum;
              const isComplete = weeklyData[index];
              return (
                <View key={index} style={styles.weeklyDayColumn}>
                  <Text style={[
                    styles.weeklyDayLabel,
                    isToday && styles.weeklyDayLabelToday
                  ]}>{day}</Text>
                  <View style={[
                    styles.weeklyDayCircle,
                    isComplete && styles.weeklyDayCircleComplete,
                    isToday && !isComplete && styles.weeklyDayCircleToday
                  ]}>
                    {isComplete ? (
                      <Text style={styles.weeklyDayCheckmark}>✓</Text>
                    ) : (
                      <View style={styles.weekDayDot} />
                    )}
                  </View>
                </View>
              );
            })}
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
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  
  // Loading Screen
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  loadingIcon: {
    fontSize: 64,
  },
  loadingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  loadingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
  },
  loadingDotActive: {
    backgroundColor: colors.primary,
  },
  
  // Header
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  streakBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  streakIcon: {
    fontSize: 16,
  },
  streakCountHeader: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  
  // Date Selector
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  dateArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: typography.fontWeight.light,
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  dateDayName: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  
  // Progress Cards
  progressCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  progressCardIcon: {
    marginBottom: spacing.xs,
  },
  progressCardEmoji: {
    fontSize: 24,
  },
  progressCardValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  progressCardLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  miniProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  waterFill: {
    backgroundColor: colors.info,
  },
  
  // Water Section
  waterSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  waterRecommendation: {
    fontSize: typography.fontSize.xs,
    color: colors.info,
    marginBottom: spacing.sm,
  },
  waterGlasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  waterGlass: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterGlassFilled: {
    backgroundColor: colors.info + '20',
  },
  waterGlassIcon: {
    fontSize: 20,
  },
  waterActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  waterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterBtnAdd: {
    backgroundColor: colors.info,
  },
  waterBtnText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
  waterBtnTextAdd: {
    color: '#FFFFFF',
  },
  waterCount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  
  // Macros Section
  macrosSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  
  // Meals Section
  mealsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  
  // Complete Button
  completeBtn: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completeBtnActive: {
    backgroundColor: colors.primary,
  },
  completeBtnDone: {
    backgroundColor: colors.success,
  },
  completeBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  completeBtnTextActive: {
    color: '#FFFFFF',
  },
  completeBtnSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  
  // Meal Log Cards
  mealLogTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  alternativeBtn: {
    flex: 1,
    backgroundColor: colors.info + '15',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  alternativeBtnText: {
    fontSize: typography.fontSize.sm,
    color: colors.info,
    fontWeight: typography.fontWeight.medium,
  },
  summaryCard: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.card,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  summaryPercent: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  calorieValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  calorieTarget: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  calorieText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginHorizontal: 2,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  mealLogCard: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    ...shadows.card,
  },
  mealLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealLogIcon: {
    fontSize: 36,
    marginRight: spacing.sm,
  },
  mealLogInfo: {
    flex: 1,
  },
  mealLogType: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  mealLogName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  mealLogCalories: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  mealLogActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  viewDetailsBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  viewDetailsBtnText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
  },
  removeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
  },
  removeBtnText: {
    textAlign: 'center',
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
  },
  weeklyCard: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.card,
  },
  weeklyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  weekDayItem: {
    alignItems: 'center',
    flex: 1,
  },
  weekDayText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  weekDayStatus: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  streakInfo: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  streakText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
  },
  // Variations button styles
  variationsBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.md,
    marginRight: spacing.xs,
  },
  variationsBtnText: {
    textAlign: 'center',
    color: colors.info,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.xs,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textOnPrimary,
    flex: 1,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textOnPrimary,
    paddingLeft: spacing.md,
  },
  modalSubtitle: {
    padding: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    backgroundColor: colors.background,
  },
  variationsList: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  variationCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  variationHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  variationEmoji: {
    fontSize: 40,
    marginRight: spacing.sm,
  },
  variationInfo: {
    flex: 1,
  },
  variationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  variationDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  variationMacros: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  replaceBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
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
  
  // ========== PROFESSIONAL LOADING STYLES ==========
  loaderContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  loaderRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.surfaceLight,
    borderTopColor: colors.primary,
    borderRightColor: colors.primary,
  },
  loaderRingGradient: {
    width: '100%',
    height: '100%',
  },
  loaderInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  loaderIcon: {
    fontSize: 40,
  },
  loadingDotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  loadingDotAnimated: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 0.3,
  },
  loadingFoodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  loadingFoodItem: {
    alignItems: 'center',
  },
  loadingFoodIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  loadingFoodLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  
  // ========== MEALS SECTION HEADER ==========
  mealsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealsBadge: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  mealsBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  
  // ========== ADVANCED MEAL CARDS ==========
  mealCardAdvanced: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  mealTypeBadge: {
    backgroundColor: colors.primaryPale,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  mealTypeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  mealCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  mealCardLeft: {
    marginRight: spacing.md,
  },
  mealEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCardEmoji: {
    fontSize: 28,
  },
  mealCardCenter: {
    flex: 1,
  },
  mealCardName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  mealCardTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  nutritionPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  nutritionPill: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  caloriePill: {
    backgroundColor: colors.primary + '20',
  },
  nutritionPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  mealCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  alternativeBtnAdvanced: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  alternativeBtnIcon: {
    fontSize: 16,
  },
  alternativeBtnTextAdvanced: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  removeBtnAdvanced: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '15',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  removeBtnIcon: {
    fontSize: 14,
    color: colors.error,
  },
  removeBtnTextAdvanced: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
  },
  
  // ========== ADVANCED COMPLETE BUTTON ==========
  completeBtnContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  completeBtnAdvanced: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  completeBtnReady: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  completeBtnCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  completeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeBtnIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  completeBtnEmoji: {
    fontSize: 24,
  },
  completeBtnTextContainer: {
    flex: 1,
  },
  completeBtnTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  completeBtnTitleReady: {
    color: colors.primary,
  },
  completeBtnTitleDone: {
    color: '#FFFFFF',
  },
  completeBtnProgress: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  completeBtnProgressBar: {
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  completeBtnProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  
  // ========== ADVANCED WEEKLY VIEW ==========
  weeklyCardAdvanced: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  weeklyTitleAdvanced: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  streakBadgeWeekly: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  streakEmojiWeekly: {
    fontSize: 14,
  },
  streakCountWeekly: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  weekDaysAdvanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayAdvanced: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    minWidth: 40,
  },
  weekDayComplete: {
    backgroundColor: colors.primaryPale,
  },
  weekDayToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  weekDayLetter: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  weekDayLetterComplete: {
    color: colors.primary,
  },
  weekDayLetterToday: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  weekDayIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayIndicatorComplete: {
    backgroundColor: colors.primary,
  },
  weekDayCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  weekDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  
  // ========== PROFESSIONAL MARK COMPLETE BUTTON ==========
  markCompleteSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  markCompleteBtn: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  markCompleteBtnReady: {
    transform: [{ scale: 1 }],
  },
  markCompleteBtnDone: {
    opacity: 0.9,
  },
  markCompleteBtnBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  markCompleteBtnBgReady: {
    backgroundColor: colors.primary,
  },
  markCompleteBtnBgDone: {
    backgroundColor: colors.primary,
  },
  markCompleteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  markCompleteIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  markCompleteIconReady: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  markCompleteIconDone: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  markCompleteEmoji: {
    fontSize: 28,
  },
  markCompleteTextWrap: {
    flex: 1,
  },
  markCompleteTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  markCompleteTitleReady: {
    color: '#FFFFFF',
  },
  markCompleteTitleDone: {
    color: '#FFFFFF',
  },
  markCompleteStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  markCompleteStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markCompleteStatIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  markCompleteStatText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  markCompleteStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  markCompleteArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCompleteArrowReady: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  markCompleteArrowText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
  markCompleteProgress: {
    height: 4,
    backgroundColor: colors.surfaceLight,
    marginTop: 0,
  },
  markCompleteProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  
  // ========== PROFESSIONAL WEEKLY SECTION ==========
  weeklySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  weeklySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  weeklySectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  weeklySectionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  weeklyStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  weeklyStreakFire: {
    fontSize: 16,
  },
  weeklyStreakCount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  weeklyStreakLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  weeklyDaysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyDayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyDayLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  weeklyDayLabelToday: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  weeklyDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyDayCircleComplete: {
    backgroundColor: colors.primary,
  },
  weeklyDayCircleToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  weeklyDayCheckmark: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});

export default MealsTrackerScreen;
