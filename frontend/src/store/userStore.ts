import { create } from 'zustand'
import type { UserType } from '../mock/data'

export type Role = 'student' | 'admin'

interface AuthData {
  userId: string
  userType: UserType
  token: string
}

function loadAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem('auth')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveAuth(data: AuthData) {
  localStorage.setItem('auth', JSON.stringify(data))
}

function clearAuth() {
  localStorage.removeItem('auth')
}

const saved = loadAuth()

interface UserState {
  currentUserId: string
  currentUserType: UserType
  role: Role
  isLoggedIn: boolean
  token: string | null
  setCurrentUser: (userId: string, userType: UserType) => void
  setRole: (role: Role) => void
  login: (userId: string, userType: UserType, token: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  currentUserId: saved?.userId || 'u_001',
  currentUserType: saved?.userType || 'SELF_DRIVEN',
  role: 'admin',
  isLoggedIn: !!saved,
  token: saved?.token || null,
  setCurrentUser: (userId: string, userType: UserType) => set({ currentUserId: userId, currentUserType: userType }),
  setRole: (role: Role) => set({ role }),
  login: (userId: string, userType: UserType, token: string) => {
    saveAuth({ userId, userType, token })
    set({ currentUserId: userId, currentUserType: userType, token, isLoggedIn: true })
  },
  logout: () => {
    clearAuth()
    set({ token: null, isLoggedIn: false })
  },
}))
