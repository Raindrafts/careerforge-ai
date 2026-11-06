import { create } from 'zustand'
import type { StudentProfile } from '@/types'

interface ProfileState {
  profile: StudentProfile | null
  isLoading: boolean
  setProfile: (profile: StudentProfile | null) => void
  setLoading: (loading: boolean) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
}))
