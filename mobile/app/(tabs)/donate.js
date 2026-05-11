import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Linking, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import LocationModal from '../../src/components/LocationModal';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { useLocationFlow } from '../../src/hooks/useLocationFlow';
import RazorpayCheckout from 'react-native-razorpay';
import DonationExitModal from '../../src/components/DonationExitModal';

export default function DonateScreen() {
  const { user: authUser } = useAuth();
  const router = useRouter();

  // Form State
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('1000');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [motivatorMobile, setMotivatorMobile] = useState('');
  const [motivatorName, setMotivatorName] = useState('');
  const [need80G, setNeed80G] = useState(false);
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  
  // Config & Loading State
  const [config, setConfig] = useState({ plans: [600, 1000, 5000], popularAmount: 1000 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isValidatingMotivator, setIsValidatingMotivator] = useState(false);
  const [isMotivatorLocked, setIsMotivatorLocked] = useState(false);
  
  const [donationLabel, setDonationLabel] = useState('');
  const [donationLabelLink, setDonationLabelLink] = useState('');
  const [donationLabelBtnText, setDonationLabelBtnText] = useState('');

  // Success & Claim Account State
  const [donationSuccess, setDonationSuccess] = useState(null);
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  const { requestLocation, loading: isDetecting } = useLocationFlow();

  useFocusEffect(
    React.useCallback(() => {
      fetchSettings();
      if (authUser) {
        setFullName(authUser.name || '');
        setMobile(authUser.mobile || '');
        setEmail(authUser.email || '');
        
        if (authUser.referredBy) {
          setMotivatorMobile(authUser.referredBy.mobile || authUser.referredBy.referralCode || '');
          setMotivatorName(authUser.referredBy.name || '');
          setIsMotivatorLocked(true);
        }
      }

      const onBackPress = () => {
        setShowExitModal(true);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [authUser])
  );

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/content/settings');
      if (data.donation_config) {
        const dConfig = typeof data.donation_config === 'string' 
          ? JSON.parse(data.donation_config) 
          : data.donation_config;
        setConfig(dConfig);
        setAmount(dConfig.popularAmount || dConfig.plans[0]);
        setCustomAmount((dConfig.popularAmount || dConfig.plans[0]).toString());
      }
      if (data.donation_label) setDonationLabel(data.donation_label);
      if (data.donation_label_link) setDonationLabelLink(data.donation_label_link);
      if (data.donation_label_btn_text) setDonationLabelBtnText(data.donation_label_btn_text);
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    const result = await requestLocation();
    if (result && result.address) {
      setAddress(result.address);
    }
  };

  // Validate Motivator logic
  useEffect(() => {
    const validate = async () => {
      if (motivatorMobile.length >= 10 && !isMotivatorLocked) {
        setIsValidatingMotivator(true);
        try {
          const { data } = await api.get(`/donate/validate-motivator/${motivatorMobile}?currentMobile=${mobile}`);
          if (data.valid) {
            setMotivatorName(data.name);
          } else {
            setMotivatorName('');
          }
        } catch (error) {
          setMotivatorName('');
        } finally {
          setIsValidatingMotivator(false);
        }
      }
    };
    const timer = setTimeout(validate, 500);
    return () => clearTimeout(timer);
  }, [motivatorMobile]);

  const handleDonate = async () => {
    const finalAmount = parseInt(customAmount) || amount;
    
    if (!fullName || mobile.length !== 10 || !finalAmount) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (need80G && (!pan || !aadhaar)) {
      Alert.alert('Error', 'PAN and Aadhaar are required for 80G benefit.');
      return;
    }

    setSubmitting(true);
    try {
      // Create the donation intent on backend
      const payload = {
        amount: finalAmount,
        donorName: fullName,
        donorMobile: mobile,
        donorEmail: email,
        address: address,
        motivatorMobile: motivatorMobile || null,
        panNumber: need80G ? pan : null,
        aadhaarNumber: need80G ? aadhaar : null,
        donationType: 'monthly'
      };

      const { data } = await api.post('/donate', payload);
      
      const options = {
        description: 'Monthly Donation',
        image: 'https://the-dharm-arth-foundation-software.vercel.app/logo.png',
        currency: data.currency || 'INR',
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_ShbaOPk9of1kgh',
        name: 'DharmArth Foundation',
        prefill: {
          email: email,
          contact: mobile,
          name: fullName
        },
        theme: {color: '#00bfa5'}
      };

      if (data.subscriptionId) {
        options.subscription_id = data.subscriptionId;
      } else if (data.order_id) {
        options.order_id = data.order_id;
        options.amount = data.amount;
      }

      RazorpayCheckout.open(options).then(async (razorpayResponse) => {
        try {
          const verifyEndpoint = data.subscriptionId ? '/payment/verify-subscription' : '/payment/verify-payment';
          const verifyPayload = {
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
            ...(data.subscriptionId ? { razorpay_subscription_id: razorpayResponse.razorpay_subscription_id || data.subscriptionId } : { razorpay_order_id: razorpayResponse.razorpay_order_id || data.order_id })
          };
          
          await api.post(verifyEndpoint, verifyPayload);
          
          setDonationSuccess({
            donationId: data.subscriptionId || data.order_id,
            amount: finalAmount,
            isAlreadyRegistered: data.isAlreadyRegistered
          });
        } catch (verifyError) {
          Alert.alert('Payment Verified', 'Payment successful but verification failed. Please contact support.');
        }
      }).catch((error) => {
        // Handle cancel or failure
        Alert.alert('Payment Cancelled', error.description || 'Payment was not completed.');
      });

    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!registerPassword || registerPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsRegistering(true);
      const { data } = await api.post('/auth/register', {
        name: fullName,
        mobile: mobile,
        email: email,
        password: registerPassword,
        referralCode: motivatorMobile
      });

      login(data);
      Alert.alert('Success', 'Account Created Successfully!');
      router.replace('/dashboard');
    } catch (error) {
      console.error("Registration failed:", error);
      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  if (donationSuccess) {
    const isLoggedIn = !!authUser;

    return (
      <View style={[styles.container, { padding: 20, justifyContent: 'center' }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40, paddingTop: 20 }}>
          <View style={styles.successIconWrapper}>
            <Ionicons name="checkmark-circle" size={60} color="#22c55e" />
          </View>

          <Text style={styles.successTitle}>
            Thank You, {fullName.split(' ')[0]}!
          </Text>
          <Text style={styles.successMessage}>
            Your donation of <Text style={{fontWeight: 'bold'}}>₹{donationSuccess.amount.toLocaleString('en-IN')}</Text> was successful.
          </Text>

          <View style={styles.transactionBox}>
            <Text style={styles.transactionLabel}>Transaction ID</Text>
            <Text style={styles.transactionId}>{donationSuccess.donationId}</Text>
          </View>

          {!isLoggedIn && (
            <View style={styles.claimAccountBox}>
              {donationSuccess.isAlreadyRegistered ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.claimTitle}>Welcome Back!</Text>
                  <Text style={styles.claimDesc}>
                    You already have an account with us. Login to track this donation and access your certificates.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.donateBtn, { marginTop: 10, width: '100%' }]}
                    onPress={() => router.push('/login')}
                  >
                    <Text style={styles.donateBtnText}>Login to Your Account</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ width: '100%' }}>
                  <Text style={styles.claimTitle}>Claim Your Account</Text>
                  <Text style={styles.claimDesc}>
                    Create a password to securely access your 80G certificates and track your donations.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Create Password</Text>
                    <View style={styles.passwordInputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Min. 6 characters"
                        secureTextEntry
                        value={registerPassword}
                        onChangeText={setRegisterPassword}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordInputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Re-enter password"
                        secureTextEntry
                        value={registerConfirmPassword}
                        onChangeText={setRegisterConfirmPassword}
                      />
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.donateBtn, { marginTop: 10, width: '100%' }]}
                    onPress={handleRegister}
                    disabled={isRegistering}
                  >
                    {isRegistering ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.donateBtnText}>Create Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.goHomeBtn}
            onPress={() => router.replace(isLoggedIn ? '/dashboard' : '/')}
          >
            <Text style={styles.goHomeText}>{isLoggedIn ? 'Go to Dashboard' : 'Skip & Go Home'}</Text>
            <Ionicons name="arrow-forward" size={18} color="#00bfa5" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Amount Selection */}
        <Text style={styles.sectionTitle}>Select Donation Amount</Text>
        
        {!!donationLabel && (
          <View style={styles.subtitleContainer}>
            <Text style={styles.donationSubtitle}>{donationLabel}</Text>
            {!!donationLabelLink && (
              <TouchableOpacity 
                style={styles.subtitleLinkBtn}
                onPress={() => Linking.openURL(donationLabelLink)}
              >
                <Text style={styles.subtitleLinkText}>{donationLabelBtnText || 'Learn More'}</Text>
                <Ionicons name="open-outline" size={14} color="#00bfa5" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.amountGrid}>
          {config.plans.map((p, index) => (
            <TouchableOpacity 
              key={`amount-${p}-${index}`} 
              style={[styles.amountBtn, amount === p && styles.amountBtnActive]}
              onPress={() => { setAmount(p); setCustomAmount(p.toString()); }}
            >
              <Text style={[styles.amountBtnText, amount === p && styles.amountBtnTextActive]}>₹{p.toLocaleString('en-IN')}</Text>
              {config.popularAmount === p && <View style={styles.popularBadge}><Text style={styles.popularText}>POPULAR</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customAmountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput 
            style={styles.customInput}
            placeholder="Custom Amount"
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={(t) => { setCustomAmount(t); setAmount(0); }}
          />
        </View>

        <View style={styles.citizenCheck}>
          <Ionicons name="checkbox" size={20} color="#00bfa5" />
          <Text style={styles.checkText}>I am an Indian Citizen</Text>
        </View>

        {/* Personal Details */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#00bfa5" />
            <Text style={styles.sectionHeaderText}>Personal Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ex. Raghu Kumar"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.flagAddon}><Text style={styles.flagText}>+91</Text></View>
              <TextInput 
                style={styles.phoneInput}
                placeholder="9876543210"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input}
              placeholder="mail@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Address (Optional)</Text>
              <TouchableOpacity 
                style={styles.detectBtn} 
                onPress={handleDetectLocation}
                disabled={isDetecting}
              >
                <Ionicons name="location" size={14} color="#00bfa5" />
                <Text style={styles.detectBtnText}>{isDetecting ? 'Detecting...' : 'Detect'}</Text>
              </TouchableOpacity>
            </View>
            <TextInput 
              style={[styles.input, styles.textArea]}
              placeholder="Ex. H.No 123, Sector 4, New Delhi"
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        {/* Motivator Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait" size={20} color="#00bfa5" />
            <Text style={styles.sectionHeaderText}>Motivator Details</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Motivated By (Mobile/ID)</Text>
            <View style={styles.motivatorInputWrapper}>
              <TextInput 
                style={[styles.input, isMotivatorLocked && styles.inputLocked]}
                placeholder="Mobile Number"
                keyboardType="phone-pad"
                value={motivatorMobile}
                onChangeText={setMotivatorMobile}
                editable={!isMotivatorLocked}
              />
              {isValidatingMotivator && <ActivityIndicator style={styles.innerLoader} size="small" color="#00bfa5" />}
            </View>
            {motivatorName ? (
              <Text style={styles.motivatorFound}>✓ {motivatorName}</Text>
            ) : motivatorMobile.length >= 10 ? (
              <Text style={styles.motivatorError}>Motivator not found</Text>
            ) : null}
          </View>
        </View>

        {/* 80G Section */}
        <View style={styles.taxSection}>
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setNeed80G(!need80G)}
          >
            <Ionicons name={need80G ? "checkbox" : "square-outline"} size={24} color="#00bfa5" />
            <Text style={styles.checkboxLabel}>I want 80G Tax Benefit</Text>
          </TouchableOpacity>

          {need80G && (
            <View style={styles.taxInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PAN Number *</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="ABCDE1234F"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={pan}
                  onChangeText={setPan}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aadhaar Number *</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="12-digit Aadhaar"
                  keyboardType="number-pad"
                  maxLength={12}
                  value={aadhaar}
                  onChangeText={setAadhaar}
                />
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.donateBtn, submitting && styles.btnDisabled]}
          onPress={handleDonate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.donateBtnText}>Proceed to Payment</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.secureNote}>
          <Ionicons name="shield-checkmark" size={16} color="#64748b" />
          <Text style={styles.secureText}>Secure 256-bit encrypted payment via Razorpay</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <LocationModal 
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onDetect={handleDetectLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  donationSubtitle: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
  },
  subtitleLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 165, 0.2)',
  },
  subtitleLinkText: {
    color: '#00bfa5',
    fontSize: 13,
    fontWeight: '700',
  },
  amountGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 20,
    justifyContent: 'center'
  },
  amountBtn: { 
    width: '30%', 
    height: 60, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amountBtnActive: { 
    borderColor: '#00bfa5', 
    backgroundColor: '#00bfa5',
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  amountBtnText: { fontSize: 16, fontWeight: '600', color: '#475569' },
  amountBtnTextActive: { color: 'white', fontWeight: '800' },
  popularBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  popularText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
    backgroundColor: '#f8fafc'
  },
  currencySymbol: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginRight: 8 },
  customInput: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1e293b' },
  citizenCheck: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  checkText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  formSection: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionHeaderText: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  inputLocked: { backgroundColor: '#f1f5f9', color: '#94a3b8' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  phoneInputRow: { flexDirection: 'row', gap: 10 },
  flagAddon: { 
    backgroundColor: '#f1f5f9', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    width: 60, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  flagText: { fontWeight: '700', color: '#475569' },
  phoneInput: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    letterSpacing: 2 
  },
  motivatorInputWrapper: { position: 'relative' },
  innerLoader: { position: 'absolute', right: 14, top: 14 },
  motivatorFound: { color: '#00bfa5', fontSize: 12, fontWeight: '700', marginTop: 4 },
  motivatorError: { color: '#ef4444', fontSize: 12, fontWeight: '700', marginTop: 4 },
  taxSection: { marginBottom: 32, padding: 16, backgroundColor: '#f8fafc', borderRadius: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  taxInputs: { marginTop: 16 },
  donateBtn: {
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  btnDisabled: { opacity: 0.7 },
  donateBtnText: { color: 'white', fontSize: 18, fontWeight: '800' },
  secureNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  secureText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center'
  },
  successMessage: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  transactionBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
    width: '100%'
  },
  transactionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b'
  },
  claimAccountBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 24,
    backgroundColor: 'white',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 30
  },
  claimTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00bfa5',
    marginBottom: 8,
    textAlign: 'center'
  },
  claimDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50
  },
  inputIcon: {
    marginRight: 10
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b'
  },
  goHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10
  },
  goHomeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00bfa5'
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 191, 165, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 165, 0.2)',
  },
  detectBtnText: {
    color: '#00bfa5',
    fontSize: 12,
    fontWeight: '700',
  },
});
