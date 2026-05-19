import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  if (loading) {
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

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const publicRoutes = ['index', 'donate', 'events'];
    const isPublicRoute = segments.length <= 1 || (segments[0] === '(tabs)' && publicRoutes.includes(segments[1])) || segments[0] === 'event';

    if (!user && !inAuthGroup && !isPublicRoute) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/dashboard');
    }
  }, [user, loading, segments]);

  return (
    <Stack>
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
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
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
