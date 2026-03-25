import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../lib/colors';

interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
}

interface Props {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement: a }: Props) {
  const date = new Date(a.published_at ?? a.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.card}>
      {a.image_url && (
        <Image source={{ uri: a.image_url }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{a.title}</Text>
        <Text style={styles.body}>{a.body}</Text>
        <Text style={styles.date}>{date}</Text>
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
