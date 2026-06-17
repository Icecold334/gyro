import { MaterialIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { Gyroscope } from 'expo-sensors'
import { Subscription } from 'expo-sensors/build/DeviceSensor'
import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import React, { useEffect, useRef, useState } from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { auth, db, storage } from '../../firebaseConfig'; // Sesuaikan dengan path file konfigurasi Anda
import { useProjectStore } from '../../projectStore'; // Tambahkan import store
interface PointOption {
  id: string
  pointName: string
}
export default function GyroScreen() {
  // 2. Ambil Project ID yang aktif dari Zustand
  const activeProjectId = useProjectStore((state) => state.activeProjectId)

  // 3. Siapkan state untuk menampung list titik ukur dan titik yang dipilih
  const [points, setPoints] = useState<PointOption[]>([])
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [selectedPointName, setSelectedPointName] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState(false) // Untuk membuka/tutup list pilihan
  const [data, setData] = useState({ x: 0, y: 0, z: 0 })
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [smoothPos, setSmoothPos] = useState({ x: 0, y: 0 })
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedDeg, setLockedDeg] = useState({ x: '0.00', y: '0.00' })
  const isLockedRef = useRef(isLocked)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 4. Ambil data titik ukur secara real-time berdasarkan proyek yang aktif
  useEffect(() => {
    if (!activeProjectId) return

    // Path menuju sub-collection points milik proyek aktif
    const pointsRef = collection(db, 'projects', activeProjectId, 'points')

    const unsubscribe = onSnapshot(pointsRef, (snapshot) => {
      const options: PointOption[] = []
      snapshot.forEach((doc) => {
        options.push({
          id: doc.id,
          pointName: doc.data().pointName || 'Tanpa Nama',
        })
      })
      setPoints(options)

      // Auto-select titik pertama jika tersedia dan belum ada yang dipilih
      if (options.length > 0 && !selectedPointId) {
        setSelectedPointId(options[0].id)
        setSelectedPointName(options[0].pointName)
      }
    })

    return () => unsubscribe()
  }, [activeProjectId])

  const handleSubmitReport = async () => {
    // Validasi: Pastikan data gyro sudah dikunci sebelum dikirim
    if (!isLocked) {
      alert('Silakan kunci (Lock) data gyro terlebih dahulu!')
      return
    }
    if (!selectedPointId) {
      alert('Silakan pilih Target Measurement Point terlebih dahulu!')
      return
    }

    setIsSubmitting(true)
    try {

      // 1. Langsung susun path Sub-Collection ke Firestore sesuai blueprint
      // Sementara menggunakan "PROYEK_TEST" dan "TITIK_TEST" karena aturan hak akses (Fase 2&3) belum diintegrasikan
      const reportsRef = collection(
        db,
        'projects',
        activeProjectId, // Menggunakan ID Proyek Aktif dari Zustand
        'points',
        selectedPointId, // Menggunakan ID Titik yang dipilih dari Dropdown
        'reports',
      )

      // 2. Kirim data angka gyro langsung ke Firestore
      await addDoc(reportsRef, {
        projectId: activeProjectId, // TAMBAHKAN INI
        pointName: selectedPointName, // TAMBAHKAN INI (ambil dari objek point yang dipilih)
        gyroX: Number(lockedDeg.x),
        gyroY: Number(lockedDeg.y),
        photoUrl: '', // Kita isi teks kosong dulu karena Storage dilewati
        submittedBy: auth.currentUser?.uid || 'anonymous',
        timestamp: serverTimestamp(),
      })

      alert('Data Gyro Berhasil Dikirim ke Firestore Database!')

      // 3. Reset tampilan form setelah berhasil kirim data
      setIsLocked(false)
      if (isLockedRef) isLockedRef.current = false
      setImageUri(null) // Reset preview foto jika ada
    } catch (error) {
      console.error('Gagal mengirim data gyro:', error)
      alert('Terjadi kesalahan saat mengirim data.')
    } finally {
      setIsSubmitting(false)
    }
  }
  const uploadImageAsync = async (uri: string): Promise<string | null> => {
    if (!uri) return null

    try {
      // 1. Mengubah file gambar lokal menjadi Blob menggunakan XMLHttpRequest (Lebih stabil di Expo)
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.onload = function () {
          resolve(xhr.response)
        }
        xhr.onerror = function (e) {
          console.error(e)
          reject(new TypeError('Network request failed'))
        }
        xhr.responseType = 'blob'
        xhr.open('GET', uri, true)
        xhr.send(null)
      })

      // 2. Membuat nama file unik berdasarkan waktu saat ini
      const filename = `report_${new Date().getTime()}.jpg`

      // 3. Pastikan mengimpor 'ref' dari 'firebase/storage' dan melemparkan objek 'storage' yang benar
      // Format: ref(storageInstance, pathString)
      const storageRef = ref(storage, `reports/${filename}`)

      // 4. Proses upload berkas ke Firebase Storage
      await uploadBytes(storageRef, blob)

      // 5. Tutup koneksi blob lokal untuk menghemat memori HP
      // @ts-ignore
      blob.close()

      // 6. Ambil URL publik gambar setelah berhasil di-upload
      const downloadUrl = await getDownloadURL(storageRef)
      return downloadUrl
    } catch (error) {
      console.error('Gagal mengunggah gambar: ', error)
      alert('Gagal mengunggah gambar bukti fisik.')
      return null
    }
  }
  const handleCapturePhoto = async () => {
    // 1. Minta izin akses kamera ke sistem HP pengguna
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

    if (permissionResult.granted === false) {
      alert(
        'Aplikasi membutuhkan izin kamera untuk mengambil bukti fisik lapangan!',
      )
      return
    }

    // 2. Buka kamera asli perangkat
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Izinkan teknisi memotong (crop) foto jika perlu
      aspect: [4, 3], // Set rasio foto standar lanskap
      quality: 0.7, // Kompres kualitas ke 70% agar hemat ukuran penyimpanan di cloud
    })

    // 3. Jika berhasil menjepret foto dan tidak dibatalkan, simpan lokasinya ke state
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri)
    }
  }

  // Fungsi untuk mulai mendengarkan sensor
  const _subscribe = () => {
    Gyroscope.setUpdateInterval(16) // ~60 FPS

    setSubscription(
      Gyroscope.addListener((gyroscopeData) => {
        // Jika status terkunci, hentikan semua kalkulasi angka dan pergerakan bola
        if (isLockedRef.current) return

        setData(gyroscopeData)

        const alpha = 0.1
        setSmoothPos((prev) => {
          const targetX = gyroscopeData.y * 220
          const targetY = gyroscopeData.x * 220

          return {
            x: prev.x + alpha * (targetX - prev.x),
            y: prev.y + alpha * (targetY - prev.y),
          }
        })
      }),
    )
  }
  const _unsubscribe = () => {
    if (subscription) {
      subscription.remove()
    }
    setSubscription(null)
  }

  useEffect(() => {
    _subscribe()
    return () => _unsubscribe()
  }, []) // Ubah kembali menjadi array kosong

  // Konversi nilai kecepatan sudut ke estimasi derajat tampilan sederhana (-30 sampai +30 derajat)
  const degX = (data.y * 57.2958).toFixed(2) // Tukar sumbu Y ke X untuk orientasi layar potret
  const degY = (data.x * 57.2958).toFixed(2)

  // Kalkulasi posisi titik (bubble) agar bergerak di dalam lingkaran placeholder (maksimal pergeseran 80px)
  const moveX = Math.max(-80, Math.min(80, smoothPos.x))
  const moveY = Math.max(-80, Math.min(80, smoothPos.y))

  const toggleLock = () => {
    if (!isLocked) {
      setLockedDeg({ x: degX, y: degY })
      setIsLocked(true)
      isLockedRef.current = true // Tambahkan ini
    } else {
      setIsLocked(false)
      isLockedRef.current = false // Tambahkan ini
    }
  }
  return (
    <View className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-primary">
            Gyroscope Tool
          </Text>
          <Text className="text-sm text-on-surface-variant mt-1">
            Capture precise structural inclination data.
          </Text>
        </View>

        {/* Target Point Selection */}
        <View className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 mb-4 z-50">
          <Text className="font-semibold text-sm text-on-surface mb-2">
            Target Measurement Point
          </Text>

          {/* Tombol Pemicu Dropdown */}
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            className="bg-surface border border-outline-variant rounded-lg px-4 h-12 flex-row items-center justify-between"
          >
            <Text className="text-on-surface font-medium">
              {selectedPointName || 'Pilih Titik Sensor...'}
            </Text>
            <MaterialIcons
              name={showDropdown ? "arrow-drop-up" : "arrow-drop-down"}
              size={24}
              color="#74777d"
            />
          </TouchableOpacity>

          {/* List Pilihan Item (Dropdown Menu) */}
          {showDropdown && (
            <View className="bg-white border border-outline-variant rounded-lg mt-2 overflow-hidden shadow-md">
              {points.length === 0 ? (
                <View className="p-3"><Text className="text-xs text-gray-400 text-center">Tidak ada titik tersedia</Text></View>
              ) : (
                points.map((point) => (
                  <TouchableOpacity
                    key={point.id}
                    onPress={() => {
                      setSelectedPointId(point.id)
                      setSelectedPointName(point.pointName)
                      setShowDropdown(false)
                    }}
                    className={`p-3 border-b border-surface-container-low active:bg-gray-100 ${selectedPointId === point.id ? 'bg-primary-container/20' : ''}`}
                  >
                    <Text className={`text-sm ${selectedPointId === point.id ? 'text-primary font-bold' : 'text-on-surface'}`}>
                      {point.pointName}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Live Readout Section */}
        <View className="bg-surface-container-low rounded-xl p-6 items-center border border-outline-variant mb-4">
          <View className="w-full flex-row justify-between items-center mb-6">
            <Text className="font-bold text-primary">Live Readout</Text>
            <View className="bg-error-container px-3 py-1 rounded-full flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-error" />
              <Text className="text-[10px] font-bold text-on-error-container">
                {isLocked ? 'LOCKED' : 'UNLOCKED'}
              </Text>
            </View>
          </View>

          {/* Gyro Graphic Placeholder */}
          <View className="w-48 h-48 rounded-full border-4 border-outline-variant bg-surface items-center justify-center mb-6 shadow-sm relative">
            <View className="absolute w-[1px] h-full bg-outline opacity-20" />
            <View className="absolute w-full h-[1px] bg-outline opacity-20" />

            {/* Titik Sensor Bergerak Dinamis */}
            <View
              style={{
                transform: [{ translateX: moveX }, { translateY: moveY }],
              }}
              className="w-8 h-8 rounded-full bg-secondary-container border-2 border-on-secondary-container absolute"
            />
          </View>

          {/* Values */}
          <View className="flex-row gap-4">
            <View className="bg-inverse-surface rounded-lg px-6 py-2 items-center min-w-[100px]">
              <Text className="text-[10px] text-on-surface-variant">
                X-AXIS
              </Text>
              <Text className="text-inverse-on-surface font-bold text-lg">
                {isLocked
                  ? Number(lockedDeg.x) >= 0
                    ? `+${lockedDeg.x}`
                    : lockedDeg.x
                  : Number(degX) >= 0
                    ? `+${degX}`
                    : degX}
                °
              </Text>
            </View>
            <View className="bg-inverse-surface rounded-lg px-6 py-2 items-center min-w-[100px]">
              <Text className="text-[10px] text-on-surface-variant">
                Y-AXIS
              </Text>
              <Text className="text-inverse-on-surface font-bold text-lg">
                {isLocked
                  ? Number(lockedDeg.y) >= 0
                    ? `+${lockedDeg.y}`
                    : lockedDeg.y
                  : Number(degY) >= 0
                    ? `+${degY}`
                    : degY}
                °
              </Text>
            </View>
          </View>

          {/* Lock / Unlock Button */}
          <TouchableOpacity
            onPress={toggleLock}
            className={`mt-8 w-full h-12 rounded-lg flex-row items-center justify-center gap-2 ${isLocked ? 'bg-amber-600' : 'bg-primary'}`}
          >
            <MaterialIcons name={isLocked ? "lock" : "lock-open"} size={20} color="white" />
            <Text className="text-white font-bold">
              {isLocked ? 'Unlock Data' : 'Lock Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Camera Module */}
        <View className="bg-surface-container rounded-xl p-4 border border-outline-variant mb-6">
          {/* PERBAIKAN: Menggunakan View untuk membungkus ikon dan teks secara horizontal */}
          <View className="flex-row items-center gap-2 mb-4">
            <MaterialIcons name="photo-camera" size={16} color="#0284c7" />
            <Text className="font-bold text-primary">
              Attach Physical Proof
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCapturePhoto}
            className="h-40 bg-surface-dim rounded-lg border-2 border-dashed border-outline-variant items-center justify-center overflow-hidden active:opacity-80"
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="items-center">
                <MaterialIcons name="add-a-photo" size={32} color="#74777d" />
                <Text className="text-sm text-on-surface-variant mt-2">
                  Tap to capture site condition
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleSubmitReport}
          disabled={isSubmitting}
          className={`mb-10 w-full h-14 rounded-lg flex-row items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400' : 'bg-success bg-green-600'}`}
        >
          <MaterialIcons name="cloud-upload" size={24} color="white" />
          <Text className="text-white font-bold text-lg">
            {isSubmitting ? 'Submitting...' : 'Submit Official Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}
