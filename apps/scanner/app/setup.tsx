import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { saveCredentials, clearCredentials } from '../lib/credentials';
import { Colors } from '../lib/colors';

export default function SetupScreen() {
  const router = useRouter();
  const [scannerCode, setScannerCode] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!scannerCode.trim() || !deviceKey.trim()) {
      setError('Both fields are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveCredentials({
        scanner_code: scannerCode.trim(),
        device_key: deviceKey.trim(),
      });
      router.replace('/scan');
    } catch {
      setError('Failed to save credentials');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    await clearCredentials();
    setScannerCode('');
    setDeviceKey('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>⬛</Text>
          </View>
          <Text style={styles.title}>Scanner Setup</Text>
          <Text style={styles.subtitle}>
            Enter the credentials for this scanner device
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Scanner Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. sc-1"
            placeholderTextColor={Colors.textSecondary}
            value={scannerCode}
            onChangeText={setScannerCode}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Device Key</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Paste device key here"
            placeholderTextColor={Colors.textSecondary}
            value={deviceKey}
            onChangeText={setDeviceKey}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Save & Start Scanning</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>Reset saved credentials</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  inner: { padding: 24, minHeight: '100%', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  inputMultiline: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  error: { fontSize: 13, color: Colors.denied },
  button: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600', color: Colors.onPrimary },
  resetButton: { alignItems: 'center', paddingVertical: 8 },
  resetText: { fontSize: 14, color: Colors.textSecondary },
});
