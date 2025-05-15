"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { HIDDEN_MESSAGE_2 } from "@/lib/constants"
import { UserProfile, AuthState } from "@/lib/types"
import { useSolanaWallet } from "./solana-wallet-context"
import { PublicKey } from "@solana/web3.js"
import { 
  fetchFromPinata, 
  getPinataUrl, 
  storeJsonOnPinata, 
  storeUserProfile 
} from "@/services/pinata-service"

interface AuthContextType extends AuthState {
  connect: () => Promise<boolean>
  disconnect: () => void
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>
  setHasInviteAccess: (value: boolean) => void
  saveProfile: (profileData: ProfileUpdateData) => Promise<void>
  isNewUser: boolean
}

export interface ProfileUpdateData {
  username: string
  avatarCid: string | null
  categories: string[]
  bio: string | null
  web3Socials?: {
    ens: string | null
    lens: string | null
    farcaster: string | null
    twitter: string | null
    telegram: string | null
  }
}

const defaultUserProfile: Omit<UserProfile, 'address'> = {
  username: "",
  avatar: null,
  avatarCid: null,
  bio: null,
  favoriteCategories: [],
  isProfileComplete: false,
  profileCid: null,
  web3Socials: {
    ens: null,
    lens: null,
    farcaster: null,
    twitter: null,
    telegram: null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEYS = {
  AUTH: "haus_auth",
  INVITE_ACCESS: "haus_invite_access",
  SIGNATURE: "_jabyl_signature"
}

interface StoredProfileData {
  address: string
  username: string
  avatarCid: string | null
  favoriteCategories: string[]
  bio: string | null
  createdAt: string
  lastUpdated: string
  web3Socials?: {
    ens: string | null
    lens: string | null
    farcaster: string | null
    twitter: string | null
    telegram: string | null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected, connecting, connect: connectWallet, disconnect: disconnectWallet } = useSolanaWallet()
  
  const [authState, setAuthState] = useState<AuthState>({
    isConnected: false,
    isLoading: false,
    hasInviteAccess: false,
    userProfile: null
  });
  
  const [isNewUser, setIsNewUser] = useState(false);

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

  // Update auth state when wallet connection changes
  useEffect(() => {
    const updateProfileFromWallet = async () => {
      if (connected && publicKey) {
        try {
          // Create initial user profile if wallet is connected
          const address = publicKey.toString();
          
          // Try to fetch existing profile from IPFS
          const existingProfileCid = localStorage.getItem(`profile_cid_${address}`);
          
          if (existingProfileCid) {
            try {
              // Try to fetch the existing profile
              const profileData = await fetchFromPinata<StoredProfileData>(existingProfileCid);
              
              // Update auth state with the fetched profile
              setAuthState(prevState => ({
                ...prevState,
                isConnected: true,
                isLoading: false,
                userProfile: {
                  address,
                  username: profileData.username,
                  avatar: profileData.avatarCid ? getPinataUrl(profileData.avatarCid) : null,
                  avatarCid: profileData.avatarCid,
                  bio: profileData.bio,
                  favoriteCategories: profileData.favoriteCategories,
                  isProfileComplete: true,
                  profileCid: existingProfileCid,
                  web3Socials: profileData.web3Socials || {
                    ens: null,
                    lens: null,
                    farcaster: null,
                    twitter: null,
                    telegram: null
                  }
                }
              }));
              setIsNewUser(false);
              return;
            } catch (error) {
              console.error("Failed to fetch profile from IPFS:", error);
              // Continue with default profile if fetch fails
            }
          }
          
          // If no profile was fetched, create a default one and flag as new user
          setAuthState(prevState => ({
            ...prevState,
            isConnected: true,
            isLoading: false,
            userProfile: {
              address,
              ...defaultUserProfile
            }
          }));
          setIsNewUser(true);
        } catch (error) {
          console.error("Error setting up user profile:", error);
        }
      } else if (!connected) {
        // Clear user profile if wallet is disconnected
        setAuthState(prevState => ({
          ...prevState,
          isConnected: false,
          isLoading: false,
          userProfile: null
        }));
        setIsNewUser(false);
      }
    };
    
    updateProfileFromWallet();
  }, [connected, publicKey])

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    const { isConnected, userProfile } = authState;
    
    if (isConnected && userProfile) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ isConnected, userProfile }))
    } else if (!isConnected) {
      localStorage.removeItem(STORAGE_KEYS.AUTH)
    }
  }, [authState.isConnected, authState.userProfile])

  const connect = async (): Promise<boolean> => {
    setAuthState(prevState => ({
      ...prevState,
      isLoading: true
    }));

    try {
      // Connect to Phantom wallet
      await connectWallet();
      
      // Wait for the connection to be established
      return true;
      
      // The connected state will be updated by the useEffect that watches connected & publicKey
    } catch (error) {
      console.error("Connection failed:", error);
      setAuthState(prevState => ({
        ...prevState,
        isLoading: false
      }));
      return false;
    }
  }

  const disconnect = () => {
    disconnectWallet();
    setAuthState({
      isConnected: false,
      isLoading: false,
      hasInviteAccess: authState.hasInviteAccess,
      userProfile: null
    });
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    setIsNewUser(false);
  }

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!authState.userProfile) return;
    
    const updatedProfile = { ...authState.userProfile, ...profile };
    
    setAuthState(prevState => ({
      ...prevState,
      userProfile: updatedProfile
    }));
  }

  const saveProfile = async (profileData: ProfileUpdateData) => {
    if (!authState.userProfile || !publicKey) return;
    
    try {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: true
      }));
      
      const address = publicKey.toString();
      
      // Prepare profile data for storage
      const storageData = {
        address,
        username: profileData.username,
        avatarCid: profileData.avatarCid,
        favoriteCategories: profileData.categories,
        bio: profileData.bio,
        web3Socials: profileData.web3Socials || authState.userProfile.web3Socials,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      
      const profileCid = await storeJsonOnPinata(storageData, `haus-user-${address}`);
      
      // Save the profile CID to localStorage for future reference
      localStorage.setItem(`profile_cid_${address}`, profileCid);
      
      // Update the user profile with the new data
      setAuthState(prevState => ({
        ...prevState,
        isLoading: false,
        userProfile: {
          ...prevState.userProfile!,
          username: profileData.username,
          avatarCid: profileData.avatarCid,
          avatar: profileData.avatarCid ? getPinataUrl(profileData.avatarCid) : null,
          favoriteCategories: profileData.categories,
          bio: profileData.bio,
          isProfileComplete: true,
          profileCid,
          web3Socials: profileData.web3Socials || prevState.userProfile!.web3Socials
        }
      }));
      
      // User is no longer new after saving profile
      setIsNewUser(false);
    } catch (error) {
      console.error("Failed to save profile to IPFS:", error);
      setAuthState(prevState => ({
        ...prevState,
        isLoading: false
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
        saveProfile,
        isNewUser
      }}
    >
      {children}
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
