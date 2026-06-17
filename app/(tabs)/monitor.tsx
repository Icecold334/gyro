import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { addDoc, collection, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { auth, db } from '../../firebaseConfig'; // Sesuaikan path
import { useProjectStore } from '../../projectStore'; // Sesuaikan path

interface MeasuringPoint {
  id: string
  pointName: string
  currentStatus: 'OK' | 'WARN' | 'CRITICAL'
  gyroX: string
  gyroY: string
  sensorId: string
}
// Komponen Card Status (Bento-style)
const StatCard = ({ title, value, icon, colorClass, bgColorClass }: any) => (
  <View
    className={`flex-1 p-3 rounded-lg border border-outline-variant h-24 justify-between ${bgColorClass}`}
  >
    <Text className="text-[10px] text-on-surface-variant uppercase tracking-widest">
      {title}
    </Text>
    <View className="flex-row items-end justify-between">
      <Text className={`text-2xl font-bold ${colorClass}`}>{value}</Text>
      <MaterialIcons name={icon} size={20} color="#74777d" />
    </View>
  </View>
)

// Komponen Card Detail Sensor
const SensorCard = ({ title, status, gyroX, gyroY, sensorId, color, projectId, pointId }: any) => (
  <View className="bg-white border border-outline-variant rounded-xl overflow-hidden mb-4 shadow-sm">
    <View className="flex-row">
      {/* Warna status kiri */}
      <View style={{ backgroundColor: color }} className="w-1" />

      <View className="p-4 flex-1">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-bold text-lg text-on-surface">{title}</Text>
          <View className="px-2 py-1 bg-surface-container rounded-md">
            <Text className="text-[10px] font-bold" style={{ color }}>
              {status}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="bg-surface-container p-2 rounded flex-1">
            <Text className="text-[9px] text-on-surface-variant uppercase">
              Gyro X
            </Text>
            <Text className="font-bold" style={{ color }}>
              {gyroX}
            </Text>
          </View>
          <View className="bg-surface-container p-2 rounded flex-1">
            <Text className="text-[9px] text-on-surface-variant uppercase">
              Gyro Y
            </Text>
            <Text className="font-bold" style={{ color }}>
              {gyroY}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-outline-variant">
          <Text className="text-xs text-on-surface-variant">
            Sensor: {sensorId}
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/details',
                params: {
                  projectId, // SINKRONISASI: Kirim Project ID
                  pointId,   // SINKRONISASI: Kirim Point ID
                  title,
                  status,
                  gyroX,
                  gyroY,
                  sensorId,
                  color
                },
              })
            }
          >
            <Text className="text-primary text-xs font-bold underline">
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
)

export default function MonitorScreen() {
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const [points, setPoints] = useState<MeasuringPoint[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const handleCreatePoint = async (pointNameInput: string) => {
    if (!activeProjectId) return
    if (!pointNameInput.trim()) {
      alert('Nama titik tidak boleh kosong!')
      return
    }

    try {
      // Menunjuk ke sub-collection: /projects/{activeProjectId}/points
      const pointsRef = collection(db, 'projects', activeProjectId, 'points')

      // Menambahkan dokumen baru dengan data awal acak (dummy)
      await addDoc(pointsRef, {
        pointName: pointNameInput,
        currentStatus: 'OK',
        gyroX: `${(Math.random() * 2 - 1).toFixed(2)}°`,
        gyroY: `${(Math.random() * 2 - 1).toFixed(2)}°`,
        sensorId: `SN-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      })

      alert('Titik ukur berhasil ditambahkan!')
    } catch (error: any) {
      alert(`Gagal menambah titik: ${error.message}`)
    }
  }

  const triggerAddPointPrompt = () => {
    // Menggunakan Alert prompt bawaan untuk menerima input teks nama titik
    Alert.prompt(
      'Titik Ukur Baru',
      'Masukkan nama titik (misal: Tiang Penyangga Utama):',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Tambah', onPress: (text) => handleCreatePoint(text || '') },
      ],
    )
  }
  useEffect(() => {
    if (!activeProjectId) return
    const checkUserRole = async () => {
      const currentUser = auth.currentUser
      if (!currentUser) return

      try {
        const membersRef = collection(db, 'project_members')
        // Query: Cari yang userId == user skrg DAN projectId == proyek aktif
        const q = query(
          membersRef,
          where('userId', '==', currentUser.uid),
          where('projectId', '==', activeProjectId)
        )

        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          // Ambil role dari dokumen pertama yang ditemukan ("mandor" atau "tukang")
          const memberData = querySnapshot.docs[0].data()
          setUserRole(memberData.role)
        }
      } catch (error) {
        console.error("Gagal mengambil role user:", error)
      }
    }

    checkUserRole()
    // Path sub-collection bertingkat
    const pointsRef = collection(db, 'projects', activeProjectId, 'points')

    const unsubscribe = onSnapshot(pointsRef, (snapshot) => {
      const pointList: MeasuringPoint[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        pointList.push({
          id: doc.id,
          pointName: data.pointName,
          currentStatus: data.currentStatus || 'OK',
          gyroX: data.gyroX || '0.0°',
          gyroY: data.gyroY || '0.0°',
          sensorId: data.sensorId || 'N/A',
        })
      })
      setPoints(pointList)
    })

    return () => unsubscribe()
  }, [activeProjectId])
  const totalPoints = points.length
  const safePoints = points.filter((p) => p.currentStatus === 'OK').length
  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 py-6">
        <Text className="text-2xl font-bold text-on-surface mb-1">
          Measurement Points
        </Text>
        <Text className="text-sm text-on-surface-variant mb-6">
          Real-time telemetry and status overview.
        </Text>

        {/* Stats Row */}
        <View className="flex-row gap-2 mb-6">
          <StatCard
            title="Total"
            value={totalPoints.toString()}
            icon="sensors"
            colorClass="text-on-surface"
            bgColorClass="bg-surface-container-low"
          />
          <StatCard
            title="Safe"
            value={safePoints.toString()}
            icon="check-circle"
            colorClass="text-[#137333]"
            bgColorClass="bg-[#e6f4ea]/20"
          />
        </View>

        {/* List Sensors */}
        {points.length === 0 ? (
          <View className="bg-white border border-outline-variant rounded-xl p-8 items-center mt-4">
            <MaterialIcons name="grid-off" size={40} color="#74777d" />
            <Text className="text-on-surface-variant text-sm mt-2 text-center">
              Belum ada titik ukur di proyek ini. Tekan tombol "+" di bawah
              untuk menambah titik.
            </Text>
          </View>
        ) : (
          points.map((point) => {
            // Menentukan warna dinamis berdasarkan status
            let statusColor = '#137333' // Default OK (Hijau)
            if (point.currentStatus === 'WARN') statusColor = '#b06000' // Oranye
            if (point.currentStatus === 'CRITICAL') statusColor = '#c5221f' // Merah

            return (
              <SensorCard
                key={point.id}
                pointId={point.id}               // SINKRONISASI: Lempar ID Titik
                projectId={activeProjectId}      // SINKRONISASI: Lempar ID Proyek Aktif
                title={point.pointName}
                status={point.currentStatus}
                gyroX={point.gyroX}
                gyroY={point.gyroY}
                sensorId={point.sensorId}
                color={statusColor}
              />
            )
          })
        )}
      </ScrollView>

      {/* Floating Action Button - Hanya muncul jika user adalah mandor */}
      {userRole === 'leader' && (
        <TouchableOpacity
          onPress={triggerAddPointPrompt}
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-xl items-center justify-center shadow-lg"
        >
          <MaterialIcons name="add" size={28} color="white" />

        </TouchableOpacity>
      )}
    </View>
  )
}
