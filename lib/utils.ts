import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Keypair } from '@solana/web3.js'

// Improved utility function with memoization for better performance
const memoizedResults = new Map<string, string>()

export function cn(...inputs: ClassValue[]): string {
  const key = JSON.stringify(inputs)

  if (memoizedResults.has(key)) {
    return memoizedResults.get(key)!
  }

  const result = twMerge(clsx(inputs))
  memoizedResults.set(key, result)

  return result
}

// Add performance utilities
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Formats a date or timestamp to a readable string
 * @param date Date object or timestamp
 * @returns Formatted date string
 */
export function formatDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Truncates a string (like an address) with ellipsis in the middle
 * @param str String to truncate
 * @param startChars Characters to show at start
 * @param endChars Characters to show at end
 * @returns Truncated string
 */
export function truncateMiddle(str: string, startChars = 4, endChars = 4): string {
  if (!str) return '';
  if (str.length <= startChars + endChars) return str;
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
}

/**
 * Safely generate random bytes in both browser and server environments
 * This uses a consistent approach to avoid hydration mismatches
 * @returns A Uint8Array with 32 random bytes
 */
export function getRandomBytes(): Uint8Array {
  const bytes = new Uint8Array(32);
  
  // For SSR compatibility, always prefer Keypair.generate() for consistency
  // This avoids hydration mismatches caused by different implementations
  const randomKeypair = Keypair.generate();
  const secretKey = randomKeypair.secretKey;
  
  // Use the first 32 bytes of the secret key
  for (let i = 0; i < 32; i++) {
    bytes[i] = secretKey[i];
  }
  
  return bytes;
}
