import React, { useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
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
  Image,
  Platform
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import DonationExitModal from '../../src/components/DonationExitModal';
import { io } from "socket.io-client";
import { Audio } from 'expo-av';
import api, { API_BASE_URL } from '../../src/services/api';
import { useTranslation } from '../../src/context/LanguageContext';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const { t, locale, changeLanguage } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuVisible, setMenuVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [exitTargetRoute, setExitTargetRoute] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = React.useRef(null);

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://res.cloudinary.com/dbe1ykvg8/video/upload/v1778523456/dharmarth_foundation/notification_ding.mp3' }
      );
      await sound.playAsync();
    } catch (error) {
      console.error("Error playing sound", error);
    }
  };

  React.useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();

    socketRef.current = io(API_BASE_URL);
    socketRef.current.emit('join_user_notifications', user._id);

    const handleNewNotif = () => {
      setUnreadCount(prev => prev + 1);
      playNotificationSound();
    };

    socketRef.current.on('payout_processed', handleNewNotif);
    socketRef.current.on('payout_rejected', handleNewNotif);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user?._id, pathname]); // Re-fetch on pathname change to catch mark-read updates

  const menuItems = [
    { label: t('navbar.myEarnings'), icon: 'wallet-outline', route: '/dashboard' },
    { label: t('navbar.myProfile'), icon: 'person-outline', route: '/profile' },
    { label: t('navbar.mySubscriptions'), icon: 'card-outline', route: '/my-subscriptions' },
    { label: t('navbar.myNetwork'), icon: 'git-network-outline', route: '/my-network' },
    { label: t('navbar.myReferrals'), icon: 'people-outline', route: '/my-referrals' },
    { label: t('navbar.shareAndEarn'), icon: 'share-social-outline', route: '/share-earn' }
  ];

  const handleLogout = () => {
    setMenuVisible(false);
    logout();
    router.replace('/login');
  };

  const navigateTo = (route) => {
    setMenuVisible(false);

    if (!user) {
      router.push('/login');
      return;
    }

    // Intercept if on donate page
    if (pathname === '/donate' || pathname === 'donate') {
      setExitTargetRoute(route === 'profile' ? '/profile' : route);
      setExitModalVisible(true);
      return;
    }

    if (route === '/profile' || route === 'profile') {
      router.push('/profile');
    } else {
      router.push(route);
    }
  };

  const handleTabChange = (e, targetRoute) => {
    // Prevent unauthenticated access to dashboard
    if (targetRoute === '/dashboard' && !user) {
      e.preventDefault();

      // If they are on the donate page, we still want to show the exit modal first,
      // and THEN go to login.
      if (pathname === '/donate' || pathname === 'donate') {
        setExitTargetRoute('/login');
        setExitModalVisible(true);
      } else {
        router.push('/login');
      }
      return;
    }

    if (pathname === '/donate' || pathname === 'donate') {
      e.preventDefault();
      setExitTargetRoute(targetRoute);
      setExitModalVisible(true);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{
        tabBarActiveTintColor: '#00bfa5',
        tabBarInactiveTintColor: '#64748b',
        headerShown: true,
        headerStyle: {
          backgroundColor: 'white',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 2,
          borderBottomColor: '#00bfa5',
        },
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontWeight: '900',
          color: '#00bfa5',
          fontSize: 26,
          marginLeft: 8,
        },
        headerLeft: () => (
          <Image
            source={require('../../assets/LOGO.jpg')}
            style={{ width: 34, height: 34, borderRadius: 17, marginLeft: 16 }}
            resizeMode="contain"
          />
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={{ marginRight: 16, padding: 4, position: 'relative' }}
              onPress={() => {
                if (!user) {
                  router.push('/login');
                } else {
                  router.push('/notifications');
                }
              }}
            >
              <Ionicons name="notifications-outline" size={28} color="#0f172a" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                marginRight: 16,
                padding: 4,
              }}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="reorder-three" size={38} color="#0f172a" />
            </TouchableOpacity>
          </View>
        ),
      }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('navbar.brand'),
            tabBarLabel: t('navbar.home'),
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
          listeners={{ tabPress: (e) => handleTabChange(e, '/index') }}
        />
        <Tabs.Screen
          name="donate"
          options={{
            title: t('navbar.donate'),
            tabBarLabel: t('navbar.donate'),
            tabBarIcon: ({ color }) => <Ionicons name="heart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: t('navbar.events'),
            tabBarLabel: t('navbar.events'),
            tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
          }}
          listeners={{ tabPress: (e) => handleTabChange(e, '/events') }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: t('navbar.dashboard'),
            tabBarLabel: t('navbar.profile'),
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
          listeners={{ tabPress: (e) => handleTabChange(e, '/dashboard') }}
        />
        <Tabs.Screen name="referrals" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>

      {/* Web-style Mobile Menu - Replaced Modal with absolute View to fix Fabric crash */}
      {menuVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <View style={{ paddingTop: Platform.OS === 'ios' ? 50 : 30 }}>
                <View style={styles.menuHeader}>
                  <View style={styles.userInfo}>
                    <Image
                      source={{ uri: user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=00bfa5&color=fff` }}
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
                  {menuItems
                    .filter(item => item.route !== '/share-earn' || user)
                    .map((item, index) => (
                    <TouchableOpacity
                      key={`menu-item-${index}`}
                      style={styles.menuItem}
                      onPress={() => navigateTo(item.route)}
                    >
                      <Ionicons name={item.icon} size={22} color="#475569" />
                      <Text style={styles.menuItemText}>{item.label}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      setLangModalVisible(true);
                    }}
                  >
                    <Ionicons name="globe-outline" size={22} color="#475569" />
                    <Text style={styles.menuItemText}>{t('navbar.changeLanguage')}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {user ? (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleLogout}
                    >
                      <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                      <Text style={[styles.menuItemText, { color: '#ef4444' }]}>{t('navbar.logout')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        router.push('/login');
                      }}
                    >
                      <Ionicons name="log-in-outline" size={22} color="#00bfa5" />
                      <Text style={[styles.menuItemText, { color: '#00bfa5' }]}>{t('navbar.login')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.menuFooter}>
                  <Text style={styles.footerBrand}>The DharmArth Foundation</Text>
                  <Text style={styles.footerVersion}>v1.0.0 Mirror Experience</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {/* Language Selection Modal */}
      {langModalVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 10000, elevation: 10000 }]}>
          <Pressable
            style={styles.langOverlay}
            onPress={() => setLangModalVisible(false)}
          >
            <View style={styles.langModalContainer}>
              <Text style={styles.langModalTitle}>{t('navbar.changeLanguage')}</Text>
              
              <TouchableOpacity
                style={[
                  styles.langOption,
                  locale === 'en' && styles.langOptionSelected
                ]}
                onPress={async () => {
                  await changeLanguage('en');
                  setLangModalVisible(false);
                }}
              >
                <Text style={[
                  styles.langOptionText,
                  locale === 'en' && styles.langOptionTextSelected
                ]}>English</Text>
                {locale === 'en' && (
                  <Ionicons name="checkmark-circle" size={22} color="#00bfa5" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.langOption,
                  locale === 'hi' && styles.langOptionSelected
                ]}
                onPress={async () => {
                  await changeLanguage('hi');
                  setLangModalVisible(false);
                }}
              >
                <Text style={[
                  styles.langOptionText,
                  locale === 'hi' && styles.langOptionTextSelected
                ]}>हिंदी (Hindi)</Text>
                {locale === 'hi' && (
                  <Ionicons name="checkmark-circle" size={22} color="#00bfa5" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.langCancelBtn}
                onPress={() => setLangModalVisible(false)}
              >
                <Text style={styles.langCancelBtnText}>{locale === 'en' ? 'Cancel' : 'रद्द करें'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      )}

      {/* Global Donation Exit Modal */}
      <DonationExitModal
        isOpen={exitModalVisible}
        onClose={() => setExitModalVisible(false)}
        onConfirmNavigation={() => {
          setExitModalVisible(false);
          if (exitTargetRoute) {
            setTimeout(() => {
              if (exitTargetRoute === '/index') router.push('/');
              else router.push(exitTargetRoute);
            }, 100);
          }
        }}
      />
    </View>
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
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white'
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  langOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  langModalContainer: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  langModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  langOption: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  langOptionSelected: {
    borderColor: '#00bfa5',
    backgroundColor: '#e6fffa',
  },
  langOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  langOptionTextSelected: {
    color: '#004d40',
  },
  langCancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  langCancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748b',
  }
});
