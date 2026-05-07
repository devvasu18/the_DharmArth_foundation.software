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

export default function Signup() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [checkingMobile, setCheckingMobile] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleMobileChange = async (val) => {
    const numericVal = val.replace(/\D/g, '');
    if (numericVal.length <= 10) {
      setMobile(numericVal);
      setIsClaiming(false);

      if (numericVal.length === 10) {
        setCheckingMobile(true);
        try {
          const { data } = await api.post('/auth/check-status', { identifier: numericVal });
          if (data.exists) {
            if (data.hasPassword) {
              Alert.alert('User Exists', 'This mobile number is already registered. Please login.');
            } else {
              setIsClaiming(true);
              if (data.name) setName(data.name);
            }
          }
        } catch (err) {
          console.error("Status check failed", err);
        } finally {
          setCheckingMobile(false);
        }
      }
    }
  };

  const handleSignup = async () => {
    if (!name || !mobile || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (name.trim().length < 4) {
      Alert.alert('Error', 'Full name must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { 
        name, 
        mobile, 
        email: email ? email.toLowerCase().trim() : undefined, 
        password 
      });
      await login(data);
      Alert.alert(
        isClaiming ? 'Account Claimed!' : 'Success!',
        `Welcome ${name}! Your account has been created.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Signup Failed', err.response?.data?.message || 'Something went wrong');
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the DharmArth Foundation</Text>
        </View>

        <View style={styles.card}>
          {isClaiming && (
            <View style={styles.claimingAlert}>
              <Ionicons name="information-circle" size={20} color="#0d7a8c" />
              <Text style={styles.claimingText}>
                Account Found! We found your previous donations. Please create a password to secure your account.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Full Name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.flexInput}
              placeholder="10-digit Mobile"
              value={mobile}
              onChangeText={handleMobileChange}
              keyboardType="phone-pad"
            />
            {checkingMobile && <ActivityIndicator size="small" color="#00bfa5" style={{ marginRight: 10 }} />}
          </View>

          <Text style={styles.label}>Email Address (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Create Password"
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
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={loading || checkingMobile}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signupButtonText}>
                {isClaiming ? 'Claim Account' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
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
  signupButton: {
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
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
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
