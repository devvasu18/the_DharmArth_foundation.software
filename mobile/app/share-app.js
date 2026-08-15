import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Linking,
  SafeAreaView,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '../src/context/LanguageContext';
import api from '../src/services/api';

const DEFAULT_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.thedharmarth.foundation';
const DEFAULT_APP_STORE_URL = 'https://apps.apple.com/us/app/dharmarth-foundation/id6780563745';

// Multi-colored Google Play Store Logo SVG Component
function GooglePlayIcon({ size = 30 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path
        d="M49.2 18.2C42.2 25.8 38 37.3 38 52.4V459.6C38 474.7 42.2 486.2 49.2 493.8L51.6 496.1L299.7 248.1V243.9L51.6 15.9L49.2 18.2Z"
        fill="#2196F3"
      />
      <Path
        d="M382.4 330.8L299.7 248.1V243.9L382.4 161.2L383.6 161.9L481.5 217.5C509.4 233.3 509.4 258.7 481.5 274.5L383.6 330.1L382.4 330.8Z"
        fill="#FFC107"
      />
      <Path
        d="M383.6 330.1L299.7 246L49.2 496.5C58.4 506.3 73.4 507.5 90.7 497.7L383.6 330.1Z"
        fill="#4CAF50"
      />
      <Path
        d="M383.6 161.9L90.7 24.3C73.4 14.5 58.4 15.7 49.2 25.5L299.7 276L383.6 161.9Z"
        fill="#F44336"
      />
    </Svg>
  );
}

export default function ShareAppScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [playStoreUrl, setPlayStoreUrl] = useState(DEFAULT_PLAY_STORE_URL);
  const [appStoreUrl, setAppStoreUrl] = useState(DEFAULT_APP_STORE_URL);

  useEffect(() => {
    const fetchStoreUrls = async () => {
      try {
        const { data } = await api.get('/content/settings');
        if (data) {
          if (data.playStoreUrl) setPlayStoreUrl(data.playStoreUrl);
          if (data.appStoreUrl) setAppStoreUrl(data.appStoreUrl);
        }
      } catch (error) {
        console.error("Failed to load store URLs in Share App page", error);
      }
    };
    fetchStoreUrls();
  }, []);

  const handleShareAndroid = async () => {
    try {
      const message = locale === 'hi'
        ? `द धर्मार्थ एंड्रॉइड ऐप डाउनलोड एवं शेयर करें: ${playStoreUrl}`
        : `Help us reach more people in need by sharing our app: ${playStoreUrl}`;
      await Share.share({
        message,
        url: playStoreUrl,
        title: t('shareApp.shareDharmarth')
      });
    } catch (err) {
      console.error('Error sharing android app:', err);
    }
  };

  const handleShareIos = async () => {
    try {
      const message = locale === 'hi'
        ? `द धर्मार्थ आईफोन ऐप डाउनलोड एवं शेयर करें: ${appStoreUrl}`
        : `Help us reach more people in need by sharing our app: ${appStoreUrl}`;
      await Share.share({
        message,
        url: appStoreUrl,
        title: t('shareApp.shareDharmarth')
      });
    } catch (err) {
      console.error('Error sharing ios app:', err);
    }
  };

  const openPlayStore = () => {
    Linking.openURL(playStoreUrl).catch(err => console.error("Couldn't load Play Store page", err));
  };

  const openAppStore = () => {
    Linking.openURL(appStoreUrl).catch(err => console.error("Couldn't load App Store page", err));
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('shareApp.title') || 'Share App',
          headerTintColor: '#1e293b',
          headerTitleStyle: { fontWeight: '900', fontSize: 20 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8, paddingRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#008080" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Branding Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../assets/LOGO.jpg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>{t('shareApp.shareDharmarth') || 'Share'}</Text>
          <Text style={styles.heroSubtitle}>
            {t('shareApp.subtitle') || 'Help us reach more people in need by sharing our app. 💚'}
          </Text>
        </View>

        {/* Card 1: Android Users */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.cardHeaderRow}
            onPress={openPlayStore}
            activeOpacity={0.7}
          >
            <View style={styles.iconBox}>
              <GooglePlayIcon size={30} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>{t('shareApp.forAndroid') || 'For Android Users'}</Text>
              <Text style={styles.cardSubtext}>
                {locale === 'hi' ? 'गूगल प्ले स्टोर पर हमारा ऐप ' : 'Share our app on '}
                <Text style={styles.cardHighlight}>{t('shareApp.googlePlayStore') || 'Google Play Store'}</Text>
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleShareAndroid}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>{t('shareApp.shareOnPlayStore') || 'Share on Play Store'}</Text>
          </TouchableOpacity>
        </View>

        {/* Card 2: iPhone Users */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.cardHeaderRow}
            onPress={openAppStore}
            activeOpacity={0.7}
          >
            <View style={styles.iconBox}>
              <Ionicons name="logo-apple" size={32} color="#000000" />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>{t('shareApp.forIphone') || 'For iPhone Users'}</Text>
              <Text style={styles.cardSubtext}>
                {locale === 'hi' ? 'ऐप स्टोर पर हमारा ऐप ' : 'Share our app on '}
                <Text style={styles.cardHighlight}>{t('shareApp.appStore') || 'App Store'}</Text>
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleShareIos}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>{t('shareApp.shareOnAppStore') || 'Share on App Store'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f2f8f8',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  cardContainer: {
    backgroundColor: '#f7fcfb',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#e2f1f0',
    marginBottom: 20,
    shadowColor: '#008080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTextCol: {
    flex: 1,
    marginLeft: 14,
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  cardHighlight: {
    color: '#008080',
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#008080',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#008080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
