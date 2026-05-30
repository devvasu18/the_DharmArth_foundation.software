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
import { useTranslation } from '../../src/context/LanguageContext';
import api from '../../src/services/api';
import { useLocationFlow } from '../../src/hooks/useLocationFlow';
import RazorpayCheckout from 'react-native-razorpay';
import DonationExitModal from '../../src/components/DonationExitModal';
import { validatePAN, validateAadhaar } from '../../src/utils/validators';
import { Modal } from 'react-native';

export default function DonateScreen() {
  const { t, locale } = useTranslation();
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
  const [wasAutoFetched, setWasAutoFetched] = useState(false);

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

  // PAN Confirmation State
  const [confirmPan, setConfirmPan] = useState('');
  const [showPanModal, setShowPanModal] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const { requestLocation, loading: isDetecting } = useLocationFlow();

  useFocusEffect(
    React.useCallback(() => {
      fetchSettings();
      if (authUser) {
        setFullName(authUser.name || '');
        setMobile(authUser.mobile || '');
        setEmail(authUser.email || '');

        if (authUser.referredBy) {
          // Directly referred — highest priority
          setMotivatorMobile(authUser.referredBy.mobile || authUser.referredBy.referralCode || '');
          setMotivatorName(authUser.referredBy.name || '');
          setIsMotivatorLocked(true);
        } else if (authUser.lastMotivatorMobile) {
          // Previously used motivator — auto-lock
          setMotivatorMobile(authUser.lastMotivatorMobile);
          if (authUser.lastMotivatorName) setMotivatorName(authUser.lastMotivatorName);
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

  // Debounced motivator validation — mirrors web logic exactly
  useEffect(() => {
    const checkMotivator = async () => {
      // Skip if locked and already have name
      if (isMotivatorLocked && motivatorName) return;

      // Self-referral guard
      if (motivatorMobile && mobile && motivatorMobile === mobile) {
        setMotivatorName('');
        return;
      }

      if (motivatorMobile.length >= 4) {
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
      } else {
        setMotivatorName('');
      }
    };

    const timer = setTimeout(checkMotivator, 500);
    return () => clearTimeout(timer);
  }, [motivatorMobile, mobile, isMotivatorLocked]);

  // Auto-fetch previous motivator for GUEST users when they type their mobile number
  useEffect(() => {
    // If guest removes a digit from their mobile number, unlock and clear any auto-fetched motivator
    if (mobile.length < 10 && wasAutoFetched) {
      setMotivatorMobile('');
      setMotivatorName('');
      setIsMotivatorLocked(false);
      setWasAutoFetched(false);
      return;
    }

    const fetchPreviousMotivator = async () => {
      // Only for guests (not logged in), full 10-digit number, no motivator set yet
      if (mobile.length === 10 && !authUser && !motivatorMobile) {
        try {
          const { data } = await api.get(`/donate/previous-motivator/${mobile}`);
          if (data.motivatorMobile) {
            setMotivatorMobile(data.motivatorMobile);
            if (data.motivatorName) setMotivatorName(data.motivatorName);
            setIsMotivatorLocked(true);
            setWasAutoFetched(true);
          }
        } catch (error) {
          // Silently fail — guest just won't have pre-filled motivator
          console.log('No previous motivator found for this number');
        }
      }
    };

    const timer = setTimeout(fetchPreviousMotivator, 800);
    return () => clearTimeout(timer);
  }, [mobile, authUser, motivatorMobile, wasAutoFetched]);

  const handleDonate = async () => {
    const finalAmount = parseInt(customAmount) || amount;

    if (!fullName || mobile.length !== 10 || !finalAmount) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (need80G) {
      if (!pan || !aadhaar) {
        Alert.alert('Error', 'PAN and Aadhaar are required for 80G benefit.');
        return;
      }
      if (!validatePAN(pan)) {
        Alert.alert('Error', 'Invalid PAN Number format (e.g. ABCDE1234F)');
        return;
      }
      if (!validateAadhaar(aadhaar)) {
        Alert.alert('Error', 'Invalid Aadhaar Number');
        return;
      }
      setConfirmPan('');
      setConfirmError('');
      setShowPanModal(true);
    } else {
      submitDonation();
    }
  };

  const handlePanConfirm = () => {
    if (confirmPan.toUpperCase() !== pan.toUpperCase()) {
      setConfirmError("PAN numbers do not match.");
      return;
    }
    setConfirmError('');
    setShowPanModal(false);
    submitDonation();
  };

  const submitDonation = async () => {
    const finalAmount = parseInt(customAmount) || amount;
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
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_SvdzLNA9hdG9PL',
        name: 'DharmArth Foundation',
        prefill: {
          email: email,
          contact: mobile,
          name: fullName
        },
        theme: { color: '#00bfa5' }
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
            {locale === 'hi' ? `धन्यवाद, ${fullName.split(' ')[0]}!` : `Thank You, ${fullName.split(' ')[0]}!`}
          </Text>
          <Text style={styles.successMessage}>
            {locale === 'hi' ? (
              <Text>आपका <Text style={{ fontWeight: 'bold' }}>₹{donationSuccess.amount.toLocaleString('en-IN')}</Text> का दान सफल रहा।</Text>
            ) : (
              <Text>Your donation of <Text style={{ fontWeight: 'bold' }}>₹{donationSuccess.amount.toLocaleString('en-IN')}</Text> was successful.</Text>
            )}
          </Text>

          <View style={styles.transactionBox}>
            <Text style={styles.transactionLabel}>{locale === 'hi' ? 'लेनदेन आईडी' : 'Transaction ID'}</Text>
            <Text style={styles.transactionId}>{donationSuccess.donationId}</Text>
          </View>

          {!isLoggedIn && (
            <View style={styles.claimAccountBox}>
              {donationSuccess.isAlreadyRegistered ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.claimTitle}>{locale === 'hi' ? 'आपका स्वागत है!' : 'Welcome Back!'}</Text>
                  <Text style={styles.claimDesc}>
                    {locale === 'hi' ? 'आपका पहले से ही हमारे पास एक खाता है। इस दान को ट्रैक करने और अपने प्रमाणपत्रों को एक्सेस करने के लिए लॉगिन करें।' : 'You already have an account with us. Login to track this donation and access your certificates.'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.donateBtn, { marginTop: 10, width: '100%' }]}
                    onPress={() => router.push('/login')}
                  >
                    <Text style={styles.donateBtnText}>{locale === 'hi' ? 'अपने खाते में लॉगिन करें' : 'Login to Your Account'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ width: '100%' }}>
                  <Text style={styles.claimTitle}>{locale === 'hi' ? 'अपने खाते का दावा करें' : 'Claim Your Account'}</Text>
                  <Text style={styles.claimDesc}>
                    {locale === 'hi' ? 'अपने 80G प्रमाणपत्रों को सुरक्षित रूप से एक्सेस करने और अपने दान को ट्रैक करने के लिए एक पासवर्ड बनाएं।' : 'Create a password to securely access your 80G certificates and track your donations.'}
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{locale === 'hi' ? 'पासवर्ड बनाएं' : 'Create Password'}</Text>
                    <View style={styles.passwordInputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        placeholder={locale === 'hi' ? 'न्यूनतम 6 वर्ण' : 'Min. 6 characters'}
                        secureTextEntry
                        value={registerPassword}
                        onChangeText={setRegisterPassword}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{locale === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}</Text>
                    <View style={styles.passwordInputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        placeholder={locale === 'hi' ? 'पासवर्ड पुनः दर्ज करें' : 'Re-enter password'}
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
                      <Text style={styles.donateBtnText}>{locale === 'hi' ? 'खाता बनाएं' : 'Create Account'}</Text>
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
            <Text style={styles.goHomeText}>
              {isLoggedIn 
                ? (locale === 'hi' ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard') 
                : (locale === 'hi' ? 'छोड़ें और होम पर जाएं' : 'Skip & Go Home')}
            </Text>
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
        <Text style={styles.sectionTitle}>{locale === 'hi' ? 'दान राशि चुनें' : 'Select Donation Amount'}</Text>

        {!!donationLabel && (
          <View style={styles.subtitleContainer}>
            <Text style={styles.donationSubtitle}>{donationLabel}</Text>
            {!!donationLabelLink && (
              <TouchableOpacity
                style={styles.subtitleLinkBtn}
                onPress={() => Linking.openURL(donationLabelLink)}
              >
                <Text style={styles.subtitleLinkText}>{donationLabelBtnText || (locale === 'hi' ? 'और जानें' : 'Learn More')}</Text>
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
              {config.popularAmount === p && <View style={styles.popularBadge}><Text style={styles.popularText}>{locale === 'hi' ? 'लोकप्रिय' : 'POPULAR'}</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customAmountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.customInput}
            placeholder={locale === 'hi' ? 'कस्टम राशि' : 'Custom Amount'}
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={(t) => { setCustomAmount(t); setAmount(0); }}
          />
        </View>

        <View style={styles.citizenCheck}>
          <Ionicons name="checkbox" size={20} color="#00bfa5" />
          <Text style={styles.checkText}>{locale === 'hi' ? 'मैं एक भारतीय नागरिक हूँ' : 'I am an Indian Citizen'}</Text>
        </View>

        {/* Personal Details */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#00bfa5" />
            <Text style={styles.sectionHeaderText}>{locale === 'hi' ? 'व्यक्तिगत विवरण' : 'Personal Details'}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{locale === 'hi' ? 'पूरा नाम *' : 'Full Name *'}</Text>
            <TextInput
              style={styles.input}
              placeholder={locale === 'hi' ? 'जैसे: रघु कुमार' : "Ex. Raghu Kumar"}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{locale === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}</Text>
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
            <Text style={styles.label}>{locale === 'hi' ? 'ईमेल पता' : 'Email Address'}</Text>
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
              <Text style={styles.label}>{locale === 'hi' ? 'पता (वैकल्पिक)' : 'Address (Optional)'}</Text>
              <TouchableOpacity
                style={styles.detectBtn}
                onPress={handleDetectLocation}
                disabled={isDetecting}
              >
                <Ionicons name="location" size={14} color="#00bfa5" />
                <Text style={styles.detectBtnText}>
                  {isDetecting 
                    ? (locale === 'hi' ? 'पता लगा रहा है...' : 'Detecting...') 
                    : (locale === 'hi' ? 'ऑटो पता लगाएँ' : 'Auto Detect')}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={locale === 'hi' ? 'जैसे: मकान नंबर 123, सेक्टर 4, नई दिल्ली' : "Ex. H.No 123, Sector 4, New Delhi"}
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
            <Text style={styles.sectionHeaderText}>{locale === 'hi' ? 'प्रेरक विवरण' : 'Motivator Details'}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{locale === 'hi' ? 'द्वारा प्रेरित (मोबाइल/आईडी)' : 'Motivated By (Mobile/ID)'}</Text>

            {isMotivatorLocked && motivatorName ? (
              /* Locked verified motivator chip */
              <View style={styles.motivatorChip}>
                <View style={styles.motivatorAvatar}>
                  <Ionicons name="person" size={22} color="#00bfa5" />
                </View>
                <View style={styles.motivatorChipInfo}>
                  <Text style={styles.motivatorChipName}>{motivatorName}</Text>
                  <View style={styles.motivatorChipBadge}>
                    <Ionicons name="shield-checkmark" size={13} color="white" />
                    <Text style={styles.motivatorChipBadgeText}>{locale === 'hi' ? 'सत्यापित प्रेरक' : 'Verified Motivator'}</Text>
                  </View>
                </View>
                <View style={styles.motivatorLockIcon}>
                  <Ionicons name="lock-closed" size={16} color="#94a3b8" />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.motivatorInputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder={locale === 'hi' ? 'मोबाइल नंबर या रेफरल कोड' : 'Mobile Number or Referral Code'}
                    keyboardType="phone-pad"
                    maxLength={15}
                    value={motivatorMobile}
                    onChangeText={(val) => setMotivatorMobile(val.toUpperCase().replace(/\s/g, ''))}
                    editable={!isMotivatorLocked}
                  />
                  {isValidatingMotivator && (
                    <ActivityIndicator style={styles.innerLoader} size="small" color="#00bfa5" />
                  )}
                </View>

                {motivatorName ? (
                  /* Verified chip shown below input */
                  <View style={styles.motivatorChip}>
                    <View style={styles.motivatorAvatar}>
                      <Ionicons name="person" size={22} color="#00bfa5" />
                    </View>
                    <View style={styles.motivatorChipInfo}>
                      <Text style={styles.motivatorChipName}>{motivatorName}</Text>
                      <View style={styles.motivatorChipBadge}>
                        <Ionicons name="shield-checkmark" size={13} color="white" />
                        <Text style={styles.motivatorChipBadgeText}>{locale === 'hi' ? 'सत्यापित प्रेरक' : 'Verified Motivator'}</Text>
                      </View>
                    </View>
                  </View>
                ) : motivatorMobile.length >= 10 && !isValidatingMotivator ? (
                  <Text style={styles.motivatorError}>
                    {locale === 'hi' ? '❌ प्रेरक नहीं मिला' : '❌ Motivator not found'}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </View>

        {/* 80G Section */}
        <View style={styles.taxSection}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setNeed80G(!need80G)}
          >
            <Ionicons name={need80G ? "checkbox" : "square-outline"} size={24} color="#00bfa5" />
            <Text style={styles.checkboxLabel}>{locale === 'hi' ? 'मुझे 80G टैक्स लाभ चाहिए' : 'I want 80G Tax Benefit'}</Text>
          </TouchableOpacity>

          {need80G && (
            <View style={styles.taxInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{locale === 'hi' ? 'पैन नंबर *' : 'PAN Number *'}</Text>
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
                <Text style={styles.label}>{locale === 'hi' ? 'आधार नंबर *' : 'Aadhaar Number *'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={locale === 'hi' ? '12-अंकीय आधार' : "12-digit Aadhaar"}
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
              <Text style={styles.donateBtnText}>
                {locale === 'hi' ? 'भुगतान के लिए आगे बढ़ें' : 'Proceed to Payment'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.secureNote}>
          <Ionicons name="shield-checkmark" size={16} color="#64748b" />
          <Text style={styles.secureText}>
            {locale === 'hi' ? 'रेज़रपे के माध्यम से सुरक्षित 256-बिट एन्क्रिप्टेड भुगतान' : 'Secure 256-bit encrypted payment via Razorpay'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onDetect={handleDetectLocation}
      />

      {/* PAN Confirmation Modal */}
      <Modal
        visible={showPanModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm PAN Details</Text>
            </View>

            <Text style={styles.modalText}>
              Please re-enter your PAN Number for verification.
            </Text>
            
            <TextInput
              style={[styles.input, confirmError ? styles.inputError : null, { marginBottom: 10 }]}
              placeholder="Enter PAN Number again"
              value={confirmPan}
              onChangeText={(text) => {
                setConfirmPan(text.toUpperCase());
                if (confirmError) setConfirmError('');
              }}
              autoCapitalize="characters"
              maxLength={10}
            />
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowPanModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handlePanConfirm}
              >
                <Text style={styles.modalBtnConfirmText}>Verify & Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // PAN Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b'
  },
  modalText: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 22
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 16
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBtnCancel: {
    backgroundColor: '#f1f5f9'
  },
  modalBtnCancelText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '700'
  },
  modalBtnConfirm: {
    backgroundColor: '#00bfa5'
  },
  modalBtnConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },
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
  motivatorInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  innerLoader: {
    position: 'absolute',
    right: 14,
  },
  inputLocked: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  motivatorError: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 6,
  },
  motivatorFound: {
    fontSize: 13,
    color: '#00bfa5',
    fontWeight: '700',
    marginTop: 6,
  },
  // Premium verified motivator chip
  motivatorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fffa',
    borderWidth: 1.5,
    borderColor: '#00bfa5',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  motivatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#00bfa5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  motivatorChipInfo: {
    flex: 1,
  },
  motivatorChipName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  motivatorChipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00bfa5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  motivatorChipBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
  },
  motivatorLockIcon: {
    padding: 4,
  },
});
