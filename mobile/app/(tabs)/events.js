import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Dimensions,
  Linking,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, Link, useFocusEffect, useRouter } from 'expo-router';
import api from '../../src/services/api';
import { useTranslation } from '../../src/context/LanguageContext';

const { width } = Dimensions.get('window');

export default function EventsScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [headerSlides, setHeaderSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headerLoading, setHeaderLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = React.useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchHeaders();
      fetchEvents();
    }, [filter, categoryFilter])
  );

  // Header Slider Autoplay
  useEffect(() => {
    if (headerSlides.length > 1) {
      const interval = setInterval(() => {
        const nextIndex = (currentSlide + 1) % headerSlides.length;
        sliderRef.current?.scrollTo({ x: nextIndex * width, animated: true });
        setCurrentSlide(nextIndex);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [headerSlides, currentSlide]);

  const fetchHeaders = async () => {
    try {
      const res = await api.get('/event-headers');
      setHeaderSlides(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHeaderLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const statusParam = filter === 'all' ? '' : (filter === 'past' ? 'completed' : filter);
      const categoryParam = categoryFilter === 'all' ? '' : categoryFilter;
      const res = await api.get(`/events?status=${statusParam}&category=${categoryParam}`);
      setEvents(res.data.events || []);
    } catch (error) {
      console.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [headersRes, eventsRes] = await Promise.all([
        api.get('/event-headers'),
        api.get(`/events?status=${filter === 'all' ? '' : (filter === 'past' ? 'completed' : filter)}&category=${categoryFilter === 'all' ? '' : categoryFilter}`)
      ]);
      setHeaderSlides(headersRes.data);
      setEvents(eventsRes.data.events || []);
    } catch (err) {
      console.error('Failed to refresh events', err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilterLabel = (f) => {
    if (locale === 'hi') {
      if (f === 'all') return 'सभी';
      if (f === 'upcoming') return 'आगामी';
      if (f === 'past') return 'पिछला';
    }
    return f.charAt(0).toUpperCase() + f.slice(1);
  };

  const getCategoryLabel = (cat) => {
    if (locale === 'hi') {
      if (cat === 'all') return 'सभी श्रेणियां';
      if (cat === 'Health Blog') return 'स्वास्थ्य ब्लॉग';
      if (cat === 'Medical Camp') return 'चिकित्सा शिविर';
      if (cat === 'Social Event') return 'सामाजिक कार्यक्रम';
      if (cat === 'Success Story') return 'सफलता की कहानी';
    }
    return cat === 'all' ? 'All Categories' : cat;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#00bfa5']}
            tintColor="#00bfa5"
          />
        }
      >
        
        {/* Header Slider */}
        <View style={styles.headerSlider}>
          {headerLoading ? (
            <ActivityIndicator size="large" color="#00bfa5" style={{ marginTop: 50 }} />
          ) : (
            <View>
              <ScrollView 
                ref={sliderRef}
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const offset = e.nativeEvent.contentOffset.x;
                  setCurrentSlide(Math.round(offset / width));
                }}
                scrollEventThrottle={16}
              >
                {headerSlides.map((slide, index) => (
                  <View key={`event-head-${slide._id || ''}-${index}`} style={{ width }}>
                    <Image source={{ uri: slide.url }} style={styles.headerImage} resizeMode="cover" />
                    <View style={styles.headerOverlay} />
                    <View style={styles.headerContent}>
                      <Text style={styles.headerTitle}>
                        {locale === 'hi' && slide.title_hi ? slide.title_hi : slide.title}
                      </Text>
                      <Text style={styles.headerSubtitle}>
                        {locale === 'hi' && slide.subtitle_hi ? slide.subtitle_hi : slide.subtitle}
                      </Text>
                      {slide.ctaLink && (
                        <TouchableOpacity 
                          style={styles.headerCta} 
                          onPress={() => Linking.openURL(`https://thedharmarth.com${slide.ctaLink}`)}
                        >
                          <Text style={styles.headerCtaText}>
                            {locale === 'hi' && slide.ctaText_hi ? slide.ctaText_hi : (slide.ctaText || 'Learn More')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.pagination}>
                {headerSlides.map((_, i) => (
                  <View key={`dot-${i}`} style={[styles.dot, currentSlide === i && styles.activeDot]} />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <View style={styles.tabsContainer}>
            {['all', 'upcoming', 'past'].map(f => (
              <TouchableOpacity 
                key={f} 
                style={[styles.tab, filter === f && styles.activeTab]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.tabText, filter === f && styles.activeTabText]}>
                  {getFilterLabel(f)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput}
              placeholder={locale === 'hi' ? 'आयोजन खोजें...' : 'Search events...'}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {['all', 'Health Blog', 'Medical Camp', 'Social Event', 'Success Story'].map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.catPill, categoryFilter === cat && styles.activeCatPill]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.catPillText, categoryFilter === cat && styles.activeCatPillText]}>
                  {getCategoryLabel(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Events Grid */}
        <View style={styles.eventsGrid}>
          {loading ? (
            <ActivityIndicator size="large" color="#00bfa5" style={{ padding: 40 }} />
          ) : filteredEvents.length === 0 ? (
            <Text style={styles.noEvents}>
              {locale === 'hi' ? 'आपकी खोज के अनुकूल कोई कार्यक्रम नहीं मिले।' : 'No events found matching your criteria.'}
            </Text>
          ) : (
            filteredEvents.map((event, index) => (
              <TouchableOpacity 
                key={`evt-card-${event._id || ''}-${index}`} 
                style={styles.eventCard}
                onPress={() => router.push(`/event/${event.slug}`)}
              >
                <Image source={{ uri: event.coverImage }} style={styles.eventCardImage} />
                <View style={styles.cardBadges}>
                  {(() => {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    const eventStatus = event.status || (event.date && eventDate < now ? 'completed' : 'upcoming');
                    const displayStatus = eventStatus === 'completed' ? 'past' : eventStatus;
                    return (
                      <Text style={[styles.statusBadge, styles[displayStatus]]}>
                        {displayStatus.toUpperCase()}
                      </Text>
                    );
                  })()}
                  {event.category && (
                    <Text style={styles.categoryBadge}>{getCategoryLabel(event.category)}</Text>
                  )}
                </View>
                <View style={styles.eventCardContent}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      <Ionicons name="calendar-outline" size={12} /> {new Date(event.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText} numberOfLines={1}>
                      <Ionicons name="location-outline" size={12} /> {event.location || 'Online'}
                    </Text>
                  </View>
                  <Text style={styles.eventTitle}>
                    {locale === 'hi' && event.title_hi ? event.title_hi : event.title}
                  </Text>
                  <Text style={styles.eventDesc} numberOfLines={2}>
                    {locale === 'hi' && event.shortDescription_hi ? event.shortDescription_hi : event.shortDescription}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Engagement Section */}
        <View style={styles.engagementSection}>
          <Text style={styles.engagementTitle}>
            {locale === 'hi' ? 'वह बदलाव बनें जो आप देखना चाहते हैं' : 'Be The Change You Want To See'}
          </Text>
          
          <View style={styles.ctaCard}>
            <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="heart" size={32} color="#ef4444" />
            </View>
            <Text style={styles.ctaTitle}>
              {locale === 'hi' ? 'स्वयंसेवक बनें' : 'Become a Volunteer'}
            </Text>
            <Text style={styles.ctaDesc}>
              {locale === 'hi' ? 'हमारी जमीनी टीम से जुड़ें और सीधे देने की खुशी का अनुभव करें।' : 'Join our on-ground team and experience the joy of giving firsthand.'}
            </Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/donate')}>
              <Text style={styles.ctaBtnText}>
                {locale === 'hi' ? 'अभी जुड़ें' : 'Join Now'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.ctaCard}>
            <View style={[styles.iconBox, { backgroundColor: '#f0fdfa' }]}>
              <Ionicons name="people" size={32} color="#00bfa5" />
            </View>
            <Text style={styles.ctaTitle}>
              {locale === 'hi' ? 'हमारे साथ भागीदार बनें' : 'Partner With Us'}
            </Text>
            <Text style={styles.ctaDesc}>
              {locale === 'hi' ? 'हमारे साथ सहयोग करके अपना प्रभाव बढ़ाएं और अधिक लोगों तक पहुंचें।' : 'Collaborate with us to amplify our impact and reach more lives.'}
            </Text>
            <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: '#1e293b' }]} onPress={() => router.push('/contact')}>
              <Text style={styles.ctaBtnText}>
                {locale === 'hi' ? 'संपर्क करें' : 'Contact Us'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  headerSlider: { height: 350, backgroundColor: '#f8fafc' },
  headerImage: { width: width, height: 350 },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  headerContent: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: 'white', lineHeight: 40 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 8, marginBottom: 20 },
  headerCta: { backgroundColor: '#00bfa5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, alignSelf: 'flex-start' },
  headerCtaText: { color: 'white', fontWeight: '800' },
  pagination: { position: 'absolute', bottom: 15, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#00bfa5', width: 20 },

  filterSection: { padding: 20, backgroundColor: 'white' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#1e293b' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1e293b' },
  categoryScroll: { flexDirection: 'row', gap: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, backgroundColor: 'white' },
  activeCatPill: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  catPillText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeCatPillText: { color: 'white' },

  eventsGrid: { padding: 20 },
  eventCard: { backgroundColor: 'white', borderRadius: 20, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, overflow: 'hidden' },
  eventCardImage: { width: '100%', height: 200 },
  cardBadges: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 10, fontWeight: '900', color: 'white' },
  upcoming: { backgroundColor: '#2563eb' },
  ongoing: { backgroundColor: '#10b981' },
  past: { backgroundColor: '#64748b' },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 10, fontWeight: '800', color: '#1e293b' },
  eventCardContent: { padding: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metaText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  metaDot: { marginHorizontal: 8, color: '#cbd5e1' },
  eventTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  eventDesc: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  noEvents: { textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 16 },

  engagementSection: { padding: 20, backgroundColor: '#f8fafc' },
  engagementTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginBottom: 32 },
  ctaCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  iconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  ctaDesc: { fontSize: 14, color: '#64748b', lineHeight: 22, marginBottom: 20 },
  ctaBtn: { backgroundColor: '#00bfa5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  ctaBtnText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
