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

export default function DonorsScreen() {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active'); // active, inactive
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchDonors = async (pageNum = 1, shouldRefresh = false) => {
    try {
      const { data } = await api.get('/subscriptions/motivator/referrals', {
        params: { status: statusFilter, page: pageNum, limit: 15 }
      });
      
      const newDonors = data.subscriptions || data;
      const pagination = data.pagination;

      if (shouldRefresh) {
        setDonors(newDonors);
      } else {
        setDonors(prev => [...prev, ...newDonors]);
      }
      
      setHasMore(pagination ? pageNum < pagination.totalPages : newDonors.length === 15);
      setPage(pageNum);
      setTotal(pagination ? pagination.totalRecords : newDonors.length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDonors(1, true);
  }, [statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDonors(1, true);
  }, [statusFilter]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchDonors(page + 1);
    }
  };

  const handleReinvite = (donor) => {
    const donorName = donor.donorName;
    const motivatorName = user?.name || 'Your Motivator';
    const mobile = donor.donorMobile;
    const amount = donor.amount;
    const is80G = donor.donorUserId?.pan ? 'true' : 'false';
    
    // Construct the re-donation link
    const donationUrl = `https://the-dharm-arth-foundation-software.vercel.app/donate?motivator=${user?.mobile}&name=${encodeURIComponent(donorName)}&mobile=${mobile}&amount=${amount}&is80G=${is80G}`;

    const message = `Namaste ${donorName}, this is ${motivatorName} from The DharmArth Foundation. 🕉️\n\nYour monthly contribution of ₹${amount} has stopped. We invite you to continue your noble support for our mission. 🙏\n\nYou can restart your donation with just one click here: ${donationUrl}\n\nThank you for your kindness!`;

    const whatsappUrl = `whatsapp://send?phone=91${mobile}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on this device.");
      }
    });
  };

  const renderItem = ({ item }) => {
    const isL1 = item.level1UserId === user?._id;
    
    return (
      <View style={styles.donorCard}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.donorName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.donorMainInfo}>
            <View style={styles.nameRow}>
              <View style={[styles.levelBadge, isL1 ? styles.l1Badge : styles.l2Badge]}>
                <Text style={styles.levelText}>{isL1 ? 'L1' : 'L2'}</Text>
              </View>
              <Text style={styles.donorName}>{item.donorName}</Text>
            </View>
            <Text style={styles.donorMobile}>{item.donorMobile}</Text>
          </View>
          <View style={[styles.statusPill, item.status === 'active' ? styles.statusActive : styles.statusInactive]}>
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
              {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>

        {item.status !== 'active' && (
          <TouchableOpacity 
            style={styles.reinviteButton}
            onPress={() => handleReinvite(item)}
          >
            <Ionicons name="logo-whatsapp" size={18} color="white" />
            <Text style={styles.reinviteText}>Send Re-invite</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Donors', headerTitleAlign: 'center' }} />
      
      {/* Segment Control */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={[styles.filterBtn, statusFilter === 'active' && styles.filterBtnActive]}
          onPress={() => setStatusFilter('active')}
        >
          <Text style={[styles.filterBtnText, statusFilter === 'active' && styles.filterBtnTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, statusFilter === 'inactive' && styles.filterBtnActive]}
          onPress={() => setStatusFilter('inactive')}
        >
          <Text style={[styles.filterBtnText, statusFilter === 'inactive' && styles.filterBtnTextActive]}>Inactive</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsSummary}>
        <Text style={styles.totalText}>{total} {statusFilter} donors found</Text>
      </View>
      
      <FlatList
        data={donors}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00bfa5']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No {statusFilter} donors found</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? <ActivityIndicator style={{ padding: 20 }} color="#00bfa5" /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  filterBtnActive: {
    backgroundColor: '#00bfa5',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  filterBtnTextActive: {
    color: 'white',
  },
  statsSummary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  totalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  donorCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e6fffa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00bfa5',
  },
  donorMainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  l1Badge: {
    backgroundColor: '#00bfa5',
  },
  l2Badge: {
    backgroundColor: '#10b981',
  },
  levelText: {
    fontSize: 9,
    fontWeight: '900',
    color: 'white',
  },
  donorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  donorMobile: {
    fontSize: 12,
    color: '#64748b',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#ecfdf5',
  },
  statusInactive: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextInactive: {
    color: '#ef4444',
  },
  cardDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 20,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  detailValuePrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00bfa5',
  },
  reinviteButton: {
    backgroundColor: '#25d366',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  reinviteText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 16,
  },
});
