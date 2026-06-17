const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

exports.detectHighTilt = functions.firestore
  .document('/projects/{projectId}/points/{pointId}/reports/{reportId}')
  .onCreate(async (snapshot, context) => {
    const reportData = snapshot.data()
    const { gyroX, gyroY } = reportData
    const { projectId } = context.params

    const absX = Math.abs(gyroX)
    const absY = Math.abs(gyroY)

    // Jika kemiringan melebihi 5 derajat
    if (absX > 5 || absY > 5) {
      try {
        // 1. Ambil data proyek untuk mengetahui siapa Mandor-nya (adminId)
        const projectDoc = await admin
          .firestore()
          .collection('projects')
          .doc(projectId)
          .get()
        if (!projectDoc.exists) return null

        const adminId = projectDoc.data().adminId

        // 2. Ambil token notifikasi (FCM Token) milik Mandor dari koleksi users
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(adminId)
          .get()
        if (!userDoc.exists) return null

        const fcmToken = userDoc.data().fcmToken // Pastikan HP Mandor menyimpan token di field ini nanti

        if (fcmToken) {
          // 3. Kirim Push Notification ke HP Mandor
          const message = {
            notification: {
              title: '⚠️ PERINGATAN BAHAYA STRUKTUR!',
              body: `Terdeteksi kemiringan ekstrem (X: ${gyroX}°, Y: ${gyroY}°) pada proyek Anda.`,
            },
            token: fcmToken,
          }

          await admin.messaging().send(message)
          console.log(`🚀 Notifikasi berhasil dikirim ke Mandor (${adminId})`)
        }
      } catch (error) {
        console.error('Gagal mengirim notifikasi:', error)
      }
    }
    return null
  })
