import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { useProjectStore } from '../../projectStore';

export default function TabLayout() {
  const activeProjectName = useProjectStore((state) => state.activeProjectName);

  // User profile state
  const [userProfile, setUserProfile] = useState({ name: 'US', photoURL: null });

  // Fetch user profile on mount
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    async function fetchUser() {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile({
            name: data.displayName || currentUser.displayName || 'US',
            photoURL: data.photoURL || currentUser.photoURL || null,
          });
        } else {
          setUserProfile({
            name: currentUser.displayName || 'US',
            photoURL: currentUser.photoURL || null,
          });
        }
      } catch (e) {
        setUserProfile({
          name: currentUser.displayName || 'US',
          photoURL: currentUser.photoURL || null,
        });
      }
    }
    fetchUser();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'US';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  return (
    <Tabs screenOptions={{
      headerShown: true, // Pastikan true
      headerStyle: { backgroundColor: '#fbf9fa' }, // Sesuai warna background kamu
      headerTitleStyle: { fontWeight: 'bold', color: '#041627' },
      headerTitle: activeProjectName ? `${activeProjectName}` : 'Project',
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
          style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
        >
          {userProfile.photoURL ? (
            <Image
              source={{ uri: userProfile.photoURL }}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
              <Text className="text-white font-bold text-sm">{getInitials(userProfile.name)}</Text>
            </View>
          )}
        </TouchableOpacity>
      )
    }}>
      <Tabs.Screen name="monitor" options={{ title: 'Monitor', tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} /> }} />
      <Tabs.Screen name="gyro" options={{ title: 'Gyro', tabBarIcon: ({ color }) => <MaterialIcons name="sensors" size={24} color={color} /> }} />
      <Tabs.Screen name="timeline" options={{ title: 'Timeline', tabBarIcon: ({ color }) => <MaterialIcons name="history" size={24} color={color} /> }} />
      <Tabs.Screen name="team" options={{ title: 'Team', tabBarIcon: ({ color }) => <MaterialIcons name="group" size={24} color={color} /> }} />
      <Tabs.Screen name="alert" options={{ title: 'Alerts', tabBarIcon: ({ color }) => <MaterialIcons name="warning-amber" size={24} color={color} /> }} />

    </Tabs>
  );
}