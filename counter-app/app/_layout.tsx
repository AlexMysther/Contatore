import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const initialLoad = useRef(true);

  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      prevUserId.current = null;
      router.replace('/login');
    } else if (prevUserId.current === null) {
      // primo login: mostra welcome
      prevUserId.current = user.id;
      router.replace('/welcome');
    }
    // aggiornamenti utente (es. avatar) non causano redirect
  }, [user, loading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login"     options={{ headerShown: false }} />
        <Stack.Screen name="register"  options={{ headerShown: false }} />
        <Stack.Screen name="welcome"   options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
        <Stack.Screen name="modal"   options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
