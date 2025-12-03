import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../constants/theme';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Professional minimal Unicode icons for each tab
const TabIcon = ({ name, isActive }: { name: string; isActive: boolean }) => {
  const iconColor = isActive ? colors.primary : colors.textMuted;
  const iconSize = isActive ? 24 : 22;
  
  const icons: Record<string, string> = {
    home: '⌂',
    meals: '◐',
    recipes: '❖',
    exercise: '◈',
    profile: '◉',
  };
  
  return (
    <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
      <Text style={[styles.icon, { color: iconColor, fontSize: iconSize }]}>
        {icons[name] || '●'}
      </Text>
    </View>
  );
};

const tabs = [
  { id: 'home', label: 'Home' },
  { id: 'meals', label: 'Meals' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'exercise', label: 'Exercise' },
  { id: 'profile', label: 'Profile' },
];

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <TabIcon name={tab.id} isActive={isActive} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.topBar,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconWrapperActive: {
    backgroundColor: colors.primaryPale,
  },
  icon: {
    fontWeight: '300',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

export default TabBar;
