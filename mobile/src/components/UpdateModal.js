import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UpdateModal = ({ isOpen, forceUpdate, playStoreUrl, onClose }) => {
  if (!isOpen) return null;

  const handleUpdatePress = async () => {
    try {
      const defaultUrl = Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id6780563745'
        : 'https://play.google.com/store/apps/details?id=com.thedharmarth.foundation';
      const url = playStoreUrl || defaultUrl;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Don't know how to open URI: " + url);
      }
    } catch (error) {
      console.error("Error opening Play Store link:", error);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={forceUpdate ? () => {} : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Close button on top-right (only if NOT a forced update) */}
          {!forceUpdate && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          )}

          <View style={styles.iconWrapper}>
            <Ionicons name="cloud-download-outline" size={40} color="#00bfa5" />
          </View>

          <Text style={styles.title}>New Update Available!</Text>
          
          <Text style={styles.description}>
            We've introduced exciting new features, bug fixes, and critical stability improvements. Please update to the latest version to continue using the application smoothly.
          </Text>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleUpdatePress}>
            <Text style={styles.btnPrimaryText}>Update Now</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>

          {/* Maybe Later button (only if NOT a forced update) */}
          {!forceUpdate && (
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
              <Text style={styles.btnSecondaryText}>Maybe Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
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
    shadowOpacity: 0.15,
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
    paddingHorizontal: 8
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

export default UpdateModal;
