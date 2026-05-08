import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Linking
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

  const fetchSubscriptions = async () => {
    try {
      const { data } = await api.get('/subscriptions/my');
      setSubscriptions(Array.isArray(data) ? data : data.subscriptions || []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch subscriptions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCancel = async (sub) => {
    Alert.alert(
      "Cancel Subscription?",
      `Are you sure you want to cancel this monthly donation (ID: ${sub.subscriptionId})? You won't be charged from the next cycle.`,
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.post(`/subscriptions/cancel/${sub._id}`);
              Alert.alert("Success", "Subscription cancelled successfully");
              fetchSubscriptions();
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Failed to cancel");
            }
          }
        }
      ]
    );
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
            <TouchableOpacity style={styles.retryBtn} onPress={() => Linking.openURL(`https://the-dharm-arth-foundation-software.vercel.app/my-subscriptions`)}>
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
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchSubscriptions(); }}
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
      />
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
  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginTop: 16 }
});
