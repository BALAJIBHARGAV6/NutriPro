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

export default function App() {
  const [screen, setScreen] = useState<'loading' | 'auth' | 'onboarding' | 'main'>('loading');
  const [activeTab, setActiveTab] = useState<'home' | 'meals' | 'recipes' | 'profile'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to load user from local storage first
      let savedUser = await storageService.getUser();
      
      // If no local user, try to load from database
      if (!savedUser) {
        savedUser = await storageService.loadUserFromDatabase();
      }
      
      if (savedUser) {
        // Sync data from database
        await storageService.syncFromDatabase(savedUser.id);
        
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

  const handleAuth = async (email: string, password: string, mode: 'signin' | 'signup') => {
    const isSignUp = mode === 'signup';
    if (isSignUp) {
      // Go to onboarding for new users
      setScreen('onboarding');
    } else {
      // For demo/existing users, create a demo user
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
  };

  const handleOnboardingComplete = async (userData: Partial<User>) => {
    const newUser: User = {
      id: 'user_' + Date.now(),
      email: userData.email || '',
      fullName: userData.fullName || '',
      age: userData.age || 25,
      gender: userData.gender || 'male',
      weight: userData.weight || 70,
      height: userData.height || 170,
      bmi: (userData.weight || 70) / Math.pow((userData.height || 170) / 100, 2),
      exerciseLevel: userData.exerciseLevel || 'moderate',
      diseases: userData.diseases || [],
      allergies: userData.allergies || [],
      healthGoals: userData.healthGoals || [],
      streak: 0,
      longestStreak: 0,
      totalMealsLogged: 0,
      registrationDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      unitsPreference: 'metric',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await storageService.saveUser(newUser);
    setUser(newUser);
    setScreen('main');
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      await storageService.saveUser(updatedUser);
      setUser(updatedUser);
    }
  };

  const handleAddToMeals = async (meal: Meal) => {
    if (user) {
      await storageService.addMealToLog(user.id, meal);
      const updatedUser = await storageService.getUser();
      if (updatedUser) setUser(updatedUser);
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
    // Clear local cache only - database data is preserved
    await storageService.clearLocalCache();
    setUser(null);
    setScreen('auth');
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
          onGoogleAuth={() => handleAuth('demo@nutripro.com', '', 'signin')}
          onDemoMode={() => handleAuth('demo@nutripro.com', '', 'signin')}
          authLoading={false}
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
