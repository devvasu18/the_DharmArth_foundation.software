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
import { useTranslation } from '../../src/context/LanguageContext';
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
  const { locale, changeLanguage } = useTranslation();
  const router = useRouter();

  const toggleLanguage = () => {
    changeLanguage(locale === 'hi' ? 'en' : 'hi');
  };

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
          <TouchableOpacity onPress={toggleLanguage} style={styles.langToggle}>
            <Ionicons name="language" size={20} color="#00bfa5" />
            <Text style={styles.langText}>{locale === 'hi' ? 'English' : 'हिंदी'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{locale === 'hi' ? 'खाता बनाएं' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>{locale === 'hi' ? 'धर्मअर्थ फाउंडेशन से जुड़ें' : 'Join the DharmArth Foundation'}</Text>
        </View>

        <View style={styles.card}>
          {isClaiming && (
            <View style={styles.claimingAlert}>
              <Ionicons name="information-circle" size={20} color="#0d7a8c" />
              <Text style={styles.claimingText}>
                {locale === 'hi' ? 'खाता मिल गया! हमें आपके पिछले दान मिले हैं। अपना खाता सुरक्षित करने के लिए कृपया एक पासवर्ड बनाएं।' : 'Account Found! We found your previous donations. Please create a password to secure your account.'}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{locale === 'hi' ? 'पूरा नाम' : 'Full Name'}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={locale === 'hi' ? "अपना पूरा नाम दर्ज करें" : "Enter your full name"}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isClaiming}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{locale === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="00000 00000"
                  keyboardType="numeric"
                  maxLength={10}
                  value={mobile}
                  onChangeText={handleMobileChange}
                />
                {checkingMobile && <ActivityIndicator size="small" color="#00bfa5" style={{ marginLeft: 10 }} />}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{locale === 'hi' ? 'ईमेल पता (वैकल्पिक)' : 'Email Address (Optional)'}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={locale === 'hi' ? "अपना ईमेल दर्ज करें" : "Enter your email"}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{locale === 'hi' ? 'पासवर्ड' : 'Password'}</Text>
              <View style={styles.passwordContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder={locale === 'hi' ? "अपना पासवर्ड बनाएं" : "Create a password"}
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
            </View>

            <TouchableOpacity 
              style={[styles.signupButton, isClaiming && styles.claimButton]}
              onPress={handleSignup}
              disabled={loading || checkingMobile}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.signupButtonText}>
                  {isClaiming 
                    ? (locale === 'hi' ? 'दावा करें और खाता सेट करें' : 'Claim & Setup Account')
                    : (locale === 'hi' ? 'खाता बनाएं' : 'Create Account')
                  }
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{locale === 'hi' ? 'क्या आपके पास पहले से खाता है?' : 'Already have an account?'}</Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>{locale === 'hi' ? 'लॉगिन करें' : 'Login'}</Text>
                </TouchableOpacity>
              </Link>
            </View>
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
    marginTop: 20,
    marginBottom: 40,
    position: 'relative'
  },
  langToggle: {
    position: 'absolute',
    top: -10,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#00bfa5',
    fontWeight: '600'
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 30
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
