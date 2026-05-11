import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking
} from 'react-native';
import api from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [txnType, setTxnType] = useState('All'); // All, Donation, Commission

  const fetchTransactions = async (pageNum = 1, shouldRefresh = false) => {
    try {
      const { data } = await api.get(`/wallet/transactions`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
          page: pageNum,
          limit: 20
        }
      });

      let newTxns = data.transactions || [];

      // Frontend filter for Type (as backend might not support it yet or returns all)
      if (txnType === 'Donation') {
        newTxns = newTxns.filter(t => t.isDonation || t.reason === 'wallet_donation');
      } else if (txnType === 'Commission') {
        newTxns = newTxns.filter(t => t.type === 'credit' && !t.isDonation && t.reason !== 'wallet_donation');
      }

      if (shouldRefresh) {
        setTransactions(newTxns);
      } else {
        setTransactions(prev => [...prev, ...newTxns]);
      }

      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1, true);
  }, [selectedMonth, selectedYear, txnType]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions(1, true);
  }, []);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchTransactions(page + 1);
    }
  };

  const renderItem = ({ item: txn }) => {
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
      <View style={styles.txnItemContainer}>
        <View style={styles.txnItemInner}>
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
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'History', headerTitleAlign: 'center' }} />

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.typeBtn, txnType === 'All' && styles.typeBtnActive]}
            onPress={() => setTxnType('All')}
          >
            <Text style={[styles.typeBtnText, txnType === 'All' && styles.typeBtnTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, txnType === 'Donation' && styles.typeBtnActive]}
            onPress={() => setTxnType('Donation')}
          >
            <Text style={[styles.typeBtnText, txnType === 'Donation' && styles.typeBtnTextActive]}>Donations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, txnType === 'Commission' && styles.typeBtnActive]}
            onPress={() => setTxnType('Commission')}
          >
            <Text style={[styles.typeBtnText, txnType === 'Commission' && styles.typeBtnTextActive]}>Commissions</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.dateFilters}>
          <View style={styles.datePicker}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <TextInput
              style={styles.dateInput}
              value={selectedMonth.toString()}
              onChangeText={(t) => setSelectedMonth(parseInt(t) || 0)}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.dateLabel}>MM</Text>
          </View>
          <View style={styles.datePicker}>
            <TextInput
              style={styles.dateInput}
              value={selectedYear.toString()}
              onChangeText={(t) => setSelectedYear(parseInt(t) || 0)}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={styles.dateLabel}>YYYY</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={transactions}
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
            <Ionicons name="receipt-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No transactions found</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filterSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeBtnActive: {
    backgroundColor: '#00bfa5',
    borderColor: '#00bfa5',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  typeBtnTextActive: {
    color: 'white',
  },
  dateFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    paddingHorizontal: 4,
    minWidth: 30,
    textAlign: 'center',
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginLeft: 2,
  },
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
  txnItemInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 16,
  },
});
