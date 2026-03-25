import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../lib/colors';

interface Props {
  token: string;
  size?: number;
}

export function QrCode({ token, size = 220 }: Props) {
  return (
    <View style={[styles.frame, { width: size + 24, height: size + 24 }]}>
      <QRCode
        value={token}
        size={size}
        color={Colors.text}
        backgroundColor={Colors.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 3,
    borderColor: Colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 12,
  },
});
