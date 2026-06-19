import { TimelineItem } from '@/components/TimelineItem';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
// Impor Firebase & Zustand Store
import { collectionGroup, onSnapshot, orderBy, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useProjectStore } from '../../projectStore';

interface DynamicTimelineItem {
    id: string;
    type: 'inspection' | 'system' | 'alert';
    time: string;
    name?: string;
    role?: string;
    location: string;
    content: string;
    gyroData?: { x: string; y: string };
    avatarUri?: string;   // Foto profil user (untuk avatar bubble)
    imageUri?: string;    // Foto bukti fisik lapangan (dari Storage)
}

export default function TimelineScreen() {
    const activeProjectId = useProjectStore((state) => state.activeProjectId);
    const [logs, setLogs] = useState<DynamicTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeProjectId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // 1. Kueri menggunakan collectionGroup untuk menembus semua sub-collection 'reports'
        const globalReportsRef = collectionGroup(db, 'reports');

        // 2. Filter: Ambil yang 'projectId' nya cocok (Kita perlu pastikan field ini dikirim saat submit di gyro.tsx)
        // Dan urutkan berdasarkan laporan terbaru
        const q = query(
            globalReportsRef,
            where('projectId', '==', activeProjectId),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const loadedLogs: DynamicTimelineItem[] = [];

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();

                const rawX = data.gyroX || 0;
                const rawY = data.gyroY || 0;
                const isAlert = Math.abs(rawX) > 2 || Math.abs(rawY) > 2;

                // Format Jam untuk UI
                const jsDate = data.timestamp?.toDate() ? data.timestamp.toDate() : new Date();
                const timeString = jsDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                loadedLogs.push({
                    id: docSnap.id,
                    type: isAlert ? 'alert' : 'inspection',
                    time: timeString,
                    name: data.submittedBy, // Store userId temporarily
                    role: 'Field Worker',
                    location: data.pointName || 'Unknown Point',
                    content: `Telah melakukan penguncian telemetri pada koordinat sumbu struktur.`,
                    gyroData: {
                        x: `${rawX >= 0 ? '+' : ''}${rawX.toFixed(3)}°`,
                        y: `${rawY >= 0 ? '+' : ''}${rawY.toFixed(3)}°`
                    },
                    imageUri: data.photoUrl || undefined,  // ✅ Foto bukti fisik dari Storage
                    avatarUri: undefined,                  // Diisi saat fetch user di bawah
                });
            });

            // Fetch actual user names
            for (let i = 0; i < loadedLogs.length; i++) {
                const userId = loadedLogs[i].name;
                if (!userId || userId === 'anonymous') {
                    loadedLogs[i].name = 'Teknisi';
                    continue;
                }

                try {
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        loadedLogs[i].name = userData.displayName || userData.email || `User ${userId.substring(0, 5)}`;
                        loadedLogs[i].avatarUri = userData.photoURL || undefined; // ✅ Foto profil untuk avatar
                        // imageUri sudah diisi dari data.photoUrl (bukti fisik), tidak di-overwrite
                    } else {
                        loadedLogs[i].name = `User ${userId.substring(0, 5)}`;
                    }
                } catch (e) {
                    loadedLogs[i].name = `User ${userId.substring(0, 5)}`;
                }
            }

            setLogs(loadedLogs);
            setLoading(false);
        }, (error) => {
            console.error("Error Collection Group:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeProjectId]);

    return (
        <View className="flex-1 bg-background">
            <ScrollView className="flex-1 py-8">
                <View className="px-6 mb-8">
                    <Text className="text-2xl font-bold text-on-background">Activity Logs</Text>
                    <Text className="text-sm text-on-surface-variant">Chronological feed of structural submissions.</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#041627" className="mt-10" />
                ) : logs.length === 0 ? (
                    <View className="px-6 py-10 items-center">
                        <MaterialIcons name="history-toggle-off" size={40} color="#74777d" />
                        <Text className="text-on-surface-variant text-sm mt-2">Belum ada aktivitas pengiriman log pada proyek ini.</Text>
                    </View>
                ) : (
                    logs.map((log) => (
                        <TimelineItem
                            key={log.id}
                            type={log.type}
                            time={log.time}
                            name={log.name}
                            role={log.role}
                            location={log.location}
                            content={log.content}
                            gyroData={log.gyroData}
                            imageUri={log.avatarUri}   // avatar user di bubble
                            reportPhotoUri={log.imageUri} // foto bukti fisik lapangan
                        />
                    ))
                )}

                {logs.length > 0 && (
                    <TouchableOpacity className="flex-row items-center justify-center gap-2 border border-outline-variant py-3 mx-10 rounded-full mb-10 mt-4">
                        <MaterialIcons name="refresh" size={18} color="#041627" />
                        <Text className="text-sm font-bold text-primary">Load Previous</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}