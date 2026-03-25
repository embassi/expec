import { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { getSession } from '../lib/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

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

  return <Slot />;
}
