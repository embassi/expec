import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getCredentials } from '../lib/credentials';
import { Colors } from '../lib/colors';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    getCredentials()
      .then(creds => {
        if (creds) {
          router.replace('/scan');
        } else {
          router.replace('/setup');
        }
      })
      .catch(() => router.replace('/setup'));
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
