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
    const onLandingPage = segments.length <= 1 || (segments[0] === '(tabs)' && segments[1] === 'index');

    if (!user && !inAuthGroup && !onLandingPage) {
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
