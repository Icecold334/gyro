import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface AlertCardProps {
    type: 'DANGER' | 'WARNING';
    time: string;
    title: string;
    description: string;
    metrics: { label: string; value: string; unit?: string }[];
}

export const AlertCard = ({ type, time, title, description, metrics }: AlertCardProps) => {
    const isDanger = type === 'DANGER';

    return (
        <View className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex-col gap-4 overflow-hidden mb-4">
            {/* Accent Bar */}
            <View className={`absolute left-0 top-0 bottom-0 w-1 ${isDanger ? 'bg-error' : 'bg-secondary-container'}`} />

            {/* Header */}
            <View className="pl-2 flex-row justify-between items-center">
                <View className={`px-2 py-1 rounded-[4px] flex-row items-center gap-1 ${isDanger ? 'bg-error' : 'bg-secondary-container'}`}>
                    <MaterialIcons name="warning" size={14} color={isDanger ? '#ffffff' : '#221b00'} />
                    <Text className={`font-bold text-[12px] ${isDanger ? 'text-on-error' : 'text-on-secondary-container'}`}>
                        {type}
                    </Text>
                </View>
                <Text className="text-sm text-on-surface-variant">{time}</Text>
            </View>

            {/* Content */}
            <View className="pl-2">
                <Text className="font-bold text-lg text-on-surface">{title}</Text>
                <Text className="text-sm text-on-surface-variant mt-1">{description}</Text>
            </View>

            {/* Metrics Bento */}
            <View className="bg-surface p-4 rounded-lg gap-3 pl-2">
                {metrics.map((m, i) => (
                    <View key={i}>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-[10px] text-outline font-bold tracking-widest">{m.label}</Text>
                            <Text className={`font-bold text-lg ${isDanger ? 'text-error' : 'text-on-surface'}`}>
                                {m.value} {m.unit && <Text className="text-[14px] text-on-surface-variant">{m.unit}</Text>}
                            </Text>
                        </View>
                        {i < metrics.length - 1 && <View className="h-[1px] bg-outline-variant opacity-50 my-1" />}
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View className="pl-2 flex-row gap-3">
                <TouchableOpacity 
                    onPress={() => router.push({
                        pathname: '/details',
                        params: { 
                            title, 
                            status: type, 
                            gyroX: metrics[0]?.value || '+0.0°', 
                            gyroY: metrics[1]?.value || '+0.0°',
                            color: isDanger ? '#ba1a1a' : '#ffe16d'
                        }
                    })}
                    className="flex-1 bg-primary h-12 rounded-lg justify-center items-center flex-row gap-2"
                >
                    <Text className="text-on-primary font-bold">Jump to Point</Text>
                    <MaterialIcons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity className="h-12 w-12 border border-outline-variant rounded-lg justify-center items-center">
                    <MaterialIcons name="location-on" size={20} color="#44474c" />
                </TouchableOpacity>
            </View>
        </View>
    );
};