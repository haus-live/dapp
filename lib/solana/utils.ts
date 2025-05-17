/**
 * Consolidated Solana utilities for HAUS dApp
 * This file replaces several separate files that had overlapping functionality
 */

import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl } from '@project-serum/anchor';
import { Buffer } from 'buffer';
import { SOLANA_PROGRAM_ID, SOLANA_RPC_URL, PINATA_GATEWAY_URL } from '../env';
import { HAUS_IDL } from './idl';
import { storeJsonOnPinata, storeFileOnPinata } from '../../services/pinata-service';
import { prepareEventMetadata } from '../event-metadata';

import { createEventDirectlyAdapter } from './instructions/create-event';

// Core Metaplex program ID
const MPL_CORE_PROGRAM = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

// Debug logging
const debug = (category: string, message: string, data?: any) => {
  const colors: Record<string, string> = {
    minter: 'background: #003300; color: #88ff88',
    directTx: 'background: #004400; color: #ffff44',
    borsh: 'background: #333311; color: #ffff55',
    ticketCollection: 'background: #330033; color: #ffff99',
    metaplex: 'background: #440044; color: #ffaaff',
    artCategory: 'background: #330033; color: #ffff99'
  };
  
  const style = colors[category] || 'background: #222222; color: #ffffff';
  console.log(`%c[${category.toUpperCase()}] ${message}`, style, data || '');
};

// ---------------------------
// ANCHOR / PROVIDER UTILITIES
// ---------------------------

/**
 * Creates a provider that can be used with Anchor
 */
export function createAnchorProvider(connection: Connection, wallet: any): AnchorProvider {
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet is required and must have a publicKey');
  }

  // Create a compatible wallet adapter
  const walletAdapter = {
    publicKey: wallet.publicKey,
    signTransaction: async (tx: any) => {
      return await wallet.signTransaction(tx);
    },
    signAllTransactions: async (txs: any[]) => {
      return await wallet.signAllTransactions(txs);
    },
  };

  return new AnchorProvider(
    connection,
    walletAdapter,
    { commitment: 'confirmed', skipPreflight: false }
  );
}

/**
 * Creates a program instance for the HAUS program
 */
export function createHausProgram(provider: AnchorProvider): Program {
  return new Program(HAUS_IDL as any, new PublicKey(SOLANA_PROGRAM_ID), provider);
}

/**
 * Gets the event PDA for a realtime asset
 */
export async function getEventPDA(
  programId: PublicKey,
  realtimeAssetKey: PublicKey
): Promise<PublicKey> {
  const [eventPda] = await PublicKey.findProgramAddress(
    [Buffer.from('event'), realtimeAssetKey.toBuffer()],
    programId
  );
  return eventPda;
}

/**
 * Gets the tipping calculator PDA for a user and realtime asset
 */
export async function getTippingCalculatorPDA(
  programId: PublicKey,
  realtimeAssetKey: PublicKey,
  userKey: PublicKey
): Promise<PublicKey> {
  const [tippingCalculatorPda] = await PublicKey.findProgramAddress(
    [
      Buffer.from('tipping_calculator'),
      realtimeAssetKey.toBuffer(),
      userKey.toBuffer()
    ],
    programId
  );
  return tippingCalculatorPda;
}

// -----------------------
// ART CATEGORY UTILITIES
// -----------------------

// Define enum values explicitly to match Solana program enumeration
export enum ArtCategory {
  StandupComedy = 0,
  PerformanceArt = 1,
  PoetrySlam = 2,
  OpenMicImprov = 3,
  LivePainting = 4,
  CreatingWorkshop = 5
}

// Type for Borsh-compatible variant objects matching the Solana program schema
export type ArtCategoryVariant = 
  | { standupComedy: {} } 
  | { performanceArt: {} } 
  | { poetrySlam: {} }
  | { openMicImprov: {} } 
  | { livePainting: {} }
  | { creatingWorkshop: {} };

/**
 * Maps UI-friendly category strings to Borsh-compatible variant objects
 */
export function mapCategoryToVariant(category: string): ArtCategoryVariant {
  // Normalize the category by trimming, converting to lowercase, and handling null/undefined
  const normalizedCategory = category?.trim()?.toLowerCase() || '';
  
  debug('artCategory', 'Mapping UI category to variant', { original: category, normalized: normalizedCategory });
  
  switch (normalizedCategory) {
    case 'standup-comedy':
    case 'standup comedy':
    case 'comedy':
      return { standupComedy: {} };
      
    case 'performance-art':
    case 'performance art':
    case 'performance':
      return { performanceArt: {} };
      
    case 'poetry-slam':
    case 'poetry slam':
    case 'poetry':
      return { poetrySlam: {} };
      
    case 'open-mic':
    case 'open mic':
    case 'open-mic-improv':
    case 'improv':
      return { openMicImprov: {} };
      
    case 'live-painting':
    case 'live painting':
    case 'painting':
      return { livePainting: {} };
      
    case 'creative-workshop':
    case 'creative workshop':
    case 'creating-workshop':
    case 'workshop':
      return { creatingWorkshop: {} };
      
    default:
      // If the category is unknown, log a warning and default to performance art
      debug('artCategory', 'Unknown category, defaulting to performanceArt', { category });
      return { performanceArt: {} };
  }
}

/**
 * Get numeric index for art category from its string key
 */
function getArtCategoryIndex(categoryKey: string): number {
  const categoryMap: Record<string, number> = {
    standupComedy: 0,
    performanceArt: 1,
    poetrySlam: 2,
    openMicImprov: 3,
    livePainting: 4,
    creatingWorkshop: 5,
  };

  const index = categoryMap[categoryKey];
  if (index === undefined) {
    debug('borsh', `Unknown art category key: "${categoryKey}". Valid keys are: ${Object.keys(categoryMap).join(', ')}`);
    return 1; // Default to performance art (index 1) for unknown categories
  }

  return index;
}

// -----------------------
// TICKET COLLECTION
// -----------------------

/**
 * Interface for Ticket Collection metadata
 */
export interface TicketCollectionConfig {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: {
    address: string;
    share: number;
  }[];
  isMutable: boolean;
  maxSupply: number;
  price: number;
  itemsAvailable: number;
  description?: string;
  bannerUrl?: string;
  eventDate?: string;
}

/**
 * Creates a ticket collection account for the event
 */
export async function createTicketCollection(
  connection: Connection,
  wallet: any,
  config: TicketCollectionConfig
): Promise<PublicKey> {
  try {
    debug('ticketCollection', 'Creating ticket collection', {
      name: config.name,
      maxSupply: config.maxSupply,
      price: config.price
    });

    // Validate wallet is connected
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    debug('ticketCollection', 'Using wallet', wallet.publicKey.toString());

    // Create metadata JSON for the collection with the ACTUAL event data
    const metadata = {
      name: config.name,
      symbol: "HAUS", // Using HAUS as the symbol for all ticket collections
      description: config.description || `Ticket collection for ${config.name}`,
      seller_fee_basis_points: 0, // No fees as tickets are meant to be burned
      image: config.bannerUrl || "", // Use the event banner
      external_url: "", // No external URL needed for in-app tickets
      attributes: [
        {
          trait_type: "Collection Type",
          value: "HAUS RTA Tickets"
        },
        {
          trait_type: "Max Supply",
          value: config.maxSupply.toString()
        },
        {
          trait_type: "Price",
          value: config.price.toString() + " SOL"
        }
      ],
      properties: {
        category: "tickets",
        creators: config.creators
      }
    };
    
    // Upload metadata to IPFS
    let metadataUri = "";
    try {
      debug('metaplex', 'Uploading collection metadata to IPFS');
      const metadataCid = await storeJsonOnPinata(
        metadata, 
        `haus-tickets-${wallet.publicKey.toString().slice(0, 8)}-${Date.now()}`
      );
      metadataUri = `${PINATA_GATEWAY_URL}/ipfs/${metadataCid}`;
      debug('metaplex', 'Metadata uploaded to IPFS', metadataUri);
    } catch (error) {
      debug('metaplex', 'Failed to upload metadata to IPFS', error);
      throw new Error(`Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Generate a completely new random keypair for each collection
    const collectionKeypair = Keypair.generate();
    debug('metaplex', 'Generated collection keypair', collectionKeypair.publicKey.toString());
    
    // Create a transaction to trigger wallet signing
    const transaction = new Transaction();
    
    // Calculate minimum balance for rent exemption (for a token account)
    const space = 300; // Minimal space needed for a basic account
    const rentExemption = await connection.getMinimumBalanceForRentExemption(space);
    
    // Create account to represent the collection
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: collectionKeypair.publicKey,
        lamports: rentExemption,
        space,
        programId: SystemProgram.programId // Using System Program as the owner
      })
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign with collection keypair
    transaction.partialSign(collectionKeypair);
    
    // Request user wallet signature
    debug('metaplex', 'Requesting wallet signature');
    
    // Request the wallet to sign the transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    
    debug('metaplex', 'Sending transaction to network');
    
    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: true }
    );
    debug('metaplex', 'Transaction submitted', signature);
    
    // Wait for confirmation using polling
    const MAX_ATTEMPTS = 20;
    const POLL_INTERVAL = 1000; // 1 second
    let confirmed = false;
    
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const status = await connection.getSignatureStatus(signature);
      
      if (status.value !== null) {
        const confirmationStatus = status.value.confirmationStatus;
        debug('metaplex', `Confirmation status (attempt ${attempt+1}): ${confirmationStatus}`);
        
        if (confirmationStatus === 'confirmed' || confirmationStatus === 'finalized') {
          confirmed = true;
          break;
        }
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
    
    if (!confirmed) {
      debug('metaplex', 'Transaction not confirmed after maximum attempts');
      throw new Error('Transaction confirmation timeout');
    }
    
    debug('metaplex', 'Transaction confirmed successfully');
    
    // Return the collection public key - this is what matters for the event NFT
    return collectionKeypair.publicKey;
  } catch (error) {
    debug('ticketCollection', 'Error in ticket collection creation', error);
    throw error;
  }
}

/**
 * Creates complete metadata for a ticket collection
 */
export function createTicketCollectionMetadata(
  eventTitle: string,
  eventDescription: string,
  creatorAddress: string,
  ticketsAmount: number,
  ticketPrice: number,
  bannerUrl?: string,
  eventDate?: string
): TicketCollectionConfig {
  return {
    name: `Tickets: ${eventTitle}`,
    symbol: 'HAUS',
    uri: '', // Will be filled during creation
    sellerFeeBasisPoints: 0, // No fees as per requirements
    creators: [
      {
        address: creatorAddress,
        share: 100,
      },
    ],
    isMutable: true,
    maxSupply: ticketsAmount,
    price: ticketPrice,
    itemsAvailable: ticketsAmount,
    description: eventDescription,
    bannerUrl,
    eventDate
  };
}

// -----------------------
// BORSH SERIALIZATION
// -----------------------

// Define instruction discriminators
const CREATE_EVENT_DISCRIMINATOR = Buffer.from([49, 219, 29, 203, 22, 98, 100, 87]);

/**
 * Create a manual CreateEvent instruction
 */
export function createCreateEventInstruction(
  realtimeAsset: PublicKey,
  authority: PublicKey,
  eventPda: PublicKey,
  mplCoreProgram: PublicKey,
  args: {
    name: string,
    uri: string,
    begin_timestamp: number | BN,
    end_timestamp: number | BN,
    reserve_price: number | BN,
    ticket_collection: PublicKey,
    art_category: any
  }
): TransactionInstruction {
  // Validate args
  if (!args.name || typeof args.name !== 'string') {
    throw new Error('Event name must be a non-empty string');
  }
  
  if (!args.uri || typeof args.uri !== 'string') {
    throw new Error('Event URI must be a non-empty string');
  }
  
  if (!args.ticket_collection || !(args.ticket_collection instanceof PublicKey)) {
    throw new Error('Ticket collection must be a valid PublicKey');
  }
  
  // Convert numbers to BN if needed
  const beginTimestamp = args.begin_timestamp instanceof BN 
    ? args.begin_timestamp 
    : new BN(args.begin_timestamp);
  
  const endTimestamp = args.end_timestamp instanceof BN 
    ? args.end_timestamp 
    : new BN(args.end_timestamp);
  
  const reservePrice = args.reserve_price instanceof BN 
    ? args.reserve_price 
    : new BN(args.reserve_price);

  // For debugging - log the art category
  debug('borsh', "Art category before serialization:", args.art_category);
  
  // Manually serialize the instruction data
  // Handle both object format and string format for art_category
  let artCategoryKey: string;
  
  if (typeof args.art_category === 'object' && args.art_category !== null) {
    // Extract the key from the variant object (e.g., { standupComedy: {} })
    const keys = Object.keys(args.art_category);
    if (keys.length !== 1) {
      throw new Error(`Invalid art category variant: expected object with single key, got ${JSON.stringify(args.art_category)}`);
    }
    artCategoryKey = keys[0];
  } else if (typeof args.art_category === 'string') {
    // Direct string format (fallback handling)
    artCategoryKey = args.art_category;
  } else {
    // Default to performance art
    artCategoryKey = 'performanceArt';
    debug('borsh', "Warning: Using default performanceArt category due to invalid input:", args.art_category);
  }
  
  const artCategoryIndex = getArtCategoryIndex(artCategoryKey);
  
  debug('borsh', "Art category conversion:", {
    original: args.art_category,
    key: artCategoryKey,
    index: artCategoryIndex
  });

  // Create instruction keys (accounts)
  const keys = [
    { pubkey: realtimeAsset, isSigner: true, isWritable: true },
    { pubkey: authority, isSigner: true, isWritable: true },
    { pubkey: eventPda, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: mplCoreProgram, isSigner: false, isWritable: false },
  ];

  // Create the manual instruction
  const instructionData = Buffer.concat([
    CREATE_EVENT_DISCRIMINATOR,
    serializeCreateEventArgs(
      args.name,
      args.uri,
      beginTimestamp,
      endTimestamp,
      reservePrice,
      args.ticket_collection,
      artCategoryIndex
    ),
  ]);

  debug('borsh', "Serialized instruction data:", instructionData);

  return new TransactionInstruction({
    keys,
    programId: new PublicKey(SOLANA_PROGRAM_ID),
    data: instructionData,
  });
}

/**
 * Manually serialize CreateEvent args using Borsh-compatible format
 */
function serializeCreateEventArgs(
  name: string,
  uri: string,
  beginTimestamp: BN,
  endTimestamp: BN,
  reservePrice: BN,
  ticketCollection: PublicKey,
  artCategoryIndex: number
): Buffer {
  try {
    // Name (string)
    const nameBuffer = Buffer.from(name, 'utf8');
    const nameLength = Buffer.alloc(4);
    nameLength.writeUInt32LE(nameBuffer.length, 0);
    
    // URI (string)
    const uriBuffer = Buffer.from(uri, 'utf8');
    const uriLength = Buffer.alloc(4);
    uriLength.writeUInt32LE(uriBuffer.length, 0);
    
    // Begin timestamp (i64)
    const beginTimestampBuffer = Buffer.alloc(8);
    beginTimestampBuffer.writeBigInt64LE(BigInt(beginTimestamp.toString()), 0);
    
    // End timestamp (i64)
    const endTimestampBuffer = Buffer.alloc(8);
    endTimestampBuffer.writeBigInt64LE(BigInt(endTimestamp.toString()), 0);
    
    // Reserve price (u128)
    const reservePriceBuffer = Buffer.alloc(16);
    const reservePriceBigInt = BigInt(reservePrice.toString());
    // Write lower 8 bytes
    reservePriceBuffer.writeBigUInt64LE(reservePriceBigInt & BigInt("0xFFFFFFFFFFFFFFFF"), 0);
    // Write upper 8 bytes
    reservePriceBuffer.writeBigUInt64LE(reservePriceBigInt >> BigInt(64), 8);
    
    // Ticket collection (Pubkey)
    const ticketCollectionBuffer = ticketCollection.toBuffer();
    
    // Art category (enum - u8)
    const artCategoryBuffer = Buffer.alloc(1);
    artCategoryBuffer.writeUInt8(artCategoryIndex, 0);
    
    // Combine all buffers
    return Buffer.concat([
      nameLength,
      nameBuffer,
      uriLength,
      uriBuffer,
      beginTimestampBuffer,
      endTimestampBuffer,
      reservePriceBuffer,
      ticketCollectionBuffer,
      artCategoryBuffer,
    ]);
  } catch (error: any) {
    debug('borsh', "Error serializing CreateEvent args:", error);
    throw new Error(`Failed to serialize event parameters: ${error.message}`);
  }
}

// -----------------------
// DIRECT TRANSACTION
// -----------------------

/**
 * Creates an event directly through manual transaction construction
 */
export async function createEventDirectly(
  connection: Connection,
  wallet: any,
  program: Program,
  inputRealtimeAsset: Keypair,
  eventParams: any
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
    
    debug('directTx', "Creating direct transaction with manual Borsh serialization", {
      realtimeAsset: realtimeAsset.publicKey.toString(),
      eventPda: eventPda.toString()
    });
    
    // Implementation of robust keypair handling for Solana program
    while (retryCount < MAX_RETRIES) {
      try {
        // If we've already tried before, we need a new keypair with high entropy
        if (retryCount > 0) {
          // Generate a fresh keypair using Solana's Keypair.generate for consistency
          const randomKeypair = Keypair.generate();
          realtimeAsset = randomKeypair;
          
          // Recalculate the event PDA with the new keypair
          eventPda = await getEventPDA(
            new PublicKey(SOLANA_PROGRAM_ID),
            realtimeAsset.publicKey
          );
          
          debug('directTx', `Retry ${retryCount}/${MAX_RETRIES}: Generated new keypair`, {
            publicKey: realtimeAsset.publicKey.toString(),
            eventPda: eventPda.toString()
          });
        }
        
        // Verify account doesn't already exist
        const accountInfo = await connection.getAccountInfo(realtimeAsset.publicKey);
        
        if (accountInfo) {
          debug('directTx', `Keypair account already exists, will retry with new keypair`, {
            publicKey: realtimeAsset.publicKey.toString(),
            retryCount: retryCount
          });
          retryCount++;
          continue; // Try again with a new keypair
        }
        
        // Account doesn't exist, we can proceed
        debug('directTx', `Found usable keypair on attempt ${retryCount+1}`, {
          publicKey: realtimeAsset.publicKey.toString(),
          eventPda: eventPda.toString()
        });
        
        // Exit retry loop since we found a good keypair
        break;
      } catch (error: any) {
        debug('directTx', `Error during keypair verification (attempt ${retryCount+1})`, error);
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
    debug('directTx', "Adding create account instruction for keypair", realtimeAsset.publicKey.toString());
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
    debug('directTx', "Using art category variant for manual serialization", artCategoryVariant);
    
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
    
    debug('directTx', "Transaction built with manual Borsh serialization", {
      instructions: transaction.instructions.length
    });
    
    // Sign with the realtime asset keypair
    transaction.partialSign(realtimeAsset);
    
    // Request signature from the wallet
    const signedTransaction = await wallet.signTransaction(transaction);
    
    debug('directTx', "Transaction signed by wallet");
    
    // Send the signed transaction to the network
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: false }
    );
    
    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');
    
    debug('directTx', "Transaction confirmed with signature", signature);
    
    return signature;
  } catch (error) {
    debug('directTx', "Error in direct transaction", error);
    throw error;
  }
}

// -----------------------
// EVENT MINTING
// -----------------------

/**
 * Parameters required for creating an event on-chain
 */
export interface EventParams {
  name: string;
  uri: string;
  beginTimestamp: number;
  endTimestamp: number;
  reservePrice: number;
  ticketCollection: PublicKey;
  artCategory: any; // Must be a variant object for Anchor serialization
}

/**
 * Mints an event NFT with ticket collection
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
    debug('minter', 'Wallet info', {
      hasPublicKey: !!wallet.publicKey,
      publicKeyStr: wallet.publicKey?.toString(),
      hasSignTransaction: !!wallet.signTransaction,
      hasSignAllTransactions: !!wallet.signAllTransactions
    });

    // 2. Create Solana connection with the production RPC URL
    if (!SOLANA_RPC_URL) {
      throw new Error('Solana RPC URL not configured in environment');
    }
    
    debug('minter', 'Using RPC URL from env', SOLANA_RPC_URL);
    debug('minter', 'Creating Solana connection');
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

    // Verify connection
    try {
      const version = await connection.getVersion();
      debug('minter', 'Connected to Solana', version);
    } catch (error: any) {
      throw new Error(`Failed to connect to Solana: ${error.message}`);
    }

    // 3. Generate a completely random keypair for the realtime asset
    const realtimeAsset = Keypair.generate();
    
    debug('minter', 'Generated keypair for realtime asset', {
      publicKey: realtimeAsset.publicKey.toString(),
      method: 'using Keypair.generate() for consistency'
    });

    // 4. Create an anchor provider that can be used with the program
    const provider = createAnchorProvider(connection, wallet);
    
    // 5. Create a program instance for the HAUS program
    const program = createHausProgram(provider);
    
    // 6. Prepare event metadata for IPFS
    debug('minter', 'Preparing event metadata for IPFS...');
    const metadataResult = await prepareEventMetadata(
      formData,
      wallet.publicKey.toString()
    );
    
    if (!metadataResult) {
      throw new Error('Failed to prepare event metadata');
    }
    
    // Extract the metadata and URI from the result
    const metadataUri = metadataResult.uri;
    const metadata = metadataResult.metadata;
    
    debug('minter', 'Event metadata prepared and uploaded to IPFS', {
      title: metadata.title,
      uri: metadataUri
    });
    
    // 7. Setup event params with the ticket collection public key
    // Parse dates from form data
    let startDate = new Date(Date.now() + 60000); // Default to 1 minute from now
    
    if (formData.date) {
      // Parse the date from the form data
      try {
        // If it's already a Date object, use it directly
        if (formData.date instanceof Date) {
          startDate = formData.date;
        } 
        // Otherwise, try to parse it as a string
        else if (typeof formData.date === 'string') {
          startDate = new Date(formData.date);
        }
        
        // Add time from formData.time if available (format should be "HH:MM")
        if (formData.time && typeof formData.time === 'string') {
          const [hours, minutes] = formData.time.split(':').map(Number);
          startDate.setHours(hours || 0, minutes || 0, 0, 0);
        }
      } catch (error) {
        debug('minter', 'Error parsing date, using default', error);
        startDate = new Date(Date.now() + 60000);
      }
    }
    
    // Ensure start date is in the future
    if (startDate.getTime() < Date.now()) {
      startDate = new Date(Date.now() + 60000); // Set to 1 minute from now
    }
    
    // According to the Solana program, durations must be multiples of FIFTEEN_MINUTES_IN_SECONDS
    // For testing, this is set to 5 seconds in the program's constants.rs
    const FIFTEEN_MINUTES_IN_SECONDS = 5; // 5 seconds for testing
    
    // Valid durations according to error message: "Should be either 15m, 30m or 45m"
    // Since FIFTEEN_MINUTES_IN_SECONDS is 5 seconds in testing mode, we need:
    // 15m = 15 * 60 = 900 seconds = 180 * 5 seconds
    // 30m = 30 * 60 = 1800 seconds = 360 * 5 seconds
    // 45m = 45 * 60 = 2700 seconds = 540 * 5 seconds
    const VALID_DURATIONS = [
      15 * 60, // 15 minutes in seconds (900)
      30 * 60, // 30 minutes in seconds (1800)
      45 * 60  // 45 minutes in seconds (2700)
    ];
    
    // Default to 15 minutes
    let durationSeconds = VALID_DURATIONS[0];
    
    // Get duration from form data (in minutes) and map to one of the valid options
    if (formData.duration && typeof formData.duration === 'number') {
      // Convert minutes to seconds
      const requestedDurationSeconds = formData.duration * 60;
      
      // Find the closest valid duration
      if (requestedDurationSeconds <= 15 * 60) {
        durationSeconds = VALID_DURATIONS[0]; // 15 minutes
      } else if (requestedDurationSeconds <= 30 * 60) {
        durationSeconds = VALID_DURATIONS[1]; // 30 minutes
      } else {
        durationSeconds = VALID_DURATIONS[2]; // 45 minutes
      }
      
      debug('minter', 'Duration calculation from form data', {
        requestedMinutes: formData.duration,
        requestedSeconds: requestedDurationSeconds,
        selectedValidDuration: durationSeconds,
        validDurations: VALID_DURATIONS.map(d => d / 60 + ' minutes')
      });
    }
    
    // Calculate the end timestamp by adding duration to start time
    const beginTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = beginTimestamp + durationSeconds;
    
    debug('minter', 'Event timing', {
      beginTimestamp,
      endTimestamp,
      durationSeconds,
      formattedStart: new Date(beginTimestamp * 1000).toISOString(),
      formattedEnd: new Date(endTimestamp * 1000).toISOString()
    });
    
    // 8. Create a ticket collection for the event
    const creatorAddress = wallet.publicKey.toString();
    const ticketPrice = formData.ticketPrice || 0.1; // Default to 0.1 SOL if not specified
    const ticketsAmount = formData.ticketAmount || formData.ticketsAmount || 100; // Default to 100 tickets if not specified
    
    // Create ticket collection using consolidated method
    debug('minter', 'Creating ticket collection...');
    const ticketCollectionConfig = createTicketCollectionMetadata(
      metadata.title,
      metadata.description || '',
      creatorAddress,
      ticketsAmount,
      ticketPrice,
      metadata.bannerUrl,
      startDate.toISOString()
    );
    
    const ticketCollection = await createTicketCollection(
      connection,
      wallet,
      ticketCollectionConfig
    );
    
    debug('minter', 'Ticket collection created', ticketCollection.toString());
    
    // 9. Map the category to the correct variant
    const artCategoryVariant = mapCategoryToVariant(formData.category || 'performance-art');
    
    // 10. Create the event parameters
    const eventParams: EventParams = {
      name: metadata.title,
      uri: metadataUri,
      beginTimestamp,
      endTimestamp,
      reservePrice: Math.floor(ticketPrice * LAMPORTS_PER_SOL), // Convert SOL to lamports
      ticketCollection,
      artCategory: artCategoryVariant
    };
    
    // 11. Create the event directly using the manual transaction builder
    debug('minter', 'Creating event using direct transaction method');
    // const signature = await createEventDirectly(
    //   connection,
    //   wallet,
    //   program,
    //   realtimeAsset,
    //   eventParams
    // );
    const signature = await createEventDirectlyAdapter(
      connection,
      wallet,
      realtimeAsset,
      eventParams
    );
    
    debug('minter', 'Event created successfully', {
      transactionSignature: signature,
      realtimeAssetKey: realtimeAsset.publicKey.toString()
    });
    
    // 12. Return the transaction signature and realtime asset key
    return {
      transactionSignature: signature,
      realtimeAssetKey: realtimeAsset.publicKey.toString()
    };
  } catch (error: any) {
    debug('minter', 'Error minting event', error);
    
    // Extract the specific Solana program error message if available
    let errorMessage = 'Failed to mint event';
    
    if (error.message) {
      errorMessage = error.message;
      
      // Look for Anchor program error information in logs
      if (error.logs && Array.isArray(error.logs)) {
        const errorLogs = error.logs.filter((log: string) => 
          log.includes('Error Message:') || log.includes('AnchorError')
        );
        
        if (errorLogs.length > 0) {
          // Extract the specific error message
          const errorMatch = errorLogs[0].match(/Error Message: (.*?)\.?$/);
          if (errorMatch && errorMatch[1]) {
            errorMessage = `Program Error: ${errorMatch[1]}`;
          }
        }
      }
      
      // Check for simulation failure
      if (error.message.includes('Simulation failed')) {
        if (error.message.includes('EventDurationInvalid')) {
          errorMessage = 'Invalid event duration. The Solana program only accepts durations of exactly 15, 30, or 45 minutes.';
        } else if (error.message.includes('custom program error')) {
          errorMessage = 'Solana program error: ' + error.message.split('custom program error:')[1].split('.')[0].trim();
        }
      }
    }
    
    throw new Error(errorMessage);
  }
}