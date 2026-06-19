import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export async function registerForPushNotificationsAsync() {
  // ⚠️ Expo Go tidak mendukung remote push notification di Android sejak SDK 53.
  // Jika berjalan di dalam Expo Go, skip registrasi secara graceful tanpa error/crash.
  const isExpoGo = Constants.appOwnership === 'expo'
  if (isExpoGo) {
    console.log(
      'ℹ️ Expo Go terdeteksi: Push notification dilewati. Gunakan Development Build untuk fitur penuh.',
    )
    return null
  }

  let token

  // 1. Periksa apakah ini perangkat fisik (simulator tidak mendukung notifikasi)
  if (Device.isDevice) {
    // 2. Periksa status izin notifikasi saat ini
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    // 3. Jika belum diberi izin, minta izin ke pengguna
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    // 4. Jika izin ditolak, hentikan proses tanpa crash
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Izin push notification ditolak oleh pengguna.')
      return null
    }

    // 5. Ambil Token Expo menggunakan projectId dari app.json
    try {
      const expoTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
      token = expoTokenData.data
      console.log('🚀 Token Expo Berhasil Diambil:', token)
    } catch (error: any) {
      console.error('Gagal mengambil token perangkat:', error.message)
    }
  } else {
    console.warn('ℹ️ Push notification hanya tersedia di perangkat fisik.')
  }

  // Konfigurasi channel notifikasi khusus Android (suara & getaran)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  return token
}
