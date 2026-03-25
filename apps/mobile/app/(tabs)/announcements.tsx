import { useEffect, useState } from 'react';
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
import { api } from '../../lib/api';
import { Colors } from '../../lib/colors';
import { AnnouncementCard } from '../../components/AnnouncementCard';

interface Community {
  id: string;
  name: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
}

export default function AnnouncementsScreen() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    api.get<Community[]>('/communities/my')
      .then(cs => {
        setCommunities(cs);
        if (cs.length > 0) setSelected(cs[0].id);
      })
      .finally(() => setLoadingCommunities(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingAnnouncements(true);
    api.get<Announcement[]>(`/communities/${selected}/announcements`)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => {
        setLoadingAnnouncements(false);
        setRefreshing(false);
      });
  }, [selected]);

  function handleRefresh() {
    setRefreshing(true);
    if (!selected) { setRefreshing(false); return; }
    api.get<Announcement[]>(`/communities/${selected}/announcements`)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => setRefreshing(false));
  }

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
              style={[styles.pill, selected === c.id && styles.pillActive]}
              onPress={() => setSelected(c.id)}
            >
              <Text style={[styles.pillText, selected === c.id && styles.pillTextActive]}>
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
              refreshing={refreshing}
              onRefresh={handleRefresh}
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
