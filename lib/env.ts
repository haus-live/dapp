/**
 * Centralized environment variable access
 * All environment variables should be accessed through this file
 * to ensure consistent naming and fallback values
 */

// Solana configuration
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC || 'https://solana-devnet.g.alchemy.com/v2/hQ3pyvJGx66ieRT9hyuPNA0o2e17yWCK';
export const SOLANA_PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || '8SjSBampBM2asLdQeJoAZpxJxpcbBEGG5q9ADRCAFxr5';

// IPFS/Pinata configuration
export const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || 'd856b1edf03a5264d9b5';
export const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET || '21db92a10e14b9235818e0ebef5098563678e6ef18631bcc2b10e1c3028053c4';
export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyZjlmZmEyMC03M2UwLTRjNDktYjg5YS1mYThkMGE2ZjkxYjYiLCJlbWFpbCI6ImhhdXNsaXZlMjVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImQ4NTZiMWVkZjAzYTUyNjRkOWI1Iiwic2NvcGVkS2V5U2VjcmV0IjoiMjFkYjkyYTEwZTE0YjkyMzU4MThlMGViZWY1MDk4NTYzNjc4ZTZlZjE4NjMxYmNjMmIxMGUxYzMwMjgwNTNjNCIsImV4cCI6MTc3ODg2MzU2N30.XhasGn7s9RRbRWciSMfo0GV4eJ2TZBJ6ZWOHqNYKB6E';
export const PINATA_URL = process.env.NEXT_PUBLIC_PINATA_URL || 'gray-random-lamprey-785.mypinata.cloud';
export const PINATA_GATEWAY_URL = `https://${PINATA_URL}/ipfs`;

// Alchemy API configuration
export const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
export const ALCHEMY_GAS_MANAGER_POLICY_ID = process.env.NEXT_PUBLIC_ALCHEMY_GAS_MANAGER_POLICY_ID || '';

/**
 * Helper function to safely access environment variables with typing support
 * @param key The environment variable key
 * @param fallback Optional fallback value
 * @returns The environment variable value or fallback
 */
export function getEnv(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
} 