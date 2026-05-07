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

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/');
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
