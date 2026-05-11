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
  TextInput
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

  const renderItem = ({ item }) => {
    const isCredit = item.type === 'credit';
    const isPayout = item.reason === 'payout';
    
    return (
      <View style={styles.txnItem}>
        <View style={[styles.iconBox, { backgroundColor: isCredit ? '#e0f2f1' : '#fef2f2' }]}>
          <Ionicons 
            name={isCredit ? 'arrow-down-circle' : 'arrow-up-circle'} 
            size={24} 
            color={isCredit ? '#00bfa5' : '#ef4444'} 
          />
        </View>
        
        <View style={styles.txnDetails}>
          <Text style={styles.txnTitle} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.txnDate}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>

        <View style={styles.txnAmountArea}>
          <Text style={[styles.txnAmount, { color: isCredit ? '#059669' : '#ef4444' }]}>
            {isCredit ? '+' : '-'} ₹{item.amount.toLocaleString()}
          </Text>
          <Text style={[styles.txnStatus, item.status === 'pending' && styles.statusPending]}>
            {item.status?.toUpperCase()}
          </Text>
        </View>
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
  txnItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txnDetails: {
    flex: 1,
  },
  txnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  txnDate: {
    fontSize: 12,
    color: '#64748b',
  },
  txnAmountArea: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  txnStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  statusPending: {
    color: '#f59e0b',
  },
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
