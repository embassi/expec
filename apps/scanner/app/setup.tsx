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
import { saveCredentials, clearCredentials, saveUserToken } from '../lib/credentials';
import { api } from '../lib/api';
import { Colors } from '../lib/colors';

type Tab = 'credentials' | 'phone';
type PhoneStep = 'phone' | 'otp';

export default function SetupScreen() {
  const router = useRouter();

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('credentials');

  // Credentials tab
  const [scannerCode, setScannerCode] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [credError, setCredError] = useState('');

  // Phone login tab
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  async function handleSave() {
    if (!scannerCode.trim() || !deviceKey.trim()) {
      setCredError('Both fields are required');
      return;
    }
    setSaving(true);
    setCredError('');
    try {
      await saveCredentials({
        scanner_code: scannerCode.trim(),
        device_key: deviceKey.trim(),
      });
      router.replace('/scan');
    } catch {
      setCredError('Failed to save credentials');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    await clearCredentials();
    setScannerCode('');
    setDeviceKey('');
    setPhone('');
    setOtp('');
    setPhoneStep('phone');
  }

  async function handleRequestOtp() {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setPhoneLoading(true);
    setPhoneError('');
    try {
      await api.post('/auth/request-otp', { phone_number: trimmed });
      setPhoneStep('otp');
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) return;
    setPhoneLoading(true);
    setPhoneError('');
    try {
      const res = await api.post<{ access_token: string }>('/auth/verify-otp', {
        phone_number: phone.trim(),
        otp,
      });
      await saveUserToken(res.access_token);
      router.replace('/scan');
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Invalid OTP');
      setOtp('');
    } finally {
      setPhoneLoading(false);
    }
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
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'credentials' && styles.tabActive]}
            onPress={() => setActiveTab('credentials')}
          >
            <Text style={[styles.tabText, activeTab === 'credentials' && styles.tabTextActive]}>
              Scanner Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'phone' && styles.tabActive]}
            onPress={() => setActiveTab('phone')}
          >
            <Text style={[styles.tabText, activeTab === 'phone' && styles.tabTextActive]}>
              Login with Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Credentials tab */}
        {activeTab === 'credentials' && (
          <View style={styles.form}>
            <Text style={styles.subtitle}>Enter the credentials for this scanner device</Text>

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

            {credError ? <Text style={styles.error}>{credError}</Text> : null}

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
        )}

        {/* Phone login tab */}
        {activeTab === 'phone' && (
          <View style={styles.form}>
            {phoneStep === 'phone' ? (
              <>
                <Text style={styles.subtitle}>Login with your phone number. Your account must have a scanner assigned to it.</Text>

                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+201234567890"
                  placeholderTextColor={Colors.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleRequestOtp}
                />

                {phoneError ? <Text style={styles.error}>{phoneError}</Text> : null}

                <TouchableOpacity
                  style={[styles.button, (phoneLoading || !phone.trim()) && styles.buttonDisabled]}
                  onPress={handleRequestOtp}
                  disabled={phoneLoading || !phone.trim()}
                >
                  {phoneLoading ? (
                    <ActivityIndicator color={Colors.onPrimary} />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP via WhatsApp</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.subtitle}>Enter the 6-digit code sent to {phone} via WhatsApp</Text>

                <Text style={styles.label}>Verification code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor={Colors.textSecondary}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                />

                {phoneError ? <Text style={styles.error}>{phoneError}</Text> : null}

                <TouchableOpacity
                  style={[styles.button, (phoneLoading || otp.length < 6) && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={phoneLoading || otp.length < 6}
                >
                  {phoneLoading ? (
                    <ActivityIndicator color={Colors.onPrimary} />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.resetButton} onPress={() => { setPhoneStep('phone'); setOtp(''); setPhoneError(''); }}>
                  <Text style={styles.resetText}>Change number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  inner: { padding: 24, minHeight: '100%', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
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
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  tabBar: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    marginBottom: 28,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.onPrimary },
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
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
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
