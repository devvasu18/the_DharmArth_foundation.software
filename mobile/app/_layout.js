import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { useEffect, useState } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const val = await AsyncStorage.getItem('hasCompletedOnboarding');
        if (val !== 'true') {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setOnboardingChecked(true);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (loading || !onboardingChecked) return;

    const performNavigationCheck = async () => {
      try {
        const val = await AsyncStorage.getItem('hasCompletedOnboarding');
        const hasCompleted = val === 'true';
        const inOnboarding = segments[0] === 'onboarding';

        if (!hasCompleted && !inOnboarding) {
          router.replace('/onboarding');
          return;
        }

        const inAuthGroup = segments[0] === '(auth)';
        const publicRoutes = ['index', 'donate', 'events', 'contact'];
        const isPublicRoute = segments.length <= 1 || (segments[0] === '(tabs)' && publicRoutes.includes(segments[1])) || segments[0] === 'event' || segments[0] === 'contact';

        if (!user && !inAuthGroup && !isPublicRoute && !inOnboarding) {
          router.replace('/login');
        } else if (user && inAuthGroup) {
          router.replace('/dashboard');
        }
      } catch (e) {
        console.error('Navigation check failed:', e);
      }
    };

    performNavigationCheck();
  }, [user, loading, segments, onboardingChecked]);

  if (loading || !onboardingChecked) {
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('../assets/LOGO.jpg')} 
          style={styles.loadingLogo} 
          resizeMode="contain" 
        />
        <ActivityIndicator size="large" color="#00bfa5" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="(auth)/signup" options={{ title: 'Sign Up', headerShown: false }} />
      <Stack.Screen 
        name="my-subscriptions" 
        options={{ 
          title: 'My Subscriptions',
          headerStyle: { backgroundColor: 'white' },
          headerTitleStyle: { fontWeight: '800', color: '#1e293b' },
          headerTintColor: '#00bfa5'
        }} 
      />
      <Stack.Screen 
        name="my-referrals" 
        options={{ 
          title: 'My Referrals',
          headerStyle: { backgroundColor: 'white' },
          headerTitleStyle: { fontWeight: '800', color: '#1e293b' },
          headerTintColor: '#00bfa5'
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: 'My Profile',
          headerStyle: { backgroundColor: 'white' },
          headerTitleStyle: { fontWeight: '800', color: '#1e293b' },
          headerTintColor: '#00bfa5'
        }} 
      />
      <Stack.Screen 
        name="contact" 
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <RootLayoutNav />
      </LanguageProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 240,
    height: 240,
  },
});
