import { AlertCard } from '@/components/AlertCard'
import { MaterialIcons } from '@expo/vector-icons'
import { collectionGroup, onSnapshot, query, where } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { db } from '../../firebaseConfig'; // Sesuaikan dengan path config Anda
import { useProjectStore } from '../../projectStore'; // Sesuaikan dengan path store Anda

interface AlertReport {
    id: string
    pointName: string
    gyroX: number
    gyroY: number
    timestamp: any
    projectId: string
}

export default function AlertScreen() {
    const activeProjectId = useProjectStore((state) => state.activeProjectId)
    const [alerts, setAlerts] = useState<AlertReport[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!activeProjectId) {
            setLoading(false)
            return
        }

        // Menggunakan collectionGroup 'reports' untuk mencari laporan di semua titik
        const reportsQuery = query(
            collectionGroup(db, 'reports'),
            where('projectId', '==', activeProjectId)
        )

        const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
            const criticalReports: AlertReport[] = []

            snapshot.forEach((doc) => {
                const data = doc.data()
                const absX = Math.abs(data.gyroX || 0)
                const absY = Math.abs(data.gyroY || 0)

                // Filter lokal: ambil yang melebihi ambang batas aman (5 derajat)
                if (absX > 5 || absY > 5) {
                    criticalReports.push({
                        id: doc.id,
                        pointName: data.pointName || 'Unknown Point',
                        gyroX: data.gyroX || 0,
                        gyroY: data.gyroY || 0,
                        timestamp: data.timestamp,
                        projectId: data.projectId
                    })
                }
            })

            // Urutkan berdasarkan waktu terbaru jika timestamp tersedia
            criticalReports.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0
                const timeB = b.timestamp?.seconds || 0
                return timeB - timeA
            })

            setAlerts(criticalReports)
            setLoading(false)
        }, (error) => {
            console.error("Gagal mengambil data alert: ", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [activeProjectId])

    // Hitung jumlah bahaya (Danger jika > 7) atau peringatan (Warning jika 5 - 7)
    const dangerCount = alerts.filter(a => Math.abs(a.gyroX) > 7 || Math.abs(a.gyroY) > 7).length
    const warningCount = alerts.length - dangerCount

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
                            <Text className="text-[12px] font-bold text-on-error-container">{dangerCount} Danger</Text>
                        </View>
                        <View className="bg-secondary-container px-3 py-1.5 rounded-full flex-row items-center gap-1">
                            <MaterialIcons name="warning" size={14} color="#221b00" />
                            <Text className="text-[12px] font-bold text-on-secondary-container">{warningCount} Warning</Text>
                        </View>
                    </View>
                </View>

                {/* List of Real-time Alerts */}
                {loading ? (
                    <Text className="text-center text-on-surface-variant mt-4">Loading alerts...</Text>
                ) : alerts.length === 0 ? (
                    <Text className="text-center text-on-surface-variant mt-4">Aman. Tidak ada pergeseran struktur ekstrem.</Text>
                ) : (
                    alerts.map((alert) => {
                        const isDanger = Math.abs(alert.gyroX) > 7 || Math.abs(alert.gyroY) > 7
                        const timeString = alert.timestamp ? new Date(alert.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'

                        return (
                            <AlertCard
                                key={alert.id}
                                type={isDanger ? "DANGER" : "WARNING"}
                                time={`Reported at ${timeString}`}
                                title={alert.pointName}
                                description={isDanger ? "Structural tilt exceeds MAXIMUM safe threshold. Immediate assessment required!" : "Vibration or slight tilt anomaly detected."}
                                metrics={[
                                    { label: 'X-AXIS', value: `${alert.gyroX > 0 ? '+' : ''}${alert.gyroX.toFixed(2)}°` },
                                    { label: 'Y-AXIS', value: `${alert.gyroY > 0 ? '+' : ''}${alert.gyroY.toFixed(2)}°` }
                                ]}
                            />
                        )
                    })
                )}

            </ScrollView>
        </View>
    )
}