import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react'; // Tambah useEffect & useState
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
// Tambahkan import Firebase dan Zustand Store
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useProjectStore } from '../../projectStore';

interface Member {
    id: string;
    userId: string;
    projectName: string;
    role: 'leader' | 'tukang';
    joinedAt: string;
    // Kita tambahkan field nama untuk di-render, jika di collection belum ada, 
    // nanti kita bisa pakai data fallback atau gabungkan dari collection users.
    displayName?: string;
}

const getInitials = (name: string) => {
    if (!name) return '??';
    const words = name.split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

// Komponen untuk Card Member
const MemberCard = ({ id, name, role, avatar, isFounder = false, onKick }) => (
    <View className="flex-row items-center justify-between p-4 bg-white border border-[#c4c6cd] rounded-xl mb-3">
        <View className="flex-row items-center gap-4">
            <View className="relative w-12 h-12 rounded-full overflow-hidden bg-[#e9e7e9] items-center justify-center">
                {avatar ? (
                    <Image source={{ uri: avatar }} className="w-full h-full" />
                ) : (
                    // Di sini diganti menggunakan fungsi inisial
                    <Text className="text-[#44474c] font-semibold">{getInitials(name)}</Text>
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
            <TouchableOpacity
                onPress={() => onKick(id, name)} // TAMBAHKAN BARIS INI
                className="w-10 h-10 items-center justify-center rounded-lg hover:bg-[#ffdad6]"
            >
                <MaterialIcons name="person-remove" size={20} color="#ba1a1a" />
            </TouchableOpacity>
        )}
    </View>
);

export default function TeamScreen() {
    const activeProjectId = useProjectStore((state) => state.activeProjectId);
    const [members, setMembers] = useState<Member[]>([]);
    const handleKickMember = (membershipId: string, memberName: string) => {
        Alert.alert(
            'Konfirmasi Kick',
            `Apakah Anda yakin ingin mengeluarkan ${memberName} dari proyek ini?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Keluarkan',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Menunjuk langsung ke dokumen: /project_members/{membershipId}
                            await deleteDoc(doc(db, 'project_members', membershipId));
                            alert('Anggota berhasil dikeluarkan!');
                        } catch (error: any) {
                            alert(`Gagal mengeluarkan anggota: ${error.message}`);
                        }
                    }
                }
            ]
        );
    };
    useEffect(() => {
        if (!activeProjectId) return;

        // Kueri: Ambil data dari project_members yang projectId-nya cocok dengan proyek aktif
        const membersRef = collection(db, 'project_members');
        const q = query(membersRef, where('projectId', '==', activeProjectId));
        console.log(query(collection(db, 'users')));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const memberList: Member[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                console.log(data);

                memberList.push({
                    id: doc.id,
                    userId: data.userId,
                    projectName: data.projectName,
                    role: data.role,
                    joinedAt: data.joinedAt,
                    displayName: data.displayName || 'Pekerja Lapangan', // Fallback nama sementara
                });
            });
            setMembers(memberList);
        });

        return () => unsubscribe();
    }, [activeProjectId]);
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
                <ScrollView showsVerticalScrollIndicator={false}>
                    {members.length === 0 ? (
                        <View className="p-8 items-center">
                            <Text className="text-[#44474c] text-sm text-center">Belum ada anggota di proyek ini.</Text>
                        </View>
                    ) : (
                        members.map((member) => (
                            <MemberCard
                                key={member.id}
                                id={member.id} // Kirim ID Dokumen
                                name={member.displayName || 'Pekerja Lapangan'}
                                role={member.role === 'leader' ? 'Leader / Creator' : 'Member'}
                                isFounder={member.role === 'leader'}
                                avatar={null}
                                onKick={handleKickMember} // Kirim Fungsi Hapus
                            />
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
}