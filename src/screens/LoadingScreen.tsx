import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';

const LoadingScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Letter animations
  const letter1 = useRef(new Animated.Value(0)).current;
  const letter2 = useRef(new Animated.Value(0)).current;
  const letter3 = useRef(new Animated.Value(0)).current;
  const letter4 = useRef(new Animated.Value(0)).current;
  const letter5 = useRef(new Animated.Value(0)).current;
  const letter6 = useRef(new Animated.Value(0)).current;
  const letter7 = useRef(new Animated.Value(0)).current;
  const letter8 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotating animation for loader
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Netflix-style letter animation
    const letters = [letter1, letter2, letter3, letter4, letter5, letter6, letter7, letter8];
    Animated.stagger(
      80,
      letters.map((letter) =>
        Animated.sequence([
          Animated.timing(letter, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(letter, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const letterAnimStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    ],
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.background}>
          {/* Netflix-style Animated Text */}
          <View style={styles.textContainer}>
            <Animated.Text style={[styles.letter, letterAnimStyle(letter1)]}>N</Animated.Text>
            <Animated.Text style={[styles.letter, letterAnimStyle(letter2)]}>u</Animated.Text>
            <Animated.Text style={[styles.letter, letterAnimStyle(letter3)]}>t</Animated.Text>
            <Animated.Text style={[styles.letter, letterAnimStyle(letter4)]}>r</Animated.Text>
            <Animated.Text style={[styles.letter, letterAnimStyle(letter5)]}>i</Animated.Text>
            <Animated.Text style={[styles.letter, letterAnimStyle(letter6)]}>P</Animated.Text>
            <Animated.Text style={[styles.letter, letterAnimStyle(letter7)]}>r</Animated.Text>
            <Animated.Text style={[styles.letter, letterAnimStyle(letter8)]}>o</Animated.Text>
          </View>

          {/* Custom Loader */}
          <Animated.View
            style={[
              styles.loader,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={styles.loaderInner} />
          </Animated.View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  textContainer: {
    flexDirection: 'row',
    marginBottom: 48,
  },
  letter: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  loader: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
  },
  loaderInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 2,
  },
});

export default LoadingScreen;
