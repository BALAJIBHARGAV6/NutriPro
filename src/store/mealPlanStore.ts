import { create } from 'zustand';
import { supabase, TABLES } from '../config/supabase';
import { MealPlan, Recipe, ShoppingList, DailyLog, NutritionInfo } from '../types/database';
import { format, startOfWeek, addDays } from 'date-fns';

interface MealPlanState {
  currentMealPlan: MealPlan | null;
  recipes: Recipe[];
  favoriteRecipes: Recipe[];
  shoppingList: ShoppingList | null;
  dailyLogs: DailyLog[];
  todayNutrition: NutritionInfo;
  isLoading: boolean;
  isGenerating: boolean;
  selectedDate: Date;
  
  // Actions
  setCurrentMealPlan: (plan: MealPlan | null) => void;
  setRecipes: (recipes: Recipe[]) => void;
  setFavoriteRecipes: (recipes: Recipe[]) => void;
  setShoppingList: (list: ShoppingList | null) => void;
  setDailyLogs: (logs: DailyLog[]) => void;
  setTodayNutrition: (nutrition: NutritionInfo) => void;
  setIsLoading: (loading: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  setSelectedDate: (date: Date) => void;
  
  // Async Actions
  fetchCurrentMealPlan: (userId: string) => Promise<void>;
  fetchRecipes: (userId: string) => Promise<void>;
  fetchFavoriteRecipes: (userId: string) => Promise<void>;
  fetchShoppingList: (userId: string) => Promise<void>;
  fetchDailyLogs: (userId: string, date: string) => Promise<void>;
  saveMealPlan: (userId: string, planData: any) => Promise<MealPlan | null>;
  toggleRecipeFavorite: (recipeId: string, isFavorite: boolean) => Promise<void>;
  logMeal: (log: Omit<DailyLog, 'id' | 'created_at'>) => Promise<void>;
  updateShoppingItem: (itemIndex: number, checked: boolean) => Promise<void>;
  calculateTodayNutrition: () => void;
}

const defaultNutrition: NutritionInfo = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
};

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  currentMealPlan: null,
  recipes: [],
  favoriteRecipes: [],
  shoppingList: null,
  dailyLogs: [],
  todayNutrition: defaultNutrition,
  isLoading: false,
  isGenerating: false,
  selectedDate: new Date(),
  
  setCurrentMealPlan: (plan) => set({ currentMealPlan: plan }),
  setRecipes: (recipes) => set({ recipes }),
  setFavoriteRecipes: (recipes) => set({ favoriteRecipes: recipes }),
  setShoppingList: (list) => set({ shoppingList: list }),
  setDailyLogs: (logs) => set({ dailyLogs: logs }),
  setTodayNutrition: (nutrition) => set({ todayNutrition: nutrition }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  fetchCurrentMealPlan: async (userId: string) => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from(TABLES.MEAL_PLANS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching meal plan:', error);
      }
      
      set({ currentMealPlan: data || null });
    } catch (error) {
      console.error('Error fetching meal plan:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchRecipes: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.RECIPES)
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching recipes:', error);
        return;
      }
      
      set({ recipes: data || [] });
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  },
  
  fetchFavoriteRecipes: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.RECIPES)
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching favorite recipes:', error);
        return;
      }
      
      set({ favoriteRecipes: data || [] });
    } catch (error) {
      console.error('Error fetching favorite recipes:', error);
    }
  },
  
  fetchShoppingList: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SHOPPING_LISTS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching shopping list:', error);
      }
      
      set({ shoppingList: data || null });
    } catch (error) {
      console.error('Error fetching shopping list:', error);
    }
  },
  
  fetchDailyLogs: async (userId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DAILY_LOGS)
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', date)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching daily logs:', error);
        return;
      }
      
      set({ dailyLogs: data || [] });
      get().calculateTodayNutrition();
    } catch (error) {
      console.error('Error fetching daily logs:', error);
    }
  },
  
  saveMealPlan: async (userId: string, planData: any) => {
    try {
      set({ isGenerating: true });
      
      // Deactivate existing meal plans
      await supabase
        .from(TABLES.MEAL_PLANS)
        .update({ is_active: false })
        .eq('user_id', userId);
      
      // Save new meal plan
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { data, error } = await supabase
        .from(TABLES.MEAL_PLANS)
        .insert({
          user_id: userId,
          week_start_date: format(weekStart, 'yyyy-MM-dd'),
          plan_data: planData,
          ai_model_used: 'gemini-1.5-flash',
          generation_prompt: 'AI Generated Meal Plan',
          is_active: true,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving meal plan:', error);
        return null;
      }
      
      set({ currentMealPlan: data });
      return data;
    } catch (error) {
      console.error('Error saving meal plan:', error);
      return null;
    } finally {
      set({ isGenerating: false });
    }
  },
  
  toggleRecipeFavorite: async (recipeId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from(TABLES.RECIPES)
        .update({ is_favorite: isFavorite })
        .eq('id', recipeId);
      
      if (error) {
        console.error('Error updating favorite:', error);
        return;
      }
      
      // Update local state
      const { recipes } = get();
      set({
        recipes: recipes.map((r) =>
          r.id === recipeId ? { ...r, is_favorite: isFavorite } : r
        ),
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },
  
  logMeal: async (log: Omit<DailyLog, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DAILY_LOGS)
        .insert(log)
        .select()
        .single();
      
      if (error) {
        console.error('Error logging meal:', error);
        return;
      }
      
      const { dailyLogs } = get();
      set({ dailyLogs: [...dailyLogs, data] });
      get().calculateTodayNutrition();
    } catch (error) {
      console.error('Error logging meal:', error);
    }
  },
  
  updateShoppingItem: async (itemIndex: number, checked: boolean) => {
    const { shoppingList } = get();
    if (!shoppingList) return;
    
    try {
      const updatedItems = [...shoppingList.items];
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], checked };
      
      const { error } = await supabase
        .from(TABLES.SHOPPING_LISTS)
        .update({ items: updatedItems })
        .eq('id', shoppingList.id);
      
      if (error) {
        console.error('Error updating shopping item:', error);
        return;
      }
      
      set({
        shoppingList: { ...shoppingList, items: updatedItems },
      });
    } catch (error) {
      console.error('Error updating shopping item:', error);
    }
  },
  
  calculateTodayNutrition: () => {
    const { dailyLogs } = get();
    
    const totals = dailyLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.nutrition_consumed.calories || 0),
        protein: acc.protein + (log.nutrition_consumed.protein || 0),
        carbs: acc.carbs + (log.nutrition_consumed.carbs || 0),
        fats: acc.fats + (log.nutrition_consumed.fats || 0),
        fiber: acc.fiber + (log.nutrition_consumed.fiber || 0),
        sugar: acc.sugar + (log.nutrition_consumed.sugar || 0),
        sodium: acc.sodium + (log.nutrition_consumed.sodium || 0),
      }),
      defaultNutrition
    );
    
    set({ todayNutrition: totals });
  },
}));

export default useMealPlanStore;
