import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async () => {
        // Validasi dasar agar input tidak kosong
        if (!email || !password || (!isLogin && !displayName)) {
            Alert.alert('Error', 'Semua kolom harus diisi!');
            return;
        }

        try {
            if (isLogin) {
                // --- LOGIKA LOGIN ---
                await signInWithEmailAndPassword(auth, email, password);
                Alert.alert('Sukses', 'Berhasil masuk!');
            } else {
                // --- LOGIKA REGISTER ---
                // 1. Buat user di Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Simpan profil tambahan ke Firestore
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    displayName: displayName,
                    email: email,
                    photoURL: "",
                    createdAt: new Date().toISOString()
                });
                Alert.alert('Sukses', 'Akun berhasil dibuat!');
            }
            // Setelah sukses, pindah halaman
            router.replace('/workspaces');
        } catch (error) {
            console.error(error);
            Alert.alert('Gagal', error.message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-surface-container-low" style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}>

                    {/* Main Card */}
                    <View className="w-full bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">

                        {/* Header */}
                        <View className="p-8">
                            <View className="flex-row items-center gap-2 text-primary mb-8">
                                <MaterialIcons name="architecture" size={24} color="#041627" />
                                <Text className="font-bold text-lg tracking-widest uppercase">Monitoring Building with Gyro</Text>
                            </View>

                            <Text className="text-3xl font-bold text-on-surface mb-2">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </Text>
                            <Text className="text-on-surface-variant mb-8">
                                {isLogin ? 'Please sign in to access your dashboard.' : 'Sign up to get started with Site Alpha-7.'}
                            </Text>

                            {/* Tabs */}
                            <View className="flex-row border-b border-surface-container-highest mb-8">
                                <TouchableOpacity onPress={() => setIsLogin(true)} className={`flex-1 pb-3 items-center border-b-2 ${isLogin ? 'border-primary' : 'border-transparent'}`}>
                                    <Text className={`font-semibold ${isLogin ? 'text-primary' : 'text-on-surface-variant'}`}>Log In</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsLogin(false)} className={`flex-1 pb-3 items-center border-b-2 ${!isLogin ? 'border-primary' : 'border-transparent'}`}>
                                    <Text className={`font-semibold ${!isLogin ? 'text-primary' : 'text-on-surface-variant'}`}>Register</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Form */}
                            <View className="gap-4">
                                {!isLogin && (
                                    <TextInput
                                        placeholder="Profile Name"
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                        className="h-12 border border-outline rounded px-4 text-on-surface"
                                    />
                                )}
                                <TextInput
                                    placeholder="Email Address"
                                    value={email}
                                    onChangeText={setEmail}
                                    className="h-12 border border-outline rounded px-4 text-on-surface"
                                    keyboardType="email-address"
                                />
                                <TextInput
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    className="h-12 border border-outline rounded px-4 text-on-surface"
                                    secureTextEntry
                                />

                                {isLogin && (
                                    <TouchableOpacity className="items-end mt-1">
                                        <Text className="text-primary font-medium text-sm">Reset Password?</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    onPress={handleAuth}
                                    className="mt-4 h-12 bg-primary rounded-full flex-row items-center justify-center gap-2"
                                >
                                    <Text className="text-on-primary font-bold text-lg">{isLogin ? 'Log In' : 'Register'}</Text>
                                    <MaterialIcons name="arrow-forward" size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="p-4 items-center border-t border-surface-container-highest">
                            <View className="flex-row items-center gap-1">
                                <MaterialIcons name="security" size={14} color="#44474c" />
                                <Text className="text-[10px] text-on-surface-variant tracking-widest uppercase">Firebase Authentication</Text>
                            </View>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}