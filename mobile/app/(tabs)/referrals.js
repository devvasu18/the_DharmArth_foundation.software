import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Referrals() {
  const { user } = useAuth();
  const router = useRouter();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchReferrals = async () => {
    try {
      const { data } = await api.get('/subscriptions/motivator/referrals', {
        params: { status: statusFilter }
      });
      // Handle both paginated and non-paginated responses
      setReferrals(data.subscriptions || data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      setLoading(true);
      fetchReferrals();
    }
  }, [statusFilter, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReferrals();
  }, [statusFilter]);

  const handleReinvite = (referral) => {
    const donorName = referral.donorName;
    const motivatorName = user?.name || 'Your Motivator';
    const mobile = referral.donorMobile;
    const amount = referral.amount;
    
    // Construct the re-donation link (pointing to the app's donate page)
    const donationUrl = Linking.createURL('/donate', { 
      queryParams: { 
        motivator: user?.mobile, 
        name: donorName, 
        mobile: mobile, 
        amount: amount 
      } 
    });

    const message = `Namaste ${donorName}, this is ${motivatorName} from The DharmArth Foundation. 🕉️\n\nYour monthly contribution of ₹${amount} has stopped. We invite you to continue your noble support.\n\nRestart here: ${donationUrl}`;

    const whatsappUrl = `whatsapp://send?phone=91${mobile}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web link
        Linking.openURL(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`);
      }
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.referralCard}>
      <View style={styles.cardRow}>
        <View style={styles.donorInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.donorName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <View style={[styles.levelBadge, { backgroundColor: item.level1UserId === user?._id ? '#00bfa5' : '#10b981' }]}>
                <Text style={styles.levelText}>{item.level1UserId === user?._id ? 'L1' : 'L2'}</Text>
              </View>
              <Text style={styles.donorName}>{item.donorName}</Text>
            </View>
            <Text style={styles.donorMobile}>{item.donorMobile}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#ecfdf5' : '#fef2f2' }]}>
          <Text style={[styles.statusText, { color: item.status === 'active' ? '#059669' : '#dc2626' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.footerLabel}>Contribution</Text>
          <Text style={styles.footerValue}>₹{item.amount}/mo</Text>
        </View>
        <View>
          <Text style={styles.footerLabel}>Started On</Text>
          <Text style={styles.footerValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        {statusFilter === 'inactive' && (
          <TouchableOpacity style={styles.reinviteButton} onPress={() => handleReinvite(item)}>
            <Ionicons name="logo-whatsapp" size={16} color="white" />
            <Text style={styles.reinviteText}>Re-invite</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={[styles.filterTab, statusFilter === 'active' && styles.activeFilterTab]}
          onPress={() => setStatusFilter('active')}
        >
          <Text style={[styles.filterTabText, statusFilter === 'active' && styles.activeFilterTabText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, statusFilter === 'inactive' && styles.activeFilterTab]}
          onPress={() => setStatusFilter('inactive')}
        >
          <Text style={[styles.filterTabText, statusFilter === 'inactive' && styles.activeFilterTabText]}>Inactive</Text>
        </TouchableOpacity>
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
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00bfa5']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No {statusFilter} referrals</Text>
              <Text style={styles.emptySubtitle}>Share your link to start earning!</Text>
            </View>
          }
        />
      )}
    </View>
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
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#00bfa5',
  },
  filterTabText: {
    fontWeight: '700',
    color: '#64748b',
    fontSize: 14,
  },
  activeFilterTabText: {
    color: 'white',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  referralCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00bfa5',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  donorMobile: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  reinviteButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  reinviteText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
});
