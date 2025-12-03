// Comprehensive Health & Fitness App Types

export interface User {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  avatarUrl?: string;
  avatar?: string; // Emoji avatar
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  bmi?: number;
  exerciseLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  diseases: string[];
  allergies: string[];
  healthGoals?: string[];
  goal?: 'maintain' | 'lose' | 'gain';
  targetWeight?: number;
  streak: number;
  longestStreak: number;
  totalMealsLogged: number;
  registrationDate?: string;
  lastLogin?: string;
  unitsPreference?: 'metric' | 'imperial';
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'maintain' | 'lose' | 'gain';
  target_weight?: number;
  units_preference: 'metric' | 'imperial';
  created_at: string;
  updated_at: string;
}

export interface HealthCondition {
  id: string;
  user_id: string;
  condition_name: string;
  diagnosis_date?: string;
  severity: 'mild' | 'moderate' | 'severe';
  is_active: boolean;
  medications?: string[];
  notes?: string;
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

export interface NutritionTarget {
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

export interface MealPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  plan_data: DayPlan;
  ai_model_used?: string;
  generation_prompt?: string;
  is_active: boolean;
  created_at: string;
}

export interface DayPlan {
  date: string;
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snacks?: Meal[];
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  emoji: string;
  imageEmoji?: string;
}

export interface Recipe {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  nutrition_info: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisine_type?: string;
  image_url?: string;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
}

export interface ExerciseRoutine {
  id: string;
  user_id: string;
  routine_date: string;
  exercise_name: string;
  exercise_type: 'cardio' | 'strength' | 'flexibility' | 'balance' | 'sports';
  duration_minutes: number;
  intensity_level: 'low' | 'medium' | 'high';
  calories_burned: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  instructions: string[];
  video_url?: string;
  image_url?: string;
  is_completed: boolean;
  completion_time?: string;
  ai_generated: boolean;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id?: string;
  food_name: string;
  nutrition_consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  // Recipe details
  ingredients?: string[];
  instructions?: string[];
  prepTime?: number;
  cookTime?: number;
  emoji?: string;
  description?: string;
  notes?: string;
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  measurement_date: string;
  weight_kg?: number;
  height_cm?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  arms_cm?: number;
  thighs_cm?: number;
  neck_cm?: number;
  body_fat_percentage?: number;
  muscle_mass_kg?: number;
  bmi?: number;
  notes?: string;
  created_at: string;
}

export interface WaterIntake {
  id: string;
  user_id: string;
  intake_date: string;
  amount_ml: number;
  intake_time: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  achievement_name: string;
  description: string;
  achievement_type: 'streak' | 'weight_loss' | 'muscle_gain' | 'consistency' | 'special';
  badge_icon: string;
  requirement_value: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_date: string;
  progress_value: number;
  created_at: string;
}

export interface DailyProgressSummary {
  user_id: string;
  email: string;
  full_name: string;
  log_date: string;
  calories_consumed: number;
  protein_consumed: number;
  carbs_consumed: number;
  fats_consumed: number;
  meals_logged: number;
  exercises_completed: number;
  water_intake_ml: number;
  sleep_hours: number;
  current_weight: number;
  current_bmi: number;
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

export interface ShoppingList {
  id: string;
  user_id: string;
  meal_plan_id?: string;
  items: ShoppingListItem[];
  week_start_date?: string;
  is_completed: boolean;
  created_at: string;
}

export interface ShoppingListItem {
  ingredient_name: string;
  quantity: string;
  unit?: string;
  is_purchased: boolean;
  recipe_reference?: string;
}

export interface AIGenerationLog {
  id: string;
  user_id: string;
  generation_type: 'meal_plan' | 'recipe' | 'exercise' | 'advice';
  request_parameters: any;
  response_data?: any;
  success: boolean;
  error_message?: string;
  generation_time_ms?: number;
  api_provider: string;
  model_version?: string;
  created_at: string;
}
