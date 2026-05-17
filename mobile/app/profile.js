import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert,
  Dimensions
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/default_guest_avatar.jpg';

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
    address: user?.address || '',
    profileImage: user?.profileImage || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow access to your photos to upload a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [10, 12],
      quality: 0.8,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      const uploadData = new FormData();
      uploadData.append('image', {
        uri: file.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      setIsUploading(true);
      try {
        const { data } = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setFormData(prev => ({ ...prev, profileImage: data.imageUrl }));
      } catch (error) {
        Alert.alert("Upload Failed", "Could not upload photo. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) return Alert.alert("Required", "Please enter your name");
    
    setIsSaving(true);
    try {
      const { data } = await api.put('/users/profile', formData);
      setUser(data.user);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'My Profile', headerTitleAlign: 'center' }} />
      
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>My Identity Profile</Text>
        <Text style={styles.sectionSubtitle}>Complete your profile to generate your official ID Card.</Text>

        <View style={styles.photoSection}>
          <View style={styles.photoWrapper}>
            <Image 
              source={{ uri: formData.profileImage || DEFAULT_AVATAR_URL }} 
              style={styles.photo} 
            />
            {isUploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#00bfa5" />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleImageUpload}>
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              value={formData.name}
              onChangeText={(v) => handleInputChange('name', v)}
              placeholder="Enter full name"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              value={formData.email}
              onChangeText={(v) => handleInputChange('email', v)}
              placeholder="Enter email"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Work / Profession</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="briefcase-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              value={formData.work}
              onChangeText={(v) => handleInputChange('work', v)}
              placeholder="e.g. Software Engineer"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio / Vision</Text>
          <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
            <Ionicons name="information-circle-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={formData.bio}
              onChangeText={(v) => handleInputChange('bio', v)}
              placeholder="A short sentence about your mission..."
              multiline
              maxLength={100}
            />
          </View>
          <Text style={styles.charCount}>{formData.bio.length} / 100</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>City</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={formData.city}
                onChangeText={(v) => handleInputChange('city', v)}
                placeholder="City"
              />
            </View>
          </View>
          <View style={{ width: 12 }} />
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>State</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                value={formData.state}
                onChangeText={(v) => handleInputChange('state', v)}
                placeholder="State"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="white" />
              <Text style={styles.submitBtnText}>Save Profile Details</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.cardPreviewBox}>
        <Text style={styles.previewTitle}>ID Card Preview</Text>
        <TouchableOpacity 
          style={styles.viewCardBtn}
          onPress={() => router.push('/volunteer-card')}
        >
          <Ionicons name="eye-outline" size={18} color="#00bfa5" />
          <Text style={styles.viewCardText}>View Full ID Card</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  formCard: { 
    backgroundColor: 'white', 
    margin: 16, 
    borderRadius: 24, 
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 24 },
  photoSection: { alignSelf: 'center', position: 'relative', marginBottom: 32 },
  photoWrapper: { 
    width: 120, 
    height: 140, 
    borderRadius: 16, 
    borderWidth: 3, 
    borderColor: '#e2e8f0', 
    overflow: 'hidden',
    backgroundColor: '#f1f5f9'
  },
  photo: { width: '100%', height: '100%' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  uploadBtn: { 
    position: 'absolute', 
    bottom: -10, 
    right: -10, 
    backgroundColor: '#00bfa5', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#cbd5e1', 
    borderRadius: 12, 
    paddingHorizontal: 12 
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: '#1e293b' },
  charCount: { fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4, fontWeight: '600' },
  row: { flexDirection: 'row' },
  submitBtn: { 
    backgroundColor: '#00bfa5', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 16, 
    borderRadius: 12,
    marginTop: 8
  },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  cardPreviewBox: { 
    marginHorizontal: 16, 
    backgroundColor: '#f0fdfa', 
    borderWidth: 1, 
    borderColor: '#00bfa5', 
    borderRadius: 16, 
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  previewTitle: { fontSize: 15, fontWeight: '700', color: '#134e4a' },
  viewCardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00bfa5' },
  viewCardText: { color: '#00bfa5', fontSize: 13, fontWeight: '700' }
});
