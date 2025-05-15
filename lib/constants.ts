// Import environment variables from centralized location
import {
  SOLANA_RPC_URL,
  SOLANA_PROGRAM_ID,
  PINATA_API_KEY,
  PINATA_API_SECRET,
  PINATA_JWT,
  PINATA_URL,
  PINATA_GATEWAY_URL
} from './env';

// Contract addresses
export const CONTRACT_ADDRESSES = {
  EVENT_FACTORY: "0x1234567890123456789012345678901234567890",
  EVENT_STATION: "0x0987654321098765432109876543210987654321",
  TICKET_FACTORY: "0x2345678901234567890123456789012345678901",
  LIVE_TIPPING: "0x3456789012345678901234567890123456789012",
  CURATION_PROPOSAL: "0x4567890123456789012345678901234567890123",
}

// Re-export Solana configuration from env.ts for backward compatibility
export const SOLANA_DEVNET_RPC = SOLANA_RPC_URL;
export const PROGRAM_ID = SOLANA_PROGRAM_ID;

// Re-export IPFS configuration from env.ts for backward compatibility
export const IPFS_GATEWAY = PINATA_GATEWAY_URL;

// API keys
export const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ""
export const GAS_MANAGER_POLICY_ID = process.env.NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID || ""

// Hidden message (encrypted)
export const HIDDEN_MESSAGE_1 = "cmVhbGl0eSAtIGlzIHlldCB0byBiZSBpbnZlbnRlZC4=" // "reality - is yet to be invented." in base64
export const HIDDEN_MESSAGE_2 = "anVzdCBhbm90aGVyIHF1b3RlLg==" // "just another quote." in base64

export const EVENT_FACTORY_ABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_title",
        type: "string",
      },
      {
        internalType: "string",
        name: "_description",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_startTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_duration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxTickets",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_ticketPrice",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_metadataURI",
        type: "string",
      },
    ],
    name: "createEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

export const TICKET_FACTORY_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_eventId",
        type: "uint256",
      },
    ],
    name: "buyTicket",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
]

export const LIVE_TIPPING_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_eventId",
        type: "uint256",
      },
    ],
    name: "tipCreator",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
]

// Define the supported video categories
export type VideoCategory = 
  | "standup-comedy"
  | "performance-art" 
  | "poetry-slam"
  | "open-mic"
  | "live-painting"
  | "creative-workshop"
  | "default";

// Video library organized by category
const videosByCategory: Record<VideoCategory, string[]> = {
  "standup-comedy": [
    "https://yddhyb5b6wwp3cqi.public.blob.vercel-storage.com/mixkit-youtuber-vlogging-in-his-studio-41272-hd-ready-0rsj4lJ7mNHJy2Rv7BAlcJI31a8l9X.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-excited-man-dancing-shot-from-below-32746-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-multicolored-lights-32746-large.mp4",
  ],
  "performance-art": [
    "https://yddhyb5b6wwp3cqi.public.blob.vercel-storage.com/1817-360-4J7GucopM3hE57hZjSwWqko3n5ULym.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-a-club-with-colorful-lighting-1227-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-with-neon-lights-around-her-32757-large.mp4",
  ],
  "poetry-slam": [
    "https://yddhyb5b6wwp3cqi.public.blob.vercel-storage.com/2955-360-xLAcPRAAEvhA4gJV8bHULqhHaftej1.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-in-a-bar-1509-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-man-talking-in-a-bar-1512-large.mp4",
  ],
  "open-mic": [
    "https://yddhyb5b6wwp3cqi.public.blob.vercel-storage.com/29983-360-yI0kgZpZ7Bj7QUbZQGPxKmmKefwLav.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-man-playing-an-acoustic-guitar-on-stage-1725-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-man-playing-a-guitar-on-stage-1718-large.mp4",
  ],
  "live-painting": [
    "https://yddhyb5b6wwp3cqi.public.blob.vercel-storage.com/443-360-kRKFI1NVe7SieGyQKFPiKQin2dY8LV.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-girl-drawing-on-a-notebook-168-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-top-view-of-woman-drawing-in-a-notebook-168-large.mp4",
  ],
  "creative-workshop": [
    "https://yddhyb5b6wwp3cqi.public.blob.vercel-storage.com/40367-360-LovhxrX7kcdSINyPAu7xLgWlCNmTBJ.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-woman-taking-pictures-of-a-plant-1389-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-woman-taking-pictures-of-plants-1388-large.mp4",
  ],
  "default": ["https://yddhyb5b6wwp3cqi.public.blob.vercel-storage.com/785-360-ykiufcPxRiluXzB1DWwD0VvDyM9efz.mp4"],
};

// Function to get a random video URL based on category
export const getRandomVideo = (category: string): string => {
  // Convert input category to a valid key or use default
  const categoryKey = (videosByCategory.hasOwnProperty(category) ? 
    category : "default") as VideoCategory;
    
  const videos = videosByCategory[categoryKey];
  const randomIndex = Math.floor(Math.random() * videos.length);
  return videos[randomIndex];
}
