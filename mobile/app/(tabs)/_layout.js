import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  TouchableOpacity, 
  View, 
  Modal, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Pressable,
  Dimensions,
  Image
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    { label: 'My Wallet', icon: 'wallet-outline', route: '/dashboard' },
    { label: 'My Profile', icon: 'person-outline', route: '/profile' },
    { label: 'My Subscriptions', icon: 'card-outline', route: '/my-subscriptions' },
    { label: 'My Referrals', icon: 'people-outline', route: '/my-referrals' },
  ];

  const handleLogout = () => {
    setMenuVisible(false);
    logout();
    router.replace('/login');
  };

  const navigateTo = (route) => {
    setMenuVisible(false);
    router.push(route);
  };

  return (
    <>
      <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#00bfa5',
        tabBarInactiveTintColor: '#64748b',
        headerShown: true,
        headerStyle: {
          backgroundColor: 'white',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        },
        headerTitleStyle: {
          fontWeight: '800',
          color: '#1e293b',
        },
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 16 }} 
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu" size={28} color="#1e293b" />
          </TouchableOpacity>
        ),
      }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="donate"
          options={{
            title: 'Donate',
            tabBarLabel: 'Donate',
            tabBarIcon: ({ color }) => <Ionicons name="heart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarLabel: 'Events',
            tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
        />
        <Tabs.Screen name="referrals" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>

      {/* Web-style Mobile Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <SafeAreaView>
              <View style={styles.menuHeader}>
                <View style={styles.userInfo}>
                  <Image 
                    source={{ uri: `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=00bfa5&color=fff` }} 
                    style={styles.avatar} 
                  />
                  <View>
                    <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
                    <Text style={styles.userRole}>{user?.roles?.[0]?.name || 'Volunteer'}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setMenuVisible(false)}>
                  <Ionicons name="close" size={28} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.menuList}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.menuItem}
                    onPress={() => navigateTo(item.route)}
                  >
                    <Ionicons name={item.icon} size={22} color="#475569" />
                    <Text style={styles.menuItemText}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                ))}

                <View style={styles.divider} />

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                  <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Logout</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuFooter}>
                <Text style={styles.footerBrand}>The DharmArth Foundation</Text>
                <Text style={styles.footerVersion}>v1.0.0 Mirror Experience</Text>
              </View>
            </SafeAreaView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: width * 0.75,
    height: '100%',
    backgroundColor: 'white',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  userRole: {
    fontSize: 12,
    color: '#00bfa5',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  menuList: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
    marginHorizontal: 8,
  },
  menuFooter: {
    padding: 24,
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerVersion: {
    fontSize: 10,
    color: '#e2e8f0',
    marginTop: 4,
  }
});
