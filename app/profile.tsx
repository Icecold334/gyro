import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, storage } from '../firebaseConfig';

export default function ProfileScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Ambil data user saat pertama kali halaman diakses
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setEmail(currentUser.email || '');
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFullName(data.displayName || currentUser.displayName || 'Teknisi Lapangan');
            setPhotoURL(data.photoURL || currentUser.photoURL || null);
          } else {
            setFullName(currentUser.displayName || 'Teknisi Lapangan');
            setPhotoURL(currentUser.photoURL || null);
          }
        } catch (error) {
          console.error('Gagal mengambil data user dari firestore', error);
          setFullName(currentUser.displayName || 'Teknisi Lapangan');
          setPhotoURL(currentUser.photoURL || null);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleChangePassword = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      Alert.alert('Error', 'Sesi pengguna tidak valid. Silakan login kembali.');
      return;
    }
    Alert.alert(
      'Ubah Password',
      `Sistem akan mengirimkan tautan (link) pengaturan ulang password baru ke email Anda:\n\n${currentUser.email}`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kirim Email',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, currentUser.email!);
              Alert.alert(
                'Email Terkirim',
                'Tautan untuk mengubah password telah berhasil dikirim! Silakan periksa kotak masuk atau folder spam email Anda.'
              );
            } catch (error: any) {
              console.error('Gagal mengirim email reset password:', error);
              Alert.alert('Gagal', `Terjadi kesalahan: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Akses ke galeri dibutuhkan untuk mengubah foto profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsUploadingPhoto(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileRef = ref(storage, `profiles/${currentUser.uid}.jpg`);
      await uploadBytes(fileRef, blob);
      const downloadUrl = await getDownloadURL(fileRef);

      await updateProfile(currentUser, { photoURL: downloadUrl });
      await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: downloadUrl });

      setPhotoURL(downloadUrl);
      Alert.alert('Sukses', 'Foto profil berhasil diperbarui!');
    } catch (error: any) {
      console.error('Gagal mengupload foto:', error);
      Alert.alert('Error', `Gagal mengupload foto: ${error.message}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveIdentity = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Nama lengkap tidak boleh kosong!');
      return;
    }

    setIsSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { displayName: fullName.trim() });
        await updateDoc(doc(db, 'users', currentUser.uid), {
          displayName: fullName.trim(),
        });
        Alert.alert('Sukses', 'Nama identitas berhasil diperbarui!');
      }
    } catch (error: any) {
      console.error('Gagal memperbarui profil:', error);
      Alert.alert('Gagal', `Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Gagal melakukan logout:', error);
      Alert.alert('Error', 'Gagal memutus sesi login, silakan coba lagi.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fbf9fa' }}>
      {/* Header — sama persis dengan details.tsx */}
      <View
        style={{
          height: 56,
          backgroundColor: '#fbf9fa',
          borderBottomWidth: 1,
          borderBottomColor: '#e3e3e3',
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#041627" />
        </TouchableOpacity>
        <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#041627' }}>Gyro</Text>
        {/* Spacer agar judul tetap di tengah */}
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-4 py-6"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header Section */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-primary">Universal Settings</Text>
            <Text className="text-sm text-on-surface-variant mt-1">
              Manage your identity and access credentials across all site nodes.
            </Text>
          </View>

          {/* Profile Card Section */}
          <View className="bg-white border border-outline-variant rounded-xl p-5 items-center gap-4 mb-6 shadow-sm relative overflow-hidden">
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center overflow-hidden">
                {isUploadingPhoto ? (
                  <ActivityIndicator color="#041627" />
                ) : (
                  <Image
                    source={{ uri: photoURL || 'https://placehold.co/150/041627/FFF?text=Tech' }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                )}
              </View>
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 bg-primary h-9 w-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm active:scale-95"
              >
                <MaterialIcons name="photo-camera" size={16} color="white" />
              </TouchableOpacity>
            </View>

            <View className="items-center">
              <Text className="text-lg font-bold text-on-surface">{fullName || 'Loading...'}</Text>
              <View className="mt-2 px-2.5 py-1 bg-surface-container rounded-md">
                <Text className="text-[10px] font-bold text-on-surface-variant font-mono">
                  ID: TECH-{auth.currentUser?.uid.substring(0, 5).toUpperCase() || 'ID'}
                </Text>
              </View>
            </View>
          </View>

          {/* Identity Data Form Section */}
          <View className="bg-white border border-outline-variant rounded-xl p-5 gap-4 mb-6 shadow-sm">
            <Text className="text-[11px] font-bold text-primary uppercase tracking-widest border-b border-outline-variant pb-2">
              Identity Data
            </Text>

            <View className="gap-2">
              <Text className="text-xs font-bold text-on-surface-variant">Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                className="w-full bg-surface border border-outline rounded-lg px-4 h-12 text-on-surface"
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-bold text-on-surface-variant">System Email</Text>
              <TextInput
                value={email}
                editable={false}
                className="w-full bg-gray-100 border border-outline rounded-lg px-4 h-12 text-gray-500"
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveIdentity}
              disabled={isSaving}
              className="mt-2 w-full bg-surface-container-high h-12 rounded-lg border border-outline-variant flex-row items-center justify-center gap-2 active:scale-95"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#041627" />
              ) : (
                <>
                  <MaterialIcons name="save" size={18} color="#041627" />
                  <Text className="text-primary font-bold text-sm">Save Identity Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Access & Security Section */}
          <View className="bg-white border border-outline-variant rounded-xl p-5 gap-4 shadow-sm">
            <Text className="text-[11px] font-bold text-primary uppercase tracking-widest border-b border-outline-variant pb-2">
              Access &amp; Security
            </Text>

            <TouchableOpacity
              onPress={handleChangePassword}
              className="w-full bg-surface h-12 rounded-lg border border-outline flex-row items-center justify-between px-4 active:scale-95"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="lock-reset" size={20} color="#74777d" />
                <Text className="text-on-surface font-bold text-sm">Change Password</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#74777d" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="w-full bg-error h-12 rounded-lg flex-row items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <MaterialIcons name="logout" size={18} color="white" />
              <Text className="text-white font-bold text-sm">Secure Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
