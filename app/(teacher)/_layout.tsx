import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { Text } from 'react-native';

const TAB_ICON: Record<string, string> = {
  index: '📡',
  students: '🎒',
  presences: '✅',
};

export default function TeacherLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          elevation: 10,
          height: 62,
          paddingBottom: 8,
        },
        tabBarLabel: ({ color }) => {
          const labels: Record<string, string> = {
            index: 'Scan NFC',
            students: 'Siswa',
            presences: 'Absensi',
          };
          return (
            <Text style={{ color, fontSize: 11, fontWeight: '600' }}>
              {labels[route.name] ?? route.name}
            </Text>
          );
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 22 }}>{TAB_ICON[route.name] ?? '•'}</Text>
        ),
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="students" />
      <Tabs.Screen name="presences" />
    </Tabs>
  );
}
