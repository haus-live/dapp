"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { HIDDEN_MESSAGE_2 } from "@/lib/constants"
import { UserProfile, AuthState } from "@/lib/types"

interface AuthContextType extends AuthState {
  connect: (walletType: string) => Promise<void>
  disconnect: () => void
  updateProfile: (profile: Partial<UserProfile>) => void
  setHasInviteAccess: (value: boolean) => void
}

const defaultUserProfile: UserProfile = {
  address: "0x1a2b3c4d5e6f7g8h9i0j",
  ensName: null,
  avatar: null,
  bio: null,
  favoriteCategories: [],
  isProfileComplete: false,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEYS = {
  AUTH: "haus_auth",
  INVITE_ACCESS: "haus_invite_access",
  SIGNATURE: "_jabyl_signature"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isConnected: false,
    isLoading: false,
    hasInviteAccess: false,
    userProfile: null
  });

  // Check if user is already connected on mount
  useEffect(() => {
    // Load authentication state
    const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH)
    if (storedAuth) {
      try {
        const { isConnected, userProfile } = JSON.parse(storedAuth)
        setAuthState(prevState => ({
          ...prevState,
          isConnected,
          userProfile
        }));
      } catch (error) {
        console.error("Failed to parse stored auth:", error)
        localStorage.removeItem(STORAGE_KEYS.AUTH)
      }
    }

    // Check if user has invite access
    const hasAccess = localStorage.getItem(STORAGE_KEYS.INVITE_ACCESS) === "true"
    setAuthState(prevState => ({
      ...prevState,
      hasInviteAccess: hasAccess
    }));

    // Add hidden message to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SIGNATURE, HIDDEN_MESSAGE_2)
    }
  }, [])

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    const { isConnected, userProfile } = authState;
    
    if (isConnected && userProfile) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ isConnected, userProfile }))
    } else if (!isConnected) {
      localStorage.removeItem(STORAGE_KEYS.AUTH)
    }
  }, [authState.isConnected, authState.userProfile])

  const connect = async (walletType: string) => {
    setAuthState(prevState => ({
      ...prevState,
      isLoading: true
    }));

    try {
      // Simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate ENS resolution
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Set connected state with detected ENS
      setAuthState({
        isConnected: true,
        isLoading: false,
        hasInviteAccess: authState.hasInviteAccess,
        userProfile: {
          ...defaultUserProfile,
          ensName: "jabyl.eth",
          avatar:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/21c09ec3-fb44-40b5-9ffc-6fedc032fe3b-I36E2znZKmldANSRQFL5kgjSSjYRka.jpeg",
        }
      });
    } catch (error) {
      console.error("Connection failed:", error)
      setAuthState(prevState => ({
        ...prevState,
        isLoading: false
      }));
    }
  }

  const disconnect = () => {
    setAuthState({
      isConnected: false,
      isLoading: false,
      hasInviteAccess: authState.hasInviteAccess,
      userProfile: null
    });
    localStorage.removeItem(STORAGE_KEYS.AUTH)
  }

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (authState.userProfile) {
      const updatedProfile = { ...authState.userProfile, ...profile }
      setAuthState(prevState => ({
        ...prevState,
        userProfile: updatedProfile
      }));
    }
  }

  const setHasInviteAccess = (value: boolean) => {
    setAuthState(prevState => ({
      ...prevState,
      hasInviteAccess: value
    }));
    localStorage.setItem(STORAGE_KEYS.INVITE_ACCESS, value ? "true" : "false")
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        connect,
        disconnect,
        updateProfile,
        setHasInviteAccess,
      }}
    >
      {children}
      {/* Hidden comment with encrypted message */}
      {/* <!-- jabyl: anVzdCBhbm90aGVyIHF1b3RlLg== --> */}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
