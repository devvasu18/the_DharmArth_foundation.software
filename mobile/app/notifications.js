import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // We could also notify the layout to reset the unread count here
    } catch (error) {
      Alert.alert("Error", "Failed to mark notifications as read");
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.notifItem, !item.isRead && styles.unreadItem]}>
      <View style={[styles.iconContainer, { backgroundColor: item.type === 'error' ? '#fef2f2' : '#ecfdf5' }]}>
        <Ionicons 
          name={item.type === 'error' ? "alert-circle" : "notifications"} 
          size={20} 
          color={item.type === 'error' ? "#ef4444" : "#00bfa5"} 
        />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifMessage, !item.isRead && styles.unreadText]}>
          {item.message}
        </Text>
        <Text style={styles.notifDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notifications', headerTitleAlign: 'center' }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Alerts</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markReadBtn}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} color="#00bfa5" />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={64} color="#e2e8f0" />
              <Text style={styles.emptyText}>
                {user ? "No notifications yet" : "Please login to view notifications"}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  markReadBtn: { fontSize: 14, color: '#00bfa5', fontWeight: '700' },
  list: { padding: 16 },
  notifItem: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  unreadItem: {
    backgroundColor: '#f0fdfa',
    borderColor: '#ccfbf1'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  notifContent: { flex: 1 },
  notifMessage: { fontSize: 14, color: '#475569', lineHeight: 20 },
  unreadText: { color: '#1e293b', fontWeight: '700' },
  notifDate: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00bfa5',
    marginLeft: 8
  },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginTop: 16 }
});
