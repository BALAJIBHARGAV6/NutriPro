import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase, TABLES } from '../config/supabase';
import { UserProfile, NutritionTargets, UserPreferences, DietaryRestriction } from '../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  nutritionTargets: NutritionTargets | null;
  preferences: UserPreferences | null;
  restrictions: DietaryRestriction[];
  isLoading: boolean;
  isOnboarded: boolean;
  
  // Actions
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setNutritionTargets: (targets: NutritionTargets | null) => void;
  setPreferences: (preferences: UserPreferences | null) => void;
  setRestrictions: (restrictions: DietaryRestriction[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOnboarded: (onboarded: boolean) => void;
  
  // Async Actions
  fetchUserData: () => Promise<void>;
  signOut: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  nutritionTargets: null,
  preferences: null,
  restrictions: [],
  isLoading: true,
  isOnboarded: false,
  
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setNutritionTargets: (targets) => set({ nutritionTargets: targets }),
  setPreferences: (preferences) => set({ preferences }),
  setRestrictions: (restrictions) => set({ restrictions }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
  
  fetchUserData: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ isLoading: true });
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // Fetch nutrition targets
      const { data: targets } = await supabase
        .from(TABLES.NUTRITION_TARGETS)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      // Fetch preferences
      const { data: preferences } = await supabase
        .from(TABLES.USER_PREFERENCES)
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // Fetch dietary restrictions
      const { data: restrictions } = await supabase
        .from(TABLES.DIETARY_RESTRICTIONS)
        .select('*')
        .eq('user_id', user.id);
      
      set({
        profile: profile || null,
        nutritionTargets: targets || null,
        preferences: preferences || null,
        restrictions: restrictions || [],
        isOnboarded: !!profile,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({
        session: null,
        user: null,
        profile: null,
        nutritionTargets: null,
        preferences: null,
        restrictions: [],
        isOnboarded: false,
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },
  
  checkOnboardingStatus: async () => {
    const { user } = get();
    if (!user) return false;
    
    try {
      const { data: profile } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      const isOnboarded = !!profile;
      set({ isOnboarded });
      return isOnboarded;
    } catch (error) {
      return false;
    }
  },
}));

export default useAuthStore;
