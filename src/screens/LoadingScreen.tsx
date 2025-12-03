import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { createStyles } from '../theme/styles';

const styles = createStyles(375);

const LoadingScreen: React.FC = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingLogo}>🥗</Text>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading NutriPlan...</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default LoadingScreen;
