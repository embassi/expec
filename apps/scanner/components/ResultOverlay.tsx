import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { Colors } from '../lib/colors';
import type { ScanValidationResult } from '@simsim/types';

const DISMISS_DELAY = 3000;

interface Props {
  result: ScanValidationResult;
  onDismiss: () => void;
}

export function ResultOverlay({ result, onDismiss }: Props) {
  const progress = useRef(new Animated.Value(1)).current;
  const granted = result.result === 'granted';

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: DISMISS_DELAY,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(onDismiss, DISMISS_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isGuest = !!result.guest_name;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onDismiss}
      activeOpacity={1}
    >
      <View style={[styles.card, granted ? styles.cardGranted : styles.cardDenied]}>
        <Text style={[styles.resultLabel, { color: granted ? Colors.granted : Colors.denied }]}>
          {granted ? '✓  GRANTED' : '✗  DENIED'}
        </Text>

        {granted ? (
          <View style={styles.info}>
            {result.photo_url ? (
              <Image
                source={{ uri: result.photo_url }}
                style={styles.photo}
              />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoInitial}>
                  {(result.resident_name ?? result.guest_name ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.name}>
              {isGuest ? result.guest_name : result.resident_name}
            </Text>

            {!isGuest && result.unit_code ? (
              <Text style={styles.sub}>Unit {result.unit_code}</Text>
            ) : null}

            {isGuest && result.host_name ? (
              <Text style={styles.sub}>
                Guest of {result.host_name}
                {result.host_unit ? ` · Unit ${result.host_unit}` : ''}
              </Text>
            ) : null}

            {result.community_name ? (
              <Text style={styles.community}>{result.community_name}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.denialReason}>
            {result.denial_reason ?? 'Access denied'}
          </Text>
        )}

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: granted ? Colors.granted : Colors.denied,
              },
            ]}
          />
        </View>

        <Text style={styles.tapToDismiss}>Tap anywhere to dismiss</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 16,
  },
  cardGranted: { backgroundColor: Colors.grantedBg, borderWidth: 2, borderColor: Colors.granted },
  cardDenied: { backgroundColor: Colors.deniedBg, borderWidth: 2, borderColor: Colors.denied },
  resultLabel: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  info: { alignItems: 'center', gap: 8 },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 4,
  },
  photoPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: { fontSize: 32, fontWeight: '700', color: Colors.text },
  name: { fontSize: 22, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  sub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  community: { fontSize: 13, color: Colors.textSecondary },
  denialReason: {
    fontSize: 18,
    color: Colors.denied,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 26,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: { height: '100%', borderRadius: 2 },
  tapToDismiss: { fontSize: 12, color: Colors.textSecondary },
});
