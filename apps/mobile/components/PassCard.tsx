import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { ApiGuestPass } from '@simsim/types';
import { Colors } from '../lib/colors';

interface Props {
  pass: ApiGuestPass;
  onCancel: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: Colors.statusGranted, text: Colors.statusGrantedText },
  used: { bg: Colors.surface, text: Colors.textSecondary },
  expired: { bg: Colors.surface, text: Colors.textSecondary },
  cancelled: { bg: Colors.statusDenied, text: Colors.statusDeniedText },
};

export function PassCard({ pass, onCancel }: Props) {
  const colors = STATUS_COLORS[pass.status] ?? { bg: Colors.surface, text: Colors.textSecondary };

  function confirmCancel() {
    Alert.alert(
      'Cancel pass',
      `Cancel the pass for ${pass.guest_name}? This cannot be undone.`,
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel pass', style: 'destructive', onPress: onCancel },
      ],
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{pass.guest_name}</Text>
          <Text style={styles.phone}>{pass.guest_phone}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {pass.pass_type.replace('_', ' ')}
        </Text>
        {pass.valid_until && (
          <Text style={styles.metaText}>
            Until: {new Date(pass.valid_until).toLocaleDateString()}
          </Text>
        )}
        {pass.usage_limit > 0 && (
          <Text style={styles.metaText}>
            Uses: {pass.usage_count}/{pass.usage_limit}
          </Text>
        )}
      </View>

      {pass.status === 'active' && (
        <TouchableOpacity style={styles.cancelButton} onPress={confirmCancel}>
          <Text style={styles.cancelText}>Cancel pass</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  phone: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  meta: { flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '500', color: Colors.error },
});
