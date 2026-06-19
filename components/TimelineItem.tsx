import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, View } from 'react-native';

interface TimelineItemProps {
    type: 'inspection' | 'system' | 'alert';
    time: string;
    name?: string;
    role?: string;
    location?: string;
    content: string;
    gyroData?: { x: string; y: string };
    imageUri?: string;        // Foto profil user (avatar bubble)
    reportPhotoUri?: string;  // Foto bukti fisik lapangan
}

const getInitials = (name?: string) => {
    if (!name || name === 'Teknisi') return 'TK';
    const words = name.split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

export const TimelineItem = ({ type, time, name, role, location, content, gyroData, imageUri, reportPhotoUri }: TimelineItemProps) => {
    const isAlert = type === 'alert';

    return (
        <View className="flex-row gap-4 px-4 group">
            {/* Sidebar Time */}
            <View className="w-16 pt-1 items-end">
                <Text className="text-[10px] text-on-surface-variant font-mono">{time}</Text>
            </View>

            {/* Timeline Node & Line */}
            <View className="items-center">
                <View className={`w-3 h-3 rounded-full border-2 border-background z-20 ${type === 'alert' ? 'bg-secondary' : type === 'inspection' ? 'bg-primary' : 'bg-outline'}`} />
                <View className="flex-1 w-0.5 bg-surface-container-high mt-1" />
            </View>

            {/* Content Card */}
            <View className={`flex-1 mb-6 p-4 rounded-xl border border-outline-variant ${isAlert ? 'border-l-4 border-l-secondary' : 'bg-surface-container-lowest'}`}>
                {/* Header (Jika bukan system log) */}
                {type !== 'system' && (
                    <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center gap-2">
                            <View className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden items-center justify-center">
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} className="w-full h-full" />
                                ) : (
                                    <Text className="text-on-surface-variant text-[10px] font-bold">{getInitials(name)}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="font-bold text-sm text-on-surface">{name}</Text>
                                <Text className="text-[10px] text-on-surface-variant">{role}</Text>
                            </View>
                        </View>
                        <View className={`${isAlert ? 'bg-secondary-container' : 'bg-surface-container'} px-2 py-0.5 rounded`}>
                            <Text className="text-[10px] font-bold text-primary">{location}</Text>
                        </View>
                    </View>
                )}

                {/* Content Body */}
                <Text className="text-sm text-on-background mb-3">{content}</Text>

                {/* Sensor Readout */}
                {gyroData && (
                    <View className="bg-surface-container-low p-3 rounded-lg flex-row items-center">
                        <View className="flex-row items-center gap-1 border-r border-outline-variant pr-3 mr-3">
                            <MaterialIcons name="sensors" size={16} color="#041627" />
                            <Text className="text-[10px] font-bold tracking-widest">GYRO</Text>
                        </View>
                        <View className="flex-row gap-4">
                            <Text className="text-[10px] text-on-surface-variant">X: <Text className="font-bold text-on-surface">{gyroData.x}</Text></Text>
                            <Text className="text-[10px] text-on-surface-variant">Y: <Text className="font-bold text-secondary">{gyroData.y}</Text></Text>
                        </View>
                    </View>
                )}

                {/* Foto Bukti Fisik Lapangan (dari Firebase Storage) */}
                {reportPhotoUri && (
                    <View className="mt-3 rounded-lg overflow-hidden border border-outline-variant">
                        <Image
                            source={{ uri: reportPhotoUri }}
                            style={{ width: '100%', height: 160 }}
                            resizeMode="cover"
                        />
                        <View className="flex-row items-center gap-1 px-2 py-1 bg-surface-container">
                            <MaterialIcons name="photo-camera" size={10} color="#74777d" />
                            <Text className="text-[9px] text-on-surface-variant font-mono">BUKTI FISIK LAPANGAN</Text>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};