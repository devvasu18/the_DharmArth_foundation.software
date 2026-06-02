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
  Alert,
  Modal,
  RefreshControl
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
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);


  // L1/L2 Donors state
  const [donorModalVisible, setDonorModalVisible] = useState(false);
  const [donorModalType, setDonorModalType] = useState('L1'); // 'L1' or 'L2'
  const [donorsList, setDonorsList] = useState([]);
  const [summaryStats, setSummaryStats] = useState({ lifetimeEarning: 0, prevMonthEarning: 0 });
  const [filterMonth, setFilterMonth] = useState(0); // 0 for Lifetime
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [modalLoading, setModalLoading] = useState(false);

  const getUniqueDonors = (list) => {
    const grouped = {};
    list.forEach(donor => {
      const key = donor.donorMobile;
      if (!key) return;
      if (!grouped[key]) {
        grouped[key] = {
          ...donor,
          totalEarning: donor.totalEarning || 0,
          lastDonation: donor.lastDonation || donor.createdAt
        };
      } else {
        grouped[key].totalEarning += (donor.totalEarning || 0);
        const currentDate = new Date(donor.lastDonation || donor.createdAt);
        const existingDate = new Date(grouped[key].lastDonation);
        if (currentDate > existingDate) {
          grouped[key].lastDonation = donor.lastDonation || donor.createdAt;
        }
      }
    });
    return Object.values(grouped);
  };

  const fetchDonorsList = async (type, month, year) => {
    setModalLoading(true);
    try {
      const endpoint = type === 'L1' ? '/wallet/l1-donors' : '/wallet/l2-donors';
      const res = await api.get(`${endpoint}?month=${month}&year=${year}`);

      // Deduplicate and aggregate list by donorMobile
      const uniqueList = getUniqueDonors(res.data.donors || []);

      setDonorsList(uniqueList);
      setSummaryStats(res.data.summary || { lifetimeEarning: 0, prevMonthEarning: 0 });
    } catch (err) {
      console.error(`Error fetching ${type} donors`, err);
      Alert.alert("Error", `Failed to load ${type} donors list.`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenDonors = (type) => {
    setDonorModalType(type);
    setFilterMonth(0); // default to Lifetime
    setFilterYear(new Date().getFullYear());
    setDonorModalVisible(true);
    fetchDonorsList(type, 0, new Date().getFullYear());
  };

  const handleMonthChange = (m) => {
    setFilterMonth(m);
    fetchDonorsList(donorModalType, m, filterYear);
  };

  const handleYearChange = (y) => {
    setFilterYear(y);
    fetchDonorsList(donorModalType, filterMonth, y);
  };

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
      const [walletRes, txnRes, settingsRes] = await Promise.all([
        api.get('/wallet/summary'),
        api.get('/wallet/transactions?limit=10'),
        api.get('/content/settings')
      ]);
      setWallet(walletRes.data.wallet);
      setStats(walletRes.data.stats);
      setTransactions(txnRes.data.transactions || []);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error("Dashboard data fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [walletRes, txnRes, settingsRes] = await Promise.all([
        api.get('/wallet/summary'),
        api.get('/wallet/transactions?limit=10'),
        api.get('/content/settings')
      ]);
      setWallet(walletRes.data.wallet);
      setStats(walletRes.data.stats);
      setTransactions(txnRes.data.transactions || []);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error("Dashboard refresh failed", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyLink = () => {
    const link = `https://thedharmarth.com/donate?ref=${user.referralCode || user.mobile}`;
    Clipboard.setString(link);
    Alert.alert("Link Copied!", "Donation link copied to clipboard.");
  };

  const handleShare = async () => {
    const donationLink = `https://thedharmarth.com/donate?ref=${user.referralCode || user.mobile}`;
    const profileLink = `https://thedharmarth.com/v/${user.referralCode || user.mobile}`;
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#00bfa5']}
            tintColor="#00bfa5"
          />
        }
      >

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
              <View style={styles.statHeaderRow}>
                <Text style={styles.statValue}>{stats.l1Donors || 0}</Text>
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => handleOpenDonors('L1')}
                >
                  <Ionicons name="eye-outline" size={16} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.statLabel}>Directly Inspired Donor</Text>
            </View>

            <View style={styles.statSeparator} />

            <View style={styles.statItem}>
              <View style={styles.statHeaderRow}>
                <Text style={styles.statValue}>{stats.l2Donors || 0}</Text>
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => handleOpenDonors('L2')}
                >
                  <Ionicons name="eye-outline" size={16} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.statLabel}>Partner-Inspired Donor</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewNetworkLink}
            onPress={() => router.push('/my-network')}
          >
            <Ionicons name="git-network" size={16} color="white" />
            <Text style={styles.viewNetworkLinkText}>View Network Tree</Text>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.withdrawBtn} onPress={() => router.push('/withdraw')}>
            <Text style={styles.withdrawBtnText}>Withdraw Now</Text>
          </TouchableOpacity>

          {wallet?.balance > 0 && (
            <TouchableOpacity
              style={styles.walletDonateBtn}
              onPress={() => router.push('/donate-wallet')}
            >
              <Ionicons name="heart" size={18} color="#00695c" style={{ marginRight: 8 }} />
              <Text style={styles.walletDonateBtnText}>
                {settings?.wallet_donate_btn_text || 'Donate From Wallet'}
              </Text>
            </TouchableOpacity>
          )}
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
              {`https://thedharmarth.com/donate?ref=${user.referralCode || user.mobile}`}
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

      {/* Donors Detail Modal */}
      <Modal
        visible={donorModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDonorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons
                  name={donorModalType === 'L1' ? "person" : "people"}
                  size={24}
                  color="white"
                />
                <Text style={styles.modalTitle}>
                  {donorModalType === 'L1' ? 'Directly Inspired Donors' : 'Indirectly Inspired Donors'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDonorModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Earnings Stats Cards */}
            <View style={styles.modalStatsSection}>
              <View style={[styles.modalStatCard, { borderLeftColor: '#00bfa5' }]}>
                <Text style={styles.modalStatLabel}>LIFETIME</Text>
                <Text style={styles.modalStatValue}>
                  ₹{(summaryStats?.lifetimeEarning || 0).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.modalStatCard, { borderLeftColor: '#f59e0b' }]}>
                <Text style={styles.modalStatLabel}>LAST MONTH</Text>
                <Text style={styles.modalStatValue}>
                  ₹{(summaryStats?.prevMonthEarning || 0).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Scrolling Horizontal Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Select Month</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {["Lifetime", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.filterTab, filterMonth === idx && styles.filterTabActive]}
                    onPress={() => handleMonthChange(idx)}
                  >
                    <Text style={[styles.filterTabText, filterMonth === idx && styles.filterTabTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filterMonth !== 0 && (
                <>
                  <Text style={styles.filterSectionTitle}>Select Year</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.horizontalScroll}
                    contentContainerStyle={styles.horizontalScrollContent}
                  >
                    {[2024, 2025, 2026].map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[styles.filterTab, filterYear === y && styles.filterTabActive]}
                        onPress={() => handleYearChange(y)}
                      >
                        <Text style={[styles.filterTabText, filterYear === y && styles.filterTabTextActive]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>

            {/* Donors List */}
            <View style={{ flex: 1 }}>
              {modalLoading ? (
                <View style={styles.modalCentered}>
                  <ActivityIndicator size="large" color="#00bfa5" />
                  <Text style={styles.modalLoadingText}>Loading donors list...</Text>
                </View>
              ) : donorsList.length === 0 ? (
                <View style={styles.modalCentered}>
                  <Ionicons name="person-outline" size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <Text style={styles.modalEmptyText}>No donors found for this period.</Text>
                </View>
              ) : (
                <ScrollView style={styles.donorsListScroll}>
                  {/* Custom Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderCol}>Donor Details</Text>
                    <Text style={[styles.tableHeaderCol, { textAlign: 'right' }]}>Your Earning</Text>
                  </View>

                  {donorsList.map((donor, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.donorName}>{donor.donorName}</Text>
                        <Text style={styles.donorMobile}>{donor.donorMobile}</Text>
                        <Text style={styles.donorDate}>
                          Last Donation: {new Date(donor.lastDonation || donor.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View style={{ justifyContent: 'center' }}>
                        <Text style={styles.donorEarning}>
                          ₹{(donor.totalEarning || 0).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeFooterBtn}
                onPress={() => setDonorModalVisible(false)}
              >
                <Text style={styles.closeFooterBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statGrid: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: 'white', fontSize: 24, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
  statSeparator: { width: 1, height: '70%', backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 8 },
  viewNetworkLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 20,
  },
  viewNetworkLinkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
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
  walletDonateBtn: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginTop: 12,
  },
  walletDonateBtnText: { color: '#00695c', fontWeight: '800', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

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
  actionPillText: { fontSize: 11, fontWeight: '700', color: '#00bfa5' },

  // Eye Button & Stats Custom Layout
  statHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 },
  eyeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00bfa5',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    flexShrink: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalStatsSection: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalStatCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  modalStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 4,
  },
  filterSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    marginBottom: 8,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
  },
  filterTabActive: {
    backgroundColor: '#00bfa5',
    borderColor: '#00bfa5',
  },
  filterTabText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  modalCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalLoadingText: {
    marginTop: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  modalEmptyText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  donorsListScroll: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCol: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  donorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  donorMobile: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  donorDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  donorEarning: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  closeFooterBtn: {
    backgroundColor: '#00bfa5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeFooterBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
    textTransform: 'uppercase',
  },
});
