// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage'
import { initializeApp } from 'firebase/app'
import { getReactNativePersistence, initializeAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAyTIjfjBAQwc5G76qtL0sx2u1YfRePzas',
  authDomain: 'monitoring-building-with-gyro.firebaseapp.com',
  projectId: 'monitoring-building-with-gyro',
  storageBucket: 'monitoring-building-with-gyro.firebasestorage.app',
  messagingSenderId: '93640328705',
  appId: '1:93640328705:web:7687260212c70a57aca200',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Inisialisasi Auth khusus untuk React Native/Expo agar sesi login tidak hilang saat aplikasi ditutup
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})

// Inisialisasi Firestore Database
const db = getFirestore(app)
const storage = getStorage(app)
// Ekspor variabel agar bisa di-import di file halaman Login/Register
export { app, auth, db, storage }
