import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: passes = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['passes'],
    queryFn: () => api.get<GuestPass[]>('/guest-passes/my'),
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['communities'],
    queryFn: () => api.get<Community[]>('/communities/my'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/guest-passes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['passes'] }),
  });

  if (isLoading) {
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
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No guest passes yet.{'\n'}Tap + to create one.</Text>
        }
        renderItem={({ item }) => (
          <PassCard pass={item} onCancel={() => cancelMutation.mutate(item.id)} />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <CreatePassModal
        visible={showModal}
        communities={communities}
        onClose={() => setShowModal(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['passes'] });
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
