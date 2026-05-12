import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Share,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import HTML from 'react-native-render-html';

const { width } = Dimensions.get('window');

const EventDetails = () => {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [slug]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/events/slug/${slug}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Failed to fetch event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Check out this event: ${event.title}\nhttps://the-dharm-arth-foundation-software.vercel.app/events/${event.slug}`,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Event Details',
          headerStyle: { backgroundColor: 'white' },
          headerTintColor: '#00bfa5',
          headerRight: () => (
            <TouchableOpacity onPress={onShare} style={{ marginRight: 15 }}>
              <Ionicons name="share-social-outline" size={24} color="#00bfa5" />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: event.coverImage }} style={styles.coverImage} />
        
        <View style={styles.contentContainer}>
          <View style={styles.badgesContainer}>
            <Text style={[styles.statusBadge, styles[event.status]]}>
              {event.status?.toUpperCase() || 'UPCOMING'}
            </Text>
            {event.category && (
              <Text style={styles.categoryBadge}>{event.category}</Text>
            )}
          </View>

          <Text style={styles.title}>{event.title}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={20} color="#00bfa5" />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>
                  {new Date(event.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="time" size={20} color="#00bfa5" />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Time</Text>
                <Text style={styles.metaValue}>{event.time || 'TBA'}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="location" size={20} color="#00bfa5" />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.metaValue}>{event.location || 'Online'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>About Event</Text>
            {event.description ? (
               <HTML 
                 source={{ html: event.description }} 
                 contentWidth={width - 40}
                 tagsStyles={{
                   p: { fontSize: 16, color: '#475569', lineHeight: 26, marginBottom: 10 },
                   li: { fontSize: 16, color: '#475569', lineHeight: 26 },
                 }}
               />
            ) : (
              <Text style={styles.description}>{event.shortDescription}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Linking.openURL('https://the-dharm-arth-foundation-software.vercel.app/donate')}
        >
          <Text style={styles.actionButtonText}>Support the Foundation</Text>
          <Ionicons name="heart" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingBottom: 100, // Space for bottom bar
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  upcoming: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  ongoing: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  completed: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 24,
    lineHeight: 32,
  },
  metaContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaTextContainer: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '700',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  actionButton: {
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#00bfa5',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '700',
  }
});

export default EventDetails;
