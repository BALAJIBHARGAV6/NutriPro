// Database Types for Supabase

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height: number | null; // in cm
  weight: number | null; // in kg
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  goal: 'maintain' | 'lose' | 'gain' | null;
  target_weight: number | null;
  created_at: string;
  updated_at: string;
}

export interface DietaryRestriction {
  id: string;
  user_id: string;
  restriction_type: 'allergy' | 'preference' | 'medical';
  restriction_name: string;
  severity: 'mild' | 'moderate' | 'severe';
  created_at: string;
}

export interface NutritionTargets {
  id: string;
  user_id: string;
  daily_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  fiber_grams: number;
  sugar_grams: number;
  sodium_mg: number;
  is_active: boolean;
  created_at: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prep_time: number; // minutes
  cook_time: number;
  servings: number;
  nutrition_info: NutritionInfo;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisine_type: string;
  image_url: string | null;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
}

export interface DayMeals {
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
  snacks: Recipe[];
}

export interface DayPlan {
  day: string;
  date: string;
  meals: DayMeals;
  daily_totals: NutritionInfo;
}

export interface MealPlanData {
  week_start: string;
  days: DayPlan[];
}

export interface MealPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  plan_data: MealPlanData;
  ai_model_used: string;
  generation_prompt: string;
  is_active: boolean;
  created_at: string;
}

export interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
  category: string;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  meal_plan_id: string;
  items: ShoppingItem[];
  week_start_date: string;
  is_completed: boolean;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id: string | null;
  food_name: string;
  nutrition_consumed: NutritionInfo;
  notes: string | null;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_cuisines: string[];
  disliked_ingredients: string[];
  meal_complexity: 'simple' | 'moderate' | 'complex';
  cooking_time_preference: 'quick' | 'medium' | 'elaborate';
  budget_level: 'budget' | 'moderate' | 'premium';
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Onboarding Data Types
export interface OnboardingData {
  // Step 1: Basic Info
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  
  // Step 2: Body Metrics
  height: number;
  weight: number;
  targetWeight: number;
  
  // Step 3: Goals
  goal: 'maintain' | 'lose' | 'gain';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  
  // Step 4: Dietary Restrictions
  restrictions: {
    type: 'allergy' | 'preference' | 'medical';
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
  }[];
  
  // Step 5: Preferences
  preferredCuisines: string[];
  dislikedIngredients: string[];
  mealComplexity: 'simple' | 'moderate' | 'complex';
  cookingTimePreference: 'quick' | 'medium' | 'elaborate';
  budgetLevel: 'budget' | 'moderate' | 'premium';
}

// API Response Types
export interface GeminiMealPlanResponse {
  week_start: string;
  days: {
    day: string;
    date: string;
    meals: {
      breakfast: RecipeResponse;
      lunch: RecipeResponse;
      dinner: RecipeResponse;
      snacks: RecipeResponse[];
    };
    daily_totals: NutritionInfo;
  }[];
}

export interface RecipeResponse {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  nutrition: NutritionInfo;
  cuisine_type?: string;
  tags?: string[];
}
