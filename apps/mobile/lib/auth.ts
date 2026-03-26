import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from './storage-keys';

export interface SessionUser {
  id: string;
  phone_number: string;
  full_name: string | null;
  profile_photo_url: string | null;
  role_type: string;
}

export async function saveSession(token: string, user: SessionUser): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token),
    SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
  ]);
}

export async function getSession(): Promise<{ token: string; user: SessionUser } | null> {
  const [token, userJson] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.getItemAsync(STORAGE_KEYS.USER),
  ]);
  if (!token || !userJson) return null;
  try {
    return { token, user: JSON.parse(userJson) };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
  ]);
}
