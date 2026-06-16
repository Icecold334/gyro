import { TimelineItem } from '@/components/TimelineItem';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function TimelineScreen() {
    return (
        <View className="flex-1 bg-background">
            <ScrollView className="flex-1 py-8">
                <View className="px-6 mb-8">
                    <Text className="text-2xl font-bold text-on-background">Activity Logs</Text>
                    <Text className="text-sm text-on-surface-variant">Chronological feed of structural submissions.</Text>
                </View>

                <TimelineItem
                    type="inspection"
                    time="14:32"
                    name="Sarah Jenkins"
                    role="Field Tech Lead"
                    location="Pillar C-4"
                    content="Visual inspection completed. Minor surface spalling detected."
                    gyroData={{ x: '+0.014°', y: '-0.002°' }}
                />

                <TimelineItem
                    type="system"
                    time="11:05"
                    content="Global baseline reset performed across Sector 4. All targets aligned."
                />

                <TimelineItem
                    type="alert"
                    time="09:15"
                    name="David Chen"
                    role="Structural Lead"
                    location="Beam F-12"
                    content="Noted minor variance in Y-axis during morning load test."
                    gyroData={{ x: '+0.001°', y: '+0.045°' }}
                />

                <TouchableOpacity className="flex-row items-center justify-center gap-2 border border-outline-variant py-3 mx-10 rounded-full mb-10">
                    <MaterialIcons name="refresh" size={18} color="#041627" />
                    <Text className="text-sm font-bold text-primary">Load Previous</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}