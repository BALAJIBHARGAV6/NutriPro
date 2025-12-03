import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, DailyLog } from '../types';
import { Meal } from './professionalAIService';

// Database Service - Syncs data with Supabase for persistence
class DatabaseService {
  
  // ==================== USER PROFILE ====================
  
  async saveUserProfile(user: User): Promise<void> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.id) return;

    const userId = authUser.user.id;

    // Save to user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activity_level: user.exerciseLevel,
        goal: user.goal || 'maintain',
        target_weight: user.targetWeight,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (profileError) console.error('Error saving profile:', profileError);

    // Save diseases as dietary restrictions
    if (user.diseases && user.diseases.length > 0) {
      // First delete existing medical restrictions
      await supabase
        .from('dietary_restrictions')
        .delete()
        .eq('user_id', userId)
        .eq('restriction_type', 'medical');

      // Insert new ones
      const restrictions = user.diseases.map(disease => ({
        user_id: userId,
        restriction_type: 'medical',
        restriction_name: disease,
        severity: 'moderate',
      }));

      const { error: restrictionError } = await supabase
        .from('dietary_restrictions')
        .insert(restrictions);

      if (restrictionError) console.error('Error saving restrictions:', restrictionError);
    }

    // Save allergies
    if (user.allergies && user.allergies.length > 0) {
      await supabase
        .from('dietary_restrictions')
        .delete()
        .eq('user_id', userId)
        .eq('restriction_type', 'allergy');

      const allergies = user.allergies.map(allergy => ({
        user_id: userId,
        restriction_type: 'allergy',
        restriction_name: allergy,
        severity: 'severe',
      }));

      await supabase.from('dietary_restrictions').insert(allergies);
    }

    // Save nutrition targets
    const dailyCalories = this.calculateDailyCalories(user);
    const { error: targetError } = await supabase
      .from('nutrition_targets')
      .upsert({
        user_id: userId,
        daily_calories: dailyCalories,
        protein_grams: Math.round(dailyCalories * 0.25 / 4),
        carbs_grams: Math.round(dailyCalories * 0.45 / 4),
        fats_grams: Math.round(dailyCalories * 0.30 / 9),
        is_active: true,
      }, { onConflict: 'user_id' });

    if (targetError) console.error('Error saving targets:', targetError);

    // Also save to local storage for offline access
    await AsyncStorage.setItem('nutripro_user', JSON.stringify(user));
  }

  async getUserProfile(): Promise<User | null> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.id) {
      // Try local storage if not authenticated
      const localData = await AsyncStorage.getItem('nutripro_user');
      return localData ? JSON.parse(localData) : null;
    }

    const userId = authUser.user.id;

    // Get profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get restrictions (diseases and allergies)
    const { data: restrictions } = await supabase
      .from('dietary_restrictions')
      .select('*')
      .eq('user_id', userId);

    // Get user basic info
    const { data: userInfo } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    const diseases = restrictions
      ?.filter(r => r.restriction_type === 'medical')
      .map(r => r.restriction_name) || [];

    const allergies = restrictions
      ?.filter(r => r.restriction_type === 'allergy')
      .map(r => r.restriction_name) || [];

    const user: User = {
      id: userId,
      email: userInfo?.email || authUser.user.email || '',
      name: userInfo?.full_name || '',
      fullName: userInfo?.full_name || '',
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      exerciseLevel: profile.activity_level,
      goal: profile.goal,
      targetWeight: profile.target_weight,
      diseases,
      allergies,
      streak: 0,
      longestStreak: 0,
      totalMealsLogged: 0,
      onboardingCompleted: true,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    // Cache locally
    await AsyncStorage.setItem('nutripro_user', JSON.stringify(user));
    return user;
  }

  // ==================== DAILY LOGS ====================

  async saveDailyLog(log: DailyLog): Promise<void> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.id) return;

    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        id: log.id,
        user_id: authUser.user.id,
        log_date: log.log_date,
        meal_type: log.meal_type,
        food_name: log.food_name,
        nutrition_consumed: log.nutrition_consumed,
        notes: JSON.stringify({
          ingredients: log.ingredients,
          instructions: log.instructions,
          prepTime: log.prepTime,
          cookTime: log.cookTime,
          emoji: log.emoji,
          description: log.description,
        }),
      });

    if (error) console.error('Error saving daily log:', error);
  }

  async getDailyLogs(date: string): Promise<DailyLog[]> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.id) return [];

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', authUser.user.id)
      .eq('log_date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching daily logs:', error);
      return [];
    }

    return (data || []).map(log => {
      const notes = log.notes ? JSON.parse(log.notes) : {};
      return {
        id: log.id,
        user_id: log.user_id,
        log_date: log.log_date,
        meal_type: log.meal_type,
        food_name: log.food_name,
        nutrition_consumed: log.nutrition_consumed,
        ingredients: notes.ingredients,
        instructions: notes.instructions,
        prepTime: notes.prepTime,
        cookTime: notes.cookTime,
        emoji: notes.emoji,
        description: notes.description,
        created_at: log.created_at,
      };
    });
  }

  async deleteDailyLog(logId: string): Promise<void> {
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('id', logId);

    if (error) console.error('Error deleting daily log:', error);
  }

  // ==================== RECIPES ====================

  async saveRecipe(meal: Meal): Promise<void> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.id) return;

    const { error } = await supabase
      .from('recipes')
      .upsert({
        id: meal.id,
        user_id: authUser.user.id,
        title: meal.name,
        description: meal.description,
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        prep_time: meal.prepTime,
        cook_time: meal.cookTime,
        servings: 1,
        nutrition_info: {
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          fiber: meal.fiber,
        },
        meal_type: meal.mealType,
        image_url: meal.emoji || meal.imageEmoji,
        tags: meal.tags,
      });

    if (error) console.error('Error saving recipe:', error);
  }

  async getUserRecipes(): Promise<Meal[]> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.id) return [];

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', authUser.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }

    return (data || []).map(recipe => ({
      id: recipe.id,
      name: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      calories: recipe.nutrition_info?.calories || 0,
      protein: recipe.nutrition_info?.protein || 0,
      carbs: recipe.nutrition_info?.carbs || 0,
      fats: recipe.nutrition_info?.fats || 0,
      fiber: recipe.nutrition_info?.fiber || 0,
      mealType: recipe.meal_type,
      emoji: recipe.image_url,
      imageEmoji: recipe.image_url,
      tags: recipe.tags,
      isFavorite: recipe.is_favorite,
    }));
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) console.error('Error deleting recipe:', error);
  }

  // ==================== MY MEALS (Added meals) ====================

  async saveMyMeal(meal: Meal, date: string): Promise<void> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.id) return;

    // Save as a recipe first
    await this.saveRecipe(meal);

    // Also save as a daily log
    const log: DailyLog = {
      id: `log_${Date.now()}_${meal.mealType}`,
      user_id: authUser.user.id,
      log_date: date,
      meal_type: meal.mealType,
      food_name: meal.name,
      nutrition_consumed: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
      },
      ingredients: meal.ingredients,
      instructions: meal.instructions,
      prepTime: meal.prepTime,
      cookTime: meal.cookTime,
      emoji: meal.emoji || meal.imageEmoji,
      description: meal.description,
      created_at: new Date().toISOString(),
    };

    await this.saveDailyLog(log);
  }

  async getMyMeals(date: string): Promise<Meal[]> {
    const logs = await this.getDailyLogs(date);
    
    return logs.map(log => ({
      id: log.id,
      name: log.food_name,
      description: log.description || '',
      ingredients: log.ingredients || [],
      instructions: log.instructions || [],
      prepTime: log.prepTime || 0,
      cookTime: log.cookTime || 0,
      calories: log.nutrition_consumed?.calories || 0,
      protein: log.nutrition_consumed?.protein || 0,
      carbs: log.nutrition_consumed?.carbs || 0,
      fats: log.nutrition_consumed?.fats || 0,
      fiber: 0,
      mealType: log.meal_type,
      emoji: log.emoji || '🍽️',
      imageEmoji: log.emoji || '🍽️',
      tags: [],
    }));
  }

  // ==================== USER STATS ====================

  async getUserStats(): Promise<{
    totalMealsLogged: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.id) {
      return { totalMealsLogged: 0, currentStreak: 0, longestStreak: 0 };
    }

    // Count total meals
    const { count: totalMeals } = await supabase
      .from('daily_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.user.id);

    // Calculate streak
    const streak = await this.calculateStreak(authUser.user.id);

    return {
      totalMealsLogged: totalMeals || 0,
      currentStreak: streak.current,
      longestStreak: streak.longest,
    };
  }

  async calculateStreak(userId: string): Promise<{ current: number; longest: number }> {
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('log_date')
      .eq('user_id', userId)
      .order('log_date', { ascending: false });

    if (!logs || logs.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Get unique dates
    const uniqueDates = [...new Set(logs.map(l => l.log_date))].sort().reverse();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if today or yesterday has logs
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1;
      
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        const diffDays = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    tempStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      const diffDays = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { current: currentStreak, longest: longestStreak };
  }

  // ==================== SYNC ====================

  async syncLocalToCloud(): Promise<void> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user?.id) return;

    // Sync user profile
    const localUser = await AsyncStorage.getItem('nutripro_user');
    if (localUser) {
      await this.saveUserProfile(JSON.parse(localUser));
    }

    // Sync all local daily logs
    const keys = await AsyncStorage.getAllKeys();
    const logKeys = keys.filter(k => k.startsWith('nutripro_logs_'));
    
    for (const key of logKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const logs: DailyLog[] = JSON.parse(data);
        for (const log of logs) {
          await this.saveDailyLog(log);
        }
      }
    }
  }

  // ==================== HELPERS ====================

  private calculateDailyCalories(user: User): number {
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
}

export const databaseService = new DatabaseService();
