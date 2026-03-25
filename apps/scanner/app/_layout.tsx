import { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { getCredentials } from '../lib/credentials';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        const creds = await getCredentials();
        if (creds) {
          router.replace('/scan');
        } else {
          router.replace('/setup');
        }
      } catch {
        router.replace('/setup');
      } finally {
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  return <Slot />;
}
