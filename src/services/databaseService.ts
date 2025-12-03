import { supabase, isSupabaseConfigured, TABLES } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  DailyLog, 
  HealthCondition,
  ExerciseRoutine,
  BodyMeasurement,
  WaterIntake,
  Achievement,
  UserAchievement,
  UserPreferences,
  NutritionTarget,
  DailyProgressSummary,
} from '../types';
import { Meal } from './professionalAIService';

// Generate a proper UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Comprehensive Database Service - Full Supabase Integration
class DatabaseService {
  
  // ==================== AUTH HELPERS ====================
  
  async getCurrentUserId(): Promise<string | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  async isAuthenticated(): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    return userId !== null;
  }

  // ==================== USER PROFILE ====================
  
  async createUserAfterSignup(authUserId: string, email: string, fullName?: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    // The database trigger 'handle_new_user' automatically creates the user row
    // when a new auth user is created. We just need to wait for it.
    // Don't manually insert - RLS policies block direct inserts to users table.
    
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify the user was created by the trigger
    const { data: existingUser, error } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('id', authUserId)
      .single();

    if (error || !existingUser) {
      console.log('User not yet created by trigger, will be created on first profile save');
    } else {
      console.log('✅ User created by database trigger');
    }
  }

  async saveUserProfile(user: User): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      // Save locally only
      await AsyncStorage.setItem('nutripro_user', JSON.stringify(user));
      return true;
    }

    try {
      // Update users table - use UPDATE not UPSERT to avoid RLS issues
      // The row should already exist from the auth trigger
      const { error: userError } = await supabase
        .from(TABLES.USERS)
        .update({
          full_name: user.fullName || user.name || '',
          avatar_url: user.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (userError) {
        console.log('Note: Could not update users table (may not exist yet):', userError.message);
      }

      // Save to user_profiles table using upsert (constraint now exists)
      const profileData = {
        user_id: userId,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activity_level: user.exerciseLevel,
        goal: user.goal || 'maintain',
        target_weight: user.targetWeight,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from(TABLES.USER_PROFILES)
        .upsert(profileData, { onConflict: 'user_id' });
      
      if (profileError) {
        console.error('Error saving profile:', profileError);
      } else {
        console.log('✅ User profile saved');
      }

      // Save health conditions (diseases)
      await this.saveHealthConditions(userId, user.diseases || []);

      // Save allergies as dietary restrictions
      await this.saveDietaryRestrictions(userId, user.allergies || [], 'allergy');

      // Calculate and save nutrition targets
      await this.saveNutritionTargets(userId, user);

      // Save user preferences
      await this.saveUserPreferences(userId, {
        notifications_enabled: true,
        meal_complexity: 'moderate',
        cooking_time_preference: 'medium',
        budget_level: 'moderate',
      });

      // Cache locally
      await AsyncStorage.setItem('nutripro_user', JSON.stringify({ ...user, id: userId }));
      
      return true;
    } catch (error) {
      console.error('Error in saveUserProfile:', error);
      // Still save locally
      await AsyncStorage.setItem('nutripro_user', JSON.stringify(user));
      return false;
    }
  }

  async getUserProfile(): Promise<User | null> {
    const userId = await this.getCurrentUserId();
    
    if (!userId) {
      // Try local storage if not authenticated
      const localData = await AsyncStorage.getItem('nutripro_user');
      return localData ? JSON.parse(localData) : null;
    }

    try {
      // Get user basic info
      const { data: userInfo } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      // Get profile
      const { data: profile } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get health conditions
      const { data: conditions } = await supabase
        .from(TABLES.HEALTH_CONDITIONS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      // Get dietary restrictions (allergies)
      const { data: restrictions } = await supabase
        .from(TABLES.DIETARY_RESTRICTIONS)
        .select('*')
        .eq('user_id', userId);

      // Get stats
      const stats = await this.getUserStats();

      if (!profile) {
        // Return local data if no profile in DB
        const localData = await AsyncStorage.getItem('nutripro_user');
        return localData ? JSON.parse(localData) : null;
      }

      const diseases = conditions?.map(c => c.condition_name) || [];
      const allergies = restrictions
        ?.filter(r => r.restriction_type === 'allergy')
        .map(r => r.restriction_name) || [];

      const user: User = {
        id: userId,
        email: userInfo?.email || '',
        name: userInfo?.full_name || '',
        fullName: userInfo?.full_name || '',
        avatarUrl: userInfo?.avatar_url,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        bmi: profile.weight / Math.pow(profile.height / 100, 2),
        exerciseLevel: profile.activity_level,
        goal: profile.goal,
        targetWeight: profile.target_weight,
        diseases,
        allergies,
        healthGoals: [profile.goal],
        streak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalMealsLogged: stats.totalMealsLogged,
        onboardingCompleted: true,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };

      // Cache locally
      await AsyncStorage.setItem('nutripro_user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      const localData = await AsyncStorage.getItem('nutripro_user');
      return localData ? JSON.parse(localData) : null;
    }
  }

  async updateUserProfile(updates: Partial<User>): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    try {
      if (updates.fullName || updates.avatarUrl) {
        // Only update fields that exist, don't update email (managed by auth)
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.fullName) updateData.full_name = updates.fullName;
        if (updates.avatarUrl) updateData.avatar_url = updates.avatarUrl;
        
        await supabase
          .from(TABLES.USERS)
          .update(updateData)
          .eq('id', userId);
      }

      if (updates.age || updates.gender || updates.height || updates.weight || updates.exerciseLevel || updates.goal) {
        await supabase
          .from(TABLES.USER_PROFILES)
          .update({
            age: updates.age,
            gender: updates.gender,
            height: updates.height,
            weight: updates.weight,
            activity_level: updates.exerciseLevel,
            goal: updates.goal,
            target_weight: updates.targetWeight,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      if (updates.diseases) {
        await this.saveHealthConditions(userId, updates.diseases);
      }

      if (updates.allergies) {
        await this.saveDietaryRestrictions(userId, updates.allergies, 'allergy');
      }

      // Update local cache
      const currentUser = await AsyncStorage.getItem('nutripro_user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        await AsyncStorage.setItem('nutripro_user', JSON.stringify({ ...user, ...updates }));
      }

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // ==================== HEALTH CONDITIONS ====================

  async saveHealthConditions(userId: string, conditions: string[]): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      // First, deactivate all existing conditions
      await supabase
        .from(TABLES.HEALTH_CONDITIONS)
        .update({ is_active: false })
        .eq('user_id', userId);

      // Upsert new conditions (now that unique constraint exists)
      if (conditions.length > 0) {
        const conditionRows = conditions.map(name => ({
          user_id: userId,
          condition_name: name,
          severity: 'moderate',
          is_active: true,
        }));

        const { error } = await supabase
          .from(TABLES.HEALTH_CONDITIONS)
          .upsert(conditionRows, { 
            onConflict: 'user_id,condition_name'
          });

        if (error) {
          console.error('Error saving health conditions:', error);
        } else {
          console.log('✅ Health conditions saved:', conditions);
        }
      }
    } catch (error) {
      console.error('Error in saveHealthConditions:', error);
    }
  }

  async getHealthConditions(userId: string): Promise<HealthCondition[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from(TABLES.HEALTH_CONDITIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching health conditions:', error);
      return [];
    }

    return data || [];
  }

  // ==================== DIETARY RESTRICTIONS ====================

  async saveDietaryRestrictions(userId: string, items: string[], type: 'allergy' | 'preference' | 'medical'): Promise<void> {
    if (!isSupabaseConfigured) return;

    // Delete existing restrictions of this type
    await supabase
      .from(TABLES.DIETARY_RESTRICTIONS)
      .delete()
      .eq('user_id', userId)
      .eq('restriction_type', type);

    // Insert new ones
    if (items.length > 0) {
      const rows = items.map(name => ({
        user_id: userId,
        restriction_type: type,
        restriction_name: name,
        severity: type === 'allergy' ? 'severe' : 'moderate',
      }));

      const { error } = await supabase
        .from(TABLES.DIETARY_RESTRICTIONS)
        .insert(rows);

      if (error) console.error('Error saving dietary restrictions:', error);
    }
  }

  // ==================== NUTRITION TARGETS ====================

  async saveNutritionTargets(userId: string, user: User): Promise<void> {
    if (!isSupabaseConfigured) return;

    const dailyCalories = this.calculateDailyCalories(user);
    
    try {
      const targetData = {
        user_id: userId,
        daily_calories: dailyCalories,
        protein_grams: Math.round(dailyCalories * 0.25 / 4),
        carbs_grams: Math.round(dailyCalories * 0.45 / 4),
        fats_grams: Math.round(dailyCalories * 0.30 / 9),
        fiber_grams: 25,
        sugar_grams: 50,
        sodium_mg: 2300,
        is_active: true,
      };

      // Use upsert now that unique constraint exists
      const { error } = await supabase
        .from(TABLES.NUTRITION_TARGETS)
        .upsert(targetData, { onConflict: 'user_id' });
      
      if (error) {
        console.error('Error saving nutrition targets:', error);
      } else {
        console.log('✅ Nutrition targets saved');
      }
    } catch (error) {
      console.error('Error in saveNutritionTargets:', error);
    }
  }

  async getNutritionTargets(userId: string): Promise<NutritionTarget | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from(TABLES.NUTRITION_TARGETS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  }

  // ==================== USER PREFERENCES ====================

  async saveUserPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      const prefData = {
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString(),
      };

      // Use upsert now that unique constraint exists
      const { error } = await supabase
        .from(TABLES.USER_PREFERENCES)
        .upsert(prefData, { onConflict: 'user_id' });
      
      if (error) {
        console.error('Error saving user preferences:', error);
      }
    } catch (error) {
      console.error('Error in saveUserPreferences:', error);
    }
  }

  // ==================== DAILY LOGS ====================

  async saveDailyLog(log: DailyLog): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    try {
      // Always generate a new UUID for the database
      // The local log.id may not be a valid UUID
      const dbId = generateUUID();
      
      const logData = {
        id: dbId,
        user_id: userId,
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
          localId: log.id, // Store original local ID for reference
        }),
      };

      // Check if a log for this meal type on this date already exists
      const { data: existing } = await supabase
        .from(TABLES.DAILY_LOGS)
        .select('id')
        .eq('user_id', userId)
        .eq('log_date', log.log_date)
        .eq('meal_type', log.meal_type)
        .single();

      if (existing) {
        // Update existing log (without changing the ID)
        const { error } = await supabase
          .from(TABLES.DAILY_LOGS)
          .update({
            food_name: log.food_name,
            nutrition_consumed: log.nutrition_consumed,
            notes: logData.notes,
          })
          .eq('id', existing.id);
        if (error) {
          console.error('Error updating daily log:', error);
          return false;
        }
      } else {
        // Insert new log
        const { error } = await supabase
          .from(TABLES.DAILY_LOGS)
          .insert(logData);
        if (error) {
          console.error('Error inserting daily log:', error);
          return false;
        }
      }
      
      console.log('✅ Daily log saved:', log.food_name);
      return true;
    } catch (error) {
      console.error('Error in saveDailyLog:', error);
      return false;
    }
  }

  async getDailyLogs(date: string): Promise<DailyLog[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from(TABLES.DAILY_LOGS)
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', date)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching daily logs:', error);
        return [];
      }

      return (data || []).map(log => {
        let notes = {};
        try {
          notes = log.notes ? JSON.parse(log.notes) : {};
        } catch (e) {
          notes = {};
        }
        return {
          id: log.id,
          user_id: log.user_id,
          log_date: log.log_date,
          meal_type: log.meal_type,
          food_name: log.food_name,
          nutrition_consumed: log.nutrition_consumed,
          ingredients: (notes as any).ingredients,
          instructions: (notes as any).instructions,
          prepTime: (notes as any).prepTime,
          cookTime: (notes as any).cookTime,
          emoji: (notes as any).emoji,
          description: (notes as any).description,
          created_at: log.created_at,
        };
      });
    } catch (error) {
      console.error('Error in getDailyLogs:', error);
      return [];
    }
  }

  async deleteDailyLog(logId: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from(TABLES.DAILY_LOGS)
      .delete()
      .eq('id', logId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting daily log:', error);
      return false;
    }
    return true;
  }

  // ==================== RECIPES ====================

  async saveRecipe(meal: Meal): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    try {
      // Generate proper UUID for database
      const dbId = generateUUID();
      
      const recipeData = {
        id: dbId,
        user_id: userId,
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
          localId: meal.id, // Store original local ID
        },
        meal_type: meal.mealType,
        image_url: meal.emoji || meal.imageEmoji,
        tags: meal.tags || [],
      };

      // Check if recipe with same name and meal type exists for this user
      const { data: existing } = await supabase
        .from(TABLES.RECIPES)
        .select('id')
        .eq('user_id', userId)
        .eq('title', meal.name)
        .eq('meal_type', meal.mealType)
        .single();

      if (existing) {
        // Update existing recipe (without changing the ID)
        const { error } = await supabase
          .from(TABLES.RECIPES)
          .update({
            description: meal.description,
            ingredients: meal.ingredients,
            instructions: meal.instructions,
            prep_time: meal.prepTime,
            cook_time: meal.cookTime,
            nutrition_info: recipeData.nutrition_info,
            image_url: recipeData.image_url,
            tags: recipeData.tags,
          })
          .eq('id', existing.id);
        if (error) {
          console.error('Error updating recipe:', error);
          return false;
        }
      } else {
        // Insert new recipe
        const { error } = await supabase
          .from(TABLES.RECIPES)
          .insert(recipeData);
        if (error) {
          console.error('Error inserting recipe:', error);
          return false;
        }
      }
      
      console.log('✅ Recipe saved:', meal.name);
      return true;
    } catch (error) {
      console.error('Error in saveRecipe:', error);
      return false;
    }
  }

  async getUserRecipes(): Promise<Meal[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }

    return (data || []).map(recipe => ({
      id: recipe.id,
      name: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      prepTime: recipe.prep_time || 0,
      cookTime: recipe.cook_time || 0,
      calories: recipe.nutrition_info?.calories || 0,
      protein: recipe.nutrition_info?.protein || 0,
      carbs: recipe.nutrition_info?.carbs || 0,
      fats: recipe.nutrition_info?.fats || 0,
      fiber: recipe.nutrition_info?.fiber || 0,
      mealType: recipe.meal_type,
      emoji: recipe.image_url || '🍽️',
      imageEmoji: recipe.image_url || '🍽️',
      tags: recipe.tags || [],
      isFavorite: recipe.is_favorite,
    }));
  }

  async deleteRecipe(recipeId: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from(TABLES.RECIPES)
      .delete()
      .eq('id', recipeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }
    return true;
  }

  // ==================== MY MEALS (Added meals) ====================

  async saveMyMeal(meal: Meal, date: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    // Save as a recipe first
    await this.saveRecipe(meal);

    // Also save as a daily log (ID will be generated in saveDailyLog)
    const log: DailyLog = {
      id: generateUUID(), // Use proper UUID
      user_id: userId,
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

    return await this.saveDailyLog(log);
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

  // ==================== EXERCISE ROUTINES ====================

  async saveExerciseRoutine(exercise: Partial<ExerciseRoutine>): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from(TABLES.EXERCISE_ROUTINES)
      .upsert({
        ...exercise,
        user_id: userId,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving exercise routine:', error);
      return false;
    }
    return true;
  }

  async getExerciseRoutines(date: string): Promise<ExerciseRoutine[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from(TABLES.EXERCISE_ROUTINES)
      .select('*')
      .eq('user_id', userId)
      .eq('routine_date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching exercise routines:', error);
      return [];
    }

    return data || [];
  }

  async completeExercise(exerciseId: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from(TABLES.EXERCISE_ROUTINES)
      .update({
        is_completed: true,
        completion_time: new Date().toISOString(),
      })
      .eq('id', exerciseId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error completing exercise:', error);
      return false;
    }
    return true;
  }

  // ==================== BODY MEASUREMENTS ====================

  async saveBodyMeasurement(measurement: Partial<BodyMeasurement>): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from(TABLES.BODY_MEASUREMENTS)
      .insert({
        ...measurement,
        user_id: userId,
        measurement_date: measurement.measurement_date || new Date().toISOString().split('T')[0],
      });

    if (error) {
      console.error('Error saving body measurement:', error);
      return false;
    }
    return true;
  }

  async getBodyMeasurements(limit: number = 30): Promise<BodyMeasurement[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from(TABLES.BODY_MEASUREMENTS)
      .select('*')
      .eq('user_id', userId)
      .order('measurement_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching body measurements:', error);
      return [];
    }

    return data || [];
  }

  async getLatestBodyMeasurement(): Promise<BodyMeasurement | null> {
    const measurements = await this.getBodyMeasurements(1);
    return measurements[0] || null;
  }

  // ==================== WATER INTAKE ====================

  async addWaterIntake(amountMl: number): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from(TABLES.WATER_INTAKE)
      .insert({
        user_id: userId,
        intake_date: new Date().toISOString().split('T')[0],
        amount_ml: amountMl,
        intake_time: new Date().toISOString(),
      });

    if (error) {
      console.error('Error adding water intake:', error);
      return false;
    }
    return true;
  }

  async getWaterIntake(date: string): Promise<number> {
    const userId = await this.getCurrentUserId();
    if (!userId) return 0;

    const { data, error } = await supabase
      .from(TABLES.WATER_INTAKE)
      .select('amount_ml')
      .eq('user_id', userId)
      .eq('intake_date', date);

    if (error) {
      console.error('Error fetching water intake:', error);
      return 0;
    }

    return (data || []).reduce((sum, item) => sum + item.amount_ml, 0);
  }

  // ==================== SLEEP TRACKING ====================

  async saveSleepData(sleepData: {
    sleepDate: string;
    bedTime: string;
    wakeTime: string;
    durationHours: number;
    qualityRating: number;
    notes?: string;
  }): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from(TABLES.SLEEP_TRACKING)
      .upsert({
        user_id: userId,
        sleep_date: sleepData.sleepDate,
        bed_time: sleepData.bedTime,
        wake_time: sleepData.wakeTime,
        duration_hours: sleepData.durationHours,
        quality_rating: sleepData.qualityRating,
        notes: sleepData.notes,
      });

    if (error) {
      console.error('Error saving sleep data:', error);
      return false;
    }
    return true;
  }

  async getSleepData(date: string): Promise<any | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from(TABLES.SLEEP_TRACKING)
      .select('*')
      .eq('user_id', userId)
      .eq('sleep_date', date)
      .single();

    if (error) return null;
    return data;
  }

  // ==================== ACHIEVEMENTS ====================

  async getUserAchievements(): Promise<UserAchievement[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from(TABLES.USER_ACHIEVEMENTS)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }

    return data || [];
  }

  async awardAchievement(achievementId: string, progressValue: number): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from(TABLES.USER_ACHIEVEMENTS)
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        earned_date: new Date().toISOString().split('T')[0],
        progress_value: progressValue,
      });

    if (error) {
      console.error('Error awarding achievement:', error);
      return false;
    }
    return true;
  }

  // ==================== DAILY PROGRESS SUMMARY ====================

  async getDailyProgressSummary(): Promise<DailyProgressSummary | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from(TABLES.DAILY_PROGRESS_SUMMARY)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching daily progress:', error);
      return null;
    }

    return data;
  }

  // ==================== USER STATS ====================

  async getUserStats(): Promise<{
    totalMealsLogged: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      return { totalMealsLogged: 0, currentStreak: 0, longestStreak: 0 };
    }

    try {
      // Count total meals
      const { count: totalMeals } = await supabase
        .from(TABLES.DAILY_LOGS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Calculate streak
      const streak = await this.calculateStreak(userId);

      return {
        totalMealsLogged: totalMeals || 0,
        currentStreak: streak.current,
        longestStreak: streak.longest,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { totalMealsLogged: 0, currentStreak: 0, longestStreak: 0 };
    }
  }

  async calculateStreak(userId: string): Promise<{ current: number; longest: number }> {
    try {
      const { data: logs } = await supabase
        .from(TABLES.DAILY_LOGS)
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
    } catch (error) {
      console.error('Error calculating streak:', error);
      return { current: 0, longest: 0 };
    }
  }

  // ==================== AI GENERATION LOGS ====================
  // Note: ai_generation_logs table doesn't exist in current schema
  // This is a placeholder for future implementation
  
  async logAIGeneration(log: {
    generationType: 'meal_plan' | 'recipe' | 'exercise' | 'advice';
    requestParameters: any;
    responseData?: any;
    success: boolean;
    errorMessage?: string;
    generationTimeMs?: number;
    modelVersion?: string;
  }): Promise<void> {
    // AI generation logging disabled - table doesn't exist
    // To enable, create ai_generation_logs table in Supabase
    console.log('AI Generation:', log.generationType, log.success ? '✅' : '❌');
  }

  // ==================== SYNC ====================

  async syncLocalToCloud(): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    try {
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

      console.log('✅ Synced local data to cloud');
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  }

  async syncCloudToLocal(): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    try {
      // Get user profile from cloud
      const user = await this.getUserProfile();
      if (user) {
        await AsyncStorage.setItem('nutripro_user', JSON.stringify(user));
      }

      // Get today's meals
      const today = new Date().toISOString().split('T')[0];
      const meals = await this.getMyMeals(today);
      if (meals.length > 0) {
        await AsyncStorage.setItem(`nutripro_mymeals_${userId}_${today}`, JSON.stringify(meals));
      }

      console.log('✅ Synced cloud data to local');
    } catch (error) {
      console.error('Error syncing from cloud:', error);
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
