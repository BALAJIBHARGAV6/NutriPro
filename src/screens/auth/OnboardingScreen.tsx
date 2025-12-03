import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storageService } from '../../services/storageService';
import { databaseService } from '../../services/databaseService';
import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { User } from '../../types';

interface OnboardingScreenProps {
  onComplete?: (user: User) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1 - Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Personal Information
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

  // Physical Metrics
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  // Lifestyle
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');
  const [goal, setGoal] = useState<'maintain' | 'lose' | 'gain'>('maintain');

  // Health Information
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);

  const commonConditions = [
    'Diabetes Type 1', 'Diabetes Type 2', 'Hypertension', 'High Cholesterol',
    'Heart Disease', 'Asthma', 'Arthritis', 'Osteoporosis', 'Thyroid',
    'Celiac Disease', 'IBS', 'Kidney Disease', 'Liver Disease'
  ];

  const commonAllergies = [
    'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat/Gluten',
    'Fish', 'Shellfish', 'Sesame', 'Latex'
  ];

  const calculateBMI = () => {
    const weightKg = units === 'imperial' ? parseFloat(weight) * 0.453592 : parseFloat(weight);
    const heightCm = units === 'imperial' ? parseFloat(height) * 2.54 : parseFloat(height);
    return weightKg / Math.pow(heightCm / 100, 2);
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const weightKg = units === 'imperial' ? parseFloat(weight) * 0.453592 : parseFloat(weight);
      const heightCm = units === 'imperial' ? parseFloat(height) * 2.54 : parseFloat(height);
      const bmi = weightKg / Math.pow(heightCm / 100, 2);

      // Get the authenticated user ID from Supabase
      let userId = 'user_' + Date.now(); // Fallback for demo mode
      let userEmail = email;
      
      if (isSupabaseConfigured) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          userId = authUser.id;
          userEmail = authUser.email || email;
        }
      }

      // Create user object with Supabase auth ID
      const newUser: User = {
        id: userId,
        email: userEmail,
        fullName: fullName,
        age: parseInt(age),
        gender: gender,
        weight: weightKg,
        height: heightCm,
        bmi: bmi,
        exerciseLevel: activityLevel,
        diseases: conditions,
        allergies: allergies,
        healthGoals: [goal],
        goal: goal as 'maintain' | 'lose' | 'gain',
        streak: 0,
        longestStreak: 0,
        totalMealsLogged: 0,
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        unitsPreference: units,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Supabase database
      const saved = await databaseService.saveUserProfile(newUser);
      
      if (saved) {
        console.log('✅ User profile saved to Supabase');
      }

      // Also save to local storage
      await storageService.saveUser(newUser);

      Alert.alert('Success!', 'Your profile has been set up successfully!');
      
      // Call onComplete callback
      if (onComplete) {
        onComplete(newUser);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMR = () => {
    const weightKg = units === 'imperial' ? parseFloat(weight) * 0.453592 : parseFloat(weight);
    const heightCm = units === 'imperial' ? parseFloat(height) * 2.54 : parseFloat(height);
    const ageNum = parseInt(age);

    if (gender === 'male') {
      return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageNum);
    } else {
      return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageNum);
    }
  };

  const getActivityMultiplier = () => {
    switch (activityLevel) {
      case 'sedentary': return 1.2;
      case 'light': return 1.375;
      case 'moderate': return 1.55;
      case 'active': return 1.725;
      case 'very_active': return 1.9;
      default: return 1.55;
    }
  };

  const toggleCondition = (condition: string) => {
    setConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      gender === g && styles.genderButtonSelected
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      gender === g && styles.genderButtonTextSelected
                    ]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Physical Metrics</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Units</Text>
              <View style={styles.unitsContainer}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    units === 'metric' && styles.unitButtonSelected
                  ]}
                  onPress={() => setUnits('metric')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    units === 'metric' && styles.unitButtonTextSelected
                  ]}>
                    Metric (kg, cm)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    units === 'imperial' && styles.unitButtonSelected
                  ]}
                  onPress={() => setUnits('imperial')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    units === 'imperial' && styles.unitButtonTextSelected
                  ]}>
                    Imperial (lbs, ft)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Weight ({units === 'metric' ? 'kg' : 'lbs'})
              </Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder={`Enter weight in ${units === 'metric' ? 'kg' : 'lbs'}`}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Height ({units === 'metric' ? 'cm' : 'inches'})
              </Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder={`Enter height in ${units === 'metric' ? 'cm' : 'inches'}`}
                keyboardType="numeric"
              />
            </View>

            {weight && height && (
              <View style={styles.bmiContainer}>
                <Text style={styles.bmiText}>
                  Calculated BMI: {calculateBMI().toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Lifestyle Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.optionsContainer}>
                {[
                  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
                  { value: 'light', label: 'Light', desc: 'Light exercise 1-3 days/week' },
                  { value: 'moderate', label: 'Moderate', desc: 'Moderate exercise 3-5 days/week' },
                  { value: 'active', label: 'Active', desc: 'Hard exercise 6-7 days/week' },
                  { value: 'very_active', label: 'Very Active', desc: 'Very hard exercise & physical job' },
                ].map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.optionCard,
                      activityLevel === level.value && styles.optionCardSelected
                    ]}
                    onPress={() => setActivityLevel(level.value as any)}
                  >
                    <Text style={[
                      styles.optionTitle,
                      activityLevel === level.value && styles.optionTitleSelected
                    ]}>
                      {level.label}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      activityLevel === level.value && styles.optionDescriptionSelected
                    ]}>
                      {level.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Health Conditions</Text>
            <Text style={styles.stepSubtitle}>Select any conditions you have (optional)</Text>
            
            <ScrollView style={styles.conditionsContainer}>
              <View style={styles.tagsContainer}>
                {commonConditions.map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.tag,
                      conditions.includes(condition) && styles.tagSelected
                    ]}
                    onPress={() => toggleCondition(condition)}
                  >
                    <Text style={[
                      styles.tagText,
                      conditions.includes(condition) && styles.tagTextSelected
                    ]}>
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Dietary Restrictions</Text>
            <Text style={styles.stepSubtitle}>Select any allergies or restrictions (optional)</Text>
            
            <ScrollView style={styles.conditionsContainer}>
              <View style={styles.tagsContainer}>
                {commonAllergies.map((allergy) => (
                  <TouchableOpacity
                    key={allergy}
                    style={[
                      styles.tag,
                      allergies.includes(allergy) && styles.tagSelected
                    ]}
                    onPress={() => toggleAllergy(allergy)}
                  >
                    <Text style={[
                      styles.tagText,
                      allergies.includes(allergy) && styles.tagTextSelected
                    ]}>
                      {allergy}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.progressStep,
                s <= step && styles.progressStepActive
              ]}
            />
          ))}
        </View>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 5 ? 'Complete' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: 16,
  },
  progressStep: {
    flex: 1,
    height: 8,
    marginHorizontal: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressStepActive: {
    backgroundColor: '#2E7D32',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
  genderButtonSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  genderButtonText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#374151',
  },
  genderButtonTextSelected: {
    color: '#2E7D32',
  },
  unitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
  unitButtonSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  unitButtonText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#374151',
  },
  unitButtonTextSelected: {
    color: '#2E7D32',
  },
  bmiContainer: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  bmiText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  optionCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#2E7D32',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionDescriptionSelected: {
    color: '#2E7D32',
  },
  conditionsContainer: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    backgroundColor: 'white',
  },
  tagSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  tagTextSelected: {
    color: '#2E7D32',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
    gap: 16,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  backButtonText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#374151',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2E7D32',
    borderRadius: 8,
  },
  nextButtonText: {
    textAlign: 'center',
    fontWeight: '500',
    color: 'white',
  },
});

export default OnboardingScreen;
