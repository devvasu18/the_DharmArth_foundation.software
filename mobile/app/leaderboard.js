import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../src/context/LanguageContext';
import api, { API_BASE_URL } from '../src/services/api';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [period, setPeriod] = useState('month'); // today, week, month, all-time
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/donate/leaderboard?period=${period}`);
      setDonors(data || []);
    } catch (error) {
      console.error("Failed to fetch leaderboard in mobile app", error);
      Alert.alert(
        locale === 'hi' ? 'त्रुटि' : 'Error',
        locale === 'hi' ? 'लीडरबोर्ड लोड करने में विफल रहा' : 'Failed to fetch leaderboard data'
      );
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    const initials = parts.map(p => p[0]).join('').toUpperCase();
    return initials.substring(0, 2) || '??';
  };

  // Split top 3 and remaining list
  const topThree = donors.slice(0, 3);
  const others = donors.slice(3);

  // Position podium in display order: [Rank 2, Rank 1, Rank 3]
  const podiumData = [];
  if (topThree[1]) podiumData.push({ ...topThree[1], rank: 2 });
  if (topThree[0]) podiumData.push({ ...topThree[0], rank: 1 });
  if (topThree[2]) podiumData.push({ ...topThree[2], rank: 3 });

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* Configure Stack Screen Header (Hidden, we use custom header below) */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('leaderboard.title')}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Period Selection Tabs */}
      <View style={styles.tabContainer}>
        {['today', 'week', 'month', 'all-time'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.tabButton, period === p ? styles.tabActiveButton : null]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.tabText, period === p ? styles.tabActiveText : null]}>
              {t(`leaderboard.tabs.${p}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00bfa5" />
          <Text style={styles.loadingText}>{t('leaderboard.fetching')}</Text>
        </View>
      ) : donors.length > 0 ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top 3 Podium layout */}
          <View style={styles.podiumContainer}>
            {podiumData.map((donor) => {
              const isFirst = donor.rank === 1;
              return (
                <View
                  key={donor.mobile}
                  style={[styles.podiumItem, isFirst ? styles.podiumFirst : null]}
                >
                  <View style={styles.avatarWrapper}>
                    {isFirst && (
                      <Image
                        source={require('../assets/crown.png')}
                        style={styles.crownImg}
                        resizeMode="contain"
                      />
                    )}
                    <View style={[styles.avatarCircle, isFirst ? styles.avatarCircleFirst : null]}>
                      <Text style={[styles.avatarInitials, isFirst ? styles.avatarInitialsFirst : null]}>
                        {getInitials(donor.name)}
                      </Text>
                    </View>
                    <View style={[styles.rankBadge, isFirst ? styles.rankBadgeFirst : null]}>
                      <Text style={[styles.rankBadgeText, isFirst ? styles.rankBadgeTextFirst : null]}>
                        {donor.rank}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.playerName, isFirst ? styles.playerNameFirst : null]} numberOfLines={1}>
                    {donor.name}
                  </Text>
                  <Text style={[styles.playerScore, isFirst ? styles.playerScoreFirst : null]}>
                    ₹{donor.totalAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Remaining players list */}
          {others.length > 0 && (
            <View style={styles.listContainer}>
              {others.map((donor, idx) => (
                <View key={donor.mobile} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <Text style={styles.listItemRank}>{idx + 4}</Text>
                    <View style={styles.rankDash} />
                    <View style={styles.listItemAvatar}>
                      <Text style={styles.listItemAvatarText}>
                        {getInitials(donor.name)}
                      </Text>
                    </View>
                    <Text style={styles.listItemName} numberOfLines={1}>
                      {donor.name}
                    </Text>
                  </View>
                  <Text style={styles.listItemScore}>
                    ₹{donor.totalAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>{t('leaderboard.noDonations')}</Text>
          <TouchableOpacity
            style={styles.beFirstBtn}
            onPress={() => router.push('/donate')}
          >
            <Text style={styles.beFirstBtnText}>{t('leaderboard.beFirst')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerRightPlaceholder: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  tabActiveButton: {
    backgroundColor: 'rgba(0, 191, 165, 0.1)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabActiveText: {
    color: '#00bfa5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    marginTop: 20,
    marginBottom: 35,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  podiumItem: {
    alignItems: 'center',
    width: (width - 64) / 3,
  },
  podiumFirst: {
    width: (width - 48) / 3 + 10,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  crownImg: {
    position: 'absolute',
    top: -30,
    width: 50,
    height: 38,
    zIndex: 10,
  },
  avatarCircle: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#00bfa5',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarCircleFirst: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    borderColor: '#d4af37',
    ...Platform.select({
      ios: {
        shadowColor: '#bf953f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  avatarInitialsFirst: {
    fontSize: 22,
    color: '#0f172a',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#00bfa5',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeFirst: {
    backgroundColor: '#d4af37',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
  },
  rankBadgeTextFirst: {
    fontSize: 12,
    color: '#000000',
  },
  playerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'lowercase',
  },
  playerNameFirst: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  playerScore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00bfa5',
    marginTop: 2,
  },
  playerScoreFirst: {
    fontSize: 16,
    fontWeight: '900',
    color: '#b38728',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemRank: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    width: 20,
    textAlign: 'center',
  },
  rankDash: {
    width: 6,
    height: 1.5,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 6,
  },
  listItemAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  listItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  listItemScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00bfa5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 64,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  beFirstBtn: {
    backgroundColor: '#00bfa5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  beFirstBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
