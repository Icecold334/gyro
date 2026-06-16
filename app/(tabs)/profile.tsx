import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const [fullName, setFullName] = useState('Field Operator 04');
    const [email, setEmail] = useState('operator04@alpha7.sys');

    const handleLogout = () => {
        // Log out logic, redirect back to login screen
        router.replace('/auth/login');
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
                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAytXRPcjbZdngURbm5tiG3_024ekYdsivJwisGtvE9mneoShsAfSyOi5G9GlIIzFxI8bmmYA8h0kM5mQsl0JS2gt5ril2VvAdVdk-j1rhatto_me8pI7sbLHUCz4AJBsLape9U9Q_dccSBeQ-J3JCu9HnAmDiJFyANSyaAeqlXlDSoal6RsTedJVCRSNbC7i6_uugrEHXiK3RLEZhW0XE1FlVtr7Si5FxMuU75jcPTtHImKPtdFuVXIcVWC879j_o-deg2YTQVUFM' }} 
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>
                        <TouchableOpacity className="absolute bottom-0 right-0 bg-primary h-9 w-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm active:scale-95">
                            <MaterialIcons name="photo-camera" size={16} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="items-center">
                        <Text className="text-lg font-bold text-on-surface">{fullName}</Text>
                        <View className="mt-2 px-2.5 py-1 bg-surface-container rounded-md">
                            <Text className="text-[10px] font-bold text-on-surface-variant font-mono">ID: ALPHA-7-892</Text>
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
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            className="w-full bg-surface border border-outline rounded-lg px-4 h-12 text-on-surface"
                        />
                    </View>

                    <TouchableOpacity className="mt-2 w-full bg-surface-container-high h-12 rounded-lg border border-outline-variant flex-row items-center justify-center gap-2 active:scale-95">
                        <MaterialIcons name="save" size={18} color="#041627" />
                        <Text className="text-primary font-bold text-sm">Save Identity Changes</Text>
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
