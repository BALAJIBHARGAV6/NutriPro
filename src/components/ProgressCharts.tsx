import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { colors, shadows, spacing, borderRadius, typography } from '../constants/theme';
import { databaseService } from '../services/databaseService';
import { storageService } from '../services/storageService';
import { isSupabaseConfigured } from '../config/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - spacing.md * 4;
const BAR_WIDTH = (CHART_WIDTH - 60) / 7;

interface DayData {
  day: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sugar: number;
  water: number;
}

interface ProgressChartsProps {
  userId: string;
  calorieTarget: number;
}

const ProgressCharts: React.FC<ProgressChartsProps> = ({ userId, calorieTarget }) => {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [activeMetric, setActiveMetric] = useState<'calories' | 'protein' | 'carbs' | 'fats' | 'water'>('calories');
  const [loading, setLoading] = useState(true);

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    loadWeekData();
  }, []);

  const loadWeekData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const weekDataArray: DayData[] = [];

      // Get last 7 days including today
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];

        // Get nutrition totals for that day
        let dayTotals = { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 };
        let waterIntake = 0;

        try {
          if (isSupabaseConfigured) {
            const logs = await databaseService.getDailyLogs(dateStr);
            logs.forEach((log: any) => {
              if (log.nutrition_consumed) {
                const carbs = log.nutrition_consumed.carbs || 0;
                dayTotals.calories += log.nutrition_consumed.calories || 0;
                dayTotals.protein += log.nutrition_consumed.protein || 0;
                dayTotals.carbs += carbs;
                dayTotals.fats += log.nutrition_consumed.fats || 0;
                dayTotals.sugar += log.nutrition_consumed.sugar || Math.round(carbs * 0.15);
              }
            });
            waterIntake = await databaseService.getWaterIntake(dateStr);
          } else {
            const totals = await storageService.getDailyNutritionTotals(userId, dateStr);
            dayTotals = {
              calories: totals.calories,
              protein: totals.protein,
              carbs: totals.carbs,
              fats: totals.fats,
              sugar: totals.sugar,
            };
          }
        } catch (err) {
          console.log('No data for', dateStr);
        }

        weekDataArray.push({
          day: dayName,
          date: dateStr,
          ...dayTotals,
          water: waterIntake,
        });
      }

      setWeekData(weekDataArray);
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = () => {
    switch (activeMetric) {
      case 'calories':
        return Math.max(calorieTarget, ...weekData.map(d => d.calories));
      case 'protein':
        return Math.max(150, ...weekData.map(d => d.protein));
      case 'carbs':
        return Math.max(250, ...weekData.map(d => d.carbs));
      case 'fats':
        return Math.max(80, ...weekData.map(d => d.fats));
      case 'water':
        return Math.max(2500, ...weekData.map(d => d.water));
      default:
        return calorieTarget;
    }
  };

  const getBarColor = () => {
    switch (activeMetric) {
      case 'calories':
        return colors.primary;
      case 'protein':
        return colors.protein;
      case 'carbs':
        return colors.carbs;
      case 'fats':
        return colors.fats;
      case 'water':
        return '#0EA5E9';
      default:
        return colors.primary;
    }
  };

  const getValue = (data: DayData) => {
    return data[activeMetric];
  };

  const getUnit = () => {
    switch (activeMetric) {
      case 'calories':
        return 'cal';
      case 'water':
        return 'ml';
      default:
        return 'g';
    }
  };

  const getTotalForWeek = () => {
    return weekData.reduce((sum, day) => sum + getValue(day), 0);
  };

  const getAverageForWeek = () => {
    const daysWithData = weekData.filter(d => getValue(d) > 0).length;
    if (daysWithData === 0) return 0;
    return Math.round(getTotalForWeek() / daysWithData);
  };

  const metrics: { key: typeof activeMetric; label: string; emoji: string }[] = [
    { key: 'calories', label: 'Calories', emoji: '🔥' },
    { key: 'protein', label: 'Protein', emoji: '💪' },
    { key: 'carbs', label: 'Carbs', emoji: '🍞' },
    { key: 'fats', label: 'Fats', emoji: '🥑' },
    { key: 'water', label: 'Water', emoji: '💧' },
  ];

  const maxValue = getMaxValue();
  const isToday = (index: number) => index === weekData.length - 1;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Weekly Progress</Text>
        <Text style={styles.subtitle}>Last 7 days</Text>
      </View>

      {/* Metric Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.metricsScroll}
        contentContainerStyle={styles.metricsContainer}
      >
        {metrics.map((metric) => (
          <TouchableOpacity
            key={metric.key}
            style={[
              styles.metricButton,
              activeMetric === metric.key && styles.metricButtonActive,
              activeMetric === metric.key && { backgroundColor: getBarColor() + '20' },
            ]}
            onPress={() => setActiveMetric(metric.key)}
          >
            <Text style={styles.metricEmoji}>{metric.emoji}</Text>
            <Text style={[
              styles.metricLabel,
              activeMetric === metric.key && { color: getBarColor(), fontWeight: '700' },
            ]}>
              {metric.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{getAverageForWeek()}</Text>
          <Text style={styles.statLabel}>Daily Avg</Text>
        </View>
        <View style={[styles.statDivider]} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{getTotalForWeek()}</Text>
          <Text style={styles.statLabel}>Week Total</Text>
        </View>
        <View style={[styles.statDivider]} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{weekData.filter(d => getValue(d) > 0).length}</Text>
          <Text style={styles.statLabel}>Active Days</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxValue}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxValue / 2)}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {/* Grid lines */}
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, { top: '50%' }]} />
          <View style={[styles.gridLine, { top: '100%' }]} />

          {weekData.map((day, index) => {
            const value = getValue(day);
            const barHeight = maxValue > 0 ? (value / maxValue) * 120 : 0;
            
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barValue}>
                  <Text style={[styles.barValueText, { color: getBarColor() }]}>
                    {value > 0 ? value : '-'}
                  </Text>
                </View>
                <View style={styles.barBackground}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: barHeight, 
                        backgroundColor: isToday(index) ? getBarColor() : getBarColor() + '80',
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.dayLabel,
                  isToday(index) && { color: getBarColor(), fontWeight: '700' }
                ]}>
                  {day.day}
                </Text>
                {isToday(index) && (
                  <View style={[styles.todayIndicator, { backgroundColor: getBarColor() }]} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Target Line Info */}
      {activeMetric === 'calories' && (
        <View style={styles.targetInfo}>
          <View style={styles.targetDot} />
          <Text style={styles.targetText}>Daily target: {calorieTarget} cal</Text>
        </View>
      )}
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
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: spacing.xl,
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
  metricsScroll: {
    marginBottom: spacing.md,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  metricButtonActive: {
    borderWidth: 0,
  },
  metricEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 180,
    marginTop: spacing.sm,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: spacing.xs,
    paddingBottom: 24,
  },
  yAxisLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 24,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    top: 0,
  },
  barWrapper: {
    alignItems: 'center',
    width: BAR_WIDTH,
  },
  barValue: {
    marginBottom: 4,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '600',
  },
  barBackground: {
    width: BAR_WIDTH - 8,
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  dayLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 6,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
    marginRight: spacing.xs,
  },
  targetText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

export default ProgressCharts;
