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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

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

  useEffect(() => {
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
  }, [authUser]);

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
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
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

      // Since we don't have native Razorpay SDK yet, we use the web checkout
      // We'll pass all parameters to the web checkout page which is already built
      const checkoutUrl = `https://the-dharm-arth-foundation-software.vercel.app/donate?name=${encodeURIComponent(fullName)}&mobile=${mobile}&email=${encodeURIComponent(email)}&amount=${finalAmount}&motivator=${motivatorMobile}&pan=${pan}&aadhaar=${aadhaar}&is80G=${need80G}`;
      
      Linking.openURL(checkoutUrl);
      
      Alert.alert(
        "Redirecting to Secure Payment",
        "We are opening our secure payment gateway in your browser to complete the donation.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'Donate Now' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Amount Selection */}
        <Text style={styles.sectionTitle}>Select Donation Amount</Text>
        <View style={styles.amountGrid}>
          {config.plans.map((p) => (
            <TouchableOpacity 
              key={p} 
              style={[styles.amountBtn, amount === p && styles.amountBtnActive]}
              onPress={() => { setAmount(p); setCustomAmount(p.toString()); }}
            >
              <Text style={[styles.amountBtnText, amount === p && styles.amountBtnTextActive]}>₹{p}</Text>
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
            <Text style={styles.label}>Address (Optional)</Text>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  amountGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  amountBtn: { 
    flex: 1, 
    height: 60, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#f8fafc'
  },
  amountBtnActive: { 
    borderColor: '#00bfa5', 
    backgroundColor: '#f0fdfa' 
  },
  amountBtnText: { fontSize: 18, fontWeight: '700', color: '#475569' },
  amountBtnTextActive: { color: '#00bfa5' },
  popularBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#00bfa5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: { color: 'white', fontSize: 8, fontWeight: '900' },
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
  secureText: { fontSize: 12, color: '#64748b', fontWeight: '500' }
});
