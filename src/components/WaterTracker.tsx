import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Water Sky Blue Color Palette - Light & Fresh
const COLORS = {
  primary: '#38BDF8',        // Water sky blue
  primaryLight: '#7DD3FC',   // Light water blue
  primaryDark: '#0EA5E9',    // Slightly deeper water blue
  accent: '#BAE6FD',         // Very light water blue
  background: '#F0F9FF',     // Sky blue 50
  surface: '#E0F2FE',        // Sky blue 100
  success: '#34D399',        // Light green
  warning: '#FBBF24',        // Light amber
  text: '#1F2937',           // Black/dark gray for main text
  textMuted: '#374151',      // Dark gray for labels
  white: '#FFFFFF',
};

// Professional Water Drop Icon
const WaterDropIcon = ({ size = 24, color = COLORS.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
      fill={color}
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Glass Icon
const GlassIcon = ({ size = 20, filled = false }: { size?: number; filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 3h14l-1.5 15a2 2 0 01-2 2H8.5a2 2 0 01-2-2L5 3z"
      fill={filled ? COLORS.primary : 'transparent'}
      stroke={filled ? COLORS.primary : COLORS.textMuted}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {filled && (
      <Path
        d="M6.5 8h11l-1 10a2 2 0 01-2 2H8.5a2 2 0 01-1-2L6.5 8z"
        fill={COLORS.primaryLight}
        opacity="0.5"
      />
    )}
  </Svg>
);

// Plus Icon
const PlusIcon = ({ size = 18, color = COLORS.white }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Minus Icon
const MinusIcon = ({ size = 18, color = COLORS.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12h14"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Check Icon
const CheckIcon = ({ size = 16, color = COLORS.success }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Target Icon
const TargetIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={COLORS.primary} strokeWidth="1.5" />
    <Circle cx="12" cy="12" r="6" stroke={COLORS.primary} strokeWidth="1.5" />
    <Circle cx="12" cy="12" r="2" fill={COLORS.primary} />
  </Svg>
);

// Clock Icon for remaining
const ClockIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={COLORS.warning} strokeWidth="1.5" />
    <Path d="M12 6v6l4 2" stroke={COLORS.warning} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

interface WaterTrackerProps {
  dailyTarget?: number;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ dailyTarget = 2500 }) => {
  const [waterIntake, setWaterIntake] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const glassSizes = [
    { size: 150, label: '150ml' },
    { size: 250, label: '250ml' },
    { size: 500, label: '500ml' },
  ];

  useEffect(() => {
    loadWaterIntake();
  }, []);

  useEffect(() => {
    const progress = Math.min(waterIntake / dailyTarget, 1);
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [waterIntake, dailyTarget]);

  const loadWaterIntake = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = await AsyncStorage.getItem(`water_${today}`);
      if (stored) {
        setWaterIntake(parseInt(stored, 10));
      }
    } catch (error) {
      console.error('Error loading water intake:', error);
    }
  };

  const saveWaterIntake = async (amount: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`water_${today}`, amount.toString());
    } catch (error) {
      console.error('Error saving water intake:', error);
    }
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const addWater = (amount: number) => {
    animatePress();
    const newAmount = waterIntake + amount;
    setWaterIntake(newAmount);
    saveWaterIntake(newAmount);
  };

  const removeWater = () => {
    if (waterIntake <= 0) return;
    animatePress();
    const newAmount = Math.max(0, waterIntake - 250);
    setWaterIntake(newAmount);
    saveWaterIntake(newAmount);
  };

  const percentage = Math.min((waterIntake / dailyTarget) * 100, 100);
  const remaining = Math.max(dailyTarget - waterIntake, 0);
  const glassesCount = Math.floor(waterIntake / 250);
  const isGoalReached = percentage >= 100;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.iconGradient}
            >
              <WaterDropIcon size={22} color={COLORS.white} />
            </LinearGradient>
          </View>
          <View>
            <Text style={styles.title}>Water Intake</Text>
            <Text style={styles.subtitle}>
              {isGoalReached ? 'Goal achieved!' : 'Stay hydrated'}
            </Text>
          </View>
        </View>
        <View style={styles.targetBadge}>
          <TargetIcon size={14} />
          <Text style={styles.targetText}>{dailyTarget}ml</Text>
        </View>
      </View>

      {/* Main Stats Row */}
      <View style={styles.statsRow}>
        {/* Circular Progress */}
        <View style={styles.circularProgress}>
          <View style={styles.circleOuter}>
            <LinearGradient
              colors={[COLORS.background, COLORS.surface]}
              style={styles.circleInner}
            >
              <Text style={styles.percentText}>{Math.round(percentage)}%</Text>
              <Text style={styles.consumedText}>{waterIntake}ml</Text>
            </LinearGradient>
          </View>
          <View style={[styles.progressRing, { borderColor: isGoalReached ? COLORS.success : COLORS.primary }]} />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsCards}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: COLORS.surface }]}>
              <GlassIcon size={18} filled />
            </View>
            <Text style={styles.statValue}>{glassesCount}</Text>
            <Text style={styles.statLabel}>Glasses</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#FEF3C7' }]}>
              <ClockIcon size={18} />
            </View>
            <Text style={styles.statValue}>{remaining}ml</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: isGoalReached ? '#D1FAE5' : COLORS.surface }]}>
              {isGoalReached ? <CheckIcon size={18} /> : <WaterDropIcon size={18} color={COLORS.primary} />}
            </View>
            <Text style={[styles.statValue, isGoalReached && { color: COLORS.success }]}>
              {isGoalReached ? 'Done' : `${Math.round(percentage)}%`}
            </Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
            <LinearGradient
              colors={isGoalReached ? [COLORS.success, '#34D399'] : [COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </Animated.View>
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>0ml</Text>
          <Text style={styles.progressLabel}>{dailyTarget / 2}ml</Text>
          <Text style={styles.progressLabel}>{dailyTarget}ml</Text>
        </View>
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAdd}>
        <Text style={styles.quickAddTitle}>Quick Add</Text>
        <View style={styles.buttonRow}>
          {glassSizes.map((glass, index) => (
            <TouchableOpacity
              key={index}
              style={styles.addButton}
              onPress={() => addWater(glass.size)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.addButtonGradient}
              >
                <PlusIcon size={16} />
                <Text style={styles.addButtonText}>{glass.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Remove Button */}
      {waterIntake > 0 && (
        <TouchableOpacity style={styles.removeButton} onPress={removeWater} activeOpacity={0.7}>
          <MinusIcon size={16} color={COLORS.primaryDark} />
          <Text style={styles.removeButtonText}>Remove 250ml</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 12,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  targetText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  circularProgress: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  circleOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
  },
  circleInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  consumedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    opacity: 0.4,
  },
  statsCards: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  quickAdd: {
    marginBottom: 12,
  },
  quickAddTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primaryDark,
  },
});

export default WaterTracker;
