import { PublicKey, Keypair, Connection, clusterApiUrl } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { HausProgramClient } from './program-client';
import { createConnection, createTemporaryKeypair } from './connection';
import { idl as HAUS_IDL } from '@/idl/event-factory';
import { prepareEventMetadata, createSolanaEventParams } from '../event-metadata';
import { Event } from '../types';
import { SOLANA_RPC_URL, SOLANA_PROGRAM_ID } from '../env';

// Add debugging for the minter
const debug = (message: string, data?: any) => {
  console.log(`%c[MINTER] ${message}`, 'background: #003300; color: #ffff00', data || '');
};

/**
 * Create and mint a new event on Solana
 * @param formData Form data from the EventFactory 
 * @param wallet User's wallet (must implement AnchorWallet interface)
 * @param username User's username
 * @returns Object containing the created event and transaction signature
 */
export async function mintEvent(
  formData: any,
  wallet: any,
  username: string
): Promise<{ event: Event, signature: string }> {
  debug("mintEvent called");
  
  try {
    debug("Wallet info", {
      hasPublicKey: !!wallet.publicKey,
      publicKeyStr: wallet.publicKey?.toString(),
      hasSignTransaction: !!wallet.signTransaction,
      hasSignAllTransactions: !!wallet.signAllTransactions
    });
    
    // Basic wallet validation
    if (!wallet || !wallet.publicKey) {
      throw new Error("Public key not found in wallet");
    }
    
    // Add a more robust check for wallet methods and add phantom fallbacks if needed
    if (!wallet.signTransaction) {
      debug("signTransaction not found in provided wallet, checking for window.phantom");
      const phantom = typeof window !== 'undefined' ? window.phantom : undefined;
      const solana = phantom ? phantom.solana : undefined;
      
      if (solana && typeof solana.signTransaction === 'function') {
        wallet.signTransaction = async (tx: any) => {
          debug("Using phantom.solana.signTransaction");
          return await solana.signTransaction(tx);
        };
      } else {
        throw new Error("signTransaction method not available");
      }
    }
    
    if (!wallet.signAllTransactions) {
      debug("signAllTransactions not found in provided wallet, checking for window.phantom");
      const phantom = typeof window !== 'undefined' ? window.phantom : undefined;
      const solana = phantom ? phantom.solana : undefined;
      
      if (solana && typeof solana.signAllTransactions === 'function') {
        wallet.signAllTransactions = async (txs: any) => {
          debug("Using phantom.solana.signAllTransactions");
          return await solana.signAllTransactions(txs);
        };
      } else {
        throw new Error("signAllTransactions method not available");
      }
    }
    
    // Get the RPC URL from centralized env variables
    debug("Using RPC URL from env", SOLANA_RPC_URL);
    
    // Create a connection with the standardized URL
    debug("Creating Solana connection");
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Test connection with a simple request
    try {
      const version = await connection.getVersion();
      debug("Connected to Solana", version);
    } catch (connError) {
      debug("Error connecting to primary RPC, trying fallback");
      // If that fails, try another endpoint as backup
      const fallbackConn = new Connection(clusterApiUrl('devnet'), 'confirmed');
      await fallbackConn.getVersion(); // Will throw if this one fails too
    }
    
    // Generate a keypair for the realtime asset
    const realtimeAsset = createTemporaryKeypair();
    debug("Generated temporary keypair", realtimeAsset.publicKey.toString());
    
    // Prepare event metadata and upload to IPFS
    debug("Preparing event metadata for IPFS...");
    const { uri, metadata } = await prepareEventMetadata(formData, wallet.publicKey.toString(), username);
    debug("Metadata uploaded to IPFS", uri);
    
    // Create event parameters for the Solana program
    debug("Creating Solana event parameters...");
    const eventParams = createSolanaEventParams(formData, uri, wallet.publicKey);
    
    // Get the program ID from centralized env variables
    debug("Using program ID:", SOLANA_PROGRAM_ID);
    
    // Initialize the program client
    debug("Initializing program client");
    const programClient = new HausProgramClient(
      connection, 
      wallet, 
      HAUS_IDL,
      new PublicKey(SOLANA_PROGRAM_ID)
    );
    
    // Call the Solana program to create the event
    debug("Calling createEvent method on program client");
    
    // Add a short timeout to ensure the wallet UI has time to initialize
    // Some browser wallets need this delay to properly display their UI
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    debug("About to sign transaction");
    
    // Perform the transaction with better timeout handling
    let signature;
    try {
      // Set a timeout for the transaction to handle wallet UI not showing up
      const transactionPromise = programClient.createEvent(realtimeAsset, eventParams);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Transaction signing timed out - wallet UI may not be showing")), 30000);
      });
      
      // Race the transaction against the timeout
      signature = await Promise.race([transactionPromise, timeoutPromise]) as string;
      debug("Transaction signature received", signature);
    } catch (txError) {
      debug("Transaction error", txError);
      
      // Check if this is a phantom-specific error
      if (txError instanceof Error) {
        const errorMessage = txError.message.toLowerCase();
        
        if (errorMessage.includes("user rejected") || errorMessage.includes("cancelled")) {
          throw new Error("Transaction rejected: You declined the transaction in your wallet.");
        } else if (errorMessage.includes("timed out")) {
          throw new Error("Transaction timed out: Please check if your wallet popup is showing or try refreshing the page.");
        } else if (errorMessage.includes("disconnected port") || errorMessage.includes("contentscript")) {
          throw new Error("Browser extension communication error: Please refresh the page and try again.");
        }
      }
      
      throw txError;
    }
    
    // Create a new event object with the transaction data
    const newEvent: Event = {
      id: realtimeAsset.publicKey.toString(),
      title: metadata.title,
      creator: metadata.creator,
      creatorAddress: metadata.creatorAddress,
      category: metadata.category,
      date: metadata.date,
      duration: metadata.duration,
      participants: 0,
      maxParticipants: metadata.ticketsAmount,
      ticketPrice: metadata.ticketPrice,
      description: metadata.description,
      image: metadata.bannerUrl || "/placeholder.svg?height=200&width=400",
      status: "created",
      contentUri: uri
    };
    
    debug("Event creation successful", { id: newEvent.id, title: newEvent.title });
    
    return { event: newEvent, signature };
  } catch (error) {
    debug("Error minting event", error);
    
    // Improve error reporting
    if (error instanceof Error) {
      debug("Error details", error.message);
      if (error.stack) debug("Stack trace", error.stack);
      
      // Check for phantom errors
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes("disconnected port") || errorMessage.includes("contentscript")) {
        throw new Error("Browser extension communication error: Please refresh the page and try again.");
      } else if (errorMessage.includes("phantom")) {
        throw new Error("Phantom wallet error: " + error.message);
      } else if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
        throw new Error("Network error: Please check your internet connection and try again.");
      } else if (errorMessage.includes("signtransaction")) {
        throw new Error("Wallet signing issue: Unable to sign transaction. Please reconnect your wallet.");
      } else if (errorMessage.includes("public key")) {
        throw new Error("Wallet connection issue: Please reconnect your wallet and try again.");
      } else if (errorMessage.includes("user rejected")) {
        throw new Error("Transaction rejected: You declined the transaction in your wallet.");
      }
    }
    
    throw new Error("Failed to mint event: " + (error instanceof Error ? error.message : String(error)));
  }
} 