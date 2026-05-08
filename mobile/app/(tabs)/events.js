import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function EventsScreen() {
  const handleOpenWeb = () => {
    Linking.openURL('https://the-dharm-arth-foundation-software.vercel.app/events');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Fundraise For' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="calendar" size={60} color="#00bfa5" />
          <Text style={styles.title}>Upcoming Events</Text>
          <Text style={styles.subtitle}>Join our community events and fundraise for noble medical causes.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Host a Fundraiser</Text>
          <Text style={styles.cardDesc}>You can host an event to raise funds for a specific medical case. We provide all the tools you need.</Text>
        </View>

        <TouchableOpacity style={styles.webButton} onPress={handleOpenWeb}>
          <Text style={styles.webButtonText}>View Active Events</Text>
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
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#f1f5f9' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  webButton: { backgroundColor: '#00bfa5', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  webButtonText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
