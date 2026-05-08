import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Linking,
  Share,
  Clipboard,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState({ l1Donors: 0, l2Donors: 0 });
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, txnRes] = await Promise.all([
        api.get('/wallet/summary'),
        api.get('/wallet/transactions?limit=10')
      ]);
      setWallet(walletRes.data.wallet);
      setStats(walletRes.data.stats);
      setTransactions(txnRes.data.transactions || []);
    } catch (error) {
      console.error("Dashboard data fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = `https://the-dharm-arth-foundation-software.vercel.app/donate?ref=${user.referralCode || user.mobile}`;
    Clipboard.setString(link);
    Alert.alert("Link Copied!", "Donation link copied to clipboard.");
  };

  const handleShare = async () => {
    const donationLink = `https://the-dharm-arth-foundation-software.vercel.app/donate?ref=${user.referralCode || user.mobile}`;
    const profileLink = `https://the-dharm-arth-foundation-software.vercel.app/v/${user.referralCode || user.mobile}`;
    const message = `Namaste! 🙏 Join me in making a difference with The DharmArth Foundation. 🕉️\n\n✨ Donate here: ${donationLink}\n📜 View my Volunteer Profile: ${profileLink}`;
    
    try {
      await Share.share({ message });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Motivator Dashboard',
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        )
      }} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Wallet Card - mirrored from web */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>My Wallet Balance</Text>
            <View style={styles.walletIconBg}>
              <Ionicons name="wallet" size={24} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
          <Text style={styles.walletBalance}>₹ {wallet?.balance?.toLocaleString() || 0}</Text>
          
          <View style={styles.walletStats}>
            <View style={styles.statRow}>
              <Ionicons name="trending-up" size={16} color="white" />
              <Text style={styles.statText}>Total Earned: ₹ {wallet?.totalEarned?.toLocaleString() || 0}</Text>
            </View>
            <View style={styles.statGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.l1Donors || 0}</Text>
                <Text style={styles.statLabel}>L1 Donors</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.l2Donors || 0}</Text>
                <Text style={styles.statLabel}>L2 Donors</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.withdrawBtn} onPress={() => Alert.alert("Payout", "Please use web version for bank withdrawals for now.")}>
            <Text style={styles.withdrawBtnText}>Withdraw Now</Text>
          </TouchableOpacity>
        </View>

        {/* Share Card - mirrored from web */}
        <View style={styles.shareCard}>
          <View style={styles.shareHeader}>
            <Ionicons name="share-social" size={24} color="#667eea" />
            <Text style={styles.shareTitle}>Share & Earn</Text>
          </View>
          <Text style={styles.shareDesc}>
            Share this personalized link with your network. When someone donates using your link, you receive a <Text style={{fontWeight:'700'}}>10% commission</Text> instantly!
          </Text>
          
          <View style={styles.refCodeBox}>
            <Text style={styles.refLabel}>Referral Code: </Text>
            <Text style={styles.refValue}>{user.referralCode || user.mobile}</Text>
          </View>

          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>
              {`https://the-dharm-arth-foundation...`}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
              <Ionicons name="copy-outline" size={16} color="white" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, {backgroundColor: '#25D366'}]} onPress={handleShare}>
              <Ionicons name="logo-whatsapp" size={20} color="white" />
              <Text style={styles.socialBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, {backgroundColor: '#1877F2'}]} onPress={handleShare}>
              <Ionicons name="logo-facebook" size={20} color="white" />
              <Text style={styles.socialBtnText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileActions}>
            <Text style={styles.actionHeading}>Volunteer Identity Card</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL('https://the-dharm-arth-foundation-software.vercel.app/profile')}>
                <Ionicons name="person-outline" size={16} color="#475569" />
                <Text style={styles.actionBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#00bfa5'}]} onPress={handleShare}>
                <Ionicons name="share-outline" size={16} color="white" />
                <Text style={[styles.actionBtnText, {color: 'white'}]}>Share Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Transaction List */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.map(txn => (
            <View key={txn._id} style={styles.txnItem}>
              <View style={styles.txnIcon}>
                <Ionicons 
                  name={txn.type === 'credit' ? "arrow-down-circle" : "arrow-up-circle"} 
                  size={24} 
                  color={txn.type === 'credit' ? "#10b981" : "#ef4444"} 
                />
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnDesc} numberOfLines={1}>{txn.description}</Text>
                <Text style={styles.txnDate}>{new Date(txn.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.txnAmount, {color: txn.type === 'credit' ? "#10b981" : "#ef4444"}]}>
                {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  
  // Wallet Card
  walletCard: { 
    backgroundColor: '#00bfa5', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700' },
  walletIconBg: { opacity: 0.5 },
  walletBalance: { color: 'white', fontSize: 36, fontWeight: '900', marginVertical: 12 },
  walletStats: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statText: { color: 'white', fontSize: 14, fontWeight: '600' },
  statGrid: { flexDirection: 'row', gap: 20 },
  statItem: { flex: 1 },
  statValue: { color: 'white', fontSize: 20, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  withdrawBtn: { backgroundColor: 'white', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  withdrawBtnText: { color: '#00bfa5', fontWeight: '800', fontSize: 16 },

  // Share Card
  shareCard: { 
    backgroundColor: 'white', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  shareHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  shareTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  shareDesc: { fontSize: 14, color: '#64748b', lineHeight: 22, marginBottom: 20 },
  refCodeBox: { flexDirection: 'row', marginBottom: 16 },
  refLabel: { fontSize: 14, color: '#64748b' },
  refValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  linkBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    padding: 12, 
    gap: 12,
    marginBottom: 20 
  },
  linkText: { flex: 1, fontSize: 12, color: '#94a3b8' },
  copyBtn: { backgroundColor: '#667eea', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  copyBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  socialBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
  profileActions: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 },
  actionHeading: { fontSize: 14, fontWeight: '800', color: '#475569', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },

  // Transactions
  transactionsSection: { paddingVertical: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  viewAll: { color: '#00bfa5', fontWeight: '700' },
  txnItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 12 },
  txnIcon: { marginRight: 16 },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  txnDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '800' }
});
