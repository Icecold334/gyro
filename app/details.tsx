import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react'; // Tambahkan useEffect
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
// Tambahkan import Firebase
import { collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface FirebaseReport {
  id: string
  author: string
  date: string
  type: 'Stable' | 'Warning' | 'Critical'
  badgeBg: string
  badgeText: string
  xValue: string
  yValue: string
  valueColor: string
  image: string | null
  description: string
  hasPhoto: boolean
  isAlert: boolean
  rawTimestamp: any
}

export default function DetailsScreen() {
  const params = useLocalSearchParams()
  const projectId = (params.projectId as string) || ''
  const pointId = (params.pointId as string) || ''
  // Set default values if params are not provided
  const title = (params.title as string) || 'Titik A - Dinding Barat'
  const status = (params.status as string) || 'CRITICAL'
  const gyroX = (params.gyroX as string) || '+4.2°'
  const gyroY = (params.gyroY as string) || '-1.8°'
  const sensorId = (params.sensorId as string) || 'SN-9942'
  const color = (params.color as string) || '#ba1a1a'

  const [activeFilter, setActiveFilter] = useState('All Reports')
  const [reports, setReports] = useState<FirebaseReport[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)  // ✅ Deklarasi state yang hilang
  // State for floating options menu (toast)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (showOptionsMenu) {
      const timer = setTimeout(() => setShowOptionsMenu(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showOptionsMenu]);


  useEffect(() => {
    if (!projectId) return;
    const checkRole = async () => {
      const q = query(
        collection(db, 'project_members'),
        where('projectId', '==', projectId),
        where('userId', '==', auth.currentUser?.uid),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setUserRole(snap.docs[0].data().role);
      }
    };
    checkRole();
  }, [projectId]);

  const handleDeletePoint = async () => {
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'points', pointId));
      Alert.alert('Sukses', 'Titik ukur berhasil dihapus');
      router.back();
    } catch (error) {
      console.error('Gagal menghapus titik:', error);
      Alert.alert('Error', 'Gagal menghapus titik ukur');
    }
  };

  const openOptionsMenu = () => setShowOptionsMenu(true);
  const closeOptionsMenu = () => setShowOptionsMenu(false);

  const handleMoreOptions = () => {
    openOptionsMenu();
  }
  // Helper untuk membersihkan simbol "°" agar bisa dibaca sebagai angka oleh grafik
  const parseTilt = (val: string) => {
    return parseFloat(val.replace(/[^\d.-]/g, '')) || 0
  }
  const handleExportPDF = async () => {
    // 1. Susun template HTML untuk isi dokumen PDF
    const htmlContent = `
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                    body { font-family: 'Helvetica', Arial, sans-serif; padding: 30px; color: #041627; }
                    .header { border-b: 2px solid #041627; padding-bottom: 10px; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; color: #041627; }
                    .meta { font-size: 12px; color: #74777d; margin-top: 5px; }
                    .card { border: 1px solid #bcbfcb; padding: 15px; border-radius: 8px; margin-bottom: 20px; bg-color: #f9f9fb; }
                    .status { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
                    .grid { display: flex; gap: 20px; margin-bottom: 15px; }
                    .grid-item { flex: 1; border-top: 1px solid #bcbfcb; padding-top: 10px; }
                    .grid-label { font-size: 10px; font-weight: bold; color: #74777d; text-transform: uppercase; }
                    .grid-value { font-size: 20px; font-weight: bold; color: #001f3d; }
                    .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    .table th, .table td { border: 1px solid #bcbfcb; padding: 10px; text-align: left; font-size: 12px; }
                    .table th { background-color: #f0f1f5; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">LAPORAN TELEMETRI STRUKTUR</div>
                    <div class="meta">Dicetak pada: ${new Date().toLocaleString('id-ID')} | ID Sensor: ${sensorId}</div>
                </div>

                <div class="card">
                    <div class="status" style="color: ${color}">STATUS UTAMA: ${status}</div>
                    <div class="grid">
                        <div class="grid-item">
                            <div class="grid-label">Nama Titik Ukur</div>
                            <div class="grid-value" style="font-size: 16px;">${title}</div>
                        </div>
                    </div>
                    <div class="grid">
                        <div class="grid-item">
                            <div class="grid-label">Terakhir Sumbu X</div>
                            <div class="grid-value">${gyroX}</div>
                        </div>
                        <div class="grid-item">
                            <div class="grid-label">Terakhir Sumbu Y</div>
                            <div class="grid-value">${gyroY}</div>
                        </div>
                    </div>
                </div>

                <h3>Riwayat Log Historis (${filteredReports.length})</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Waktu / Pemeriksa</th>
                            <th>Tipe</th>
                            <th>Nilai X / Y</th>
                            <th>Deskripsi Temuan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredReports
        .map(
          (report) => `
                            <tr>
                                <td><b>${report.author}</b><br/><span style="color:#74777d; font-size:10px;">${report.date}</span></td>
                                <td><span style="color: ${report.isAlert ? '#ba1a1a' : '#137333'}; font-weight:bold;">${report.type}</span></td>
                                <td>X: ${report.xValue}<br/>Y: ${report.yValue}</td>
                                <td>${report.description}</td>
                            </tr>
                        `,
        )
        .join('')}
                    </tbody>
                </table>
            </body>
        </html>
    `

    try {
      // 2. Cetak HTML menjadi file PDF temporer (.pdf)
      const { uri } = await Print.printToFileAsync({ html: htmlContent })

      // 3. Picu menu berbagi (Share Sheet) bawaan OS HP
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Unduh Laporan ${title}`,
        })
      } else {
        alert('Fitur sharing tidak tersedia di perangkat ini')
      }
    } catch (error: any) {
      alert(`Gagal mengeksport PDF: ${error.message}`)
    }
  }
  const latestReport = reports.length > 0 ? reports[0] : null;
  const displayStatus = latestReport ? latestReport.type.toUpperCase() : status;
  const displayX = latestReport ? latestReport.xValue : gyroX;
  const displayY = latestReport ? latestReport.yValue : gyroY;

  let displayColor = color;
  if (latestReport) {
    if (latestReport.type === 'Critical') displayColor = '#ba1a1a';
    else if (latestReport.type === 'Warning') displayColor = '#b06000';
    else displayColor = '#137333';
  }

  const currentX = parseTilt(displayX)
  const currentY = parseTilt(displayY)

  // Konfigurasi data dataset grafik X dan Y
  const chartData = {
    labels: ['10s', '8s', '6s', '4s', '2s', 'Now'],
    datasets: [
      {
        data: [
          currentX - 0.3,
          currentX + 0.1,
          currentX - 0.1,
          currentX + 0.2,
          currentX - 0.2,
          currentX,
        ],
        color: (opacity = 1) => `rgba(186, 26, 26, ${opacity})`, // Warna Merah untuk Gyro X
        strokeWidth: 2,
      },
      {
        data: [
          currentY + 0.1,
          currentY - 0.2,
          currentY + 0.2,
          currentY - 0.1,
          currentY + 0.05,
          currentY,
        ],
        color: (opacity = 1) => `rgba(19, 115, 51, ${opacity})`, // Warna Hijau untuk Gyro Y
        strokeWidth: 2,
      },
    ],
    legend: ['X-Tilt', 'Y-Tilt'],
  }

  useEffect(() => {
    if (!projectId || !pointId) return

    // Tunjuk path sub-collection: /projects/{projectId}/points/{pointId}/reports
    const reportsRef = collection(db, 'projects', projectId, 'points', pointId, 'reports')
    const q = query(reportsRef, orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedReports: FirebaseReport[] = []

      snapshot.forEach((docSnap) => {
        const data = docSnap.data()

        // Atur ambang batas peringatan mandiri untuk pewarnaan badge UI
        const rawX = data.gyroX || 0
        const rawY = data.gyroY || 0
        const isCritical = Math.abs(rawX) > 4 || Math.abs(rawY) > 4
        const isWarning = (Math.abs(rawX) > 2 && Math.abs(rawX) <= 4) || (Math.abs(rawY) > 2 && Math.abs(rawY) <= 4)

        let reportType: 'Stable' | 'Warning' | 'Critical' = 'Stable'
        let badgeBg = 'bg-[#137333]'
        let valueColor = 'text-[#137333]'

        if (isCritical) {
          reportType = 'Critical'
          badgeBg = 'bg-[#ba1a1a]'
          valueColor = 'text-[#ba1a1a]'
        } else if (isWarning) {
          reportType = 'Warning'
          badgeBg = 'bg-amber-600'
          valueColor = 'text-amber-600'
        }

        // Format tanggal JavaScript sederhana dari Firebase Timestamp
        const jsDate = data.timestamp?.toDate() ? data.timestamp.toDate() : new Date()
        const formattedDate = jsDate.toLocaleDateString('id-ID', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ` • ${jsDate.getHours()}:${String(jsDate.getMinutes()).padStart(2, '0')}`

        loadedReports.push({
          id: docSnap.id,
          author: data.submittedBy || 'anonymous', // sementara simpan UID, diganti di bawah
          date: formattedDate,
          type: reportType,
          badgeBg: badgeBg,
          badgeText: 'text-white',
          xValue: `${rawX >= 0 ? '+' : ''}${rawX.toFixed(2)}°`,
          yValue: `${rawY >= 0 ? '+' : ''}${rawY.toFixed(2)}°`,
          valueColor: valueColor,
          image: data.photoUrl || null,
          hasPhoto: !!data.photoUrl,
          isAlert: isCritical || isWarning,
          description: data.photoUrl
            ? 'Laporan telemetri resmi disertai lampiran bukti dokumentasi foto fisik struktur bangunan dari lokasi kerja.'
            : 'Laporan telemetri sensor mandiri tanpa lampiran dokumentasi visual perimeter.',
          rawTimestamp: data.timestamp
        })
      })

      // Resolve nama nyata dari collection users berdasarkan UID submittedBy
      for (let i = 0; i < loadedReports.length; i++) {
        const uid = loadedReports[i].author
        if (!uid || uid === 'anonymous') {
          loadedReports[i].author = 'Teknisi Lapangan'
          continue
        }
        try {
          const userDoc = await getDoc(doc(db, 'users', uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            loadedReports[i].author = userData.displayName || userData.email || 'Teknisi Lapangan'
          } else {
            loadedReports[i].author = 'Teknisi Lapangan'
          }
        } catch {
          loadedReports[i].author = 'Teknisi Lapangan'
        }
      }

      setReports(loadedReports)
    })

    return () => unsubscribe()
  }, [projectId, pointId])

  // Filter logic (Tetap dipertahankan di bawah useEffect)
  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'Photos') return r.hasPhoto
    if (activeFilter === 'Alerts Only') return r.isAlert
    return true
  })



  return (
    <SafeAreaView className="flex-1 bg-surface" style={{ flex: 1 }}>
      {/* Top Bar Header */}
      <View className="h-14 bg-surface border-b border-outline-variant px-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-1 rounded-full active:scale-95 hover:bg-surface-container-high"
          >
            <MaterialIcons name="arrow-back" size={24} color="#041627" />
          </TouchableOpacity>
          <Text className="font-bold text-lg text-primary" numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleExportPDF}
            className="p-2 active:scale-95 rounded-full"
          >
            <MaterialIcons name="share" size={20} color="#44474c" />
          </TouchableOpacity>
          {userRole === 'leader' && (
            <TouchableOpacity onPress={openOptionsMenu} className="p-2 active:scale-95 rounded-full">
              <MaterialIcons name="more-vert" size={20} color="#44474c" />
            </TouchableOpacity>
          )}
          {/* Floating Options Overlay (Toast) */}
          {showOptionsMenu && (
            <View className="absolute top-16 left-1/2 -translate-x-1/2 bg-white border border-outline-variant rounded-lg shadow-lg z-50 p-2 w-48">
              <TouchableOpacity onPress={() => { closeOptionsMenu(); handleDeletePoint(); }} className="p-2">
                <Text className="text-sm text-[#ba1a1a] font-bold text-center">Hapus Titik</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeOptionsMenu} className="p-2">
                <Text className="text-sm text-on-surface-variant">Batal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        className="flex-1 px-4 py-6"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Summary Card */}
        <View className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl mb-6 shadow-sm">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Current Status
              </Text>
              <View className="flex-row items-center gap-2">
                <View
                  className="w-3 h-3 rounded-full bg-error"
                  style={{ backgroundColor: displayColor }}
                />
                <Text className="text-lg font-bold" style={{ color: displayColor }}>
                  {displayStatus}
                </Text>
              </View>
            </View>
            <View className="items-end max-w-[50%]">
              <Text className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Last Sync
              </Text>
              <Text className="text-sm font-semibold text-on-surface text-right">
                {latestReport ? latestReport.date : '-'}
              </Text>
            </View>
          </View>

          {/* Tilt Grid values */}
          <View className="grid grid-cols-2 flex-row gap-4 py-4 border-y border-outline-variant">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase">
                Latest X-Tilt
              </Text>
              <Text className="text-2xl font-black text-primary font-mono">
                {displayX}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase">
                Latest Y-Tilt
              </Text>
              <Text className="text-2xl font-black text-primary font-mono">
                {displayY}
              </Text>
            </View>
          </View>

          {/* Sensor location */}
          <View className="mt-4 flex-row items-center gap-2">
            <MaterialIcons name="location-on" size={16} color="#74777d" />
            <Text className="text-xs text-on-surface-variant">
              Segment 4, Level -2 West Perimeter
            </Text>
          </View>
        </View>
        {/* Telemetry Chart Section */}
        <View className="bg-white border border-outline-variant p-4 rounded-xl mb-6 shadow-sm">
          <Text className="text-base font-bold text-on-surface mb-2">
            Real-time Tilt Waveform
          </Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 48} // Responsif mengikuti lebar layar HP
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 2, // 2 angka di belakang koma
              color: (opacity = 1) => `rgba(4, 22, 39, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(116, 119, 125, ${opacity})`,
              style: { borderRadius: 12 },
              propsForDots: {
                r: '3',
                strokeWidth: '1',
                stroke: '#041627',
              },
            }}
            bezier // Membuat lekukan grafik menjadi halus (smooth curve)
            style={{ marginVertical: 8, borderRadius: 12 }}
          />
        </View>
        {/* Filter Chips */}
        <View className="mb-6 flex-row items-center gap-2">
          {['All Reports', 'Photos', 'Alerts Only'].map((filter) => {
            const isActive = activeFilter === filter
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full border ${isActive
                  ? 'bg-primary border-primary'
                  : 'bg-surface-container-high border-outline-variant'
                  }`}
              >
                <Text
                  className={`text-xs font-bold ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Reports List */}
        <View className="gap-4">
          <Text className="text-lg font-bold text-on-surface mb-2 px-1">
            Historical Logs
          </Text>

          {filteredReports.map((report) => (
            <View
              key={report.id}
              className="bg-white border border-outline-variant rounded-xl overflow-hidden flex-col"
            >
              {/* Cari bagian rendering list gambar di return UI kamu, sesuaikan bagian ini */}
              {report.hasPhoto && report.image && (
                <View className="h-44 w-full relative">
                  <Image
                    source={{ uri: report.image }} // Mengarah langsung ke url gambar string dinamis
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className={`absolute top-3 left-3 px-2 py-0.5 rounded ${report.badgeBg}`}>
                    <Text className={`text-[10px] font-bold uppercase ${report.badgeText}`}>
                      {report.type}
                    </Text>
                  </View>
                </View>
              )}

              {/* Details Body */}
              <View className="p-4">
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="font-bold text-primary text-[15px]">
                      {report.author}
                    </Text>
                    <Text className="text-xs text-on-surface-variant mt-0.5">
                      {report.date}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`text-[13px] font-black font-mono ${report.valueColor}`}
                    >
                      X: {report.xValue}
                    </Text>
                    <Text className="text-[12px] font-bold font-mono text-on-surface-variant mt-0.5">
                      Y: {report.yValue}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-on-surface-variant leading-relaxed">
                  {report.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
