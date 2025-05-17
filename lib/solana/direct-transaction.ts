/**
 * Direct Solana transaction construction for HAUS program
 * This bypasses Anchor serialization issues by using proper manual Borsh serialization
 */

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  Keypair, 
  SystemProgram,
} from '@solana/web3.js';
import { BN, Program } from '@project-serum/anchor';
import { CreateEventParams } from '../event-metadata';
import { SOLANA_PROGRAM_ID } from '../env';
import { getEventPDA } from './anchor-utils';
import { createCreateEventInstruction } from './borsh-helper';

// Core Metaplex program ID
const MPL_CORE_PROGRAM = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

// Debug logging
const debug = (message: string, data?: any) => {
  console.log(`%c[DIRECT TX] ${message}`, 'background: #004400; color: #ffff44', data || '');
};

/**
 * Creates an event directly through manual transaction construction
 * This bypasses Anchor's serialization to ensure proper Borsh compatibility
 * 
 * @param connection Solana connection
 * @param wallet User wallet with signTransaction
 * @param program Anchor program instance
 * @param realtimeAsset Keypair for the realtime asset
 * @param eventParams Event parameters
 * @returns Transaction signature
 */
export async function createEventDirectly(
  connection: Connection,
  wallet: any,
  program: Program,
  inputRealtimeAsset: Keypair,
  eventParams: CreateEventParams
): Promise<string> {
  // Set initial keypair based on input
  let realtimeAsset = inputRealtimeAsset;
  // We'll need to recalculate this if the keypair changes
  let eventPda: PublicKey;
  
  // Track retries so we don't get stuck in an infinite loop
  const MAX_RETRIES = 3;
  let retryCount = 0;
  try {
    // Find the event PDA
    eventPda = await getEventPDA(
      new PublicKey(SOLANA_PROGRAM_ID), 
      realtimeAsset.publicKey
    );
    
    debug("Creating direct transaction with manual Borsh serialization", {
      realtimeAsset: realtimeAsset.publicKey.toString(),
      eventPda: eventPda.toString()
    });
    
    // Implementation of robust keypair handling for Solana program
    while (retryCount < MAX_RETRIES) {
      try {
        // If we've already tried before, we need a new keypair with high entropy
        if (retryCount > 0) {
          // Generate a fresh keypair using secure crypto API
          const seedBytes = new Uint8Array(32);
          window.crypto.getRandomValues(seedBytes);
          
          // Incorporate retry count and timestamp for additional entropy
          const timestamp = Date.now();
          for (let i = 0; i < 8; i++) {
            seedBytes[i] ^= Number((timestamp >> (i * 8)) & 0xFF) ^ (retryCount << i);
          }
          
          // Create keypair from this high-entropy seed
          realtimeAsset = Keypair.fromSeed(seedBytes);
          
          // Recalculate the event PDA with the new keypair
          eventPda = await getEventPDA(
            new PublicKey(SOLANA_PROGRAM_ID),
            realtimeAsset.publicKey
          );
          
          debug(`Retry ${retryCount}/${MAX_RETRIES}: Generated new keypair`, {
            publicKey: realtimeAsset.publicKey.toString(),
            eventPda: eventPda.toString()
          });
        }
        
        // Verify account doesn't already exist
        const accountInfo = await connection.getAccountInfo(realtimeAsset.publicKey);
        
        if (accountInfo) {
          debug(`Keypair account already exists, will retry with new keypair`, {
            publicKey: realtimeAsset.publicKey.toString(),
            retryCount: retryCount
          });
          retryCount++;
          continue; // Try again with a new keypair
        }
        
        // Account doesn't exist, we can proceed
        debug(`Found usable keypair on attempt ${retryCount+1}`, {
          publicKey: realtimeAsset.publicKey.toString(),
          eventPda: eventPda.toString()
        });
        
        // Exit retry loop since we found a good keypair
        break;
      } catch (error) {
        debug(`Error during keypair verification (attempt ${retryCount+1})`, error);
        retryCount++;
        
        if (retryCount >= MAX_RETRIES) {
          throw new Error(`Failed to generate a valid keypair after ${MAX_RETRIES} attempts: ${error.message}`);
        }
      }
    }
    
    // Create a new transaction
    const transaction = new Transaction();
    
    // Get a recent blockhash for the transaction
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Always add the create account instruction - we've verified it's new
    debug("Adding create account instruction for keypair", realtimeAsset.publicKey.toString());
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: realtimeAsset.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(0),
        space: 0,
        programId: program.programId
      })
    );
    
    // For debugging - log the art category variant
    const artCategoryVariant = eventParams.artCategory;
    debug("Using art category variant for manual serialization", artCategoryVariant);
    
    // Create the instruction with manual Borsh serialization helper
    const createEventIx = createCreateEventInstruction(
      realtimeAsset.publicKey,
      wallet.publicKey,
      eventPda,
      MPL_CORE_PROGRAM,
      {
        name: eventParams.name,
        uri: eventParams.uri,
        begin_timestamp: new BN(eventParams.beginTimestamp),
        end_timestamp: new BN(eventParams.endTimestamp),
        reserve_price: new BN(eventParams.reservePrice),
        ticket_collection: eventParams.ticketCollection,
        art_category: artCategoryVariant
      }
    );
    
    // Add instruction to transaction
    transaction.add(createEventIx);
    
    debug("Transaction built with manual Borsh serialization", {
      instructions: transaction.instructions.length
    });
    
    // Sign with the realtime asset keypair
    transaction.partialSign(realtimeAsset);
    
    // Request signature from the wallet
    const signedTransaction = await wallet.signTransaction(transaction);
    
    debug("Transaction signed by wallet");
    
    // Send the signed transaction to the network
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: false }
    );
    
    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');
    
    debug("Transaction confirmed with signature", signature);
    
    return signature;
  } catch (error) {
    debug("Error in direct transaction", error);
    throw error;
  }
}