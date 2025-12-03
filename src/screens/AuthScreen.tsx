import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { createStyles } from '../theme/styles';
const styles = createStyles();

interface AuthScreenProps {
  onAuth: (email: string, password: string, mode: 'signin' | 'signup') => Promise<void>;
  onGoogleAuth: () => Promise<void>;
  onDemoMode: () => void;
  authLoading: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuth,
  onGoogleAuth,
  onDemoMode,
  authLoading,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.authContent}>
            <Text style={styles.authLogo}>🥗</Text>
            <Text style={styles.authTitle}>NutriPlan</Text>
            <Text style={styles.authSubtitle}>
              Your AI-powered nutrition companion
            </Text>

            {/* Google Sign In */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={onGoogleAuth}
              disabled={authLoading}
            >
              <Text style={styles.googleIcon}>🔗</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email/Password Form */}
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => onAuth(email, password, authMode)}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Auth Mode */}
            <TouchableOpacity onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
              <Text style={styles.toggleAuthText}>
                {authMode === 'signin'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'
                }
              </Text>
            </TouchableOpacity>

            {/* Demo Account */}
            <TouchableOpacity style={styles.demoBtn} onPress={onDemoMode}>
              <Text style={styles.demoBtnText}>🎯 Try AI Assistant</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AuthScreen;
