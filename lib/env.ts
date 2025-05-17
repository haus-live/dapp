/**
 * Environment variables for the application
 * Provides centralized access to configuration values
 */

// Solana RPC URL - using environment variable with fallback
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC || 'https://solana-devnet.g.alchemy.com/v2/hQ3pyvJGx66ieRT9hyuPNA0o2e17yWCK';

// Solana program ID - using environment variable with fallback
export const SOLANA_PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || '8SjSBampBM2asLdQeJoAZpxJxpcbBEGG5q9ADRCAFxr5';

// Pinata IPFS gateway URL for content retrieval
export const PINATA_GATEWAY_URL = `https://${process.env.NEXT_PUBLIC_PINATA_URL || 'gray-random-lamprey-785.mypinata.cloud'}/ipfs`;

// Pinata API credentials for IPFS uploads
export const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || 'd856b1edf03a5264d9b5';
export const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET || '21db92a10e14b9235818e0ebef5098563678e6ef18631bcc2b10e1c3028053c4';

// Pinata JWT for authentication (optional, used when available)
export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

// Export all environment variables for easier imports
export const ENV = {
  SOLANA_RPC_URL,
  SOLANA_PROGRAM_ID,
  PINATA_GATEWAY_URL,
  PINATA_API_KEY,
  PINATA_API_SECRET,
  PINATA_JWT
};