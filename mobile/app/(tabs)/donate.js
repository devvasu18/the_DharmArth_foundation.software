import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function DonateScreen() {
  const handleOpenWeb = () => {
    Linking.openURL('https://the-dharm-arth-foundation-software.vercel.app/donate');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Browse Donations' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="heart" size={60} color="#ef4444" />
          <Text style={styles.title}>Make a Difference</Text>
          <Text style={styles.subtitle}>Your contribution can save lives. Choose a cause and donate today.</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why Donate with Us?</Text>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#00bfa5" />
            <Text style={styles.infoText}>0% Platform Fee - 100% to Cause</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#00bfa5" />
            <Text style={styles.infoText}>Verified Medical Cases</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#00bfa5" />
            <Text style={styles.infoText}>80G Tax Benefit Available</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.webButton} onPress={handleOpenWeb}>
          <Text style={styles.webButtonText}>View Donation Causes</Text>
          <Ionicons name="open-outline" size={20} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24 },
  hero: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  infoCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#f1f5f9' },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  webButton: { backgroundColor: '#00bfa5', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  webButtonText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
