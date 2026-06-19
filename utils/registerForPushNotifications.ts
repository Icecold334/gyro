import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export async function registerForPushNotificationsAsync() {
  let token

  // 1. Periksa apakah ini perangkat fisik (karena simulator/emulator sering kali tidak mendukung notifikasi)
  if (Device.isDevice) {
    // 2. Periksa status izin notifikasi saat ini
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    // 3. Jika belum diberi izin, minta izin ke pengguna
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    // 4. Jika izin ditolak, hentikan proses
    if (finalStatus !== 'granted') {
      alert('Gagal mendapatkan izin untuk push notification!')
      return null
    }
    // 5. Ambil Token Expo menggunakan ID yang sudah terdaftar
    try {
      const expoTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'd3d600bd-d196-43bd-a0e0-65bf0bb25a50', // ID dari terminal Anda
      })
      token = expoTokenData.data

      console.log('🚀 Token Expo Berhasil Diambil:', token)
    } catch (error) {
      console.error('Gagal mengambil token perangkat:', error.message)
    }
  } else {
    alert(
      'Harus menggunakan perangkat fisik untuk menggunakan Push Notifications',
    )
  }

  // Konfigurasi tambahan khusus untuk perangkat Android agar muncul pop-up popup/suara
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  return token
}
