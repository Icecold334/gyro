import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Impor Firebase Auth
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function ProfileScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // 1. Ambil data user saat pertama kali halaman diakses
    useEffect(() => {
        const currentUser = auth.currentUser;
        console.log(currentUser);

        if (currentUser) {
            setFullName(currentUser.displayName || 'Teknisi Lapangan');
            setEmail(currentUser.email || '');
        }
    }, []);

    // 2. Fungsi untuk menyimpan perubahan nama ke Firebase Auth
    const handleSaveIdentity = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Nama lengkap tidak boleh kosong!');
            return;
        }

        setIsSaving(true);
        try {
            const currentUser = auth.currentUser;

            if (currentUser) {
                // Update profile di sisi Firebase Auth Server
                await updateProfile(currentUser, {
                    displayName: fullName.trim()
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

    // 3. Fungsi untuk menghancurkan token session login (Secure Logout)
    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Bersihkan tumpukan navigasi dan lempar kembali ke halaman login
            router.replace('/auth/login');
        } catch (error) {
            console.error('Gagal melakukan logout:', error);
            Alert.alert('Error', 'Gagal memutus sesi login, silakan coba lagi.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
            style={{ flex: 1 }}
        >
            <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header */}
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
                            <Image
                                // Ambil foto dari firebase auth, jika kosong gunakan avatar dummy konstruksi standar
                                source={{ uri: auth.currentUser?.photoURL || 'https://placehold.co/150/041627/FFF?text=Tech' }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>
                        <TouchableOpacity className="absolute bottom-0 right-0 bg-primary h-9 w-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm active:scale-95">
                            <MaterialIcons name="photo-camera" size={16} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="items-center">
                        <Text className="text-lg font-bold text-on-surface">{fullName || 'Loading...'}</Text>
                        <View className="mt-2 px-2.5 py-1 bg-surface-container rounded-md">
                            {/* Menampilkan 5 digit terakhir UID sebagai ID Pekerja unik */}
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
                            editable={false} // Aturan Best Practice: Email Firebase Auth tidak boleh diedit sembarangan lewat input biasa
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
                        Access & Security
                    </Text>

                    <TouchableOpacity className="w-full bg-surface h-12 rounded-lg border border-outline flex-row items-center justify-between px-4 active:scale-95">
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
    );
}