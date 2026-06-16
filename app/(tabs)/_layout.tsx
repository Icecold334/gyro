import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: true, // Pastikan true
      headerStyle: { backgroundColor: '#fbf9fa' }, // Sesuai warna background kamu
      headerTitleStyle: { fontWeight: 'bold', color: '#041627' },
      headerTitle: 'Project: Site Alpha-7',
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => router.replace('/workspaces')}
          style={{ marginLeft: 16 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#041627" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          style={{ marginRight: 16 }}
        >
          <MaterialIcons name="person" size={24} color="#44474c" />
        </TouchableOpacity>
      )
    }}>
      <Tabs.Screen name="monitor" options={{ title: 'Monitor', tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} /> }} />
      <Tabs.Screen name="gyro" options={{ title: 'Gyro', tabBarIcon: ({ color }) => <MaterialIcons name="sensors" size={24} color={color} /> }} />
      <Tabs.Screen name="timeline" options={{ title: 'Timeline', tabBarIcon: ({ color }) => <MaterialIcons name="history" size={24} color={color} /> }} />
      <Tabs.Screen name="team" options={{ title: 'Team', tabBarIcon: ({ color }) => <MaterialIcons name="group" size={24} color={color} /> }} />
      <Tabs.Screen name="alert" options={{ title: 'Alerts', tabBarIcon: ({ color }) => <MaterialIcons name="warning-amber" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}