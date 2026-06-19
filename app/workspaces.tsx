import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth, db } from '../firebaseConfig'
import { useProjectStore } from '../projectStore' // Sesuaikan path-nya
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotifications' // Pastikan path folder utils ini sudah benar

interface ProjectMember {
  id: string
  projectId: string
  projectName: string
  role: 'leader' | 'member'
  joinedAt: string
}

export default function WorkspacesScreen() {
  const [projects, setProjects] = useState<ProjectMember[]>([])
  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    async function saveNotificationToken() {
      try {
        const token = await registerForPushNotificationsAsync()
        if (token) {
          const userRef = doc(db, 'users', currentUser.uid)
          await updateDoc(userRef, { fcmToken: token })
          console.log('🚀 FCM Token berhasil disimpan ke Firestore!')
        }
      } catch (err) {
        console.error('Gagal memperbarui FCM Token:', err)
      }
    }
    saveNotificationToken()

    // Ambil data dari project_members milik user yang sedang login
    const q = query(
      collection(db, 'project_members'),
      where('userId', '==', currentUser.uid),
    )

    // Menggunakan onSnapshot agar UI otomatis terupdate jika ada proyek baru/bergabung
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projectList: ProjectMember[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          projectList.push({
            id: doc.id,
            projectId: data.projectId,
            projectName: data.projectName,
            role: data.role,
            joinedAt: data.joinedAt,
          })
        })
        setProjects(projectList)
      },
      (error) => {
        console.error('Gagal mengambil daftar proyek:', error)
      },
    )

    return () => unsubscribe()
  }, [])
  const handleJoinProject = async (codeInput) => {
    const currentUser = auth.currentUser
    if (!currentUser) return
    if (!codeInput.trim()) {
      Alert.alert('Error', 'Kode undangan tidak boleh kosong!')
      return
    }

    try {
      // 1. Cari proyek yang memiliki inviteCode sesuai input
      const q = query(
        collection(db, 'projects'),
        where('inviteCode', '==', codeInput.trim().toUpperCase()),
      )
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        Alert.alert('Gagal', 'Kode undangan tidak ditemukan!')
        return
      }

      // 2. Ambil data proyek yang ditemukan
      const projectDoc = querySnapshot.docs[0]
      const projectId = projectDoc.id
      const projectData = projectDoc.data()

      // 3. Masukkan user ke proyek tersebut sebagai "member"
      await addDoc(collection(db, 'project_members'), {
        userId: currentUser.uid,
        projectId: projectId,
        projectName: projectData.projectName,
        role: 'member', // Peran sebagai anggota biasa
        joinedAt: new Date().toISOString(),
      })

      Alert.alert(
        'Sukses',
        `Berhasil bergabung ke proyek: ${projectData.projectName}`,
      )
    } catch (error) {
      Alert.alert('Gagal', error.message)
    }
  }

  const triggerJoinProjectPrompt = () => {
    Alert.prompt('Gabung Proyek', 'Masukkan 6-digit kode undangan proyek:', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Gabung', onPress: (text) => handleJoinProject(text) },
    ])
  }
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateProject = async (projectNameInput) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      Alert.alert('Error', 'Sesi Anda telah berakhir. Silakan login kembali.')
      return
    }
    if (!projectNameInput.trim()) {
      Alert.alert('Error', 'Nama proyek tidak boleh kosong!')
      return
    }

    const inviteCode = generateInviteCode()
    try {
      const projectRef = await addDoc(collection(db, 'projects'), {
        projectName: projectNameInput,
        inviteCode: inviteCode,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      })

      await addDoc(collection(db, 'project_members'), {
        userId: currentUser.uid,
        projectId: projectRef.id,
        projectName: projectNameInput,
        role: 'leader',
        joinedAt: new Date().toISOString(),
      })

      Alert.alert(
        'Sukses',
        `Proyek berhasil dibuat!\nKode Undangan: ${inviteCode}`,
      )
    } catch (error) {
      Alert.alert('Gagal', error.message)
    }
  }

  const triggerCreateProjectPrompt = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt('Proyek Baru', 'Masukkan nama proyek struktur bangunan:', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Buat', onPress: (text) => handleCreateProject(text) },
      ])
    } else {
      // Untuk Android (Prompt sederhana, nama proyek dummy atau bawaan)
      // Di tahap berikutnya bisa dikembangkan dengan Modal custom jika diperlukan
      const namaDummy = `Proyek Site ${Math.floor(100 + Math.random() * 900)}`
      handleCreateProject(namaDummy)
    }
  }
  const setActiveProject = useProjectStore((state) => state.setActiveProject)
  const handleSelectWorkspace = (projectId: string, projectName: string) => {
    // 1. Simpan ke Global State Zustand
    setActiveProject(projectId, projectName)

    // 2. Pindah ke halaman monitor utama
    router.replace('/monitor')
  }

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      {/* Custom Top App Bar */}
      <View className="h-14 bg-surface border-b border-outline-variant px-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <MaterialIcons name="architecture" size={24} color="#041627" />
          <Text className="font-bold text-lg text-primary tracking-tight">
            Project: Site Alpha-7
          </Text>
        </View>
        <View className="h-8 w-8 rounded-full bg-primary-container items-center justify-center">
          <Text className="text-on-primary-container text-xs font-bold font-mono">
            US
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Section */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-on-surface mb-1">
            Workspaces
          </Text>
          <Text className="text-sm text-on-surface-variant">
            Select an active structural monitoring site to view telemetry.
          </Text>
        </View>

        {/* Actions Row */}
        <View className="flex-row gap-3 mb-8">
          <TouchableOpacity
            onPress={triggerJoinProjectPrompt}
            className="flex-1 bg-white border border-outline h-12 rounded-lg items-center justify-center flex-row gap-2"
          >
            <MaterialIcons name="link" size={18} color="#041627" />
            <Text className="text-primary font-bold text-xs uppercase">
              Join Project
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={triggerCreateProjectPrompt}
            className="flex-1 bg-primary h-12 rounded-lg items-center justify-center flex-row gap-2 shadow-sm"
          >
            <MaterialIcons name="add" size={18} color="white" />
            <Text className="text-on-primary font-bold text-xs uppercase">
              Create Project
            </Text>
          </TouchableOpacity>
        </View>

        {/* Associated Projects Section */}
        <View className="mb-8">
          <Text className="text-[18px] font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">
            Associated Projects
          </Text>

          {/* Projects List */}
          {/* Projects List */}
          <View className="gap-4">
            {projects.length === 0 ? (
              <View className="bg-white border border-outline-variant rounded-xl p-5 items-center">
                <Text className="text-on-surface-variant text-sm">
                  Belum ada proyek. Silakan buat atau gabung proyek baru.
                </Text>
              </View>
            ) : (
              projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  onPress={() =>
                    handleSelectWorkspace(
                      project.projectId,
                      project.projectName,
                    )
                  }
                  className="bg-white border border-outline-variant rounded-xl p-5 h-44 justify-between relative overflow-hidden shadow-sm"
                >
                  {/* Accent Background */}
                  <View className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed opacity-10 rounded-bl-full" />

                  <View>
                    <View className="flex-row justify-between items-start mb-3">
                      <View
                        className={
                          project.role === 'leader'
                            ? 'bg-primary-container px-2.5 py-1 rounded inline-flex flex-row items-center gap-1'
                            : 'bg-surface-variant px-2.5 py-1 rounded inline-flex flex-row items-center gap-1'
                        }
                      >
                        <MaterialIcons
                          name={project.role === 'leader' ? 'shield' : 'group'}
                          size={12}
                          color={
                            project.role === 'leader' ? '#0b1d2d' : '#44474c'
                          }
                        />
                        <Text
                          className={
                            project.role === 'leader'
                              ? 'text-[10px] font-bold text-on-primary-fixed uppercase'
                              : 'text-[10px] font-bold text-on-surface-variant uppercase'
                          }
                        >
                          {project.role === 'leader'
                            ? 'My Project'
                            : 'Member Project'}
                        </Text>
                      </View>
                      <MaterialIcons
                        name="arrow-outward"
                        size={18}
                        color="#74777d"
                      />
                    </View>
                    <Text
                      className="text-lg font-bold text-on-surface"
                      numberOfLines={2}
                    >
                      {project.projectName}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-end border-t border-surface-variant pt-3">
                    <Text className="text-[10px] text-on-surface-variant font-mono uppercase">
                      Role: {project.role}
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2 h-2 rounded-full bg-secondary-container" />
                      <Text className="text-[11px] font-bold text-primary">
                        Active
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Join Request History Section */}
        <View>
          <Text className="text-[18px] font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">
            Join Request History
          </Text>

          <View className="bg-white border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant shadow-sm">
            {/* Pending Request */}
            <View className="p-4 flex-col gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-[15px] text-on-surface">
                  Terowongan MRT Fase 2
                </Text>
                <View className="bg-secondary-fixed px-2.5 py-1 rounded-full flex-row items-center gap-1">
                  <MaterialIcons name="schedule" size={12} color="#221b00" />
                  <Text className="text-[10px] font-bold text-on-secondary-fixed uppercase">
                    Pending
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] text-on-surface-variant font-mono">
                REQUESTED: OCT 24, 2023
              </Text>
            </View>

            {/* Approved Request */}
            <View className="p-4 flex-col gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-[15px] text-on-surface">
                  Elevasi Jalan Tol JORR 2
                </Text>
                <View className="bg-primary-fixed px-2.5 py-1 rounded-full flex-row items-center gap-1">
                  <MaterialIcons
                    name="check-circle"
                    size={12}
                    color="#0b1d2d"
                  />
                  <Text className="text-[10px] font-bold text-on-primary-fixed uppercase">
                    Approved
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] text-on-surface-variant font-mono">
                REQUESTED: OCT 12, 2023
              </Text>
            </View>

            {/* Rejected Request */}
            <View className="p-4 flex-col gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-[15px] text-on-surface">
                  Bendungan Sepaku Semoi
                </Text>
                <View className="bg-error-container px-2.5 py-1 rounded-full flex-row items-center gap-1">
                  <MaterialIcons name="cancel" size={12} color="#ba1a1a" />
                  <Text className="text-[10px] font-bold text-on-error-container uppercase">
                    Rejected
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] text-on-surface-variant font-mono">
                REQUESTED: SEP 05, 2023
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
