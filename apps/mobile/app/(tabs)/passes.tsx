import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../lib/colors';
import { PassCard } from '../../components/PassCard';
import { CreatePassModal } from '../../components/CreatePassModal';

interface Community {
  id: string;
  name: string;
}

interface GuestPass {
  id: string;
  guest_name: string;
  guest_phone: string;
  pass_type: string;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
}

export default function PassesScreen() {
  const [passes, setPasses] = useState<GuestPass[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    try {
      const [p, c] = await Promise.all([
        api.get<GuestPass[]>('/guest-passes/my'),
        api.get<Community[]>('/communities/my'),
      ]);
      setPasses(p);
      setCommunities(c);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(id: string) {
    try {
      await api.delete(`/guest-passes/${id}`);
      setPasses(prev => prev.filter(p => p.id !== id));
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={passes.length === 0 ? styles.center : styles.list}
        data={passes}
        keyExtractor={p => p.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No guest passes yet.{'\n'}Tap + to create one.</Text>
        }
        renderItem={({ item }) => (
          <PassCard pass={item} onCancel={() => handleCancel(item.id)} />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <CreatePassModal
        visible={showModal}
        communities={communities}
        onClose={() => setShowModal(false)}
        onCreated={pass => {
          setPasses(prev => [pass as GuestPass, ...prev]);
          setShowModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  list: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, fontWeight: '300', color: Colors.onPrimary, lineHeight: 32 },
});
