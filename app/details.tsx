import { MaterialIcons } from '@expo/vector-icons'
import * as Print from 'expo-print'
import { router, useLocalSearchParams } from 'expo-router'
import * as Sharing from 'expo-sharing'
import React, { useState } from 'react'
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function DetailsScreen() {
  const params = useLocalSearchParams()

  // Set default values if params are not provided
  const title = (params.title as string) || 'Titik A - Dinding Barat'
  const status = (params.status as string) || 'CRITICAL'
  const gyroX = (params.gyroX as string) || '+4.2°'
  const gyroY = (params.gyroY as string) || '-1.8°'
  const sensorId = (params.sensorId as string) || 'SN-9942'
  const color = (params.color as string) || '#ba1a1a'

  const [activeFilter, setActiveFilter] = useState('All Reports')
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
  const currentX = parseTilt(gyroX)
  const currentY = parseTilt(gyroY)

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

  // Sample data matching the HTML
  const reports = [
    {
      id: 1,
      author: 'Sarah Jenkins',
      date: 'Oct 24, 2023 • 14:32',
      type: 'Critical',
      badgeBg: 'bg-error/90',
      badgeText: 'text-white',
      xValue: '+4.2°',
      yValue: '-1.8°',
      valueColor: 'text-error',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCTnhgP-6KQxPUNrOG5ZKieSVjhiZ0V348-vwMAGkfKCHe6F7P5T0TO51bxRVmXQqgP6vK84zzGk_FjgPq5j9QTAhcWTnqpqmpN84AfS4iQvMrzKF4zKmjYcCp_PbF7pMMWzYqUxHoLGb2h96SK9ZYOynnYynrUhrHLzJvRhDnGD9BnsAzsr1aAy-1CWBKsC6S-JTv4VWMTr9jC9izmTauZoFEUBVrxBFP9zZW2gRdsDsiPbD3XqiCb88nM-xKnSu2QMmVfTNc6CO0',
      description:
        'Visual inspection confirms sensor reading. Hairline fracture extending 15cm from mounting bracket. Immediate monitoring advised.',
      hasPhoto: true,
      isAlert: true,
    },
    {
      id: 2,
      author: 'Marcus Vane',
      date: 'Oct 23, 2023 • 09:15',
      type: 'Warning',
      badgeBg: 'bg-secondary-container',
      badgeText: 'text-on-secondary-container',
      xValue: '+2.1°',
      yValue: '-0.9°',
      valueColor: 'text-secondary',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAWavqIc01L6Nf_F1Gx34fqmxA0LMx7Z0B13BuGfQiYNIrFgJnzVwQPCifF4ZoIzmdBFSfnjCzyCXorjjGI9guVJCy9xCjEeXPdhJJv8XStITBbg3Cdc5XYiRQqkTnr4P2mLixRUMdm4u_Q2Xl6YFs304Dpqexjy0Hy7WQQMMbzGZlyW2xlEDrcwPuaZcK2wTXIH2i1DX2uJX1SPO7L-FSHPrb86T-rLxE6mEf8YvGPscsW-A3YuWPsSu9uOJS5rX8hNoGG9e7cW9I',
      description:
        'Slight deviation detected post-excavation nearby. No visual cracks found.',
      hasPhoto: true,
      isAlert: true,
    },
    {
      id: 3,
      author: 'Sarah Jenkins',
      date: 'Oct 20, 2023 • 16:45',
      type: 'Stable',
      badgeBg: 'bg-[#137333]',
      badgeText: 'text-white',
      xValue: '+0.02°',
      yValue: '+0.01°',
      valueColor: 'text-[#137333]',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAEzKpo9TWYrPteihusPOQTXbFs29NtDIwERn4lMj1Sft4_QUHz-jJYMdX7APBzmHmoL3Tn3NbTw-O6Ma4rMOyZp6Ityfp9tQBq54GkG2hvZl-iLlmNsk3dsQugIYD_RO9WhtkYY8mRWG84XlkYM20AdOx0IDHaWP5gce1ZON7CruItApxKJ7NgURuAZjWaabgxWqFFyrg8zMqAJkDh41oSsCERX_Sh29H2f23y5GOW8ez1NoNs9OrMtdCbkTsIROh5jZvFc0jwoHo',
      description:
        'Initial baseline reading after sensor installation. Calibration successful.',
      hasPhoto: true,
      isAlert: false,
    },
    {
      id: 4,
      author: 'Team Lead Alpha',
      date: 'Oct 19, 2023 • 08:00',
      type: 'Stable',
      badgeBg: 'bg-[#137333]',
      badgeText: 'text-white',
      xValue: '-0.01°',
      yValue: '-0.02°',
      valueColor: 'text-[#137333]',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC6e1HX3xKGILzn8A5AdXfDzJCTDp0p7ynWHUDxiUdvHLf0VLsq47y3exllCXNrgpQ9-YkayIYRKJU6pupTp40qtx2gfHSTP5W9VuSm7LSnEOJPP9zpcBGsA061i0fLwUGHHhs8UOteobGUIgrI1ROR-tEuJ7cveVxj6a5LSKq1-s1ZLPgrC5Oj3whkApw33MjMklxDW0S3ZEKhLzMl8c7Cw1xgCzw527DQVvUp9vrRjo4SawH0EMKYldV6U7Uo6RpmLdwiZTrzGYY',
      description:
        'Routine check. All structural elements within safety margins.',
      hasPhoto: true,
      isAlert: false,
    },
  ]

  // Filter logic
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
          <TouchableOpacity className="p-2 active:scale-95 rounded-full">
            <MaterialIcons name="more-vert" size={20} color="#44474c" />
          </TouchableOpacity>
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
                  style={{ backgroundColor: color }}
                />
                <Text className="text-lg font-bold" style={{ color: color }}>
                  {status}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Last Sync
              </Text>
              <Text className="text-sm font-semibold text-on-surface">
                2 mins ago
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
                {gyroX}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase">
                Latest Y-Tilt
              </Text>
              <Text className="text-2xl font-black text-primary font-mono">
                {gyroY}
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
                className={`px-4 py-2 rounded-full border ${
                  isActive
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
              {/* Image Header if present */}
              {report.hasPhoto && (
                <View className="h-44 w-full relative">
                  <Image
                    source={{ uri: report.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View
                    className={`absolute top-3 left-3 px-2 py-0.5 rounded ${report.badgeBg}`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${report.badgeText}`}
                    >
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

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-xl items-center justify-center shadow-lg active:scale-95">
        <MaterialIcons name="add-a-photo" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}
