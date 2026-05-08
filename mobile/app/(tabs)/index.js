import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator,
  Share,
  Alert
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import api, { API_BASE_URL } from '../../src/services/api';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'react-native';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/default_guest_avatar.jpg';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState({ l1Donors: 0, l2Donors: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/wallet/summary');
      setWallet(data.wallet);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const donationLink = user?.referralCode
    ? `https://the-dharm-arth-foundation-software.vercel.app/donate?ref=${user.referralCode}`
    : `https://the-dharm-arth-foundation-software.vercel.app/donate?ref=${user?.mobile}`;

  const profileLink = user?.referralCode
    ? `https://the-dharm-arth-foundation-software.vercel.app/v/${user.referralCode}`
    : `https://the-dharm-arth-foundation-software.vercel.app/v/${user?.mobile}`;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(donationLink);
    Alert.alert('Copied', 'Donation link copied to clipboard!');
  };

  const onShare = async () => {
    try {
      const message = `Namaste! 🙏 Join me in making a difference with The DharmArth Foundation. 🕉️\n\nYour small contribution can bring big changes to someone's life. 🤝\n\n✨ Donate here: ${donationLink}\n📜 View my Volunteer Profile: ${profileLink}\n\nThank you for your support! ❤️`;
      await Share.share({
        message: message,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00bfa5']} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Namaste, {user?.name}!</Text>
            <Text style={styles.subtitle}>Here is your impact summary</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileIconBtn}
            onPress={() => router.push('/profile')}
          >
            <Image 
              source={{ uri: user?.profileImage || DEFAULT_AVATAR }} 
              style={styles.headerAvatar} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletLabel}>Available Balance</Text>
          <Ionicons name="wallet-outline" size={24} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.balanceText}>₹ {wallet?.balance?.toLocaleString() || 0}</Text>
        
        <View style={styles.walletStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹ {wallet?.totalEarned?.toLocaleString() || 0}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.l1Donors + stats.l2Donors}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.walletActionButton}
            onPress={() => router.push('/volunteer-card')}
          >
            <Ionicons name="card-outline" size={18} color="#00695c" />
            <Text style={styles.walletActionText}>ID Card</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.walletActionButton}
            onPress={() => router.push('/withdraw')}
          >
            <Ionicons name="cash-outline" size={18} color="#00695c" />
            <Text style={styles.walletActionText}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.walletActionButton}
            onPress={() => router.push('/bank-details')}
          >
            <Ionicons name="business-outline" size={18} color="#00695c" />
            <Text style={styles.walletActionText}>Bank</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={styles.statBox}
          onPress={() => router.push('/donors')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#e0f2f1' }]}>
            <Ionicons name="people" size={20} color="#00bfa5" />
          </View>
          <Text style={styles.boxValue}>{stats.l1Donors || 0}</Text>
          <Text style={styles.boxLabel}>Direct Donors</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statBox}
          onPress={() => router.push('/donors')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#fff3e0' }]}>
            <Ionicons name="git-network" size={20} color="#ff9800" />
          </View>
          <Text style={styles.boxValue}>{stats.l2Donors || 0}</Text>
          <Text style={styles.boxLabel}>Indirect Donors</Text>
        </TouchableOpacity>
      </View>

      {/* Referral Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="share-social" size={20} color="#667eea" />
          <Text style={styles.cardTitle}>Share & Earn</Text>
        </View>
        <Text style={styles.cardDesc}>
          Earn 10% commission instantly when someone donates using your link.
        </Text>
        
        <View style={styles.linkContainer}>
          <Text style={styles.linkText} numberOfLines={1}>{donationLink}</Text>
          <TouchableOpacity onPress={copyToClipboard} style={styles.copyIcon}>
            <Ionicons name="copy-outline" size={20} color="#00bfa5" />
          </TouchableOpacity>
        </View>

        <View style={styles.shareButtons}>
          <TouchableOpacity style={[styles.shareButton, { backgroundColor: '#25D366' }]} onPress={onShare}>
            <Ionicons name="logo-whatsapp" size={20} color="white" />
            <Text style={styles.shareButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareButton, { backgroundColor: '#00bfa5' }]} onPress={onShare}>
            <Ionicons name="share-outline" size={20} color="white" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.historyLink}
        onPress={() => router.push('/transactions')}
      >
        <Text style={styles.historyLinkText}>View Full Transaction History</Text>
        <Ionicons name="receipt-outline" size={16} color="#64748b" />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

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
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileIconBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  walletCard: {
    margin: 24,
    marginTop: 0,
    backgroundColor: '#00bfa5',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 24,
  },
  walletStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  walletActionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  walletActionText: {
    color: '#00695c',
    fontWeight: '800',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  boxValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  boxLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyIcon: {
    padding: 4,
    marginLeft: 8,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 12,
  },
  historyLinkText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
