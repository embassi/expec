import { Tabs, useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../lib/colors';
import { clearSession } from '../../lib/auth';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    QR: '⬛',
    Communities: '🏘',
    Passes: '🎫',
    News: '📢',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '•'}
    </Text>
  );
}

function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await clearSession();
    router.replace('/(auth)/phone');
  }
  return (
    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.onPrimary }}>Sign out</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.border,
        },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.onPrimary,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My QR',
          tabBarIcon: ({ focused }) => <TabIcon label="QR" focused={focused} />,
          headerRight: () => <LogoutButton />,
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ focused }) => <TabIcon label="Communities" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="passes"
        options={{
          title: 'Passes',
          tabBarIcon: ({ focused }) => <TabIcon label="Passes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'News',
          tabBarIcon: ({ focused }) => <TabIcon label="News" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
