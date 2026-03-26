import { useEffect } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { getSession } from '../lib/auth';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        const session = await getSession();
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/phone');
        }
      } catch {
        router.replace('/(auth)/phone');
      } finally {
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
