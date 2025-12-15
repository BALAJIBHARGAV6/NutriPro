import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Recipe, DailyLog } from '../types';
import { Meal } from './professionalAIService';
import { databaseService } from './databaseService';
import { isSupabaseConfigured } from '../config/supabase';

// Generate a proper UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const KEYS = {
  USER: 'nutripro_user',
  MEALS_PREFIX: 'nutripro_meals_',
  RECIPES: 'nutripro_recipes',
  DAILY_LOGS_PREFIX: 'nutripro_logs_',
  STREAK: 'nutripro_streak',
};

class StorageService {
  // User Management
  async saveUser(user: User): Promise<void> {
    // Save locally first
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    
    // Sync to Supabase database
    if (isSupabaseConfigured) {
      try {
        const saved = await databaseService.saveUserProfile(user);
        if (saved) {
          console.log('✅ User profile synced to Supabase');
        }
      } catch (error) {
        console.log('Database sync failed for user:', error);
      }
    }
  }

  async getUser(): Promise<User | null> {
    // Try local first for speed
    const localData = await AsyncStorage.getItem(KEYS.USER);
    if (localData) {
      return JSON.parse(localData);
    }
    // If not local, try database
    try {
      const dbUser = await databaseService.getUserProfile();
      if (dbUser) {
        await AsyncStorage.setItem(KEYS.USER, JSON.stringify(dbUser));
        return dbUser;
      }
    } catch (error) {
      console.log('Database fetch failed:', error);
    }
    return null;
  }

  async updateUser(updates: Partial<User>): Promise<User | null> {
    const user = await this.getUser();
    if (!user) return null;
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    await this.saveUser(updatedUser);
    return updatedUser;
  }

  async clearUser(): Promise<void> {
    // Only clear local cache, NOT database data
    await AsyncStorage.removeItem(KEYS.USER);
  }

  // Load user data from database after login
  async loadUserFromDatabase(): Promise<User | null> {
    try {
      const dbUser = await databaseService.getUserProfile();
      if (dbUser) {
        await AsyncStorage.setItem(KEYS.USER, JSON.stringify(dbUser));
        // Also load stats
        const stats = await databaseService.getUserStats();
        dbUser.streak = stats.currentStreak;
        dbUser.longestStreak = stats.longestStreak;
        dbUser.totalMealsLogged = stats.totalMealsLogged;
        await AsyncStorage.setItem(KEYS.USER, JSON.stringify(dbUser));
        return dbUser;
      }
    } catch (error) {
      console.log('Failed to load user from database:', error);
    }
    return null;
  }

  // Meals Management (by date)
  async saveTodaysMeals(userId: string, meals: Meal[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${KEYS.MEALS_PREFIX}${userId}_${today}`;
    await AsyncStorage.setItem(key, JSON.stringify(meals));
  }

  async getTodaysMeals(userId: string): Promise<Meal[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMealsByDate(userId, today);
  }

  async getMealsByDate(userId: string, date: string): Promise<Meal[]> {
    const key = `${KEYS.MEALS_PREFIX}${userId}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  // My Meals (Added meals - separate from AI suggestions)
  async addToMyMeals(userId: string, meal: Meal): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `nutripro_mymeals_${userId}_${today}`;
    const existingMeals = await this.getMyMeals(userId, today);
    
    // Check if meal type already exists - replace it
    const filtered = existingMeals.filter(m => m.mealType !== meal.mealType);
    filtered.push(meal);
    
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  }

  async getMyMeals(userId: string, date: string): Promise<Meal[]> {
    const key = `nutripro_mymeals_${userId}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async getMyMealsToday(userId: string): Promise<Meal[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMyMeals(userId, today);
  }

  async removeFromMyMeals(userId: string, date: string, mealType: string): Promise<void> {
    const key = `nutripro_mymeals_${userId}_${date}`;
    const meals = await this.getMyMeals(userId, date);
    const filtered = meals.filter(m => m.mealType !== mealType);
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  }

  // Daily Logs (for tracking/history) - includes full recipe details
  async addMealToLog(userId: string, meal: Meal): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${KEYS.DAILY_LOGS_PREFIX}${userId}_${today}`;
    const existingLogs = await this.getDailyLogs(userId, today);
    
    // Check if this meal type already logged today - replace it
    const existingIndex = existingLogs.findIndex(log => log.meal_type === meal.mealType);
    
    const newLog: DailyLog = {
      id: generateUUID(), // Use proper UUID for Supabase compatibility
      user_id: userId,
      log_date: today,
      meal_type: meal.mealType,
      food_name: meal.name,
      nutrition_consumed: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
      },
      // Include full recipe details
      ingredients: meal.ingredients || [],
      instructions: meal.instructions || [],
      prepTime: meal.prepTime,
      cookTime: meal.cookTime,
      emoji: meal.emoji || meal.imageEmoji,
      description: meal.description,
      created_at: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      // Replace existing meal of same type
      existingLogs[existingIndex] = newLog;
    } else {
      existingLogs.push(newLog);
    }
    
    // Save locally first
    await AsyncStorage.setItem(key, JSON.stringify(existingLogs));
    
    // Also add to My Meals
    await this.addToMyMeals(userId, meal);
    
    // Update user stats
    await this.incrementMealsLogged(userId);
    await this.updateStreak(userId);

    // Sync to Supabase database
    if (isSupabaseConfigured) {
      try {
        const saved = await databaseService.saveDailyLog(newLog);
        if (saved) {
          await databaseService.saveRecipe(meal);
          console.log('✅ Meal synced to Supabase');
        }
      } catch (error) {
        console.log('Database sync failed for meal log:', error);
      }
    }
  }

  async getDailyLogs(userId: string, date: string): Promise<DailyLog[]> {
    const key = `${KEYS.DAILY_LOGS_PREFIX}${userId}_${date}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async removeMealFromLog(userId: string, date: string, logId: string): Promise<void> {
    const key = `${KEYS.DAILY_LOGS_PREFIX}${userId}_${date}`;
    const logs = await this.getDailyLogs(userId, date);
    const logToRemove = logs.find(log => log.id === logId);
    const filtered = logs.filter(log => log.id !== logId);
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
    
    // Also remove from My Meals
    if (logToRemove) {
      await this.removeFromMyMeals(userId, date, logToRemove.meal_type);
    }
  }

  // Recipes Management
  async saveRecipes(recipes: Recipe[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(recipes));
  }

  async getRecipes(): Promise<Recipe[]> {
    const data = await AsyncStorage.getItem(KEYS.RECIPES);
    return data ? JSON.parse(data) : [];
  }

  async getRecipesByMealType(mealType: string): Promise<Recipe[]> {
    const recipes = await this.getRecipes();
    return recipes.filter(r => r.meal_type === mealType);
  }

  async getRecipesByDisease(disease: string): Promise<Recipe[]> {
    const recipes = await this.getRecipes();
    return recipes.filter(r => r.tags?.includes(disease.toLowerCase()));
  }

  // Streak Management
  async updateStreak(userId: string): Promise<number> {
    const user = await this.getUser();
    if (!user) return 0;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.lastLogin?.split('T')[0];

    if (lastLogin === today) {
      return user.streak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayLogs = await this.getDailyLogs(userId, yesterdayStr);
    
    let newStreak = user.streak;
    if (yesterdayLogs.length > 0 || lastLogin === yesterdayStr) {
      newStreak = user.streak + 1;
    } else if (lastLogin !== today) {
      newStreak = 0;
    }

    const longestStreak = Math.max(user.longestStreak || 0, newStreak);
    
    await this.updateUser({
      streak: newStreak,
      longestStreak,
      lastLogin: new Date().toISOString(),
    });

    return newStreak;
  }

  async incrementMealsLogged(userId: string): Promise<void> {
    const user = await this.getUser();
    if (user) {
      await this.updateUser({
        totalMealsLogged: (user.totalMealsLogged || 0) + 1,
      });
    }
  }

  // Calculate daily nutrition totals
  async getDailyNutritionTotals(userId: string, date: string): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    sugar: number;
    mealsCount: number;
  }> {
    const logs = await this.getDailyLogs(userId, date);
    return logs.reduce(
      (acc, log) => {
        const carbs = log.nutrition_consumed?.carbs || 0;
        return {
          calories: acc.calories + (log.nutrition_consumed?.calories || 0),
          protein: acc.protein + (log.nutrition_consumed?.protein || 0),
          carbs: acc.carbs + carbs,
          fats: acc.fats + (log.nutrition_consumed?.fats || 0),
          // Estimate sugar as ~15% of carbs if not tracked
          sugar: acc.sugar + (log.nutrition_consumed?.sugar || Math.round(carbs * 0.15)),
          mealsCount: acc.mealsCount + 1,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0, mealsCount: 0 }
    );
  }

  // Clear local cache only (for logout) - database data is preserved
  async clearLocalCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const nutriproKeys = keys.filter(k => k.startsWith('nutripro_'));
    await AsyncStorage.multiRemove(nutriproKeys);
  }

  // Alias for backward compatibility
  async clearAllData(): Promise<void> {
    await this.clearLocalCache();
  }

  // Load all data from database after login
  async syncFromDatabase(userId: string): Promise<void> {
    try {
      // Load user profile
      const user = await databaseService.getUserProfile();
      if (user) {
        await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
      }

      // Load today's meals
      const today = new Date().toISOString().split('T')[0];
      const meals = await databaseService.getMyMeals(today);
      if (meals.length > 0) {
        const key = `nutripro_mymeals_${userId}_${today}`;
        await AsyncStorage.setItem(key, JSON.stringify(meals));
      }

      // Load daily logs
      const logs = await databaseService.getDailyLogs(today);
      if (logs.length > 0) {
        const key = `${KEYS.DAILY_LOGS_PREFIX}${userId}_${today}`;
        await AsyncStorage.setItem(key, JSON.stringify(logs));
      }

      console.log('Synced data from database successfully');
    } catch (error) {
      console.log('Failed to sync from database:', error);
    }
  }
  
  // Water Intake Management (glasses count - 250ml per glass)
  async saveWaterIntake(userId: string, date: string, glasses: number): Promise<void> {
    const key = `nutripro_water_${userId}_${date}`;
    await AsyncStorage.setItem(key, JSON.stringify(glasses));
    
    // Sync to database if configured (convert glasses to ml)
    if (isSupabaseConfigured) {
      try {
        // Add the difference as new intake
        await databaseService.addWaterIntake(250); // 250ml per glass
      } catch (error) {
        console.log('Failed to sync water intake to database:', error);
      }
    }
  }
  
  async getWaterIntake(userId: string, date: string): Promise<number> {
    const key = `nutripro_water_${userId}_${date}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Try database if configured
    if (isSupabaseConfigured) {
      try {
        const dbIntakeMl = await databaseService.getWaterIntake(date);
        if (dbIntakeMl > 0) {
          const glasses = Math.floor(dbIntakeMl / 250); // Convert ml to glasses
          await AsyncStorage.setItem(key, JSON.stringify(glasses));
          return glasses;
        }
      } catch (error) {
        console.log('Failed to get water intake from database:', error);
      }
    }
    
    return 0;
  }
  
  // Day Completion
  async markDayComplete(userId: string, date: string, completed: boolean): Promise<void> {
    const key = `nutripro_daycomplete_${userId}_${date}`;
    await AsyncStorage.setItem(key, JSON.stringify(completed));
  }
  
  async isDayComplete(userId: string, date: string): Promise<boolean> {
    const key = `nutripro_daycomplete_${userId}_${date}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : false;
  }
}

export const storageService = new StorageService();
