/**
 * Core types used throughout the application
 */

// User/Authentication types
export interface UserProfile {
  address: string
  username: string
  avatar: string | null
  avatarCid: string | null
  bio: string | null
  favoriteCategories: string[]
  isProfileComplete: boolean
  profileCid: string | null
  web3Socials: {
    ens: string | null
    lens: string | null
    farcaster: string | null
    twitter: string | null
    telegram: string | null
  }
  id: string
  createdAt: string
  events: string[]
  tickets: string[]
}

export interface AuthState {
  isConnected: boolean
  isLoading: boolean
  hasInviteAccess: boolean
  userProfile: UserProfile | null
}

// Event types
export interface Event {
  id: string
  title: string
  description: string
  creator: string
  creatorAddress: string
  category: string
  date: string
  duration: number
  participants: number
  maxParticipants: number
  ticketPrice: number
  image: string
  status: "created" | "live" | "completed" | "finalized"
  contentUri: string
  ticketCollection?: string // Solana address of the ticket collection (Candy Machine)
}

export type EventCategory = 
  | "standup-comedy"
  | "performance-art" 
  | "poetry-slam"
  | "open-mic"
  | "live-painting"
  | "creative-workshop"
  | "music-performance"
  | "dance-performance"
  | "digital-art"
  | "storytelling"

// Ticketing types
export interface Ticket {
  id: string
  eventId: string
  owner: string
  price: number
  purchasedAt: string
}

// Chat/Messages types
export interface ChatMessage {
  id: string
  eventId: string
  sender: string
  senderAddress: string
  message: string
  timestamp: string
  isTip?: boolean
  tipAmount?: number
}

// Tipping types
export interface Tip {
  id: string
  eventId: string
  sender: string
  amount: number
  timestamp: string
} 