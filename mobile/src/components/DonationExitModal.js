import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DonationExitModal = ({ isOpen, onClose, onConfirmNavigation }) => {
  const [phase, setPhase] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '' });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { user: authUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      if (authUser) {
        setFormData({
          name: authUser.name || '',
          mobile: authUser.mobile || ''
        });
      }
      // Start pulsing animation for heart
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      setPhase(1);
      pulseAnim.stopAnimation();
    }
  }, [isOpen, authUser]);

  const handleSubmit = async () => {
    if (!formData.mobile || formData.mobile.length < 10) {
      Alert.alert('Invalid Input', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/leads', {
        ...formData,
        type: 'donation_exit',
        source: 'donation_page',
        language: 'en'
      });
      Alert.alert('Thank You', "We'll remind you later!");
      onConfirmNavigation();
    } catch (error) {
      console.error("Failed to save lead:", error);
      Alert.alert('Oops', "Something went wrong, but you can still donate later!");
      onConfirmNavigation();
    } finally {
      setLoading(false);
    }
  };

  // Critical for Fabric Stability
  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>

            {phase === 1 ? (
              <View style={styles.phaseContainer}>
                <View style={styles.iconWrapper}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="heart" size={54} color="#ef4444" />
                  </Animated.View>
                </View>
                <Text style={styles.title}>Please Don't Give Up!</Text>
                <Text style={styles.description}>
                  Every small contribution makes a huge difference in someone's life. Are you sure you want to leave?
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.btnStay} onPress={onClose}>
                    <Text style={styles.btnStayText}>Contribute Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnLater} onPress={() => setPhase(2)}>
                    <Text style={styles.btnLaterText}>Remind Me Later</Text>
                    <Ionicons name="arrow-forward" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.phaseContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Ionicons name="call" size={38} color="#3b82f6" />
                </View>
                <Text style={styles.title}>We'll remind you!</Text>
                <Text style={styles.description}>
                  Leave your details and we'll send you a gentle reminder when you're ready.
                </Text>

                <View style={styles.formGroup}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your Name"
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mobile Number"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={formData.mobile}
                      onChangeText={(text) => setFormData({ ...formData, mobile: text.replace(/[^0-9]/g, '') })}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={loading}>
                  <Text style={styles.btnSubmitText}>{loading ? 'Saving...' : 'Remind Later'}</Text>
                  {!loading && <Ionicons name="paper-plane" size={16} color="white" />}
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnLeave} onPress={onConfirmNavigation}>
                  <Text style={styles.btnLeaveText}>back to dashboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: '100%',
    padding: 20,
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4
  },
  phaseContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center'
  },
  description: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10
  },
  actions: {
    width: '100%',
    gap: 12
  },
  btnStay: {
    backgroundColor: '#00bfa5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%'
  },
  btnStayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },
  btnLater: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  btnLaterText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600'
  },
  formGroup: {
    width: '100%',
    marginBottom: 16
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b'
  },
  btnSubmit: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8
  },
  btnSubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },
  btnLeave: {
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8
  },
  btnLeaveText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline'
  }
});

export default DonationExitModal;
