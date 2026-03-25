import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../lib/api';
import { getSession } from '../../lib/auth';
import { Colors } from '../../lib/colors';
import { QrCode } from '../../components/QrCode';

const REFRESH_INTERVAL = 25;

export default function QrScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');

  const refreshTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchToken = useCallback(async () => {
    try {
      const { qr_token: t } = await api.get<{ qr_token: string }>('/access/qr');
      setToken(t);
      setCountdown(REFRESH_INTERVAL);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QR');
    } finally {
      setLoading(false);
    }
  }, []);

  function startTimers() {
    clearInterval(refreshTimer.current);
    clearInterval(countdownTimer.current);
    refreshTimer.current = setInterval(fetchToken, REFRESH_INTERVAL * 1000);
    countdownTimer.current = setInterval(() => {
      setCountdown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
  }

  useEffect(() => {
    getSession().then(s => {
      if (s?.user?.full_name) setUserName(s.user.full_name);
    });
    fetchToken();
    startTimers();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        fetchToken();
        startTimers();
      }
    });

    return () => {
      clearInterval(refreshTimer.current);
      clearInterval(countdownTimer.current);
      sub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {userName ? <Text style={styles.name}>{userName}</Text> : null}
        <Text style={styles.subtitle}>Show this QR code at the gate</Text>

        <View style={styles.qrContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchToken}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : token ? (
            <QrCode token={token} size={220} />
          ) : null}
        </View>

        {!error && !loading && (
          <View style={styles.countdownRow}>
            <View style={[styles.countdownBar, { width: `${(countdown / REFRESH_INTERVAL) * 100}%` }]} />
            <Text style={styles.countdownText}>Refreshes in {countdown}s</Text>
          </View>
        )}
      </View>
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
