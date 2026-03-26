import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Colors } from '../../lib/colors';

const COUNTRIES = [
  { code: 'EG', name: 'Egypt', dial: '+2' },
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { code: 'AE', name: 'UAE', dial: '+971' },
  { code: 'KW', name: 'Kuwait', dial: '+965' },
  { code: 'QA', name: 'Qatar', dial: '+974' },
  { code: 'JO', name: 'Jordan', dial: '+962' },
  { code: 'LB', name: 'Lebanon', dial: '+961' },
  { code: 'FR', name: 'France', dial: '+33' },
];

export default function PhoneScreen() {
  const router = useRouter();
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = phone.trim().length >= 7 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    const fullNumber = country.dial + phone.trim();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/request-otp', { phone_number: fullNumber });
      router.push({ pathname: '/(auth)/otp', params: { phone: fullNumber } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          {/* Heading */}
          <View style={styles.headingRow}>
            <Text style={styles.headingBold}>AHLAN!</Text>
            <Text style={styles.headingLight}> Hello!</Text>
          </View>
          <Text style={styles.subtitle}>Enter your Whatsapp number to continue</Text>

          {/* Input */}
          <Text style={styles.label}>Whatsapp number</Text>
          <View style={styles.inputRow}>
            <Pressable style={styles.countrySelector} onPress={() => setPickerVisible(true)}>
              <Text style={styles.countrySelectorText}>{country.code}</Text>
              <Text style={styles.chevron}>▾</Text>
            </Pressable>
            <View style={styles.divider} />
            <TextInput
              style={styles.phoneInput}
              placeholder="01234567890"
              placeholderTextColor={Colors.textDisabled}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.buttonText}>Send OTP via Whatsapp</Text>
                <Text style={styles.buttonIcon}> 💬</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Country picker modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select country</Text>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.countryRow, item.code === country.code && styles.countryRowActive]}
                onPress={() => {
                  setCountry(item);
                  setPickerVisible(false);
                }}
              >
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDial}>{item.dial}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundCream },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
  },

  // Heading
  headingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  headingBold: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headingLight: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 32,
  },

  // Input
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 54,
    marginBottom: 12,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 4,
  },
  countrySelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  chevron: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.text,
  },

  error: { fontSize: 13, color: Colors.error, marginBottom: 8 },

  // Button
  button: {
    height: 54,
    backgroundColor: Colors.whatsappGreen,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  buttonIcon: {
    fontSize: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  countryRowActive: {
    backgroundColor: Colors.surface,
  },
  countryName: {
    fontSize: 15,
    color: Colors.text,
  },
  countryDial: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
