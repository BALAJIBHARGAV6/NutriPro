import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, shadows, spacing, borderRadius, typography } from '../constants/theme';
import { databaseService } from '../services/databaseService';
import { storageService } from '../services/storageService';
import { professionalAIService, Meal, UserProfile } from '../services/professionalAIService';
import { isSupabaseConfigured } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WeeklyMealPlanProps {
  userId: string;
  userProfile: UserProfile;
  onMealPress: (meal: Meal) => void;
  onAddMeal: (meal: Meal, date: string) => void;
}

interface DayPlan {
  date: string;
  dayName: string;
  isToday: boolean;
  meals: {
    breakfast?: Meal;
    lunch?: Meal;
    dinner?: Meal;
    snack?: Meal;
  };
}

const WeeklyMealPlan: React.FC<WeeklyMealPlanProps> = ({
  userId,
  userProfile,
  onMealPress,
  onAddMeal,
}) => {
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadWeekPlan();
  }, []);

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const loadWeekPlan = async () => {
    try {
      setLoading(true);
      const weekDates = getWeekDates();
      const today = new Date().toISOString().split('T')[0];
      
      // Load saved week plan from storage
      const savedPlanStr = await AsyncStorage.getItem(`weekly_plan_${userId}`);
      const savedPlan = savedPlanStr ? JSON.parse(savedPlanStr) : null;
      
      const plans: DayPlan[] = [];
      let todayIndex = 0;

      for (let i = 0; i < weekDates.length; i++) {
        const date = weekDates[i];
        const dateStr = date.toISOString().split('T')[0];
        const isToday = dateStr === today;
        if (isToday) todayIndex = i;

        // Check if we have meals for this date
        let dayMeals: DayPlan['meals'] = {};

        // First check saved plan
        if (savedPlan && savedPlan[dateStr]) {
          dayMeals = savedPlan[dateStr];
        } else {
          // Try to load from database
          try {
            let meals: Meal[] = [];
            if (isSupabaseConfigured) {
              meals = await databaseService.getMyMeals(dateStr);
            }
            
            meals.forEach((meal) => {
              if (meal.mealType === 'breakfast') dayMeals.breakfast = meal;
              else if (meal.mealType === 'lunch') dayMeals.lunch = meal;
              else if (meal.mealType === 'dinner') dayMeals.dinner = meal;
              else if (meal.mealType === 'snack') dayMeals.snack = meal;
            });
          } catch (err) {
            console.log('No meals for', dateStr);
          }
        }

        plans.push({
          date: dateStr,
          dayName: fullDayNames[date.getDay()],
          isToday,
          meals: dayMeals,
        });
      }

      setWeekPlan(plans);
      setSelectedDay(todayIndex);
    } catch (error) {
      console.error('Error loading week plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeekPlan = async () => {
    try {
      setGenerating(true);
      Alert.alert(
        'Generate Week Plan',
        'This will generate AI meal suggestions for the entire week. Continue?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setGenerating(false) },
          {
            text: 'Generate',
            onPress: async () => {
              try {
                const weekDates = getWeekDates();
                const newPlan: Record<string, DayPlan['meals']> = {};

                for (const date of weekDates) {
                  const dateStr = date.toISOString().split('T')[0];
                  
                  // Generate meals for each day
                  const dayPlan = await professionalAIService.generateDayPlan(userProfile);
                  
                  newPlan[dateStr] = {
                    breakfast: dayPlan.breakfast,
                    lunch: dayPlan.lunch,
                    dinner: dayPlan.dinner,
                    snack: dayPlan.snacks?.[0],
                  };
                }

                // Save the plan
                await AsyncStorage.setItem(`weekly_plan_${userId}`, JSON.stringify(newPlan));
                
                // Reload
                await loadWeekPlan();
                
                Alert.alert('Success! 🎉', 'Your weekly meal plan has been generated!');
              } catch (error) {
                console.error('Error generating week plan:', error);
                Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
              } finally {
                setGenerating(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      setGenerating(false);
    }
  };

  const renderMealSlot = (
    meal: Meal | undefined,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    emoji: string,
    label: string
  ) => {
    const currentDay = weekPlan[selectedDay];
    
    if (meal) {
      return (
        <TouchableOpacity
          style={styles.mealCard}
          onPress={() => onMealPress(meal)}
        >
          <View style={styles.mealCardHeader}>
            <Text style={styles.mealEmoji}>{meal.imageEmoji || emoji}</Text>
            <View style={styles.mealTypeTag}>
              <Text style={styles.mealTypeText}>{label}</Text>
            </View>
          </View>
          <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
          <View style={styles.mealNutrition}>
            <Text style={styles.mealCalories}>{meal.calories} cal</Text>
            <Text style={styles.mealMacros}>P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.mealCard, styles.emptyMealCard]}
        onPress={() => {
          // Generate a suggestion for this slot
          Alert.alert(
            `Add ${label}`,
            'Generate an AI suggestion or browse recipes?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Generate',
                onPress: async () => {
                  try {
                    const meal = await professionalAIService.generatePersonalizedMeal(mealType, userProfile);
                    if (currentDay) {
                      onAddMeal(meal, currentDay.date);
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to generate meal');
                  }
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.emptyEmoji}>{emoji}</Text>
        <Text style={styles.emptyLabel}>Add {label}</Text>
        <Text style={styles.emptyPlus}>+</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const currentDayPlan = weekPlan[selectedDay];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Weekly Meal Plan</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateWeekPlan}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>🔄 Generate</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {weekPlan.map((day, index) => {
          const date = new Date(day.date);
          const mealsCount = Object.values(day.meals).filter(Boolean).length;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                selectedDay === index && styles.dayButtonActive,
                day.isToday && styles.dayButtonToday,
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[
                styles.dayButtonLabel,
                selectedDay === index && styles.dayButtonLabelActive,
              ]}>
                {dayNames[date.getDay()]}
              </Text>
              <Text style={[
                styles.dayButtonDate,
                selectedDay === index && styles.dayButtonDateActive,
              ]}>
                {date.getDate()}
              </Text>
              {mealsCount > 0 && (
                <View style={[
                  styles.mealCountBadge,
                  selectedDay === index && styles.mealCountBadgeActive,
                ]}>
                  <Text style={styles.mealCountText}>{mealsCount}</Text>
                </View>
              )}
              {day.isToday && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected Day Info */}
      <View style={styles.selectedDayInfo}>
        <Text style={styles.selectedDayName}>{currentDayPlan?.dayName}</Text>
        {currentDayPlan?.isToday && (
          <View style={styles.todayTag}>
            <Text style={styles.todayTagText}>Today</Text>
          </View>
        )}
      </View>

      {/* Meals Grid */}
      <View style={styles.mealsGrid}>
        {renderMealSlot(currentDayPlan?.meals.breakfast, 'breakfast', '🍳', 'Breakfast')}
        {renderMealSlot(currentDayPlan?.meals.lunch, 'lunch', '🥗', 'Lunch')}
        {renderMealSlot(currentDayPlan?.meals.dinner, 'dinner', '🍽️', 'Dinner')}
        {renderMealSlot(currentDayPlan?.meals.snack, 'snack', '🍎', 'Snack')}
      </View>

      {/* Day Nutrition Summary */}
      {currentDayPlan && Object.values(currentDayPlan.meals).some(Boolean) && (
        <View style={styles.daySummary}>
          <Text style={styles.daySummaryTitle}>Day Total</Text>
          <View style={styles.daySummaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Object.values(currentDayPlan.meals)
                  .filter(Boolean)
                  .reduce((sum, m) => sum + (m?.calories || 0), 0)}
              </Text>
              <Text style={styles.summaryLabel}>cal</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Object.values(currentDayPlan.meals)
                  .filter(Boolean)
                  .reduce((sum, m) => sum + (m?.protein || 0), 0)}g
              </Text>
              <Text style={styles.summaryLabel}>protein</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Object.values(currentDayPlan.meals)
                  .filter(Boolean)
                  .reduce((sum, m) => sum + (m?.carbs || 0), 0)}g
              </Text>
              <Text style={styles.summaryLabel}>carbs</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  daySelector: {
    marginBottom: spacing.md,
  },
  daySelectorContent: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    minWidth: 50,
    position: 'relative',
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
  },
  dayButtonToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayButtonLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dayButtonLabelActive: {
    color: '#fff',
  },
  dayButtonDate: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  dayButtonDateActive: {
    color: '#fff',
  },
  mealCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.success,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCountBadgeActive: {
    backgroundColor: '#fff',
  },
  mealCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  selectedDayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  selectedDayName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  todayTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  todayTagText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mealCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    minHeight: 120,
  },
  emptyMealCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  mealEmoji: {
    fontSize: 24,
  },
  mealTypeTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  mealTypeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  mealName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  mealNutrition: {
    marginTop: 'auto',
  },
  mealCalories: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  mealMacros: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  emptyEmoji: {
    fontSize: 32,
    opacity: 0.5,
  },
  emptyLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyPlus: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  daySummary: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  daySummaryTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  daySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
});

export default WeeklyMealPlan;
