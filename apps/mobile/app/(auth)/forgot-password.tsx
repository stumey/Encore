import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/lib/auth/useAuth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const forgotPassword = useAuth((state) => state.forgotPassword);
  const confirmPasswordReset = useAuth((state) => state.confirmPassword);
  const isLoading = useAuth((state) => state.isLoading);

  const validateEmail = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCode = () => {
    const newErrors: typeof errors = {};

    if (!code) {
      newErrors.code = 'Verification code is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async () => {
    if (!validateEmail()) return;

    try {
      await forgotPassword(email);
      setStep('code');
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send code'
      );
    }
  };

  const handleResetPassword = async () => {
    if (!validateCode()) return;

    try {
      await confirmPasswordReset(email, code, newPassword);
      Alert.alert('Success', 'Password reset successfully', [
        { text: 'OK', onPress: () => router.push('/(auth)/login') },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to reset password'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === 'email'
              ? 'Enter your email to receive a verification code'
              : 'Enter the code and your new password'}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'email' ? (
            <>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />

              <Button
                title="Send Verification Code"
                onPress={handleSendCode}
                loading={isLoading}
                style={styles.submitButton}
              />
            </>
          ) : (
            <>
              <Input
                label="Verification Code"
                placeholder="Enter code from email"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoCapitalize="none"
                error={errors.code}
              />

              <Input
                label="New Password"
                placeholder="Create a new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                error={errors.newPassword}
                helperText="Must be at least 8 characters"
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                error={errors.confirmPassword}
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={isLoading}
                style={styles.submitButton}
              />

              <Button
                title="Resend Code"
                onPress={handleSendCode}
                variant="ghost"
              />
            </>
          )}

          <Button
            title="Back to Login"
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: {
    marginTop: 16,
  },
});
