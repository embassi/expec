import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Colors } from '../../lib/colors';
import { QrCode } from '../../components/QrCode';

const REFRESH_INTERVAL = 25;

export default function QrScreen() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ full_name: string | null }>('/me'),
    staleTime: 60_000,
  });

  const { data, isLoading, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['qr-token'],
    queryFn: () => api.get<{ qr_token: string }>('/access/qr'),
    refetchInterval: REFRESH_INTERVAL * 1000,
    staleTime: 0,
    gcTime: 0,
  });

  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  useEffect(() => {
    if (!dataUpdatedAt) return;
    const update = () => {
      const elapsed = Math.floor((Date.now() - dataUpdatedAt) / 1000);
      setCountdown(Math.max(0, REFRESH_INTERVAL - elapsed));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [dataUpdatedAt]);

  const token = data?.qr_token ?? null;
  const errorMsg = error instanceof Error ? error.message : error ? 'Failed to load QR' : '';

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
        {me?.full_name ? (
          <Text style={styles.name}>{me.full_name}</Text>
        ) : null}
        <Text style={styles.subtitle}>Show this QR code at the gate</Text>

        <View style={styles.qrContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : errorMsg ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : token ? (
            <Animated.View
              key={token}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <QrCode token={token} size={220} />
            </Animated.View>
          ) : null}
        </View>

        {!errorMsg && !isLoading && (
          <View style={styles.countdownRow}>
            <View
              style={[
                styles.countdownBar,
                { width: `${(countdown / REFRESH_INTERVAL) * 100}%` },
              ]}
            />
            <Text style={styles.countdownText}>Refreshes in {countdown}s</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  name: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  qrContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: { alignItems: 'center', gap: 12 },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: Colors.onPrimary },
  countdownRow: {
    width: '100%',
    marginTop: 24,
    gap: 6,
  },
  countdownBar: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  countdownText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'right' },
});
