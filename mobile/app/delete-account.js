import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';

const RESEND_WAIT = 120; // 2 minutes

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [step, setStep] = useState('warning'); // 'warning' | 'otp' | 'deleting' | 'done'
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [otp, setOtp] = useState('');
  const [reason, setReason] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [blockedMessage, setBlockedMessage] = useState(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(RESEND_WAIT);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    setBlockedMessage(null);
    try {
      const { data } = await api.post('/users/delete-account/send-otp');
      setMaskedMobile(data.maskedMobile || '');
      setWalletBalance(data.walletBalance || 0);
      setStep('otp');
      startCountdown();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.blocked) {
        setBlockedMessage(errData.message);
        triggerShake();
      } else {
        Alert.alert('Error', errData?.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    await handleSendOtp();
  };

  const handleDeleteAccount = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP sent to your mobile.');
      return;
    }

    Alert.alert(
      '⚠️ Final Confirmation',
      walletBalance > 0
        ? `Your wallet balance of ₹${walletBalance} will be donated to The DharmArth Foundation.\n\nThis action is PERMANENT and cannot be undone. Are you absolutely sure?`
        : `This action is PERMANENT and cannot be undone. Are you absolutely sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete My Account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await api.delete('/users/delete-account', {
                data: { otp, reason: reason || 'User requested deletion' }
              });
              // Log out and clear local state
              await logout();
              setStep('done');
            } catch (err) {
              setIsDeleting(false);
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete account. Please try again.');
            }
          }
        }
      ]
    );
  };

  // ─── DONE SCREEN ──────────────────────────────────────────────
  if (step === 'done') {
    return (
      <View style={styles.doneContainer}>
        <Stack.Screen options={{ title: 'Account Deleted', headerBackVisible: false }} />
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark-circle" size={72} color="#00bfa5" />
        </View>
        <Text style={styles.doneTitle}>Account Deleted</Text>
        <Text style={styles.doneSubtitle}>
          Your account has been successfully deleted. Thank you for your time with The DharmArth Foundation. 🙏
        </Text>
        {walletBalance > 0 && (
          <View style={styles.donationNote}>
            <Ionicons name="heart" size={16} color="#e11d48" />
            <Text style={styles.donationNoteText}>
              ₹{walletBalance} from your wallet was donated to the Foundation.
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.doneBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Stack.Screen options={{ title: 'Delete Account', headerTitleAlign: 'center' }} />

      {/* ─── WARNING BANNER ─────────────────────────────────── */}
      <View style={styles.warningBanner}>
        <View style={styles.warningIconRow}>
          <View style={styles.warningIconCircle}>
            <Ionicons name="warning" size={36} color="#fff" />
          </View>
        </View>
        <Text style={styles.warningTitle}>Delete Your Account?</Text>
        <Text style={styles.warningSubtitle}>
          This action is <Text style={{ fontWeight: '900' }}>permanent and irreversible.</Text> Please read carefully before proceeding.
        </Text>
      </View>

      {/* ─── WHAT WILL HAPPEN ──────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What Happens When You Delete</Text>

        <View style={styles.impactSection}>
          <Text style={styles.impactLabel}>🗑️ Permanently Deleted</Text>
          {[
            'Your profile and login access',
            'Prescriptions and medical records',
            'Saved addresses',
            'Personal notifications',
          ].map((item, i) => (
            <View key={i} style={styles.impactRow}>
              <Ionicons name="close-circle" size={16} color="#e11d48" />
              <Text style={styles.impactText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.impactSection, { marginTop: 16 }]}>
          <Text style={styles.impactLabel}>📋 Kept for Legal / Audit Records</Text>
          {[
            'Donation history (required for 80G tax receipts)',
            'Commission & transaction records',
            'Referral chain (admin audit trail)',
            'Completed order history',
          ].map((item, i) => (
            <View key={i} style={styles.impactRow}>
              <Ionicons name="information-circle" size={16} color="#f59e0b" />
              <Text style={styles.impactText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Wallet notice */}
        <View style={styles.walletNotice}>
          <Ionicons name="wallet-outline" size={20} color="#7c3aed" />
          <Text style={styles.walletNoticeText}>
            If your wallet has a balance, it will be <Text style={{ fontWeight: '800' }}>automatically donated</Text> to The DharmArth Foundation when you delete your account.
          </Text>
        </View>
      </View>

      {/* ─── BLOCKED MESSAGE ──────────────────────────────── */}
      {blockedMessage && (
        <Animated.View style={[styles.blockedCard, { transform: [{ translateX: shakeAnim }] }]}>
          <Ionicons name="alert-circle" size={22} color="#e11d48" />
          <Text style={styles.blockedText}>{blockedMessage}</Text>
        </Animated.View>
      )}

      {/* ─── WARNING STEP ──────────────────────────────────── */}
      {step === 'warning' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reason for Leaving (Optional)</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="Tell us why you're leaving..."
            placeholderTextColor="#94a3b8"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{reason.length} / 200</Text>

          <TouchableOpacity
            style={styles.proceedBtn}
            onPress={handleSendOtp}
            disabled={isSendingOtp}
          >
            {isSendingOtp ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.proceedBtnText}>Send OTP to Confirm Deletion</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#475569" />
            <Text style={styles.cancelBtnText}>No, Keep My Account</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── OTP STEP ─────────────────────────────────────── */}
      {step === 'otp' && (
        <View style={styles.card}>
          <View style={styles.otpHeader}>
            <Ionicons name="phone-portrait-outline" size={28} color="#e11d48" />
            <Text style={styles.cardTitle}>Verify Your Identity</Text>
          </View>
          <Text style={styles.otpHint}>
            An OTP has been sent to{' '}
            <Text style={{ fontWeight: '800', color: '#1e293b' }}>{maskedMobile}</Text>{' '}
            via WhatsApp.
          </Text>

          {walletBalance > 0 && (
            <View style={styles.walletWarning}>
              <Ionicons name="warning" size={18} color="#f59e0b" />
              <Text style={styles.walletWarningText}>
                Your wallet balance of <Text style={{ fontWeight: '900' }}>₹{walletBalance}</Text> will be donated to the Foundation upon deletion.
              </Text>
            </View>
          )}

          <TextInput
            style={styles.otpInput}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#94a3b8"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.deleteBtn, otp.length !== 6 && styles.deleteBtnDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeleting || otp.length !== 6}
          >
            {isDeleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.deleteBtnText}>Yes, Delete My Account</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendBtn, countdown > 0 && styles.resendBtnDisabled]}
            onPress={handleResendOtp}
            disabled={countdown > 0}
          >
            <Ionicons name="refresh" size={16} color={countdown > 0 ? '#94a3b8' : '#00bfa5'} />
            <Text style={[styles.resendBtnText, countdown > 0 && { color: '#94a3b8' }]}>
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setStep('warning'); setOtp(''); }}>
            <Ionicons name="arrow-back" size={18} color="#475569" />
            <Text style={styles.cancelBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── CONTACT ALTERNATIVE ──────────────────────────── */}
      <View style={styles.helpCard}>
        <Ionicons name="help-circle-outline" size={20} color="#64748b" />
        <Text style={styles.helpText}>
          Need help or facing an issue?{' '}
          <Text
            style={styles.helpLink}
            onPress={() => router.push('/contact')}
          >
            Contact our support team instead
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Done screen
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f8fafc' },
  doneIcon: { marginBottom: 24 },
  doneTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  doneSubtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  donationNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff0f3', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#fecdd3' },
  donationNoteText: { flex: 1, fontSize: 13, color: '#9f1239', fontWeight: '600' },
  doneBtn: { backgroundColor: '#00bfa5', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14 },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Warning banner
  warningBanner: {
    backgroundColor: '#e11d48',
    margin: 16,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  warningIconRow: { marginBottom: 16 },
  warningIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  warningTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  warningSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },

  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 16 },

  // Impact list
  impactSection: { gap: 8 },
  impactLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  impactText: { fontSize: 14, color: '#475569', flex: 1, lineHeight: 20 },

  // Wallet notice
  walletNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  walletNoticeText: { flex: 1, fontSize: 13, color: '#5b21b6', lineHeight: 20 },

  // Blocked
  blockedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff0f3',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fecdd3',
  },
  blockedText: { flex: 1, fontSize: 14, color: '#9f1239', lineHeight: 20, fontWeight: '600' },

  // Reason
  reasonInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1e293b',
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  charCount: { fontSize: 11, color: '#94a3b8', textAlign: 'right', marginBottom: 20, fontWeight: '600' },

  // Buttons
  proceedBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  proceedBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  cancelBtnText: { color: '#475569', fontSize: 14, fontWeight: '700' },

  // OTP
  otpHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  otpHint: { fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 22 },
  walletWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  walletWarningText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 20 },
  otpInput: {
    borderWidth: 2,
    borderColor: '#e11d48',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
  },
  deleteBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  deleteBtnDisabled: { backgroundColor: '#f87171', opacity: 0.6, elevation: 0 },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 12,
  },
  resendBtnDisabled: { opacity: 0.5 },
  resendBtnText: { color: '#00bfa5', fontSize: 14, fontWeight: '700' },

  // Help
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
  },
  helpText: { flex: 1, fontSize: 13, color: '#64748b', lineHeight: 20 },
  helpLink: { color: '#00bfa5', fontWeight: '700' },
});
