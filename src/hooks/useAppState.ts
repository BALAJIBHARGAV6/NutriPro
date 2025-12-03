import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { professionalAIService, Meal, DayPlan, UserProfile } from '../services/professionalAIService';

export const useAppState = () => {
  // Core state
  const [screen, setScreen] = useState<string>('loading');
  const [activeTab, setActiveTab] = useState('home');
  const [refreshing, setRefreshing] = useState(false);
  
  // User state
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    name: '', age: 0, gender: '', weight: 0, height: 0,
    goal: '', activityLevel: '',
    dietaryRestrictions: [], allergies: [], healthConditions: [],
    calorieTarget: 0,
  });
  
  // Nutrition state
  const [nutrition, setNutrition] = useState({
    calories: { current: 0, target: 2000 },
    protein: { current: 0, target: 150 },
    carbs: { current: 0, target: 250 },
    fats: { current: 0, target: 65 },
  });
  
  // Meal plan state
  const [todayMeals, setTodayMeals] = useState<DayPlan | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showMealDetail, setShowMealDetail] = useState(false);
  
  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreference, setAiPreference] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Auth state
  const [authLoading, setAuthLoading] = useState(false);

  // Check session on app start
  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        const profileData = await AsyncStorage.getItem('profile');
        
        if (userData && profileData) {
          setUser(JSON.parse(userData));
          setProfile(JSON.parse(profileData));
          setScreen('home');
        } else {
          setScreen('auth');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setScreen('auth');
      }
    };
    
    checkSession();
  }, []);

  // Watch user state changes
  useEffect(() => {
    if (user !== null && screen === 'auth') {
      setScreen('home');
    }
  }, [user, screen]);

  // Calculate nutrition targets
  const calculateTargets = () => {
    const { weight, height, age, gender, activityLevel, goal } = profile;
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;
    
    const multipliers: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
    };
    
    let tdee = bmr * (multipliers[activityLevel] || 1.55);
    if (goal === 'lose') tdee -= 500;
    if (goal === 'gain') tdee += 300;
    
    const calories = Math.round(tdee);
    const protein = Math.round(weight * 2);
    const fats = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);
    
    setNutrition({
      calories: { current: 0, target: calories },
      protein: { current: 0, target: protein },
      carbs: { current: 0, target: carbs },
      fats: { current: 0, target: fats },
    });
    
    setProfile(p => ({ ...p, calorieTarget: calories }));
  };

  // Generate AI meal plan
  const handleGenerateMealPlan = async () => {
    setIsGenerating(true);
    try {
      const dayPlan = await professionalAIService.generateDayPlan(profile);
      setTodayMeals(dayPlan);
      
      const totalCals = dayPlan.breakfast.calories + dayPlan.lunch.calories + 
                       dayPlan.dinner.calories + dayPlan.snacks.reduce((a, s) => a + s.calories, 0);
      const totalProtein = dayPlan.breakfast.protein + dayPlan.lunch.protein + 
                          dayPlan.dinner.protein + dayPlan.snacks.reduce((a, s) => a + s.protein, 0);
      
      setNutrition(n => ({
        ...n,
        calories: { ...n.calories, current: totalCals },
        protein: { ...n.protein, current: totalProtein },
      }));
      
      Alert.alert('Success! 🎉', 'Your personalized meal plan is ready! (Using smart recommendations)');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate single AI meal
  const handleGenerateSingleMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setIsGenerating(true);
    try {
      const meal = await professionalAIService.generatePersonalizedMeal(mealType, profile, aiPreference);
      if (meal && todayMeals) {
        if (mealType === 'snack') {
          setTodayMeals({ ...todayMeals, snacks: [...todayMeals.snacks, meal] });
        } else {
          setTodayMeals({ ...todayMeals, [mealType]: meal });
        }
        setShowAiModal(false);
        setAiPreference('');
        Alert.alert('New Meal Generated! 🍽️', `${meal.name} has been added to your plan.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate meal.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Log meal as eaten
  const handleLogMeal = (meal: Meal) => {
    setNutrition(n => ({
      calories: { ...n.calories, current: n.calories.current + meal.calories },
      protein: { ...n.protein, current: n.protein.current + meal.protein },
      carbs: { ...n.carbs, current: n.carbs.current + meal.carbs },
      fats: { ...n.fats, current: n.fats.current + meal.fats },
    }));
    Alert.alert('Logged! ✅', `${meal.name} added to your daily intake.`);
  };

  // Complete onboarding
  const completeOnboarding = () => {
    calculateTargets();
    setScreen('home');
  };

  // Save user data to storage
  const saveUserData = async (userData: any, profileData: UserProfile) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('profile', JSON.stringify(profileData));
      console.log('User data saved to storage');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  // Auth handlers
  const handleAuth = async (authEmail: string) => {
    setAuthLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const userData = { name: profile.name || 'User', email: authEmail };
      setUser(userData);
      await saveUserData(userData, profile);
      Alert.alert('Success!', `Welcome ${profile.name || 'User'}!`);
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const userData = { name: profile.name || 'User', email: 'user@gmail.com' };
      setUser(userData);
      await saveUserData(userData, profile);
      Alert.alert('Success!', `Welcome ${profile.name || 'User'}!`);
    } catch (error) {
      Alert.alert('Error', 'Google sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoMode = () => {
    setUser({ name: '', email: 'demo@nutriplan.app' });
    setScreen('onboarding');
  };

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('profile');
      setUser(null);
      setProfile({
        name: '', age: 0, gender: '', weight: 0, height: 0,
        goal: '', activityLevel: '',
        dietaryRestrictions: [], allergies: [], healthConditions: [],
        calorieTarget: 0,
      });
      setScreen('auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    // State
    screen, activeTab, refreshing, user, profile, nutrition,
    todayMeals, selectedMeal, showMealDetail, isGenerating,
    aiPreference, showAiModal, authLoading,
    // Setters
    setScreen, setActiveTab, setProfile, setSelectedMeal,
    setShowMealDetail, setAiPreference, setShowAiModal,
    // Handlers
    handleGenerateMealPlan, handleGenerateSingleMeal, handleLogMeal,
    completeOnboarding, handleAuth, handleGoogleAuth, handleDemoMode, handleSignOut,
  };
};
