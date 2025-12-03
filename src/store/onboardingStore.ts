import { create } from 'zustand';
import { OnboardingData } from '../types/database';

interface OnboardingState {
  data: Partial<OnboardingData>;
  currentStep: number;
  totalSteps: number;
  
  // Actions
  setData: (data: Partial<OnboardingData>) => void;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  reset: () => void;
}

const initialData: Partial<OnboardingData> = {
  fullName: '',
  age: undefined,
  gender: undefined,
  height: undefined,
  weight: undefined,
  targetWeight: undefined,
  goal: undefined,
  activityLevel: undefined,
  restrictions: [],
  preferredCuisines: [],
  dislikedIngredients: [],
  mealComplexity: 'moderate',
  cookingTimePreference: 'medium',
  budgetLevel: 'moderate',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  data: initialData,
  currentStep: 0,
  totalSteps: 7,
  
  setData: (data) => set({ data }),
  
  updateData: (updates) =>
    set((state) => ({
      data: { ...state.data, ...updates },
    })),
  
  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
    })),
  
  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),
  
  setStep: (step) => set({ currentStep: step }),
  
  reset: () => set({ data: initialData, currentStep: 0 }),
}));

export default useOnboardingStore;
