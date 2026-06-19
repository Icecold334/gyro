const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const admin = require('firebase-admin')
const fetch = require('node-fetch') // Pastikan node-fetch tersedia, atau gunakan pencarian global fetch bawaan Node.js v24

admin.initializeApp()

exports.detecthightilt = onDocumentCreated(
  '/projects/{projectId}/points/{pointId}/reports/{reportId}',
  async (event) => {
    const reportData = event.data.data()
    if (!reportData) return null

    const { gyroX, gyroY } = reportData
    const projectId = event.params ? event.params.projectId : null

    if (!projectId) {
      console.error('❌ Error: projectId tidak ditemukan.')
      return null
    }

    const absX = Math.abs(gyroX)
    const absY = Math.abs(gyroY)

    // Ambang batas kemiringan ekstrem > 5 derajat
    if (absX > 5 || absY > 5) {
      try {
        // 1. Ambil data proyek untuk mencari adminId
        const projectDoc = await admin
          .firestore()
          .collection('projects')
          .doc(projectId)
          .get()
        if (!projectDoc.exists) return null

        const adminId = projectDoc.data().adminId || projectDoc.data().createdBy
        if (!adminId) return null

        // 2. Ambil token dari Firestore milik Mandor
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(adminId)
          .get()
        if (!userDoc.exists) return null

        const fcmToken = userDoc.data().fcmToken
        if (!fcmToken) {
          console.log(
            `⚠️ Mandor (${adminId}) belum memiliki token di database.`,
          )
          return null
        }

        const notificationTitle = '⚠️ PERINGATAN BAHAYA STRUKTUR!'
        const notificationBody = `Terdeteksi kemiringan ekstrem (X: ${gyroX}°, Y: ${gyroY}°) pada proyek Anda.`

        // 3. JALUR KHUSUS EXPO TOKEN (Untuk iOS Expo Go)
        if (
          fcmToken.includes('ExponentPushToken') ||
          fcmToken.includes('ExpoPushToken')
        ) {
          console.log(
            `🔗 Mengirim notifikasi via Jembatan API Expo untuk Mandor: ${adminId}`,
          )

          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: fcmToken,
              sound: 'default',
              title: notificationTitle,
              body: notificationBody,
              data: { projectId, gyroX, gyroY },
            }),
          })

          const resData = await response.json()
          console.log('🚀 Respon API Expo:', JSON.stringify(resData))
          return null
        }

        // 4. JALUR NATIVE FCM (Untuk Android / Production Build)
        const message = {
          notification: {
            title: notificationTitle,
            body: notificationBody,
          },
          token: fcmToken,
        }

        await admin.messaging().send(message)
        console.log(`🚀 Sukses! Notifikasi FCM terkirim ke Mandor (${adminId})`)
      } catch (error) {
        console.error('Gagal mengirim notifikasi:', error.message)
      }
    }
    return null
  },
)
