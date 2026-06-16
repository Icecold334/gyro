import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Komponen untuk Card Member
const MemberCard = ({ name, role, detail, avatar, isFounder = false }) => (
    <View className="flex-row items-center justify-between p-4 bg-white border border-[#c4c6cd] rounded-xl mb-3">
        <View className="flex-row items-center gap-4">
            <View className="relative w-12 h-12 rounded-full overflow-hidden bg-[#e9e7e9] items-center justify-center">
                {avatar ? (
                    <Image source={{ uri: avatar }} className="w-full h-full" />
                ) : (
                    <Text className="text-[#44474c] font-semibold">JD</Text>
                )}
                {isFounder && <View className="absolute bottom-0 right-0 w-3 h-3 bg-[#e9c400] border-2 border-white rounded-full" />}
            </View>
            <View>
                <Text className="text-[18px] font-semibold text-[#1b1c1d]">{name}</Text>
                <View className={`mt-1 px-2 py-0.5 rounded-sm self-start ${isFounder ? 'bg-[#041627]' : 'bg-[#e4e2e3]'}`}>
                    <Text className={`text-[12px] ${isFounder ? 'text-white' : 'text-[#44474c]'}`}>{role}</Text>
                </View>
            </View>
        </View>

        {!isFounder && (
            <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-lg hover:bg-[#ffdad6]">
                <MaterialIcons name="person-remove" size={20} color="#ba1a1a" />
            </TouchableOpacity>
        )}
    </View>
);

export default function TeamScreen() {
    return (
        <View className="flex-1 bg-[#fbf9fa]">
            {/* Header Section */}
            <View className="px-4 py-6">
                <View className="flex-row items-end justify-between mb-6">
                    <View>
                        <Text className="text-[18px] font-semibold text-[#1b1c1d] mb-1">Project Directory</Text>
                        <Text className="text-[16px] text-[#44474c]">Active personnel on Site Alpha-7.</Text>
                    </View>
                    <TouchableOpacity className="flex-row items-center justify-center h-10 px-4 bg-[#041627] rounded-lg">
                        <MaterialIcons name="person-add" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text className="text-[#ffffff] text-[12px] font-medium">Invite</Text>
                    </TouchableOpacity>
                </View>

                {/* Member List */}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <MemberCard
                        name="Robert Vance"
                        role="Founder/Creator"
                        isFounder={true}
                        avatar="https://via.placeholder.com/150"
                    />
                    <MemberCard
                        name="Elena Rostova"
                        role="Member"
                        avatar="https://via.placeholder.com/150"
                    />
                    <MemberCard
                        name="Jackson Davis"
                        role="Member"
                    />
                </ScrollView>
            </View>
        </View>
    );
}