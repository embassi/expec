import { View, Text, StyleSheet, Image } from 'react-native';
import type { ApiAnnouncement } from '@simsim/types';
import { Colors } from '../lib/colors';

interface Props {
  announcement: ApiAnnouncement;
}

export function AnnouncementCard({ announcement: a }: Props) {
  const dateStr = a.published_at ?? a.created_at;
  const date = dateStr
    ? new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <View style={styles.card}>
      {a.image_url && (
        <Image source={{ uri: a.image_url }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        {a.title ? <Text style={styles.title}>{a.title}</Text> : null}
        {a.body ? <Text style={styles.body}>{a.body}</Text> : null}
        {date ? <Text style={styles.date}>{date}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: '100%', height: 180 },
  content: { padding: 16, gap: 6 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  date: { fontSize: 12, color: Colors.textDisabled, marginTop: 4 },
});
