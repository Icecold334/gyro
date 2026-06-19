import { MaterialIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  deleteDoc,
} from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth, db } from '../firebaseConfig'
import { useProjectStore } from '../projectStore'
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotifications'
import CustomPromptModal from '../components/CustomPromptModal'

interface ProjectMember {
  id: string
  projectId: string
  projectName: string
  role: 'leader' | 'member'
  joinedAt: string
  inviteCode?: string
  lastStatus?: 'OK' | 'WARN' | 'CRITICAL' | 'NO DATA'
  lastUpdated?: string
}

const getInitials = (name?: string) => {
  if (!name || name === 'US') return 'US';
  const words = name.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return 'US';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

export default function WorkspacesScreen() {
  const [projects, setProjects] = useState<ProjectMember[]>([])
  const [userProfile, setUserProfile] = useState<{ name: string, photoURL: string | null }>({ name: 'US', photoURL: null })

  // Modal state untuk Create & Join (cross-platform pengganti Alert.prompt)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [joinModalVisible, setJoinModalVisible] = useState(false)

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    async function fetchUserProfile() {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserProfile({
            name: data.displayName || currentUser.displayName || 'US',
            photoURL: data.photoURL || currentUser.photoURL || null
          })
        } else {
          setUserProfile({
            name: currentUser.displayName || 'US',
            photoURL: currentUser.photoURL || null
          })
        }
      } catch (e) {
        setUserProfile({
          name: currentUser.displayName || 'US',
          photoURL: currentUser.photoURL || null
        })
      }
    }
    fetchUserProfile()

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
      async (snapshot) => {
        const projectList: ProjectMember[] = []
        const fetches: Promise<void>[] = []

        snapshot.forEach((docSnap) => {
          const data = docSnap.data()
          const pm: ProjectMember = {
            id: docSnap.id,
            projectId: data.projectId,
            projectName: data.projectName,
            role: data.role,
            joinedAt: data.joinedAt,
          }
          projectList.push(pm)

          if (data.role === 'leader') {
            fetches.push(
              getDoc(doc(db, 'projects', data.projectId)).then(pDoc => {
                if (pDoc.exists()) {
                  pm.inviteCode = pDoc.data().inviteCode
                }
              }).catch(err => console.error("Error fetching project invite code", err))
            )
          }

          fetches.push(
            getDocs(
              query(
                collectionGroup(db, 'reports'),
                where('projectId', '==', data.projectId),
                orderBy('timestamp', 'desc'),
                limit(1)
              )
            ).then(snap => {
              if (!snap.empty) {
                const lastReport = snap.docs[0].data();
                const rawX = lastReport.gyroX || 0;
                const rawY = lastReport.gyroY || 0;
                const isCritical = Math.abs(rawX) > 2 || Math.abs(rawY) > 2;
                const isWarn = Math.abs(rawX) > 1 || Math.abs(rawY) > 1;
                pm.lastStatus = isCritical ? 'CRITICAL' : (isWarn ? 'WARN' : 'OK');
                
                const date = lastReport.timestamp?.toDate ? lastReport.timestamp.toDate() : new Date();
                pm.lastUpdated = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
              } else {
                pm.lastStatus = 'NO DATA';
              }
            }).catch(err => {
              console.error("Error fetching latest report", err);
              pm.lastStatus = 'NO DATA';
            })
          )
        })

        await Promise.all(fetches)
        setProjects([...projectList])
      },
      (error) => {
        console.error('Gagal mengambil daftar proyek:', error)
      },
    )

    return () => unsubscribe()
  }, [])

  const handleDeleteProject = (project: ProjectMember) => {
    Alert.alert(
      project.role === 'leader' ? 'Hapus Proyek' : 'Keluar dari Proyek',
      project.role === 'leader' 
        ? `Apakah Anda yakin ingin menghapus proyek "${project.projectName}" beserta seluruh anggotanya secara permanen?`
        : `Apakah Anda yakin ingin keluar dari proyek "${project.projectName}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: project.role === 'leader' ? 'Hapus' : 'Keluar', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (project.role === 'leader') {
                // Delete the project document
                await deleteDoc(doc(db, 'projects', project.projectId));
                // Delete all project_members associated with this project
                const membersQuery = query(collection(db, 'project_members'), where('projectId', '==', project.projectId));
                const membersSnap = await getDocs(membersQuery);
                const deletePromises = membersSnap.docs.map(mDoc => deleteDoc(doc(db, 'project_members', mDoc.id)));
                await Promise.all(deletePromises);
                
                Alert.alert('Sukses', 'Proyek berhasil dihapus.');
              } else {
                // Just delete the user's membership
                await deleteDoc(doc(db, 'project_members', project.id));
                Alert.alert('Sukses', 'Berhasil keluar dari proyek.');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    )
  }

  const handleJoinProject = async (codeInput: string) => {
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

      // 3. Cek apakah user sudah terdaftar di proyek ini (pencegahan duplicate join)
      const duplicateCheck = query(
        collection(db, 'project_members'),
        where('userId', '==', currentUser.uid),
        where('projectId', '==', projectId),
      )
      const duplicateSnap = await getDocs(duplicateCheck)
      if (!duplicateSnap.empty) {
        Alert.alert('Gagal', 'Anda sudah terdaftar di proyek ini!')
        return
      }

      // 4. Masukkan user ke proyek tersebut sebagai "member"
      await addDoc(collection(db, 'project_members'), {
        userId: currentUser.uid,
        projectId: projectId,
        projectName: projectData.projectName,
        role: 'member',
        joinedAt: new Date().toISOString(),
      })

      Alert.alert(
        'Sukses',
        `Berhasil bergabung ke proyek: ${projectData.projectName}`,
      )
    } catch (error: any) {
      Alert.alert('Gagal', error.message)
    }
  }

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateProject = async (projectNameInput: string) => {
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
    } catch (error: any) {
      Alert.alert('Gagal', error.message)
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
            Monitoring Building with Gyro
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.replace('/profile')}
          className="h-8 w-8 rounded-full bg-primary-container items-center justify-center overflow-hidden"
        >
          {userProfile.photoURL ? (
            <Image source={{ uri: userProfile.photoURL }} className="w-full h-full" />
          ) : (
            <Text className="text-on-primary-container text-[10px] font-bold font-mono">
              {getInitials(userProfile.name)}
            </Text>
          )}
        </TouchableOpacity>
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
            onPress={() => setJoinModalVisible(true)}
            className="flex-1 bg-white border border-outline h-12 rounded-lg items-center justify-center flex-row gap-2"
          >
            <MaterialIcons name="link" size={18} color="#041627" />
            <Text className="text-primary font-bold text-xs uppercase">
              Join Project
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCreateModalVisible(true)}
            className="flex-1 bg-primary h-12 rounded-lg items-center justify-center flex-row gap-2 shadow-sm"
          >
            <MaterialIcons name="add" size={18} color="white" />
            <Text className="text-on-primary font-bold text-xs uppercase text-white">
              Create Project
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Prompt Modal - Create Project (cross-platform, replaces Alert.prompt) */}
        <CustomPromptModal
          visible={createModalVisible}
          title="Proyek Baru"
          message="Masukkan nama proyek struktur bangunan:"
          placeholder="contoh: Gedung A - Lantai 3"
          confirmText="Buat"
          onConfirm={(text) => {
            setCreateModalVisible(false)
            handleCreateProject(text)
          }}
          onCancel={() => setCreateModalVisible(false)}
        />

        {/* Custom Prompt Modal - Join Project (cross-platform, replaces Alert.prompt) */}
        <CustomPromptModal
          visible={joinModalVisible}
          title="Gabung Proyek"
          message="Masukkan 6-digit kode undangan proyek:"
          placeholder="contoh: ABC123"
          confirmText="Gabung"
          onConfirm={(text) => {
            setJoinModalVisible(false)
            handleJoinProject(text)
          }}
          onCancel={() => setJoinModalVisible(false)}
        />

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

                    {project.role === 'leader' && project.inviteCode && (
                      <TouchableOpacity
                        onPress={() => {
                          Clipboard.setStringAsync(project.inviteCode || '');
                          Alert.alert('Sukses', 'Kode undangan disalin ke clipboard!');
                        }}
                        className="flex-row items-center gap-1 mt-2 bg-surface-container-high self-start px-2 py-1 rounded border border-outline-variant"
                      >
                        <MaterialIcons name="content-copy" size={12} color="#041627" />
                        <Text className="text-[10px] font-mono font-bold text-primary">
                          CODE: {project.inviteCode}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="flex-row justify-between items-end border-t border-surface-variant pt-3">
                    <View>
                      <Text className="text-[10px] text-on-surface-variant font-mono uppercase">
                        Role: {project.role}
                      </Text>
                      <View className="flex-row items-center gap-1.5 mt-1">
                        <View className={`w-2 h-2 rounded-full ${project.lastStatus === 'CRITICAL' ? 'bg-[#ba1a1a]' : project.lastStatus === 'WARN' ? 'bg-[#b06000]' : project.lastStatus === 'OK' ? 'bg-[#137333]' : 'bg-outline'}`} />
                        <Text className={`text-[11px] font-bold ${project.lastStatus === 'CRITICAL' ? 'text-[#ba1a1a]' : project.lastStatus === 'WARN' ? 'text-[#b06000]' : project.lastStatus === 'OK' ? 'text-[#137333]' : 'text-on-surface-variant'}`}>
                          {project.lastStatus === 'NO DATA' ? 'NO DATA' : `${project.lastStatus} • ${project.lastUpdated}`}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      onPress={(e) => {
                        handleDeleteProject(project);
                      }}
                      className="w-8 h-8 items-center justify-center bg-error-container rounded-lg"
                    >
                      <MaterialIcons name={project.role === 'leader' ? 'delete' : 'logout'} size={16} color="#ba1a1a" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>


      </ScrollView>
    </SafeAreaView>
  )
}
