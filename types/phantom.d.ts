/**
 * TypeScript declarations for Phantom wallet 
 */

interface PhantomSolanaAdapter {
  publicKey: import('@solana/web3.js').PublicKey;
  connect: () => Promise<{ publicKey: import('@solana/web3.js').PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: import('@solana/web3.js').Transaction) => Promise<import('@solana/web3.js').Transaction>;
  signAllTransactions: (transactions: import('@solana/web3.js').Transaction[]) => Promise<import('@solana/web3.js').Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  isConnected: boolean;
}

interface PhantomProvider {
  solana?: PhantomSolanaAdapter;
  isPhantom?: boolean;
  connect: (params?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: string }>;
  disconnect: () => Promise<void>;
}

// Augment the Window interface
declare global {
  interface Window {
    phantom?: PhantomProvider;
    solana?: PhantomSolanaAdapter;
  }
}

export {}; 