/**
 * Production event minting actions
 * Handles wallet interaction and blockchain transactions
 */
import { mintEvent } from '@/lib/solana/event-minter';

/**
 * Mints an event NFT on the Solana blockchain
 * Handles the creation of a ticket collection and the event NFT
 * 
 * @param wallet Connected Phantom wallet
 * @param formData Form data from the event creation flow
 * @returns Object containing transaction signature and realtime asset key
 */
export async function handleMintEvent(wallet: any, formData: any) {
  try {
    // Log for debugging
    console.log('[DEBUG] Mint button clicked');
    
    // Validate wallet connection
    const walletConnected = wallet && wallet.publicKey && wallet.connected;
    if (!walletConnected) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    // Log environment status
    console.log('[DEBUG] Environment check:', {
      hasPhantom: !!window.solana,
      hasWindowSolana: !!window.solana,
      isPhantomConnected: wallet.isConnected
    });
    
    // Validate required wallet features
    console.log('[DEBUG] Connection status:', {
      userProfile: !!formData,
      publicKey: !!wallet.publicKey,
      signTransaction: typeof wallet.signTransaction === 'function',
      signAllTransactions: typeof wallet.signAllTransactions === 'function',
      phantomConnected: wallet.isConnected
    });
    
    // Log wallet adapter creation
    console.log('[DEBUG] Creating wallet adapter for Anchor');
    
    // Log wallet state for debugging
    console.log('[DEBUG] Phantom wallet state:', {
      isConnected: wallet.isConnected,
      publicKey: wallet.publicKey?.toString(),
      isPhantom: wallet.isPhantom
    });
    
    // Start the minting process
    console.log('[DEBUG] Starting event minting process with wallet:', wallet.publicKey.toString());
    
    // This triggers the wallet for multiple transaction signatures:
    // 1. Creating the ticket collection
    // 2. Creating the event with the ticket collection
    const result = await mintEvent(wallet, formData);
    
    return {
      transactionSignature: result.transactionSignature, 
      realtimeAssetKey: result.realtimeAssetKey
    };
  } catch (error) {
    console.error('Error in handleMintEvent:', error);
    throw error;
  }
}