import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

export default function DonateWalletScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({ btnText: 'Donate From Wallet' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, settingsRes] = await Promise.all([
          api.get('/wallet/summary'),
          api.get('/content/settings')
        ]);
        setWallet(walletRes.data.wallet);
        setSettings({
          btnText: settingsRes.data.wallet_donate_btn_text || 'Donate From Wallet'
        });
        setAmount(walletRes.data.wallet.balance.toString());
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSendOTP = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (amt > wallet.balance) {
      Alert.alert("Error", "Insufficient wallet balance");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/donate/wallet/send-otp');
      setIsOtpSent(true);
      Alert.alert("OTP Sent", "A 6-digit verification code has been sent to your WhatsApp.");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      Alert.alert("Error", "Please enter complete 6-digit OTP");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/donate/wallet', { 
        amount: parseFloat(amount),
        donorName: user.name,
        donorMobile: user.mobile,
        donorEmail: user.email,
        otp: otpString
      });
      Alert.alert("Thank You!", "Your donation from wallet was successful. Your contribution matters!", [
        { text: "OK", onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Donation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Wallet Donation' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="heart-circle" size={80} color="#ef4444" />
          <Text style={styles.title}>Noble Contribution</Text>
          <Text style={styles.subtitle}>You can donate your earned commissions back to the foundation to support our mission.</Text>
        </View>

        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Available Balance</Text>
          <Text style={styles.walletBalance}>₹ {wallet.balance.toLocaleString()}</Text>
        </View>

        {!isOtpSent ? (
          <View style={styles.card}>
            <Text style={styles.label}>Donation Amount (₹)</Text>
            <View style={styles.amountInputWrapper}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(val) => {
                  // Only allow digits and at most one decimal point with max 2 decimal places
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    setAmount(val);
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, submitting && styles.disabledButton]}
              onPress={handleSendOTP}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Donate</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.otpHeader}>
              <Ionicons name="lock-closed-outline" size={40} color="#00bfa5" />
              <Text style={styles.otpTitle}>Confirm Donation</Text>
              <Text style={styles.otpSubtitle}>Enter 6-digit code sent to your WhatsApp</Text>
            </View>

            <View style={styles.otpContainer}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, submitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Confirm Donation of ₹{amount}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backLink}
              onPress={() => setIsOtpSent(false)}
              disabled={submitting}
            >
              <Text style={styles.backLinkText}>Change Amount</Text>
            </TouchableOpacity>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  walletCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  walletBalance: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 16,
  },
  amountInputWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: '#ef4444',
    paddingBottom: 8,
    marginBottom: 32,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 16,
  },
  otpSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: '14%',
    height: 50,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  backLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#64748b',
    fontWeight: '600',
  },
});
