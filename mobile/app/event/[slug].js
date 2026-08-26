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
import YoutubeIframe from 'react-native-youtube-iframe';
import api from '../../src/services/api';

import { useTranslation } from '../../src/context/LanguageContext';

const { width } = Dimensions.get('window');

const API_BASE_URL = 'https://api.thedharmarth.com';

const getYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const getEventCoverUrl = (event) => {
  if (!event) return null;
  if (event.coverImage) {
    const ytId = getYouTubeVideoId(event.coverImage);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return event.coverImage.startsWith('http')
      ? event.coverImage
      : `${API_BASE_URL}${event.coverImage.startsWith('/') ? '' : '/'}${event.coverImage}`;
  }
  if (event.heroImages && event.heroImages.length > 0) {
    const firstHero = event.heroImages[0];
    const ytId = getYouTubeVideoId(firstHero);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return firstHero.startsWith('http')
      ? firstHero
      : `${API_BASE_URL}${firstHero.startsWith('/') ? '' : '/'}${firstHero}`;
  }
  return null;
};

const EventDetails = () => {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
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

  const renderDetailBlock = (block, index) => {
    switch (block.type) {
      case 'text':
        const blockText = (locale === 'hi' && block.content?.htmlHi)
          ? block.content.htmlHi
          : (block.content?.html || block.content?.text || '');
        return (
          <View key={`detail-${index}`} style={styles.detailBlock}>
            <Text style={styles.detailText}>
              {blockText.replace(/<[^>]*>?/gm, '')}
            </Text>
          </View>
        );
      case 'image':
        const imgUrl = block.content?.url?.startsWith('http') 
          ? block.content.url 
          : `https://api.thedharmarth.com${block.content?.url?.startsWith('/') ? '' : '/'}${block.content?.url}`;
        return (
          <View key={`detail-${index}`} style={styles.detailBlock}>
             <Image source={{ uri: imgUrl }} style={styles.detailImage} resizeMode="cover" />
             {block.content?.caption ? <Text style={styles.mediaCaption}>{block.content.caption}</Text> : null}
          </View>
        );
      case 'youtube':
      case 'video':
        let videoId = '';
        try {
            const url = block.content?.url || '';
            if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
            else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1];
            else if (url.includes('embed/')) videoId = url.split('embed/')[1];
        } catch (e) { }

        if (!videoId) return null;

        return (
          <View key={`detail-${index}`} style={styles.detailBlock}>
            <Text style={styles.blockLabel}>{locale === 'hi' ? 'मुख्य आकर्षण देखें' : 'Watch Highlight'}</Text>
            <View style={{ borderRadius: 12, overflow: 'hidden', marginTop: 10 }}>
              <YoutubeIframe
                height={220}
                videoId={videoId}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const onShare = async () => {
    if (!event) return;
    const title = (locale === 'hi' && event.title_hi) ? event.title_hi : event.title;
    try {
      await Share.share({
        message: `${locale === 'hi' ? 'इस कार्यक्रम को देखें' : 'Check out this event'}: ${title}\nhttps://thedharmarth.com/events/${event.slug}`,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: locale === 'hi' ? 'त्रुटि' : 'Error' }} />
        <Text style={styles.errorText}>{locale === 'hi' ? 'कार्यक्रम नहीं मिला' : 'Event not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{locale === 'hi' ? 'वापस जाएं' : 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const eventDate = new Date(event.date);
  const now = new Date();
  const eventStatus = event.status || (event.date && eventDate < now ? 'completed' : 'upcoming');
  const statusLabel = eventStatus === 'upcoming'
    ? (locale === 'hi' ? 'आगामी' : 'UPCOMING')
    : eventStatus === 'ongoing'
      ? (locale === 'hi' ? 'जारी है' : 'ONGOING')
      : (locale === 'hi' ? 'पूर्ण' : 'COMPLETED');

  const displayTitle = (locale === 'hi' && event.title_hi) ? event.title_hi : event.title;
  const displayLocation = (locale === 'hi' && event.location_hi) ? event.location_hi : (event.location || (locale === 'hi' ? 'ऑनलाइन' : 'Online'));
  const shortDesc = (locale === 'hi' && event.shortDescription_hi) ? event.shortDescription_hi : event.shortDescription;
  
  const blockTextContent = (locale === 'hi' && event.blocks?.find(b => b.type === 'text')?.content?.htmlHi)
    ? event.blocks.find(b => b.type === 'text')?.content?.htmlHi
    : event.blocks?.find(b => b.type === 'text')?.content?.html;

  const fullDesc = (locale === 'hi' && event.description_hi)
    ? event.description_hi
    : (event.description || blockTextContent || '');

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: locale === 'hi' ? 'कार्यक्रम विवरण' : 'Event Details',
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
        {(() => {
          const youtubeCoverId = getYouTubeVideoId(event.coverImage);
          if (youtubeCoverId) {
            return (
              <View style={{ width: '100%', height: 250, backgroundColor: '#000' }}>
                <YoutubeIframe
                  height={250}
                  videoId={youtubeCoverId}
                  webViewStyle={{ opacity: 0.99 }}
                />
              </View>
            );
          }
          const coverUrl = getEventCoverUrl(event);
          return coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : null;
        })()}
        
        <View style={styles.contentContainer}>
          <View style={styles.badgesContainer}>
            <Text style={[styles.statusBadge, styles[eventStatus]]}>
              {statusLabel}
            </Text>
            {event.category && (
              <Text style={styles.categoryBadge}>{event.category}</Text>
            )}
          </View>

          <Text style={styles.title}>{displayTitle}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={20} color="#00bfa5" />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>{locale === 'hi' ? 'तारीख' : 'Date'}</Text>
                <Text style={styles.metaValue}>
                  {event.date ? new Date(event.date).toLocaleDateString(locale === 'hi' ? 'hi-IN' : undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'TBA'}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="time" size={20} color="#00bfa5" />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>{locale === 'hi' ? 'समय' : 'Time'}</Text>
                <Text style={styles.metaValue}>{event.time || (locale === 'hi' ? 'जल्द घोषित' : 'TBA')}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="location" size={20} color="#00bfa5" />
              <View style={styles.metaTextContainer}>
                <Text style={styles.metaLabel}>{locale === 'hi' ? 'स्थान' : 'Location'}</Text>
                <Text style={styles.metaValue}>{displayLocation}</Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>{locale === 'hi' ? 'कार्यक्रम के बारे में' : 'About Event'}</Text>
            
            {shortDesc ? (
              <Text style={[styles.description, fullDesc && fullDesc !== shortDesc ? { fontWeight: '600', color: '#1e293b', marginBottom: 12 } : null]}>
                {shortDesc.replace(/<[^>]*>?/gm, '')}
              </Text>
            ) : null}

            {fullDesc && fullDesc !== shortDesc ? (
              <Text style={styles.description}>
                {fullDesc.replace(/<[^>]*>?/gm, '')}
              </Text>
            ) : null}

            {!shortDesc && !fullDesc ? (
              <Text style={styles.description}>
                {locale === 'hi' ? 'कोई विवरण उपलब्ध नहीं है।' : 'No description available.'}
              </Text>
            ) : null}
          </View>

          {event.details && event.details.length > 0 && (
            <View style={styles.detailsContainer}>
              <Text style={styles.sectionTitle}>{locale === 'hi' ? 'कार्यक्रम की मुख्य बातें' : 'Event Highlights'}</Text>
              {event.details.map((block, index) => renderDetailBlock(block, index))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/donate')}
        >
          <Text style={styles.actionButtonText}>{locale === 'hi' ? 'फाउंडेशन का समर्थन करें' : 'Support the Foundation'}</Text>
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
  detailsContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 24,
  },
  detailBlock: {
    marginBottom: 24,
  },
  detailText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  mediaCaption: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  blockLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00bfa5',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  youtubeCard: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  youtubeThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.75,
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
