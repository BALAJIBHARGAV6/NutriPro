import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopNavbarProps {
  title?: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  showBack?: boolean;
  showLogo?: boolean;
}

const TopNavbar: React.FC<TopNavbarProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  showBack = false,
  showLogo = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {(showBack || leftIcon) && (
            <TouchableOpacity style={styles.iconBtn} onPress={onLeftPress}>
              <Text style={styles.iconText}>{showBack ? '←' : leftIcon}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.centerSection}>
          {showLogo ? (
            <Text style={styles.logo}>Nutri Pro</Text>
          ) : (
            <>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </>
          )}
        </View>
        
        <View style={styles.rightSection}>
          {rightIcon && (
            <TouchableOpacity style={styles.iconBtn} onPress={onRightPress}>
              <Text style={styles.iconText}>{rightIcon}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftSection: {
    width: 50,
    alignItems: 'flex-start' as const,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center' as const,
  },
  rightSection: {
    width: 50,
    alignItems: 'flex-end' as const,
  },
  logo: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#E8F5E9',
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default TopNavbar;
