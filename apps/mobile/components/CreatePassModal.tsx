import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { api } from '../lib/api';
import { Colors } from '../lib/colors';

interface Community {
  id: string;
  name: string;
}

interface Props {
  visible: boolean;
  communities: Community[];
  onClose: () => void;
  onCreated: (pass: unknown) => void;
}

const PASS_TYPES = [
  { value: 'guest', label: 'Guest' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'service_provider', label: 'Service Provider' },
];

export function CreatePassModal({ visible, communities, onClose, onCreated }: Props) {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [passType, setPassType] = useState('guest');
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setGuestName('');
    setGuestPhone('');
    setPassType('guest');
    setCommunityId(communities[0]?.id ?? '');
    setError('');
  }

  async function handleCreate() {
    if (!guestName.trim() || !guestPhone.trim() || !communityId) return;
    setSaving(true);
    setError('');
    try {
      const pass = await api.post('/guest-passes', {
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        pass_type: passType,
        community_id: communityId,
      });
      onCreated(pass);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pass');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>New Guest Pass</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Guest name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={Colors.textDisabled}
            value={guestName}
            onChangeText={setGuestName}
          />

          <Text style={styles.label}>Guest phone *</Text>
          <TextInput
            style={styles.input}
            placeholder="+201234567890"
            placeholderTextColor={Colors.textDisabled}
            value={guestPhone}
            onChangeText={setGuestPhone}
            keyboardType="phone-pad"
          />

          {communities.length > 1 && (
            <>
              <Text style={styles.label}>Community</Text>
              <View style={styles.optionRow}>
                {communities.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.option, communityId === c.id && styles.optionActive]}
                    onPress={() => setCommunityId(c.id)}
                  >
                    <Text style={[styles.optionText, communityId === c.id && styles.optionTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Pass type</Text>
          <View style={styles.optionRow}>
            {PASS_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.option, passType === t.value && styles.optionActive]}
                onPress={() => setPassType(t.value)}
              >
                <Text style={[styles.optionText, passType === t.value && styles.optionTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Create Pass</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  closeText: { fontSize: 16, color: Colors.textSecondary },
  form: { padding: 20, gap: 12 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionText: { fontSize: 14, color: Colors.textSecondary },
  optionTextActive: { color: Colors.primaryDark, fontWeight: '600' },
  error: { fontSize: 13, color: Colors.error },
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
});
