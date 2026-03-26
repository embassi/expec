import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Colors } from '../../lib/colors';
import { clearSession } from '../../lib/auth';

interface MeProfile {
  id: string;
  phone_number: string;
  full_name: string | null;
  profile_photo_url: string | null;
  status: string;
  created_at: string;
}

interface SignedUploadResponse {
  signed_url: string;
  path: string;
  bucket: string;
  public_url: string;
}

const AVATAR_SIZE = 96;

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const initialized = useRef(false);

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeProfile>('/me'),
  });

  // Populate name field once after first load
  useEffect(() => {
    if (me && !initialized.current) {
      setName(me.full_name ?? '');
      initialized.current = true;
    }
  }, [me]);

  const hasNameChanged = name !== (me?.full_name ?? '');

  const saveName = useMutation({
    mutationFn: () =>
      api.patch<MeProfile>('/me', { full_name: name.trim() || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
    onError: (err) => {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save name.');
    },
  });

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please allow access to your photo library in Settings.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      // 1. Get a signed upload URL from our API
      const { signed_url, public_url } = await api.post<SignedUploadResponse>(
        '/upload/sign',
        {
          type: 'profile-photo',
          content_type: 'image/jpeg',
          file_size: asset.fileSize ?? 500_000,
        },
      );

      // 2. Upload the image bytes directly to the signed URL
      const imgResponse = await fetch(asset.uri);
      const blob = await imgResponse.blob();
      const uploadResponse = await fetch(signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      if (!uploadResponse.ok) throw new Error('Photo upload failed');

      // 3. Persist the public URL on the user profile
      await api.patch('/me', { profile_photo_url: public_url });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      Alert.alert(
        'Upload failed',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          router.replace('/(auth)/phone');
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const initials = (me?.full_name ?? me?.phone_number ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const memberSince = me?.created_at
    ? new Date(me.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={handlePickPhoto}
          disabled={uploadingPhoto}
          activeOpacity={0.8}
        >
          {me?.profile_photo_url ? (
            <Image
              source={{ uri: me.profile_photo_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {uploadingPhoto && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color={Colors.onPrimary} />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change photo</Text>
      </View>

      {/* Display name */}
      <View style={styles.section}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={Colors.textDisabled}
          returnKeyType="done"
          onSubmitEditing={() => hasNameChanged && saveName.mutate()}
        />
        {hasNameChanged && (
          <TouchableOpacity
            style={[styles.saveBtn, saveName.isPending && styles.saveBtnDisabled]}
            onPress={() => saveName.mutate()}
            disabled={saveName.isPending}
          >
            {saveName.isPending ? (
              <ActivityIndicator color={Colors.onPrimary} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save name</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Phone (read-only) */}
      <View style={styles.section}>
        <Text style={styles.label}>Phone number</Text>
        <View style={styles.readOnly}>
          <Text style={styles.readOnlyText}>{me?.phone_number}</Text>
        </View>
      </View>

      {/* Member since */}
      {memberSince && (
        <View style={styles.section}>
          <Text style={styles.label}>Member since</Text>
          <View style={styles.readOnly}>
            <Text style={styles.readOnlyText}>{memberSince}</Text>
          </View>
        </View>
      )}

      {/* Sign out */}
      <View style={styles.signOutSection}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 34, fontWeight: '700', color: Colors.onPrimary },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cameraIconText: { fontSize: 14, lineHeight: 18 },
  avatarHint: { marginTop: 10, fontSize: 13, color: Colors.textSecondary },

  section: { marginBottom: 20, gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  saveBtn: {
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: Colors.onPrimary },
  readOnly: {
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  readOnlyText: { fontSize: 16, color: Colors.textSecondary },

  signOutSection: { marginTop: 16 },
  signOutBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: Colors.error },
});
