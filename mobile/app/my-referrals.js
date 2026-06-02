import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function MyReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active'); // active, inactive
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchReferrals = async (pageNum = 1, shouldRefresh = false) => {
    try {
      const { data } = await api.get('/subscriptions/motivator/referrals', {
        params: { status: statusFilter, page: pageNum, limit: 15 }
      });
      
      const newRefs = data.subscriptions || data;
      const pagination = data.pagination;

      if (shouldRefresh) {
        setReferrals(newRefs);
      } else {
        setReferrals(prev => [...prev, ...newRefs]);
      }
      
      setHasMore(pagination ? pageNum < pagination.totalPages : newRefs.length === 15);
      setPage(pageNum);
      setTotal(pagination ? pagination.totalRecords : newRefs.length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchReferrals(1, true);
  }, [statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReferrals(1, true);
  }, [statusFilter]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchReferrals(page + 1);
    }
  };

  const handleReinvite = (ref) => {
    const donorName = ref.donorName;
    const motivatorName = user?.name || 'Your Motivator';
    const mobile = ref.donorMobile;
    const amount = ref.amount;
    const is80G = ref.donorUserId?.pan ? 'true' : 'false';
    
    const donationUrl = `https://thedharmarth.com/donate?motivator=${user?.mobile}&name=${encodeURIComponent(donorName)}&mobile=${mobile}&amount=${amount}&is80G=${is80G}`;

    const message = `Namaste ${donorName}, this is ${motivatorName} from The DharmArth Foundation. 🕉️\n\nYour monthly contribution of ₹${amount} has stopped. We invite you to continue your noble support for our mission. 🙏\n\nYou can restart your donation with just one click here: ${donationUrl}\n\nThank you for your kindness!`;

    const whatsappUrl = `whatsapp://send?phone=91${mobile}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert("Error", "WhatsApp is not installed.");
      }
    });
  };

  const renderItem = ({ item }) => {
    const isL1 = item.level1UserId === user?._id;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.donorInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.donorName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <View style={styles.nameRow}>
                <View style={[styles.levelBadge, isL1 ? styles.l1Badge : styles.l2Badge]}>
                  <Text style={styles.levelText}>{isL1 ? 'L1' : 'L2'}</Text>
                </View>
                <Text style={styles.name}>{item.donorName}</Text>
              </View>
              <Text style={styles.mobile}>{item.donorMobile}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, item.status === 'active' ? styles.statusTextActive : styles.statusTextInactive]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Monthly Contribution</Text>
            <Text style={styles.detailValuePrimary}>₹{item.amount}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Started On</Text>
            <Text style={styles.detailValue}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.status !== 'active' && (
          <TouchableOpacity style={styles.reinviteBtn} onPress={() => handleReinvite(item)}>
            <Ionicons name="logo-whatsapp" size={18} color="white" />
            <Text style={styles.reinviteText}>Send Re-invite on WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Referrals', headerTitleAlign: 'center' }} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconBox}>
            <Ionicons name="people" size={24} color="#00bfa5" />
          </View>
          <View>
            <Text style={styles.headerTitle}>My Referrals</Text>
            <Text style={styles.headerDesc}>Track donors motivated by you.</Text>
          </View>
        </View>

        <View style={styles.filterBar}>
          <TouchableOpacity 
            style={[styles.filterBtn, statusFilter === 'active' && styles.filterBtnActive]}
            onPress={() => setStatusFilter('active')}
          >
            <Text style={[styles.filterBtnText, statusFilter === 'active' && styles.filterBtnTextActive]}>Active Donors</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, statusFilter === 'inactive' && styles.filterBtnActive]}
            onPress={() => setStatusFilter('inactive')}
          >
            <Text style={[styles.filterBtnText, statusFilter === 'inactive' && styles.filterBtnTextActive]}>Inactive Donors</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00bfa5" />
        </View>
      ) : (
        <FlatList
          data={referrals}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00bfa5']} tintColor="#00bfa5" />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={64} color="#e2e8f0" />
                <Text style={styles.emptyText}>No {statusFilter} referrals found</Text>
              </View>
            )
          }
          ListFooterComponent={hasMore ? <ActivityIndicator style={{ padding: 20 }} color="#00bfa5" /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  headerIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  headerDesc: { fontSize: 13, color: '#64748b' },
  filterBar: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  filterBtnActive: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  filterBtnText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  filterBtnTextActive: { color: '#00bfa5' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  donorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#00bfa5' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  mobile: { fontSize: 12, color: '#64748b' },
  levelBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  l1Badge: { backgroundColor: '#00bfa5' },
  l2Badge: { backgroundColor: '#10b981' },
  levelText: { fontSize: 9, fontWeight: '900', color: 'white' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: '#ecfdf5' },
  statusInactive: { backgroundColor: '#fef2f2' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#dc2626' },
  cardDetails: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, gap: 20 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#334155' },
  detailValuePrimary: { fontSize: 14, fontWeight: '800', color: '#00bfa5' },
  reinviteBtn: { backgroundColor: '#25d366', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 },
  reinviteText: { color: 'white', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginTop: 16 }
});
