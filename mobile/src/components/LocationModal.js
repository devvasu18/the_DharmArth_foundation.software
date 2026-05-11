import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LocationModal = ({ isOpen, onClose, onDetect }) => {
  if (!isOpen) return null;

  const handleTurnOnAndDetect = async () => {
    onClose();
    if (onDetect) {
      onDetect();
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>

          <View style={styles.iconWrapper}>
            <Ionicons name="location" size={40} color="#00bfa5" />
          </View>

          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.description}>
            To detect your address automatically, we need your location permission and services enabled.
          </Text>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleTurnOnAndDetect}>
            <Text style={styles.btnPrimaryText}>Turn On & Detect</Text>
            <Ionicons name="flash-outline" size={18} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
            <Text style={styles.btnSecondaryText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
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
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 191, 165, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 20,
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
  btnPrimary: {
    backgroundColor: '#00bfa5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%'
  },
  btnPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },
  btnSecondary: {
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8
  },
  btnSecondaryText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600'
  }
});

export default LocationModal;
