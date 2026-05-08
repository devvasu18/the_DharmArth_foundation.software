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

export default function WithdrawScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [wallet, setWallet] = useState(null);
  const [rules, setRules] = useState({ minBalance: 500, successMessage: '' });
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Amount, 2: OTP, 3: Success
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, settingsRes] = await Promise.all([
          api.get('/wallet/summary'),
          api.get('/content/settings')
        ]);
        setWallet(walletRes.data.wallet);
        setRules({
          minBalance: settingsRes.data.payout_min_balance || 500,
          successMessage: settingsRes.data.payout_success_message || 'Your payment will be received in your bank account in 5-7 working days.'
        });
        setAmount(walletRes.data.wallet.balance);
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load wallet data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSendOTP = async () => {
    if (amount < rules.minBalance) {
      Alert.alert("Minimum Balance", `Minimum withdrawal is ₹${rules.minBalance}`);
      return;
    }
    if (amount > wallet.balance) {
      Alert.alert("Error", "Amount exceeds available balance");
      return;
    }
    if (!user.payoutCredentials?.accountNumber) {
      Alert.alert("Incomplete Profile", "Please set up your Bank Details first.", [
        { text: "Go to Bank Details", onPress: () => router.push('/bank-details') },
        { text: "Cancel", style: "cancel" }
      ]);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/payouts/send-otp');
      setStep(2);
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
      await api.post('/payouts/request', { 
        amount: amount,
        otp: otpString
      });
      setStep(3);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to submit request");
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

  if (step === 3) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Success' }} />
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successText}>{rules.successMessage}</Text>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.doneButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: step === 1 ? 'Withdrawal' : 'Verify OTP' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 ? (
          <>
            <View style={styles.walletCard}>
              <Text style={styles.walletLabel}>Available Balance</Text>
              <Text style={styles.walletBalance}>₹ {wallet.balance.toLocaleString()}</Text>
              <View style={styles.minInfo}>
                <Ionicons name="information-circle-outline" size={16} color="white" />
                <Text style={styles.minText}>Minimum required: ₹{rules.minBalance}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Enter Amount</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount.toString()}
                  onChangeText={(text) => setAmount(parseInt(text) || 0)}
                  keyboardType="number-pad"
                  autoFocus
                />
              </View>

              <View style={styles.bankPreview}>
                <Text style={styles.bankPreviewLabel}>Transfer to:</Text>
                {user.payoutCredentials?.accountNumber ? (
                  <View style={styles.bankRow}>
                    <Ionicons name="business-outline" size={20} color="#00bfa5" />
                    <View>
                      <Text style={styles.bankName}>{user.payoutCredentials.bankName}</Text>
                      <Text style={styles.bankAcc}>A/C: ****{user.payoutCredentials.accountNumber.slice(-4)}</Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => router.push('/bank-details')}>
                    <Text style={styles.setupLink}>Setup Bank Details First</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, submitting && styles.disabledButton]}
                onPress={handleSendOTP}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>Next Step</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.otpHeader}>
              <Ionicons name="lock-closed-outline" size={40} color="#00bfa5" />
              <Text style={styles.otpTitle}>Security Check</Text>
              <Text style={styles.otpSubtitle}>Enter the 6-digit code sent to your WhatsApp (+91 {user.mobile})</Text>
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
                  selectTextOnFocus
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
                <Text style={styles.primaryButtonText}>Confirm Withdrawal</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backLink}
              onPress={() => setStep(1)}
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
  walletCard: {
    backgroundColor: '#00bfa5',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  walletBalance: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 12,
  },
  minInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#00bfa5',
    paddingBottom: 8,
    marginBottom: 32,
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
  },
  bankPreview: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  bankPreviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  bankAcc: {
    fontSize: 13,
    color: '#64748b',
  },
  setupLink: {
    color: '#00bfa5',
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#00bfa5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#00bfa5',
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
    lineHeight: 18,
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
    color: '#1e293b',
  },
  backLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});
