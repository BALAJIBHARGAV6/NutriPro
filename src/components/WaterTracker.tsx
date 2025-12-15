import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { colors, shadows, spacing, borderRadius, typography } from '../constants/theme';
import { databaseService } from '../services/databaseService';
import { isSupabaseConfigured } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WaterTrackerProps {
  userId: string;
  onUpdate?: (totalMl: number) => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ userId, onUpdate }) => {
  const [waterIntake, setWaterIntake] = useState(0); // in ml
  const [dailyGoal] = useState(2500); // 2.5L default goal
  const [isLoading, setIsLoading] = useState(false);
  const waveAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const glasses = Math.floor(waterIntake / 250);
  const progress = Math.min((waterIntake / dailyGoal) * 100, 100);

  useEffect(() => {
    loadWaterIntake();
    startWaveAnimation();
  }, []);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadWaterIntake = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (isSupabaseConfigured) {
        const totalMl = await databaseService.getWaterIntake(today);
        setWaterIntake(totalMl);
      } else {
        // Fallback to local storage
        const stored = await AsyncStorage.getItem(`water_${userId}_${today}`);
        if (stored) setWaterIntake(parseInt(stored, 10));
      }
    } catch (error) {
      console.error('Error loading water intake:', error);
    }
  };

  const addWater = async (amountMl: number) => {
    setIsLoading(true);
    try {
      const newTotal = waterIntake + amountMl;
      setWaterIntake(newTotal);
      
      if (isSupabaseConfigured) {
        await databaseService.addWaterIntake(amountMl);
      } else {
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(`water_${userId}_${today}`, newTotal.toString());
      }
      
      onUpdate?.(newTotal);
    } catch (error) {
      console.error('Error adding water:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const waterButtons = [
    { label: '🥛', amount: 250, text: '250ml' },
    { label: '🧴', amount: 500, text: '500ml' },
    { label: '🍶', amount: 750, text: '750ml' },
    { label: '🫗', amount: 1000, text: '1L' },
  ];

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💧 Water Intake</Text>
        <Text style={styles.subtitle}>{glasses} glasses today</Text>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.currentAmount}>{waterIntake}ml</Text>
          <Text style={styles.goalText}>/ {dailyGoal}ml goal</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: progressWidth,
                transform: [{ translateY: waveTranslate }],
              }
            ]} 
          />
          <View style={styles.progressWave} />
        </View>
        
        <Text style={styles.percentText}>{Math.round(progress)}%</Text>
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.buttonsContainer}>
        {waterButtons.map((btn, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.waterButton, isLoading && styles.buttonDisabled]}
            onPress={() => addWater(btn.amount)}
            disabled={isLoading}
          >
            <Text style={styles.buttonEmoji}>{btn.label}</Text>
            <Text style={styles.buttonText}>{btn.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hydration Status */}
      <View style={styles.statusContainer}>
        {progress >= 100 ? (
          <Text style={styles.statusComplete}>✅ Great job! Goal reached!</Text>
        ) : progress >= 75 ? (
          <Text style={styles.statusGood}>💪 Almost there! Keep it up!</Text>
        ) : progress >= 50 ? (
          <Text style={styles.statusOk}>👍 Halfway done!</Text>
        ) : (
          <Text style={styles.statusLow}>💡 Remember to stay hydrated!</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  currentAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: '#0EA5E9', // Water blue
  },
  goalText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  progressBarContainer: {
    height: 24,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
  },
  progressWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  percentText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  waterButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    marginHorizontal: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  buttonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: '#0284C7',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusComplete: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: '600',
  },
  statusGood: {
    fontSize: typography.fontSize.sm,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  statusOk: {
    fontSize: typography.fontSize.sm,
    color: '#F59E0B',
    fontWeight: '600',
  },
  statusLow: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default WaterTracker;
