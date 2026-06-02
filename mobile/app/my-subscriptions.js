import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Linking,
  Modal,
  TextInput,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Stack } from 'expo-router';

export default function MySubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  
  // OTP States
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const fetchSubscriptions = async (pageNum = 1, shouldRefresh = false) => {
    if (pageNum > 1 && !hasMore) return;
    
    try {
      if (pageNum === 1 && !shouldRefresh) setLoading(true);
      if (pageNum > 1) setFetchingMore(true);

      const { data } = await api.get('/subscriptions/my', {
        params: { page: pageNum, limit: 20 }
      });
      
      const newSubs = Array.isArray(data) ? data : data.subscriptions || [];
      const pagination = data.pagination || {};

      if (pageNum === 1) {
        setSubscriptions(newSubs);
      } else {
        setSubscriptions(prev => [...prev, ...newSubs]);
      }

      setHasMore(pageNum < (pagination.totalPages || 1));
      setPage(pageNum);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch subscriptions");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(1);
  }, []);

  const loadMore = () => {
    if (!fetchingMore && hasMore) {
      fetchSubscriptions(page + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions(1, true);
  };

  const handleCancel = async (sub) => {
    Alert.alert(
      "Cancel Subscription?",
      `Are you sure you want to cancel this monthly donation (ID: ${sub.subscriptionId})? An OTP will be sent to your mobile for confirmation.`,
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Send OTP", 
          onPress: async () => {
            try {
              setSendingOtp(true);
              await api.post(`/subscriptions/request-cancel-otp/${sub._id}`);
              setSelectedSub(sub);
              setOtpModalOpen(true);
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Failed to send OTP");
            } finally {
              setSendingOtp(false);
            }
          }
        }
      ]
    );
  };

  const confirmCancel = async () => {
    if (otpValue.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setVerifyingOtp(true);
      await api.post(`/subscriptions/cancel/${selectedSub._id}`, { otp: otpValue });
      Alert.alert("Success", "Subscription cancelled successfully");
      setOtpModalOpen(false);
      setOtpValue('');
      setSelectedSub(null);
      fetchSubscriptions(1, true);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to cancel");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return { text: 'ACTIVE', color: '#059669', bg: '#ecfdf5' };
      case 'cancelled':
        return { text: 'CANCELLED', color: '#dc2626', bg: '#fef2f2' };
      case 'failed':
        return { text: 'FAILED', color: '#dc2626', bg: '#fef2f2' };
      case 'created':
        return { text: 'PENDING', color: '#c2410c', bg: '#fff7ed' };
      default:
        return { text: status.toUpperCase(), color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const renderItem = ({ item }) => {
    const status = getStatusBadge(item.status);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
            <Text style={styles.freq}>/ monthly</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.value} numberOfLines={1}>{item.subscriptionId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Started:</Text>
            <Text style={styles.value}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          {item.status === 'active' && item.nextBillingDate && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Next Billing:</Text>
              <Text style={[styles.value, styles.highlight]}>{new Date(item.nextBillingDate).toLocaleDateString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          {item.status === 'active' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
              <Ionicons name="close-circle-outline" size={18} color="#dc2626" />
              <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
          {item.status === 'failed' && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => Linking.openURL(`https://thedharmarth.com/my-subscriptions`)}>
              <Ionicons name="refresh-outline" size={18} color="white" />
              <Text style={styles.retryBtnText}>Retry Payment</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Subscriptions', headerTitleAlign: 'center' }} />
      <FlatList
        data={subscriptions}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00bfa5']}
            tintColor="#00bfa5"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="card-outline" size={64} color="#e2e8f0" />
              <Text style={styles.emptyText}>No monthly donations found</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Subscriptions</Text>
            <Text style={styles.headerDesc}>Manage your recurring donations and support.</Text>
          </View>
        }
        ListFooterComponent={
          fetchingMore ? <ActivityIndicator style={{ padding: 20 }} color="#00bfa5" /> : null
        }
      />

      <Modal
        visible={otpModalOpen}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Cancellation</Text>
            <Text style={styles.modalDesc}>
              Enter the 6-digit code sent to your mobile.
            </Text>
            
            <TextInput
              style={styles.otpInput}
              value={otpValue}
              onChangeText={v => setOtpValue(v.replace(/\D/g, ''))}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBtnCancel} 
                onPress={() => {
                  setOtpModalOpen(false);
                  setOtpValue('');
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnConfirm} 
                onPress={confirmCancel}
                disabled={verifyingOtp}
              >
                {verifyingOtp ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>Confirm</Text>
                )}
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
  header: { padding: 24, backgroundColor: 'white', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  headerDesc: { fontSize: 14, color: '#64748b' },
  list: { padding: 16, paddingBottom: 40 },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  amount: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  freq: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardBody: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  value: { fontSize: 13, color: '#334155', fontWeight: '700' },
  highlight: { color: '#00bfa5' },
  cardFooter: { marginTop: 20 },
  cancelBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#fee2e2',
    backgroundColor: '#fffcfc'
  },
  cancelBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  retryBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 12, 
    borderRadius: 12, 
    backgroundColor: '#00bfa5'
  },
  retryBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginTop: 16 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24
  },
  otpInput: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 24,
    letterSpacing: 8
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalBtnCancel: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9'
  },
  modalBtnTextCancel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b'
  },
  modalBtnConfirm: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#00bfa5'
  },
  modalBtnTextConfirm: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white'
  }
});
