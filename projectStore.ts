import { create } from 'zustand'

interface ProjectState {
  activeProjectId: string | null
  activeProjectName: string | null
  setActiveProject: (id: string, name: string) => void
  clearActiveProject: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  activeProjectId: null,
  activeProjectName: null,
  setActiveProject: (id, name) =>
    set({ activeProjectId: id, activeProjectName: name }),
  clearActiveProject: () =>
    set({ activeProjectId: null, activeProjectName: null }),
}))
