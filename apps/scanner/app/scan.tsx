import { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';
import { getCredentials } from '../lib/credentials';
import { Colors } from '../lib/colors';
import { ResultOverlay } from '../components/ResultOverlay';
import type { ScanValidationResult } from '@simsim/types';

type ScanState = 'idle' | 'processing' | 'result';

function decodeJwtType(token: string): string | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const payload = JSON.parse(decoded);
    return payload.type ?? null;
  } catch {
    return null;
  }
}

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanValidationResult | null>(null);
  const scannedRef = useRef(false);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scannedRef.current || scanState !== 'idle') return;
    scannedRef.current = true;
    setScanState('processing');

    try {
      const creds = await getCredentials();
      if (!creds) {
        router.replace('/setup');
        return;
      }

      const type = decodeJwtType(data);
      let validationResult: ScanValidationResult;

      if (type === 'resident_access') {
        validationResult = await api.post<ScanValidationResult>('/scanner/validate-resident', {
          scanner_code: creds.scanner_code,
          qr_token: data,
        });
      } else if (type === 'guest_access') {
        validationResult = await api.post<ScanValidationResult>('/scanner/validate-pass', {
          scanner_code: creds.scanner_code,
          pass_token: data,
        });
      } else {
        validationResult = { result: 'denied', denial_reason: 'Invalid or unrecognised QR code' } as ScanValidationResult;
      }

      setResult(validationResult);
      setScanState('result');
    } catch (err) {
      setResult({
        result: 'denied',
        denial_reason: err instanceof Error ? err.message : 'Validation failed',
      } as ScanValidationResult);
      setScanState('result');
    }
  }

  function resetScan() {
    setResult(null);
    setScanState('idle');
    scannedRef.current = false;
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera access is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanState === 'idle' ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {scanState === 'processing' && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.processingText}>Validating...</Text>
        </View>
      )}

      {scanState === 'result' && result && (
        <ResultOverlay result={result} onDismiss={resetScan} />
      )}

      {scanState === 'idle' && (
        <View style={styles.viewfinder}>
          <View style={styles.corner} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      )}

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/setup')}
      >
        <Text style={styles.settingsText}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    gap: 16,
  },
  permissionText: { fontSize: 16, color: Colors.text, textAlign: 'center' },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  buttonText: { fontSize: 15, fontWeight: '600', color: Colors.onPrimary },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  processingText: { fontSize: 18, color: Colors.text, fontWeight: '600' },
  viewfinder: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    height: '40%',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: 0,
    left: 0,
  },
  cornerTR: {
    top: 0,
    left: undefined,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  cornerBL: {
    top: undefined,
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  cornerBR: {
    top: undefined,
    bottom: 0,
    left: undefined,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  settingsButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: { fontSize: 22, color: Colors.text },
});
