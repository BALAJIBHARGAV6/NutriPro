import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 0;

// Storage adapter that works on both web and native
const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

// Create Supabase client only if configured, otherwise create a mock
let supabaseClient: SupabaseClient;

if (isSupabaseConfigured) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} else {
  // Create a dummy client for development without Supabase
  console.warn('⚠️ Supabase is not configured. Running in demo mode.');
  console.warn('To enable full functionality, add your Supabase credentials to .env file.');
  
  // Mock Supabase client that won't crash the app
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithOAuth: async () => ({ data: { url: null, provider: 'google' }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Demo mode - Supabase not configured' } }),
      signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Demo mode - Supabase not configured' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      setSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ limit: () => ({ single: async () => ({ data: null, error: null }) }) }) }), or: () => ({ order: async () => ({ data: [], error: null }) }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
      upsert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
      delete: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
  } as unknown as SupabaseClient;
}

export const supabase = supabaseClient;

// Database table names - matches your Supabase schema exactly
export const TABLES = {
  // Core user tables
  USERS: 'users',
  USER_PROFILES: 'user_profiles',
  USER_PREFERENCES: 'user_preferences',
  
  // Health & dietary
  DIETARY_RESTRICTIONS: 'dietary_restrictions',
  HEALTH_CONDITIONS: 'health_conditions',
  NUTRITION_TARGETS: 'nutrition_targets',
  
  // Meals & recipes
  MEAL_PLANS: 'meal_plans',
  RECIPES: 'recipes',
  RECIPE_DISEASE_SUITABILITY: 'recipe_disease_suitability',
  DAILY_LOGS: 'daily_logs',
  SHOPPING_LISTS: 'shopping_lists',
  
  // Fitness & tracking
  EXERCISE_ROUTINES: 'exercise_routines',
  BODY_MEASUREMENTS: 'body_measurements',
  WATER_INTAKE: 'water_intake',
  SLEEP_TRACKING: 'sleep_tracking',
  
  // Achievements (Note: 'achievements' table may not exist - only user_achievements)
  USER_ACHIEVEMENTS: 'user_achievements',
  
  // Views (read-only)
  DAILY_PROGRESS_SUMMARY: 'daily_progress_summary',
} as const;

export default supabase;
