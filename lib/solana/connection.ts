import { Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { useSolanaWallet } from '@/contexts/solana-wallet-context';
import { SOLANA_RPC_URL } from '@/lib/env';

// Add debugging for RPC connection issues
const debug = (message: string, data?: any) => {
  console.log(`%c[CONNECTION] ${message}`, 'background: #330033; color: #22ff22', data || '');
};

/**
 * Get the Solana RPC URL based on the environment
 * @returns Solana RPC URL
 */
export function getClusterUrl(): string {
  debug("Using RPC URL from env", SOLANA_RPC_URL);
  return SOLANA_RPC_URL;
}

/**
 * Creates a connection to the Solana network using environment variables or fallbacks
 * @returns Connection object
 */
export function createConnection(): Connection {
  try {
    debug("Creating connection with RPC URL:", SOLANA_RPC_URL);
    return new Connection(SOLANA_RPC_URL, 'confirmed');
  } catch (error) {
    console.error("Failed to connect to primary RPC, trying fallback:", error);
    // Use official Solana endpoint as fallback
    debug("Using fallback connection with Solana official endpoint");
    return new Connection(clusterApiUrl('devnet'), 'confirmed');
  }
}

/**
 * Create an Anchor provider using the Phantom wallet
 * @param wallet Phantom wallet with publicKey and signTransaction
 * @returns Anchor provider instance
 */
export function createProvider(wallet: any): AnchorProvider {
  const connection = createConnection();
  
  // Create AnchorWallet adapter for Phantom wallet
  const anchorWallet = {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
  };
  
  return new AnchorProvider(
    connection,
    anchorWallet as Wallet,
    { commitment: 'confirmed' }
  );
}

/**
 * Creates a temporary keypair for use with the program
 * @returns New Keypair instance
 */
export function createTemporaryKeypair(): Keypair {
  return Keypair.generate();
} 