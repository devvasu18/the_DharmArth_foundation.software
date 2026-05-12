import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
