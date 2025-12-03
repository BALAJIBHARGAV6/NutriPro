import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

interface NutritionRingProps {
  value: number;
  target: number;
  label: string;
  color: string;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  unit?: string;
}

export const NutritionRing: React.FC<NutritionRingProps> = ({
  value,
  target,
  label,
  color,
  size = 100,
  strokeWidth = 10,
  showPercentage = true,
  unit = '',
}) => {
  const percentage = Math.min((value / target) * 100, 100);
  
  const displayValue = showPercentage
    ? `${Math.round(percentage)}%`
    : `${Math.round(value)}${unit}`;
  
  // Simple progress ring using View with border
  const innerSize = size - strokeWidth * 2;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.border,
          },
        ]}
      />
      {/* Progress indicator - simplified as a colored arc representation */}
      <View
        style={[
          styles.progressContainer,
          {
            width: size,
            height: size,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: innerSize * 0.8,
              height: 4,
              backgroundColor: color,
              transform: [{ scaleX: percentage / 100 }],
            },
          ]}
        />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.value, { color }]}>{displayValue}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

interface NutritionRingsRowProps {
  calories: { value: number; target: number };
  protein: { value: number; target: number };
  carbs: { value: number; target: number };
  fats: { value: number; target: number };
}

export const NutritionRingsRow: React.FC<NutritionRingsRowProps> = ({
  calories,
  protein,
  carbs,
  fats,
}) => {
  return (
    <View style={styles.ringsRow}>
      <NutritionRing
        value={calories.value}
        target={calories.target}
        label="Calories"
        color={colors.calories}
        size={90}
        strokeWidth={8}
      />
      <NutritionRing
        value={protein.value}
        target={protein.target}
        label="Protein"
        color={colors.protein}
        size={70}
        strokeWidth={6}
        unit="g"
        showPercentage={false}
      />
      <NutritionRing
        value={carbs.value}
        target={carbs.target}
        label="Carbs"
        color={colors.carbs}
        size={70}
        strokeWidth={6}
        unit="g"
        showPercentage={false}
      />
      <NutritionRing
        value={fats.value}
        target={fats.target}
        label="Fats"
        color={colors.fats}
        size={70}
        strokeWidth={6}
        unit="g"
        showPercentage={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  progressContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  progressFill: {
    borderRadius: 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});

export default NutritionRing;
