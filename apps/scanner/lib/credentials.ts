import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storage-keys';

export interface ScannerCredentials {
  scanner_code: string;
  device_key: string;
}

export async function saveCredentials(creds: ScannerCredentials): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.SCANNER_CODE, creds.scanner_code],
    [STORAGE_KEYS.DEVICE_KEY, creds.device_key],
  ]);
}

export async function getCredentials(): Promise<ScannerCredentials | null> {
  const pairs = await AsyncStorage.multiGet([STORAGE_KEYS.SCANNER_CODE, STORAGE_KEYS.DEVICE_KEY]);
  const scanner_code = pairs[0][1];
  const device_key = pairs[1][1];
  if (!scanner_code || !device_key) return null;
  return { scanner_code, device_key };
}

export async function clearCredentials(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEYS.SCANNER_CODE, STORAGE_KEYS.DEVICE_KEY]);
}
