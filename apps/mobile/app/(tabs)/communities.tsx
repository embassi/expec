import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../lib/colors';

interface Community {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface Membership {
  id: string;
  community_id: string;
  unit_id: string | null;
  relationship_type: string;
  role_type: string;
  approval_status: string;
}

interface CommunityWithMembership extends Community {
  membership: Membership | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: Colors.statusGranted, text: Colors.statusGrantedText },
  pending: { bg: Colors.statusPending, text: Colors.statusPendingText },
  rejected: { bg: Colors.statusDenied, text: Colors.statusDeniedText },
  suspended: { bg: Colors.statusDenied, text: Colors.statusDeniedText },
};

export default function CommunitiesScreen() {
  const [items, setItems] = useState<CommunityWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [communities, memberships] = await Promise.all([
        api.get<Community[]>('/communities/my'),
        api.get<Membership[]>('/memberships/my'),
      ]);
      const joined = communities.map(c => ({
        ...c,
        membership: memberships.find(m => m.community_id === c.id) ?? null,
      }));
      setItems(joined);
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={items.length === 0 ? styles.center : styles.list}
      data={items}
      keyExtractor={i => i.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={Colors.primary}
        />
      }
      ListEmptyComponent={
        <Text style={styles.empty}>No communities yet.{'\n'}Ask a manager to add you.</Text>
      }
      renderItem={({ item }) => {
        const status = item.membership?.approval_status ?? 'unknown';
        const colors = STATUS_COLORS[status] ?? { bg: Colors.surface, text: Colors.textSecondary };
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.communityName}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </View>
            </View>
            {item.membership && (
              <View style={styles.details}>
                <Text style={styles.detail}>
                  Role: {item.membership.role_type}
                </Text>
                <Text style={styles.detail}>
                  Type: {item.membership.relationship_type}
                </Text>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  list: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  communityName: { fontSize: 16, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  details: { marginTop: 10, gap: 4 },
  detail: { fontSize: 13, color: Colors.textSecondary },
});
