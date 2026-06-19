import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { auth, db } from '../../firebaseConfig'
import { useProjectStore } from '../../projectStore'
import CustomPromptModal from '../../components/CustomPromptModal'

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
const SensorCard = ({ title, status, gyroX, gyroY, sensorId, color, projectId, pointId, canDelete, onDelete }: any) => (
  <TouchableOpacity
    onPress={() =>
      router.push({
        pathname: '/details',
        params: {
          projectId,
          pointId,
          title,
          status,
          gyroX,
          gyroY,
          sensorId,
          color
        },
      })
    }
    onLongPress={() => canDelete && onDelete && onDelete(pointId, title)}
    className="bg-white border border-outline-variant rounded-xl overflow-hidden mb-3 shadow-sm"
  >
    <View className="flex-row">
      {/* Warna status kiri */}
      <View style={{ backgroundColor: color }} className="w-1" />

      <View className="p-4 flex-1 flex-row justify-between items-center">
        <View>
          <Text className="font-bold text-lg text-on-surface">{title}</Text>
          <Text className="text-xs text-on-surface-variant mt-1">
            Sensor: {sensorId}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {canDelete && (
            <TouchableOpacity
              onPress={() => onDelete && onDelete(pointId, title)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="delete-outline" size={20} color="#c5221f" />
            </TouchableOpacity>
          )}
          <MaterialIcons name="chevron-right" size={24} color="#74777d" />
        </View>
      </View>
    </View>
  </TouchableOpacity>
)

export default function MonitorScreen() {
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const [points, setPoints] = useState<MeasuringPoint[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [addPointModalVisible, setAddPointModalVisible] = useState(false)
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
    setAddPointModalVisible(true)
  }

  const handleDeletePoint = (pointId: string, pointName: string) => {
    if (!activeProjectId) return
    Alert.alert(
      'Hapus Titik Ukur',
      `Apakah Anda yakin ingin menghapus titik "${pointName}"? Seluruh riwayat laporan pada titik ini juga akan ikut terhapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'projects', activeProjectId, 'points', pointId))
              Alert.alert('Sukses', `Titik "${pointName}" berhasil dihapus.`)
            } catch (error: any) {
              Alert.alert('Gagal', error.message)
            }
          },
        },
      ]
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
  const warnPoints = points.filter((p) => p.currentStatus === 'WARN').length
  const criticalPoints = points.filter((p) => p.currentStatus === 'CRITICAL').length
  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 py-6">
        <Text className="text-2xl font-bold text-on-surface mb-1">
          Measurement Points
        </Text>
        <Text className="text-sm text-on-surface-variant mb-6">
          Real-time telemetry and status overview.
        </Text>
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
                pointId={point.id}
                projectId={activeProjectId}
                title={point.pointName}
                status={point.currentStatus}
                gyroX={point.gyroX}
                gyroY={point.gyroY}
                sensorId={point.sensorId}
                color={statusColor}
                canDelete={userRole === 'leader'}
                onDelete={handleDeletePoint}
              />
            )
          })
        )}
      </ScrollView>

      {/* FAB - Hanya muncul jika user adalah mandor/leader */}
      {userRole === 'leader' && (
        <TouchableOpacity
          onPress={triggerAddPointPrompt}
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-xl items-center justify-center shadow-lg"
        >
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Custom Prompt Modal - Tambah Titik Ukur (cross-platform) */}
      <CustomPromptModal
        visible={addPointModalVisible}
        title="Titik Ukur Baru"
        message="Masukkan nama titik pengukuran (misal: Tiang Penyangga Utama):"
        placeholder="contoh: Pondasi Barat A"
        confirmText="Tambah"
        onConfirm={(text) => {
          setAddPointModalVisible(false)
          handleCreatePoint(text)
        }}
        onCancel={() => setAddPointModalVisible(false)}
      />
    </View>
  )
}
