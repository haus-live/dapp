/**
 * This implements event NFT minting using Solana and Metaplex */

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { HausProgramClient } from './program-client';
import { createTicketCollection, createTicketCollectionMetadata } from './candy-machine';
import { prepareEventMetadata, CreateEventParams } from '../event-metadata';
import { SOLANA_RPC_URL } from '../env';
import { ArtCategory } from './art-category';
import { mapCategoryToVariant, numberToVariant } from './art-category';
import { createEventDirectly } from './direct-transaction';
import { createAnchorProvider, createHausProgram } from './anchor-utils';

// Debug logging for event minting
const debug = (message: string, data?: any) => {
  console.log(`%c[MINTER] ${message}`, 'background: #003300; color: #88ff88', data || '');
};

/**
 * Map UI category string to Solana program enum variant
 * This function uses the corrected enum format required by the Solana program
 */
function getCategoryVariant(category: string): any {
  // Use the imported function that returns a Borsh-compatible variant
  return mapCategoryToVariant(category);
}

/**
 * Mints an event NFT with ticket collection
 * 
 * @param wallet Connected user wallet
 * @param formData Form data from the event creation flow
 * @returns Transaction signature from blockchain
 */
export async function mintEvent(
  wallet: any, 
  formData: any
): Promise<{ transactionSignature: string; realtimeAssetKey: string }> {
  try {
    // 1. Validate wallet connection
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Log wallet info for debugging
    debug('Wallet info', {
      hasPublicKey: !!wallet.publicKey,
      publicKeyStr: wallet.publicKey?.toString(),
      hasSignTransaction: !!wallet.signTransaction,
      hasSignAllTransactions: !!wallet.signAllTransactions
    });

    // 2. Create Solana connection with the production RPC URL
    if (!SOLANA_RPC_URL) {
      throw new Error('Solana RPC URL not configured in environment');
    }
    
    debug('Using RPC URL from env', SOLANA_RPC_URL);
    debug('Creating Solana connection');
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

    // Verify connection
    try {
      const version = await connection.getVersion();
      debug('Connected to Solana', version);
    } catch (error) {
      throw new Error(`Failed to connect to Solana: ${error.message}`);
    }

    // 3. Generate a completely random keypair for the realtime asset
    // Create a fresh random keypair each time with proper entropy
    const seedBytes = new Uint8Array(32);
    window.crypto.getRandomValues(seedBytes);
    
    // Generate timestamp and add to first 8 bytes for uniqueness
    const timestamp = Date.now();
    for (let i = 0; i < 8; i++) {
      seedBytes[i] ^= Number((timestamp >> (i * 8)) & 0xFF);
    }
    
    // Create keypair from this high-entropy seed
    const realtimeAsset = Keypair.fromSeed(seedBytes);
    
    debug('Generated high-entropy unique keypair', {
      publicKey: realtimeAsset.publicKey.toString(),
      timestamp: timestamp,
      method: 'using secure random values with timestamp entropy'
    });

    // 4. Prepare event metadata
    debug('Preparing event metadata for IPFS...');
    if (!formData.banner || !(formData.banner instanceof File)) {
      throw new Error('Banner image is required and must be a valid file');
    }
    
    try {
      var { uri, metadata } = await prepareEventMetadata(formData, wallet.publicKey.toString());
      debug('Metadata uploaded to IPFS', uri);
    } catch (error) {
      throw new Error(`Failed to prepare event metadata: ${error.message}`);
    }

    // 5. Create ticket collection using production Metaplex implementation
    debug('Creating ticket collection for event...');
    
    // Add timestamp and random value to name to ensure uniqueness
    const collectionTimestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    const uniqueCollectionName = `${metadata.title} Tickets #${collectionTimestamp}-${randomId}`;
    
    // Validate ticket parameters
    const ticketPrice = parseFloat(formData.ticketPrice) || 0.1;
    const ticketsAmount = parseInt(formData.ticketsAmount) || 99;
    
    if (isNaN(ticketPrice) || ticketPrice < 0) {
      throw new Error('Invalid ticket price');
    }
    
    if (isNaN(ticketsAmount) || ticketsAmount < 1 || ticketsAmount > 10000) {
      throw new Error('Invalid tickets amount (must be between 1 and 10000)');
    }
    
    const ticketCollectionConfig = createTicketCollectionMetadata(
      uniqueCollectionName,
      metadata.description || '',
      wallet.publicKey.toString(),
      ticketsAmount,
      ticketPrice,
      metadata.bannerUrl
    );
    
    debug('Creating ticket collection with parameters', {
      name: ticketCollectionConfig.name,
      maxSupply: ticketCollectionConfig.maxSupply,
      price: ticketCollectionConfig.price
    });
    
    // Create the collection (triggers wallet signature)
    try {
      var ticketCollectionKey = await createTicketCollection(
        connection,
        wallet,
        ticketCollectionConfig
      );
      
      debug('Ticket collection created', ticketCollectionKey.toString());
    } catch (error) {
      throw new Error(`Failed to create ticket collection: ${error.message}`);
    }

    // 6. Get Borsh-compatible art category variant for Solana program
    if (!metadata.category) {
      metadata.category = 'performance-art'; // Default category
    }
    
    const artCategoryVariant = mapCategoryToVariant(metadata.category);
    
    debug('Using Borsh-compatible art category variant', {
      uiCategory: metadata.category,
      variant: artCategoryVariant
    });

    // 7. Setup event params with the ticket collection public key
    // Parse dates from metadata
    if (!metadata.startDate || !(metadata.startDate instanceof Date)) {
      metadata.startDate = new Date(Date.now() + 60000); // Default to 1 minute from now
    }
    
    if (!metadata.endDate || !(metadata.endDate instanceof Date)) {
      metadata.endDate = new Date(metadata.startDate.getTime() + 3600000); // Default to 1 hour after start
    }
    
    // Ensure start date is in the future
    if (metadata.startDate.getTime() < Date.now()) {
      metadata.startDate = new Date(Date.now() + 60000); // Set to 1 minute from now
    }
    
    // Ensure end date is after start date
    if (metadata.endDate.getTime() <= metadata.startDate.getTime()) {
      metadata.endDate = new Date(metadata.startDate.getTime() + 3600000); // 1 hour after start
    }
    
    // Convert dates to UNIX timestamps in seconds
    const beginTimestamp = Math.floor(metadata.startDate.getTime() / 1000);
    const endTimestamp = Math.floor(metadata.endDate.getTime() / 1000);
    
    debug('Using event time range', {
      beginTimestamp: new Date(beginTimestamp * 1000).toISOString(),
      endTimestamp: new Date(endTimestamp * 1000).toISOString(),
      durationSeconds: endTimestamp - beginTimestamp
    });
    
    // Validate reserve price
    const reservePrice = typeof formData.reservePrice === 'number' 
      ? formData.reservePrice 
      : parseFloat(formData.reservePrice || '0');
      
    if (isNaN(reservePrice) || reservePrice < 0) {
      throw new Error('Invalid reserve price');
    }
    
    // Convert reserve price to lamports
    const reservePriceLamports = Math.floor(reservePrice * LAMPORTS_PER_SOL);
    
    const eventParams: CreateEventParams = {
      name: metadata.title,
      uri: uri,
      beginTimestamp: beginTimestamp,
      endTimestamp: endTimestamp,
      reservePrice: reservePriceLamports,
      ticketCollection: ticketCollectionKey,
      artCategory: artCategoryVariant // Using the variant object for Anchor serialization
    };
    
    debug('Final event parameters', {
      name: eventParams.name,
      uri: eventParams.uri,
      beginTimestamp: new Date(eventParams.beginTimestamp * 1000).toISOString(),
      endTimestamp: new Date(eventParams.endTimestamp * 1000).toISOString(),
      reservePrice: eventParams.reservePrice / LAMPORTS_PER_SOL + ' SOL',
      ticketCollection: eventParams.ticketCollection.toString(),
      artCategory: eventParams.artCategory
    });

    // 8. Set up for direct transaction with proper Borsh serialization
    // Create provider and program instances
    try {
      const provider = createAnchorProvider(connection, wallet);
      const program = createHausProgram(provider);
      
      // 9. Create the event on-chain using direct transaction with manual Borsh serialization
      debug('Creating event on-chain with manual Borsh serialization', realtimeAsset.publicKey.toString());
      
      // Use our direct transaction implementation with proper Borsh serialization
      const txSignature = await createEventDirectly(
        connection, 
        wallet, 
        program, 
        realtimeAsset, 
        eventParams
      );
      
      debug('Event created successfully with signature', txSignature);

      // Return the transaction signature and realtime asset key
      return {
        transactionSignature: txSignature,
        realtimeAssetKey: realtimeAsset.publicKey.toString()
      };
    } catch (error) {
      debug('Error creating event on-chain', error);
      
      // Check for specific errors related to the Solana program
      if (error.message && error.message.includes('0x1780')) {
        throw new Error('Ticket collection not found or invalid. Please try again with a different name.');
      }
      
      if (error.message && error.message.includes('0x1781')) {
        throw new Error('Event duration is invalid. Please check start and end times.');
      }
      
      throw new Error(`Failed to create event on-chain: ${error.message}`);
    }
  } catch (error) {
    debug('Error minting event', error);
    
    // Provide specific error messages based on error types
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        throw new Error('Transaction rejected by wallet. Please try again and approve the transaction.');
      } else if (error.message.includes('Blockhash not found')) {
        throw new Error('Network error: Blockhash not found. The Solana network may be congested. Please try again.');
      } else if (error.message.includes('Invalid ticket collection')) {
        throw new Error('Invalid ticket collection. Please restart the minting process.');
      } else if (error.message.includes('InstructionDidNotDeserialize')) {
        throw new Error('Failed to create event: The program could not process the instruction. Please check parameters and try again.');
      }
      throw error;
    }
    
    throw new Error(`Failed to mint event: ${String(error)}`);
  }
}