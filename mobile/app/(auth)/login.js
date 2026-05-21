import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP and Forgot Password Flow States
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Identifier/OTP, 2: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      await login(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter your mobile number or email address');
      return;
    }
    
    const isEmail = identifier.includes('@');
    if (!isEmail && identifier.replace(/\D/g, '').length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number or email address');
      return;
    }

    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { identifier });
      setOtpSent(true);
      Alert.alert('Success', data.message || `OTP sent successfully!`);
    } catch (err) {
      console.error(err);
      Alert.alert('Failed to send OTP', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { identifier, otp });
      await login(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { identifier, otp, newPassword });
      
      await login(data);
      Alert.alert('Success', 'Password reset successful! Welcome back.');
      
      // Reset states
      setIsForgotPassword(false);
      setResetStep(1);
      setOtp('');
      setOtpSent(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error(err);
      Alert.alert('Reset Failed', err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
             <Ionicons name="heart" size={40} color="#00bfa5" />
          </View>
          <Text style={styles.title}>DharmArth Foundation</Text>
          <Text style={styles.subtitle}>
            {isForgotPassword ? 'Reset Password' : 'Welcome back!'}
          </Text>
        </View>

        {isForgotPassword && resetStep === 2 ? (
          /* Step 2: New Password input card */
          <View style={styles.card}>
            <Text style={styles.resetSubtitle}>OTP verified! Now set your new password.</Text>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Min 6 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showResetPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowResetPassword(!showResetPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showResetPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Repeat password"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry={!showResetPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowResetPassword(!showResetPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showResetPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => {
                setIsForgotPassword(false);
                setResetStep(1);
                setOtp('');
                setOtpSent(false);
                setNewPassword('');
                setConfirmNewPassword('');
              }}
            >
              <Text style={styles.skipButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Normal Login / Forgot Password Step 1 Card */
          <View style={styles.card}>
            {isForgotPassword && (
              <View style={styles.claimingAlert}>
                <Ionicons name="information-circle" size={20} color="#0d7a8c" />
                <Text style={styles.claimingText}>
                  Forgot Password? We will send an OTP to your registered WhatsApp or Email to reset your password.
                </Text>
              </View>
            )}

            <Text style={styles.label}>Email / Mobile Number</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.flexInput}
                placeholder="Enter Email or 10-digit Mobile"
                value={identifier}
                onChangeText={(val) => {
                  let cleanVal = val.replace(/\s/g, '');
                  if (/^\d+$/.test(cleanVal) && cleanVal.length > 10) {
                    setIdentifier(cleanVal.slice(0, 10));
                  } else {
                    setIdentifier(cleanVal);
                  }
                }}
                editable={!otpSent}
                autoCapitalize="none"
              />
              {otpSent && loginMethod === 'otp' && (
                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  style={{ padding: 10 }}
                >
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              )}
            </View>

            {loginMethod === 'password' && (
              <>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color="#64748b" 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.forgotBtn}
                  onPress={() => {
                    setIsForgotPassword(true);
                    setLoginMethod('otp');
                    setOtpSent(false);
                    setResetStep(1);
                  }}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </>
            )}

            {loginMethod === 'otp' && otpSent && (
              <>
                <Text style={styles.label}>Enter 6-digit OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={(val) => setOtp(val.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </>
            )}

            {loginMethod === 'otp' ? (
              !otpSent ? (
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={handleSendOTP}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginButtonText}>Get OTP</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={isForgotPassword ? () => setResetStep(2) : handleVerifyOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {isForgotPassword ? 'Verify OTP' : 'Verify & Login'}
                    </Text>
                  )}
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            )}

            {!isForgotPassword && (
              <TouchableOpacity
                style={styles.toggleMethodButton}
                onPress={() => {
                  setLoginMethod(loginMethod === 'otp' ? 'password' : 'otp');
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                <Ionicons 
                  name={loginMethod === 'otp' ? 'key-outline' : 'phone-portrait-outline'} 
                  size={18} 
                  color="#00bfa5" 
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.toggleMethodText}>
                  {loginMethod === 'otp' ? 'Login via Password' : 'Login via OTP'}
                </Text>
              </TouchableOpacity>
            )}

            {isForgotPassword && (
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={() => {
                  setIsForgotPassword(false);
                  setLoginMethod('password');
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                <Text style={styles.skipButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}

            {!isForgotPassword && (
              <>
                <TouchableOpacity 
                  style={styles.skipButton}
                  onPress={() => router.replace('/')}
                  disabled={loading}
                >
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <Link href="/signup" asChild>
                    <TouchableOpacity>
                      <Text style={styles.linkText}>Sign Up</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  flexInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  changeBtnText: {
    color: '#00bfa5',
    fontWeight: '700',
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  eyeIcon: {
    padding: 12,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    color: '#00bfa5',
    fontSize: 14,
    fontWeight: '600',
  },
  claimingAlert: {
    backgroundColor: 'rgba(13, 170, 188, 0.1)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00bfa5',
  },
  claimingText: {
    color: '#0d7a8c',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  loginButton: {
    backgroundColor: '#00bfa5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  toggleMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00bfa5',
    borderRadius: 12,
    padding: 12,
    marginTop: 24,
  },
  toggleMethodText: {
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 15,
  },
  resetSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  skipButton: {
    backgroundColor: 'transparent',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  linkText: {
    color: '#00bfa5',
    fontSize: 14,
    fontWeight: '700',
  },
});
