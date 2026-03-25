import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storage-keys';

export interface SessionUser {
  id: string;
  phone_number: string;
  full_name: string | null;
  profile_photo_url: string | null;
  role_type: string;
}

export async function saveSession(token: string, user: SessionUser): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.ACCESS_TOKEN, token],
    [STORAGE_KEYS.USER, JSON.stringify(user)],
  ]);
}

export async function getSession(): Promise<{ token: string; user: SessionUser } | null> {
  const pairs = await AsyncStorage.multiGet([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.USER]);
  const token = pairs[0][1];
  const userJson = pairs[1][1];
  if (!token || !userJson) return null;
  try {
    return { token, user: JSON.parse(userJson) };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.USER]);
}
