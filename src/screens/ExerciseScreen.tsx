import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Alert,
  Modal,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { User } from '../types';
import { colors, shadows, spacing, borderRadius, typography, textStyles } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExerciseScreenProps {
  user: User;
}

interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  calories: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  emoji: string;
  instructions: string[];
  benefits: string[];
  precautions?: string[];
  reps?: string;
  sets?: number;
}

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  
  // Timer states
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;

  const categories = [
    { id: 'all', name: 'All', emoji: '🏃' },
    { id: 'cardio', name: 'Cardio', emoji: '❤️' },
    { id: 'strength', name: 'Strength', emoji: '💪' },
    { id: 'flexibility', name: 'Flexibility', emoji: '🧘' },
    { id: 'balance', name: 'Balance', emoji: '⚖️' },
  ];

  // AI-based exercise suggestions based on user profile
  const generateExercises = (): Exercise[] => {
    const baseExercises: Exercise[] = [];
    const userAge = user.age || 30;
    const userGender = user.gender || 'male';
    const userDiseases = user.diseases || [];
    
    // Determine intensity based on age and conditions
    const isElderly = userAge >= 60;
    const hasHeartCondition = userDiseases.some(d => 
      d.toLowerCase().includes('heart') || d.toLowerCase().includes('hypertension')
    );
    const hasDiabetes = userDiseases.some(d => 
      d.toLowerCase().includes('diabetes')
    );
    const hasArthritis = userDiseases.some(d => 
      d.toLowerCase().includes('arthritis') || d.toLowerCase().includes('joint')
    );
    const hasBackPain = userDiseases.some(d => 
      d.toLowerCase().includes('back') || d.toLowerCase().includes('spine')
    );

    // CARDIO EXERCISES
    if (!hasHeartCondition || isElderly) {
      baseExercises.push({
        id: 'walk_1',
        name: 'Gentle Walking',
        description: 'Low-impact cardio perfect for all fitness levels',
        duration: 30,
        calories: 120,
        difficulty: 'easy',
        category: 'cardio',
        emoji: '🚶',
        instructions: [
          'Start with a warm-up of slow walking for 5 minutes',
          'Maintain a comfortable pace where you can hold a conversation',
          'Swing your arms naturally',
          'Keep your posture upright',
          'Cool down with slower walking for 5 minutes',
        ],
        benefits: ['Improves cardiovascular health', 'Low impact on joints', 'Reduces stress', 'Boosts mood'],
        precautions: hasHeartCondition ? ['Monitor heart rate', 'Stop if feeling dizzy'] : undefined,
      });
    }

    if (!isElderly && !hasHeartCondition) {
      baseExercises.push({
        id: 'jog_1',
        name: 'Light Jogging',
        description: 'Moderate cardio to improve endurance',
        duration: 20,
        calories: 200,
        difficulty: 'medium',
        category: 'cardio',
        emoji: '🏃',
        instructions: [
          'Warm up with 5 minutes of brisk walking',
          'Start jogging at a comfortable pace',
          'Breathe rhythmically - in through nose, out through mouth',
          'Land on mid-foot to reduce impact',
          'Cool down with 5 minutes of walking',
        ],
        benefits: ['Burns calories efficiently', 'Strengthens heart', 'Improves stamina', 'Releases endorphins'],
      });
    }

    baseExercises.push({
      id: 'cycle_1',
      name: isElderly ? 'Stationary Cycling' : 'Cycling',
      description: 'Joint-friendly cardio exercise',
      duration: 25,
      calories: 180,
      difficulty: isElderly ? 'easy' : 'medium',
      category: 'cardio',
      emoji: '🚴',
      instructions: [
        'Adjust seat height so leg is slightly bent at bottom of pedal',
        'Start with low resistance',
        'Maintain steady pace',
        'Keep back straight',
        'Gradually increase resistance as comfortable',
      ],
      benefits: ['Zero impact on joints', 'Great for arthritis', 'Strengthens legs', 'Improves heart health'],
    });

    // STRENGTH EXERCISES
    if (!hasBackPain) {
      baseExercises.push({
        id: 'squat_1',
        name: userAge >= 50 ? 'Chair Squats' : 'Bodyweight Squats',
        description: 'Lower body strength exercise',
        duration: 10,
        calories: 80,
        difficulty: userAge >= 50 ? 'easy' : 'medium',
        category: 'strength',
        emoji: '🏋️',
        reps: userAge >= 50 ? '8-10 reps' : '12-15 reps',
        sets: 3,
        instructions: [
          userAge >= 50 ? 'Stand in front of a sturdy chair' : 'Stand with feet shoulder-width apart',
          'Keep chest up and core engaged',
          'Lower by pushing hips back',
          userAge >= 50 ? 'Lightly touch the chair, then stand' : 'Go down until thighs are parallel to ground',
          'Push through heels to stand up',
        ],
        benefits: ['Strengthens legs and glutes', 'Improves balance', 'Functional for daily life', 'Burns calories'],
      });
    }

    baseExercises.push({
      id: 'wall_push_1',
      name: isElderly || hasArthritis ? 'Wall Push-ups' : 'Push-ups',
      description: 'Upper body strength builder',
      duration: 10,
      calories: 60,
      difficulty: isElderly || hasArthritis ? 'easy' : 'medium',
      category: 'strength',
      emoji: '💪',
      reps: isElderly ? '8-10 reps' : '10-15 reps',
      sets: 3,
      instructions: isElderly || hasArthritis ? [
        'Stand facing a wall at arm\'s length',
        'Place hands on wall at shoulder height',
        'Lean in by bending elbows',
        'Push back to starting position',
        'Keep body straight throughout',
      ] : [
        'Start in plank position with hands shoulder-width apart',
        'Keep body in a straight line',
        'Lower chest towards ground',
        'Push back up to starting position',
        'Breathe out as you push up',
      ],
      benefits: ['Strengthens chest, shoulders, triceps', 'Core engagement', 'No equipment needed', 'Adjustable difficulty'],
    });

    baseExercises.push({
      id: 'resistance_1',
      name: 'Resistance Band Rows',
      description: 'Back strengthening exercise',
      duration: 10,
      calories: 50,
      difficulty: 'easy',
      category: 'strength',
      emoji: '🎯',
      reps: '12-15 reps',
      sets: 3,
      instructions: [
        'Sit with legs extended, band around feet',
        'Hold band ends with both hands',
        'Pull band towards your waist',
        'Squeeze shoulder blades together',
        'Slowly release back to start',
      ],
      benefits: ['Improves posture', 'Strengthens back muscles', 'Good for desk workers', 'Prevents back pain'],
    });

    // FLEXIBILITY EXERCISES
    baseExercises.push({
      id: 'yoga_1',
      name: 'Gentle Yoga Flow',
      description: 'Calming flexibility routine',
      duration: 20,
      calories: 70,
      difficulty: 'easy',
      category: 'flexibility',
      emoji: '🧘',
      instructions: [
        'Start in comfortable seated position',
        'Practice deep breathing for 2 minutes',
        'Move through cat-cow stretches',
        'Hold child\'s pose for 30 seconds',
        'End with seated forward fold',
      ],
      benefits: ['Increases flexibility', 'Reduces stress', 'Improves breathing', 'Calms the mind'],
      precautions: hasBackPain ? ['Avoid deep forward bends', 'Use props for support'] : undefined,
    });

    baseExercises.push({
      id: 'stretch_1',
      name: 'Full Body Stretch',
      description: 'Comprehensive stretching routine',
      duration: 15,
      calories: 40,
      difficulty: 'easy',
      category: 'flexibility',
      emoji: '🤸',
      instructions: [
        'Neck rolls - 10 each direction',
        'Shoulder circles - 10 each direction',
        'Side stretches - 30 seconds each side',
        'Hamstring stretch - 30 seconds each leg',
        'Quad stretch - 30 seconds each leg',
      ],
      benefits: ['Prevents injury', 'Improves range of motion', 'Reduces muscle tension', 'Great for mornings'],
    });

    // BALANCE EXERCISES
    baseExercises.push({
      id: 'balance_1',
      name: 'Single Leg Stand',
      description: 'Improve balance and stability',
      duration: 10,
      calories: 30,
      difficulty: 'easy',
      category: 'balance',
      emoji: '⚖️',
      reps: '30 seconds each leg',
      sets: 3,
      instructions: [
        'Stand near a wall or chair for support if needed',
        'Lift one foot off the ground',
        'Hold for 30 seconds',
        'Switch to other leg',
        'Progress by closing eyes or removing support',
      ],
      benefits: ['Prevents falls', 'Strengthens ankles', 'Improves coordination', 'Essential for aging'],
    });

    baseExercises.push({
      id: 'balance_2',
      name: 'Heel-to-Toe Walk',
      description: 'Improve gait and balance',
      duration: 10,
      calories: 25,
      difficulty: 'easy',
      category: 'balance',
      emoji: '👣',
      instructions: [
        'Stand with arms out to sides for balance',
        'Place heel of one foot directly in front of toe of other',
        'Take 20 steps forward',
        'Turn around and walk back',
        'Keep eyes focused on a point ahead',
      ],
      benefits: ['Improves gait pattern', 'Enhances proprioception', 'Reduces fall risk', 'Functional for daily life'],
    });

    // Add diabetes-specific exercises
    if (hasDiabetes) {
      baseExercises.push({
        id: 'diabetes_1',
        name: 'Post-Meal Walk',
        description: 'Helps regulate blood sugar after eating',
        duration: 15,
        calories: 60,
        difficulty: 'easy',
        category: 'cardio',
        emoji: '🩺',
        instructions: [
          'Walk 15-30 minutes after each main meal',
          'Keep a moderate pace',
          'This helps glucose absorption',
          'Stay hydrated',
          'Carry glucose tablets in case of low blood sugar',
        ],
        benefits: ['Regulates blood sugar', 'Improves insulin sensitivity', 'Aids digestion', 'Prevents spikes'],
        precautions: ['Monitor blood sugar before and after', 'Have snacks available'],
      });
    }

    // Gender-specific recommendations
    if (userGender === 'female' && !isElderly) {
      baseExercises.push({
        id: 'female_1',
        name: 'Hip Strengthening',
        description: 'Important for women\'s bone health',
        duration: 15,
        calories: 60,
        difficulty: 'easy',
        category: 'strength',
        emoji: '🦵',
        reps: '15 reps each side',
        sets: 3,
        instructions: [
          'Lie on your side with legs stacked',
          'Keep core engaged',
          'Lift top leg up about 45 degrees',
          'Hold for 2 seconds',
          'Lower slowly and repeat',
        ],
        benefits: ['Strengthens hip abductors', 'Supports pelvic health', 'Prevents osteoporosis', 'Improves stability'],
      });
    }

    return baseExercises;
  };

  // Loading animation
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading]);

  // Load exercises with 4 second minimum
  useEffect(() => {
    const loadExercises = async () => {
      const startTime = Date.now();
      
      try {
        const generatedExercises = generateExercises();
        setExercises(generatedExercises);
      } catch (error) {
        console.error('Error generating exercises:', error);
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 4000 - elapsedTime);
        setTimeout(() => setIsLoading(false), remainingTime);
      }
    };

    loadExercises();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const filteredExercises = exercises.filter(ex => 
    selectedCategory === 'all' || ex.category === selectedCategory
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.primary;
    }
  };

  // Timer functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startExercise = (exercise: Exercise) => {
    setActiveExercise(exercise);
    setTimeRemaining(exercise.duration * 60); // Convert minutes to seconds
    setShowTimerModal(true);
    setIsTimerRunning(false);
    setIsPaused(false);
  };

  const speakNumber = (num: number) => {
    Speech.speak(num.toString(), {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const speakText = (text: string) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.85,
    });
  };

  const beginTimer = () => {
    setIsTimerRunning(true);
    setIsPaused(false);
    Vibration.vibrate(100);
    speakText('Exercise started! Let\'s go!');
    
    // Pulse animation for timer
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerPulse, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(timerPulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const pauseTimer = () => {
    setIsPaused(true);
    timerPulse.stopAnimation();
    timerPulse.setValue(1);
  };

  const resumeTimer = () => {
    setIsPaused(false);
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerPulse, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(timerPulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerPulse.stopAnimation();
    timerPulse.setValue(1);
    setIsTimerRunning(false);
    setIsPaused(false);
    setShowTimerModal(false);
    setActiveExercise(null);
  };

  const completeExercise = () => {
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    speakText('Exercise complete! Great job!');
    Alert.alert(
      '🎉 Exercise Complete!',
      `Great job! You burned approximately ${activeExercise?.calories || 0} calories.\n\nKeep up the great work!`,
      [{ text: 'Awesome!', onPress: stopTimer }]
    );
  };

  // Timer countdown effect
  useEffect(() => {
    if (isTimerRunning && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            completeExercise();
            return 0;
          }
          
          const newTime = prev - 1;
          
          // Announce every 1 minute (when seconds = 0)
          if (newTime > 10 && newTime % 60 === 0) {
            const mins = Math.floor(newTime / 60);
            if (mins > 0) {
              speakText(`${mins} minute${mins > 1 ? 's' : ''} remaining`);
            }
          }
          
          // Countdown last 10 seconds with voice
          if (newTime <= 10 && newTime > 0) {
            speakNumber(newTime);
            Vibration.vibrate(100);
          }
          
          // Vibrate every 10 seconds
          if (newTime % 10 === 0 && newTime > 10) {
            Vibration.vibrate(50);
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, isPaused]);

  // Render Timer Modal
  const renderTimerModal = () => (
    <Modal
      visible={showTimerModal}
      animationType="slide"
      statusBarTranslucent={true}
      transparent={false}
    >
      <View style={styles.timerModalContainer}>
        {/* Header */}
        <TouchableOpacity style={styles.timerCloseBtn} onPress={stopTimer}>
          <Text style={styles.timerCloseBtnText}>✕</Text>
        </TouchableOpacity>
        
        <ScrollView 
          style={styles.timerModalScrollView}
          contentContainerStyle={styles.timerModalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise Info */}
          <View style={styles.timerExerciseInfo}>
            <Text style={styles.timerExerciseEmoji}>{activeExercise?.emoji || '🏋️'}</Text>
            <Text style={styles.timerExerciseName}>{activeExercise?.name}</Text>
            <Text style={styles.timerExerciseDesc}>{activeExercise?.description}</Text>
          </View>
          
          {/* Timer Display */}
          <Animated.View style={[styles.timerCircle, { transform: [{ scale: timerPulse }] }]}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.timerLabel}>
              {isTimerRunning ? (isPaused ? 'PAUSED' : 'IN PROGRESS') : 'READY'}
            </Text>
          </Animated.View>
          
          {/* Progress Info */}
          <View style={styles.timerStats}>
            <View style={styles.timerStatItem}>
              <Text style={styles.timerStatIcon}>🔥</Text>
              <Text style={styles.timerStatValue}>{activeExercise?.calories || 0}</Text>
              <Text style={styles.timerStatLabel}>Calories</Text>
            </View>
            <View style={styles.timerStatItem}>
              <Text style={styles.timerStatIcon}>⏱️</Text>
              <Text style={styles.timerStatValue}>{activeExercise?.duration || 0}</Text>
              <Text style={styles.timerStatLabel}>Minutes</Text>
            </View>
            <View style={styles.timerStatItem}>
              <Text style={styles.timerStatIcon}>💪</Text>
              <Text style={styles.timerStatValue}>{activeExercise?.difficulty || 'easy'}</Text>
              <Text style={styles.timerStatLabel}>Difficulty</Text>
            </View>
          </View>
          
          {/* Control Buttons */}
          <View style={styles.timerControls}>
            {!isTimerRunning ? (
              <TouchableOpacity style={styles.timerStartBtn} onPress={beginTimer}>
                <Text style={styles.timerStartBtnText}>▶ START</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.timerControlRow}>
                {isPaused ? (
                  <TouchableOpacity style={styles.timerResumeBtn} onPress={resumeTimer}>
                    <Text style={styles.timerControlBtnText}>▶ RESUME</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.timerPauseBtn} onPress={pauseTimer}>
                    <Text style={styles.timerControlBtnText}>⏸ PAUSE</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.timerStopBtn} onPress={stopTimer}>
                  <Text style={styles.timerStopBtnText}>⏹ STOP</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Tips */}
          <View style={styles.timerTips}>
            <Text style={styles.timerTipsTitle}>💡 Tips</Text>
            <Text style={styles.timerTipsText}>
              • Stay hydrated during exercise{'\n'}
              • Maintain proper form{'\n'}
              • Breathe consistently{'\n'}
              • Stop if you feel pain
            </Text>
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingScreen}>
          <View style={styles.loaderContainer}>
            <Animated.View style={[styles.loaderRing, { transform: [{ rotate: spin }] }]} />
            <View style={styles.loaderInner}>
              <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
                <Text style={styles.loaderIcon}>🏋️</Text>
              </Animated.View>
            </View>
          </View>
          
          <Text style={styles.loadingTitle}>Preparing Your Workout</Text>
          <Text style={styles.loadingSubtitle}>
            Customizing exercises for your health profile...
          </Text>
          
          <View style={styles.loadingDotsRow}>
            <Animated.View style={[styles.loadingDot, { opacity: pulseValue }]} />
            <View style={[styles.loadingDot, { opacity: 0.6 }]} />
            <View style={[styles.loadingDot, { opacity: 0.3 }]} />
          </View>
          
          <View style={styles.loadingFoodRow}>
            <View style={styles.loadingFoodItem}>
              <Text style={styles.loadingFoodEmoji}>🏃</Text>
              <Text style={styles.loadingFoodLabel}>Cardio</Text>
            </View>
            <View style={styles.loadingFoodItem}>
              <Text style={styles.loadingFoodEmoji}>💪</Text>
              <Text style={styles.loadingFoodLabel}>Strength</Text>
            </View>
            <View style={styles.loadingFoodItem}>
              <Text style={styles.loadingFoodEmoji}>🧘</Text>
              <Text style={styles.loadingFoodLabel}>Flexibility</Text>
            </View>
            <View style={styles.loadingFoodItem}>
              <Text style={styles.loadingFoodEmoji}>⚖️</Text>
              <Text style={styles.loadingFoodLabel}>Balance</Text>
            </View>
          </View>
          
          {user.diseases && user.diseases.length > 0 && (
            <View style={styles.loadingBadge}>
              <Text style={styles.loadingBadgeText}>
                🎯 Customized for {user.diseases[0]}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Exercise Hub</Text>
              <Text style={styles.headerSubtitle}>
                {user.diseases?.length ? `Optimized for ${user.diseases[0]}` : 'Stay active, stay healthy'}
              </Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeEmoji}>🎯</Text>
              <Text style={styles.headerBadgeText}>{user.age}y • {user.gender === 'male' ? '♂' : '♀'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏃</Text>
            <Text style={styles.statValue}>{exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={styles.statValue}>
              {Math.round(exercises.reduce((sum, ex) => sum + ex.duration, 0) / exercises.length) || 0}
            </Text>
            <Text style={styles.statLabel}>Avg Mins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>
              {Math.round(exercises.reduce((sum, ex) => sum + ex.calories, 0) / exercises.length) || 0}
            </Text>
            <Text style={styles.statLabel}>Avg Cal</Text>
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Exercises List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>
            Recommended for You ({filteredExercises.length})
          </Text>
          
          {filteredExercises.map((exercise) => {
            const isExpanded = expandedExercise === exercise.id;
            
            return (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseCard}
                onPress={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                activeOpacity={0.9}
              >
                {/* Exercise Header */}
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseIconContainer}>
                    <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                    <View style={styles.exerciseMeta}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaIcon}>⏱️</Text>
                        <Text style={styles.metaText}>{exercise.duration} min</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaIcon}>🔥</Text>
                        <Text style={styles.metaText}>{exercise.calories} cal</Text>
                      </View>
                      <View style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }
                      ]}>
                        <Text style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(exercise.difficulty) }
                        ]}>
                          {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </View>

                {/* Expanded Content */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Instructions */}
                    <View style={styles.instructionsSection}>
                      <Text style={styles.instructionsTitle}>📋 How to do it</Text>
                      {exercise.instructions.map((instruction, idx) => (
                        <View key={idx} style={styles.instructionRow}>
                          <View style={styles.instructionNumber}>
                            <Text style={styles.instructionNumberText}>{idx + 1}</Text>
                          </View>
                          <Text style={styles.instructionText}>{instruction}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Reps/Sets if applicable */}
                    {exercise.reps && (
                      <View style={styles.repsSection}>
                        <Text style={styles.repsLabel}>Sets: {exercise.sets}</Text>
                        <Text style={styles.repsLabel}>Reps: {exercise.reps}</Text>
                      </View>
                    )}

                    {/* Benefits */}
                    <View style={styles.benefitsSection}>
                      <Text style={styles.benefitsTitle}>✨ Benefits</Text>
                      <View style={styles.benefitsTags}>
                        {exercise.benefits.map((benefit, idx) => (
                          <View key={idx} style={styles.benefitTag}>
                            <Text style={styles.benefitText}>{benefit}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Precautions if any */}
                    {exercise.precautions && (
                      <View style={styles.precautionsSection}>
                        <Text style={styles.precautionsTitle}>⚠️ Precautions</Text>
                        {exercise.precautions.map((precaution, idx) => (
                          <Text key={idx} style={styles.precautionText}>• {precaution}</Text>
                        ))}
                      </View>
                    )}

                    {/* Start Button */}
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => startExercise(exercise)}
                    >
                      <Text style={styles.startButtonText}>▶ Start Exercise</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Health Tip */}
        <View style={styles.healthTip}>
          <Text style={styles.healthTipEmoji}>💡</Text>
          <View style={styles.healthTipContent}>
            <Text style={styles.healthTipTitle}>Daily Tip</Text>
            <Text style={styles.healthTipText}>
              {user.diseases?.some(d => d.toLowerCase().includes('diabetes'))
                ? 'Exercise after meals helps regulate blood sugar levels. Aim for 15-30 minute walks after each meal.'
                : 'Aim for at least 30 minutes of moderate exercise most days. Start small and build up gradually!'}
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xl * 2 }} />
      </ScrollView>
      
      {renderTimerModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  
  // Loading styles
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  loaderContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  loaderRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.surfaceLight,
    borderTopColor: colors.primary,
    borderRightColor: colors.primary,
  },
  loaderInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  loaderIcon: {
    fontSize: 40,
  },
  loadingTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  loadingSubtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  loadingDotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  loadingFoodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  loadingFoodItem: {
    alignItems: 'center',
  },
  loadingFoodEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  loadingFoodLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  loadingBadge: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  loadingBadgeText: {
    ...textStyles.label,
    color: colors.primary,
  },

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h1,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  headerBadgeEmoji: {
    fontSize: 16,
  },
  headerBadgeText: {
    ...textStyles.label,
    color: '#FFFFFF',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...textStyles.number,
    fontSize: 19,
    color: colors.textPrimary,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Categories
  categorySection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  categoryScroll: {
    marginLeft: -spacing.xs,
    paddingRight: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
    ...shadows.soft,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  // Exercises
  exercisesSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  exerciseHeader: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  exerciseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseEmoji: {
    fontSize: 28,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  exerciseDescription: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  difficultyText: {
    ...textStyles.labelSmall,
  },
  expandIcon: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },

  // Expanded content
  expandedContent: {
    padding: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  instructionsSection: {
    marginTop: spacing.md,
  },
  instructionsTitle: {
    ...textStyles.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  instructionNumberText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  repsSection: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  repsLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  benefitsSection: {
    marginTop: spacing.md,
  },
  benefitsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  benefitsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  benefitTag: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  benefitText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  precautionsSection: {
    marginTop: spacing.md,
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  precautionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  precautionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  startButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },

  // Health Tip
  healthTip: {
    flexDirection: 'row',
    backgroundColor: colors.primaryPale,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'flex-start',
  },
  healthTipEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  healthTipContent: {
    flex: 1,
  },
  healthTipTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  healthTipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  
  // ========== TIMER MODAL STYLES ==========
  timerModalContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  timerModalScrollView: {
    flex: 1,
  },
  timerModalContent: {
    padding: spacing.lg,
    paddingTop: 60,
    alignItems: 'center',
  },
  timerCloseBtn: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  timerCloseBtnText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
  },
  timerExerciseInfo: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  timerExerciseEmoji: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  timerExerciseName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  timerExerciseDesc: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 6,
    borderColor: '#FFFFFF',
  },
  timerText: {
    fontSize: 52,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  timerLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
    letterSpacing: 2,
  },
  timerStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  timerStatItem: {
    alignItems: 'center',
  },
  timerStatIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  timerStatValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  timerStatLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  timerControls: {
    marginTop: spacing.xl,
    width: '100%',
  },
  timerStartBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  timerStartBtnText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  timerControlRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timerPauseBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  timerResumeBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  timerControlBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  timerStopBtn: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  timerStopBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  timerTips: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    width: '100%',
  },
  timerTipsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  timerTipsText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
});

export default ExerciseScreen;
