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
  Platform,
  Linking
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const indianBanks = [
    "Bank of Baroda", "Bank of India", "Bank of Maharashtra", "Canara Bank", "Central Bank of India",
    "Indian Bank", "Indian Overseas Bank", "Punjab & Sind Bank", "Punjab National Bank", "State Bank of India",
    "UCO Bank", "Union Bank of India", "Axis Bank", "Bandhan Bank", "CSB Bank",
    "City Union Bank", "DCB Bank", "Dhanlaxmi Bank", "Federal Bank", "HDFC Bank",
    "ICICI Bank", "IDBI Bank", "IDFC FIRST Bank", "IndusInd Bank", "Jammu & Kashmir Bank",
    "Karnataka Bank", "Karur Vysya Bank", "Kotak Mahindra Bank", "Nainital Bank", "RBL Bank",
    "South Indian Bank", "Tamilnad Mercantile Bank", "YES Bank", "AU Small Finance Bank",
    "Capital Small Finance Bank", "Equitas Small Finance Bank", "ESAF Small Finance Bank",
    "Fincare Small Finance Bank", "Jana Small Finance Bank", "North East Small Finance Bank",
    "Shivalik Small Finance Bank", "Suryoday Small Finance Bank", "Ujjivan Small Finance Bank",
    "Unity Small Finance Bank", "Utkarsh Small Finance Bank", "Airtel Payments Bank",
    "Fino Payments Bank", "India Post Payments Bank", "Jio Payments Bank", "NSDL Payments Bank",
    "Paytm Payments Bank"
].sort();

export default function BankDetailsScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.payoutCredentials) {
      setBankForm({
        bankName: user.payoutCredentials.bankName || '',
        accountHolder: user.payoutCredentials.accountHolder || '',
        accountNumber: user.payoutCredentials.accountNumber || '',
        ifscCode: user.payoutCredentials.ifscCode || ''
      });
    }
  }, [user]);

  const filteredBanks = indianBanks.filter(bank =>
    bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    // IFSC Validation: 4 chars, 0, then 6 alphanumeric
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankForm.ifscCode)) {
      Alert.alert("Invalid IFSC", "Format: ABCD0123456");
      return;
    }

    // Account Number Validation: 9-18 digits
    const accRegex = /^\d{9,18}$/;
    if (!accRegex.test(bankForm.accountNumber)) {
      Alert.alert("Invalid Account", "Should be 9-18 digits.");
      return;
    }

    if (!bankForm.bankName) {
      Alert.alert("Error", "Please select a Bank Name");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/users/become-motivator', bankForm);
      const updatedUser = { ...data.user, token: user.token };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert("Success", "Payout details saved successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to save details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Bank Details', headerTitleAlign: 'center' }} />
      
      {Platform.OS === 'ios' ? (
        <ScrollView contentContainerStyle={[styles.scrollContent, { flex: 1, justifyContent: 'center' }]}>
          <View style={[styles.form, { alignItems: 'center', padding: 24 }]}>
            <Ionicons name="business" size={48} color="#00bfa5" style={{ marginBottom: 12 }} />
            <Text style={[styles.title, { fontSize: 18, marginTop: 12, textAlign: 'center', color: '#1e293b' }]}>
              Web Payout Setup
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginTop: 8 }}>
              To comply with App Store guidelines, bank details and payout options cannot be configured within the iOS application.
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginTop: 12, fontWeight: '600' }}>
              Please log in to your account at thedharmarth.com on a web browser to complete your payout profile.
            </Text>
            <TouchableOpacity 
              style={[styles.saveButton, { width: '100%', marginTop: 24 }]}
              onPress={() => Linking.openURL(`https://thedharmarth.com/profile?authToken=${encodeURIComponent(user?.token || '')}`)}
            >
              <Text style={styles.saveButtonText}>Go to Website</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="business" size={32} color="#00bfa5" />
            </View>
            <Text style={styles.title}>Payout Profile</Text>
            <Text style={styles.subtitle}>Provide your bank details to receive commissions.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Bank Name</Text>
            <TouchableOpacity 
              style={styles.pickerTrigger}
              onPress={() => setShowBankPicker(true)}
            >
              <Text style={bankForm.bankName ? styles.pickerText : styles.placeholderText}>
                {bankForm.bankName || "Select Bank"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>

            <Text style={styles.label}>Account Holder Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#64748b" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={bankForm.accountHolder}
                onChangeText={(text) => setBankForm({...bankForm, accountHolder: text})}
                placeholder="Name as per Bank"
              />
            </View>

            <Text style={styles.label}>Account Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={18} color="#64748b" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={bankForm.accountNumber}
                onChangeText={(text) => setBankForm({...bankForm, accountNumber: text.replace(/\D/g, '')})}
                placeholder="9-18 Digits"
                keyboardType="number-pad"
              />
            </View>

            <Text style={styles.label}>IFSC Code</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#64748b" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={bankForm.ifscCode}
                onChangeText={(text) => setBankForm({...bankForm, ifscCode: text.toUpperCase().replace(/[^A-Z0-9]/g, '')})}
                placeholder="e.g. HDFC0001234"
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save & Enable Payouts</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Bank Picker Modal Replacement (Simple List) */}
      {showBankPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search banks..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            <ScrollView style={styles.bankList}>
              {filteredBanks.map((bank, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.bankOption}
                  onPress={() => {
                    setBankForm({...bankForm, bankName: bank});
                    setShowBankPicker(false);
                    setSearchTerm('');
                  }}
                >
                  <Text style={styles.bankOptionText}>{bank}</Text>
                  {bankForm.bankName === bank && (
                    <Ionicons name="checkmark" size={20} color="#00bfa5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickerText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  saveButton: {
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
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 16,
  },
  bankList: {
    flex: 1,
  },
  bankOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bankOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
});
