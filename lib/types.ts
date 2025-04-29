/**
 * Core types used throughout the application
 */

// User/Authentication types
export interface UserProfile {
  address: string
  ensName: string | null
  avatar: string | null
  bio: string | null
  favoriteCategories: string[]
  isProfileComplete: boolean
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
  creator: string
  creatorAddress: string
  category: string
  date: string
  duration: number
  participants: number
  maxParticipants: number
  ticketPrice: number
  description: string
  image: string
  status: "created" | "upcoming" | "live" | "completed" | "finalized"
  videoUrl?: string
  contentUri?: string
  totalTips?: number
  highestTipper?: string
  highestTipAmount?: number
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
  used: boolean
  createdAt: string
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
  senderAddress: string
  amount: number
  timestamp: string
  message?: string
} 