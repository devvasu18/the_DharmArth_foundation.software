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
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/default_guest_avatar.jpg';

export default function ProfileScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    work: user?.work || '',
    bio: user?.bio || '',
    city: user?.city || '',
    state: user?.state || '',
    profileImage: user?.profileImage || ''
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        work: user.work || '',
        bio: user.bio || '',
        city: user.city || '',
        state: user.state || '',
        profileImage: user.profileImage || ''
      });
    }
  }, [user]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const fileName = uri.split('/').pop();
      const fileType = fileName.split('.').pop();
      
      formData.append('image', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: fileName,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      });

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData(prev => ({ ...prev, profileImage: data.imageUrl }));
      Alert.alert("Success", "Photo uploaded successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Upload Failed", "Could not upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', formData);
      const updatedUser = { ...data.user, token: user.token };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Edit Profile', headerTitleAlign: 'center' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <Image 
              source={{ uri: formData.profileImage || DEFAULT_AVATAR }} 
              style={styles.profilePhoto} 
            />
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#00bfa5" />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickImage} disabled={uploading}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Your Name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work / Profession</Text>
            <TextInput
              style={styles.input}
              value={formData.work}
              onChangeText={(text) => setFormData({...formData, work: text})}
              placeholder="e.g. Social Worker"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio / Mission (Max 100 chars)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => setFormData({...formData, bio: text})}
              placeholder="Tell donors about your mission..."
              multiline
              maxLength={100}
            />
            <Text style={styles.charCount}>{formData.bio.length} / 100</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({...formData, city: text})}
                placeholder="City"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData({...formData, state: text})}
                placeholder="State"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00bfa5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  changePhotoText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#00bfa5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
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
});
