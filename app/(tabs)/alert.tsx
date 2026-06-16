import { AlertCard } from '@/components/AlertCard';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function AlertScreen() {
    return (
        <View className="flex-1 bg-background">
            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Header Summary */}
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-on-surface">Alert Center</Text>
                    <Text className="text-sm text-on-surface-variant">Critical Point Summary</Text>

                    <View className="flex-row gap-2 mt-4">
                        <View className="bg-error-container px-3 py-1.5 rounded-full flex-row items-center gap-1">
                            <MaterialIcons name="priority-high" size={14} color="#93000a" />
                            <Text className="text-[12px] font-bold text-on-error-container">1 Danger</Text>
                        </View>
                        <View className="bg-secondary-container px-3 py-1.5 rounded-full flex-row items-center gap-1">
                            <MaterialIcons name="warning" size={14} color="#221b00" />
                            <Text className="text-[12px] font-bold text-on-secondary-container">2 Warning</Text>
                        </View>
                    </View>
                </View>

                {/* List of Alerts */}
                <AlertCard
                    type="DANGER"
                    time="Active since 10:42 AM"
                    title="Pier 4 - South Column"
                    description="Structural tilt exceeds maximum safe threshold. Immediate assessment required."
                    metrics={[
                        { label: 'X-AXIS DEVIATION', value: '+4.2°' },
                        { label: 'RATE OF CHANGE', value: '+0.5°/hr' }
                    ]}
                />

                <AlertCard
                    type="WARNING"
                    time="11:15 AM"
                    title="East Wall - Section B"
                    description="Vibration anomaly detected during heavy excavation."
                    metrics={[
                        { label: 'PEAK VELOCITY', value: '18.5', unit: 'mm/s' },
                        { label: 'FREQUENCY', value: '42 Hz' }
                    ]}
                />

            </ScrollView>
        </View>
    );
}