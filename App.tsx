import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import NEW screen components
import LoadingScreen from './src/screens/LoadingScreen';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MealsTrackerScreen from './src/screens/MealsTrackerScreen';
import RecipesListScreen from './src/screens/RecipesListScreen';
import ProfileScreenNew from './src/screens/ProfileScreenNew';
import TabBar from './src/components/TabBar';
import MealDetailModal from './src/components/MealDetailModal';

import { User } from './src/types';
import { Meal } from './src/services/professionalAIService';
import { storageService } from './src/services/storageService';
import { databaseService } from './src/services/databaseService';
import { supabase, isSupabaseConfigured } from './src/config/supabase';

export default function App() {
  const [screen, setScreen] = useState<'loading' | 'auth' | 'onboarding' | 'main'>('loading');
  const [activeTab, setActiveTab] = useState<'home' | 'meals' | 'recipes' | 'profile'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth state changes
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setScreen('auth');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const checkAuth = async () => {
    try {
      if (isSupabaseConfigured) {
        // Check Supabase session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is authenticated, load their profile
          await loadUserProfile();
          return;
        }
      }
      
      // Fallback to local storage for demo mode
      const savedUser = await storageService.getUser();
      if (savedUser) {
        setUser(savedUser);
        await storageService.updateStreak(savedUser.id);
        setScreen('main');
      } else {
        setScreen('auth');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setScreen('auth');
    }
  };

  const loadUserProfile = async () => {
    try {
      // Get user profile from database
      const userProfile = await databaseService.getUserProfile();
      
      if (userProfile) {
        // User has completed onboarding
        setUser(userProfile);
        await databaseService.syncCloudToLocal();
        setScreen('main');
      } else {
        // User exists in auth but hasn't completed onboarding
        setScreen('onboarding');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setScreen('auth');
    }
  };

  const handleAuth = async (email: string, password: string, mode: 'signin' | 'signup') => {
    setAuthLoading(true);
    
    try {
      if (isSupabaseConfigured) {
        if (mode === 'signup') {
          // Sign up with Supabase
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: '' },
              // For mobile apps, we can skip email confirmation
              // Configure this in Supabase Dashboard > Auth > Settings
            }
          });
          
          if (error) {
            Alert.alert('Sign Up Error', error.message);
            setAuthLoading(false);
            return;
          }
          
          if (data.user) {
            // Wait for the database trigger to create the user row
            await databaseService.createUserAfterSignup(data.user.id, email);
            
            // Check if email confirmation is required
            if (data.session) {
              // User is auto-confirmed, proceed to onboarding
              setScreen('onboarding');
            } else {
              // Email confirmation required
              Alert.alert(
                'Check Your Email',
                'We sent you a confirmation link. After confirming, please sign in with your credentials.',
                [{ text: 'OK', onPress: () => setScreen('auth') }]
              );
            }
          }
        } else {
          // Sign in with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            Alert.alert('Sign In Error', error.message);
            setAuthLoading(false);
            return;
          }
          
          if (data.user) {
            await loadUserProfile();
          }
        }
      } else {
        // Demo mode - no Supabase
        if (mode === 'signup') {
          setScreen('onboarding');
        } else {
          // Create demo user
          const demoUser: User = {
            id: 'demo_user_' + Date.now(),
            email: email || 'demo@nutripro.com',
            fullName: 'Demo User',
            age: 30,
            gender: 'male',
            weight: 70,
            height: 175,
            bmi: 22.9,
            exerciseLevel: 'moderate',
            diseases: [],
            allergies: [],
            healthGoals: ['General Health'],
            streak: 0,
            longestStreak: 0,
            totalMealsLogged: 0,
            registrationDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            unitsPreference: 'metric',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await storageService.saveUser(demoUser);
          setUser(demoUser);
          setScreen('main');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert('Demo Mode', 'Google Sign-In requires Supabase configuration. Using demo mode.');
      handleAuth('demo@nutripro.com', '', 'signin');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      
      if (error) {
        Alert.alert('Google Sign-In Error', error.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google Sign-In failed');
    }
  };

  const handleOnboardingComplete = async (userData: User) => {
    try {
      // Save complete user profile to Supabase
      const success = await databaseService.saveUserProfile(userData);
      
      if (success) {
        console.log('✅ User profile saved to Supabase');
      }
      
      // Also save locally
      await storageService.saveUser(userData);
      
      setUser(userData);
      setScreen('main');
    } catch (error) {
      console.error('Error saving user profile:', error);
      // Still proceed with local data
      await storageService.saveUser(userData);
      setUser(userData);
      setScreen('main');
    }
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      
      // Update in Supabase
      await databaseService.updateUserProfile(updates);
      
      // Update locally
      await storageService.saveUser(updatedUser);
      setUser(updatedUser);
    }
  };

  const handleAddToMeals = async (meal: Meal) => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      
      // Save to Supabase
      await databaseService.saveMyMeal(meal, today);
      
      // Also save locally
      await storageService.addMealToLog(user.id, meal);
      
      // Refresh user stats
      const stats = await databaseService.getUserStats();
      const updatedUser = { 
        ...user, 
        totalMealsLogged: stats.totalMealsLogged,
        streak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      };
      setUser(updatedUser);
      
      Alert.alert('Success', '✅ Added to your meals!');
    }
  };

  const handleRegenerateMeals = async () => {
    setIsGenerating(true);
    // Clear today's meals to trigger regeneration
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.removeItem(`nutripro_meals_${user.id}_${today}`);
    }
    setIsGenerating(false);
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      
      // Clear local cache
      await storageService.clearLocalCache();
      setUser(null);
      setScreen('auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state
      await storageService.clearLocalCache();
      setUser(null);
      setScreen('auth');
    }
  };

  // Loading Screen
  if (screen === 'loading') {
    return <LoadingScreen />;
  }

  // Auth Screen
  if (screen === 'auth') {
    return (
      <SafeAreaProvider>
        <AuthScreen 
          onAuth={handleAuth}
          onGoogleAuth={handleGoogleAuth}
          onDemoMode={() => handleAuth('demo@nutripro.com', 'demo123456', 'signin')}
          authLoading={authLoading}
        />
      </SafeAreaProvider>
    );
  }

  // Onboarding Screen
  if (screen === 'onboarding') {
    return (
      <SafeAreaProvider>
        <OnboardingScreen 
          onComplete={(newUser) => {
            setUser(newUser);
            setScreen('main');
          }}
        />
      </SafeAreaProvider>
    );
  }

  // Main App with Tabs
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />
        
        {activeTab === 'home' && user && (
          <DashboardScreen
            user={user}
            onMealPress={(meal) => { setSelectedMeal(meal); setShowMealDetail(true); }}
            onAddToMeals={handleAddToMeals}
            onNavigateToRecipes={() => setActiveTab('recipes')}
            onNavigateToExercise={() => {}}
          />
        )}
        
        {activeTab === 'meals' && user && (
          <MealsTrackerScreen
            user={user}
            onViewDetails={(log) => {}}
          />
        )}
        
        {activeTab === 'recipes' && user && (
          <RecipesListScreen
            user={user}
            onRecipePress={(recipe) => { setSelectedMeal(recipe); setShowMealDetail(true); }}
            onAddToMeals={handleAddToMeals}
          />
        )}
        
        {activeTab === 'profile' && user && (
          <ProfileScreenNew
            user={user}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
            onRegenerateMeals={handleRegenerateMeals}
          />
        )}

        <TabBar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} />
        
        <MealDetailModal 
          visible={showMealDetail} 
          meal={selectedMeal} 
          onClose={() => setShowMealDetail(false)} 
          onLog={() => { 
            if (selectedMeal) { 
              handleAddToMeals(selectedMeal); 
              setShowMealDetail(false); 
            } 
          }} 
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
