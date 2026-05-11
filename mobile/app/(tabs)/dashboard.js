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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Wallet Card - mirrored from web */}
        <View style={styles.walletCard}>
          <View style={styles.walletPattern}>
            <Ionicons name="wallet" size={140} color="rgba(255,255,255,0.2)" />
          </View>

          <Text style={styles.walletLabel}>My Wallet Balance</Text>
          <Text style={styles.walletBalance}>₹ {wallet?.balance?.toLocaleString() || 0}</Text>

          <View style={styles.walletStats}>
            <Ionicons name="trending-up" size={16} color="white" />
            <Text style={styles.statText}>Total Earned: ₹ {wallet?.totalEarned?.toLocaleString() || 0}</Text>
          </View>

          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.l1Donors || 0}</Text>
              <Text style={styles.statLabel}>L1 Donors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.l2Donors || 0}</Text>
              <Text style={styles.statLabel}>L2 Donors</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.withdrawBtn} onPress={() => Linking.openURL('https://the-dharm-arth-foundation-software.vercel.app/dashboard')}>
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
            Share this personalized link with your network. When someone donates using your link, you receive a <Text style={{ color: '#00bfa5' }}>10% commission</Text> instantly in your wallet!
          </Text>

          <View style={styles.refCodeLabel}>
            <Text style={styles.refText}>
              Referral Code: <Text style={styles.refHighlight}>{user.referralCode || user.mobile}</Text>
            </Text>
          </View>

          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>
              {`https://the-dharm-arth-foundation-software.vercel.app/donate?ref=${user.referralCode || user.mobile}`}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#25D366' }]} onPress={handleShare}>
              <Ionicons name="logo-whatsapp" size={24} color="white" />
              <Text style={styles.socialBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} onPress={handleShare}>
              <Ionicons name="logo-facebook" size={24} color="white" />
              <Text style={styles.socialBtnText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#dc2743' }]} onPress={handleShare}>
              <Ionicons name="logo-instagram" size={24} color="white" />
              <Text style={styles.socialBtnText}>Instagram</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileActions}>
            <Text style={styles.actionHeading}>Volunteer Identity Card</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/profile')}>
                <Ionicons name="person-outline" size={16} color="#475569" />
                <Text style={styles.actionBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00bfa5' }]} onPress={handleShare}>
                <Ionicons name="share-outline" size={16} color="white" />
                <Text style={[styles.actionBtnText, { color: 'white' }]}>Share Profile</Text>
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

          {transactions.map(txn => {
            const isCredit = txn.type === 'credit';
            const statusColor = txn.status === 'failed' ? '#0f0f0fff' : '#64748b';

            let statusText = '';
            if (txn.reason === 'payout' && txn.status === 'pending') statusText = 'IN PROCESS';
            else if (txn.status === 'failed') statusText = 'FAILED';
            else if (txn.isHelpResolved) statusText = 'HELP RESOLVED';
            else if (txn.type === 'credit') statusText = 'Commission';
            else if (txn.isDonation || txn.reason === 'wallet_donation') statusText = 'Donation';
            else if (txn.reason === 'payout') statusText = txn.status === 'success' || txn.status === 'completed' ? 'COMPLETED' : 'FAILED';
            else statusText = (txn.type || '').toUpperCase();

            return (
              <View key={txn._id} style={styles.txnItemContainer}>
                <View style={styles.txnItem}>
                  <View style={styles.txnIcon}>
                    <Ionicons
                      name={isCredit ? "arrow-down-circle" : "arrow-up-circle"}
                      size={24}
                      color={isCredit ? "#10b981" : "#0c0c0cff"}
                    />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnDesc} numberOfLines={1}>{txn.description}</Text>
                    <Text style={styles.txnDate}>{new Date(txn.createdAt).toLocaleDateString()}</Text>
                    <Text style={[styles.txnStatusBadge, { color: statusColor }]}>{statusText}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txnAmount, { color: isCredit ? "#10b981" : "#0e0d0dff" }]}>
                      {isCredit ? '+' : ''}₹{txn.amount}
                    </Text>
                  </View>
                </View>

                {/* Receipt and 80G Actions */}
                {(txn.isDonation || txn.is80G || txn.is80GUploaded) && (
                  <View style={styles.txnActions}>
                    {/* Receipt */}
                    {txn.isDonation && (txn.receiptUrl || txn.certificateUrl) && (
                      <TouchableOpacity
                        style={styles.actionPill}
                        onPress={() => Linking.openURL(`${api.defaults.baseURL.replace('/api', '')}${txn.receiptUrl || txn.certificateUrl}`)}
                      >
                        <Ionicons name="download-outline" size={12} color="#00bfa5" />
                        <Text style={styles.actionPillText}>Receipt</Text>
                      </TouchableOpacity>
                    )}

                    {/* 80G */}
                    {txn.isDonation && (
                      txn.is80GUploaded && txn.certificate80GUrl ? (
                        <TouchableOpacity
                          style={[styles.actionPill, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}
                          onPress={() => Linking.openURL(`${api.defaults.baseURL.replace('/api', '')}${txn.certificate80GUrl}`)}
                        >
                          <Ionicons name="document-text-outline" size={12} color="#16a34a" />
                          <Text style={[styles.actionPillText, { color: '#16a34a' }]}>80G</Text>
                        </TouchableOpacity>
                      ) : txn.is80G ? (
                        <View style={[styles.actionPill, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
                          <Text style={[styles.actionPillText, { color: '#c2410c' }]}>80G Pending</Text>
                        </View>
                      ) : null
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },

  // Wallet Card
  walletCard: {
    backgroundGradient: 'linear-gradient(135deg, #00bfa5 0%, #00695c 100%)', // Handled by background color for now
    backgroundColor: '#00bfa5',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  walletPattern: { position: 'absolute', top: -20, right: -20, opacity: 0.2 },
  walletLabel: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  walletBalance: {
    color: 'white',
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  walletStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    marginBottom: 24,
    gap: 8
  },
  statText: { color: 'white', fontSize: 13, fontWeight: '600' },
  statGrid: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  statItem: { flex: 1 },
  statValue: { color: 'white', fontSize: 24, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  withdrawBtn: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  withdrawBtnText: { color: '#00695c', fontWeight: '800', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Share Card
  shareCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    position: 'relative',
  },
  shareHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  shareTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  shareDesc: { fontSize: 15, color: '#0f172a', lineHeight: 24, fontWeight: '600', marginBottom: 20 },
  refCodeLabel: {
    backgroundColor: 'rgba(0, 191, 165, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 165, 0.3)',
    borderStyle: 'dashed',
    marginBottom: 20,
    alignSelf: 'flex-start'
  },
  refText: { fontSize: 14, color: '#4a5568' },
  refHighlight: { color: '#00bfa5', fontWeight: '800' },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 30,
    padding: 6,
    gap: 12,
    marginBottom: 20
  },
  linkText: { flex: 1, fontSize: 13, color: '#1e293b', fontWeight: '600', paddingLeft: 16 },
  copyBtn: { backgroundColor: '#00bfa5', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25 },
  copyBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },

  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  socialBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
  },
  socialBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },

  profileActions: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 },
  actionHeading: { fontSize: 14, fontWeight: '800', color: '#475569', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },

  // Transactions
  transactionsSection: { paddingVertical: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  viewAll: { color: '#00bfa5', fontWeight: '700', fontSize: 14 },
  txnItemContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  txnItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  txnIcon: { marginRight: 16 },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  txnDate: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  txnStatusBadge: { fontSize: 10, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
  txnAmount: { fontSize: 16, fontWeight: '800' },
  txnActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc'
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1'
  },
  actionPillText: { fontSize: 11, fontWeight: '700', color: '#00bfa5' }
});
