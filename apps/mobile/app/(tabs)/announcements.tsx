import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { ApiAnnouncement, ApiCommunity } from '@simsim/types';
import { api } from '../../lib/api';
import { Colors } from '../../lib/colors';
import { AnnouncementCard } from '../../components/AnnouncementCard';

export default function AnnouncementsScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  const { data: communities = [], isLoading: loadingCommunities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => api.get<ApiCommunity[]>('/communities/my'),
  });

  const communityId = selected ?? communities[0]?.id ?? null;

  const {
    data: announcements = [],
    isLoading: loadingAnnouncements,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['announcements', communityId],
    queryFn: () => api.get<ApiAnnouncement[]>(`/communities/${communityId}/announcements`),
    enabled: !!communityId,
  });

  if (loadingCommunities) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {communities.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          {communities.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.pill, communityId === c.id && styles.pillActive]}
              onPress={() => setSelected(c.id)}
            >
              <Text style={[styles.pillText, communityId === c.id && styles.pillTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loadingAnnouncements ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={announcements.length === 0 ? styles.center : styles.list}
          data={announcements}
          keyExtractor={a => a.id}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !loadingAnnouncements}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {communities.length === 0
                ? 'No communities yet.'
                : 'No announcements yet.'}
            </Text>
          }
          renderItem={({ item }) => <AnnouncementCard announcement={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  pills: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  pillTextActive: { color: Colors.onPrimary },
  list: { padding: 16, gap: 12 },
});
