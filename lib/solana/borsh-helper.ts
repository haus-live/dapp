/**
 * Helper for Borsh serialization to ensure proper Solana program compatibility
 * This file handles proper Borsh serialization for the Solana program
 */

import { BorshInstructionCoder, BorshCoder } from '@project-serum/anchor';
import { 
  PublicKey, 
  TransactionInstruction, 
  SystemProgram, 
  Connection, 
  Transaction 
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import { SOLANA_PROGRAM_ID } from '../env';

// Debug logging
const debug = (message: string, data?: any) => {
  console.log(`%c[BORSH] ${message}`, 'background: #333311; color: #ffff55', data || '');
};

// Program ID
const PROGRAM_ID = new PublicKey(SOLANA_PROGRAM_ID);

// Define instruction discriminators
const CREATE_EVENT_DISCRIMINATOR = Buffer.from([49, 219, 29, 203, 22, 98, 100, 87]);

/**
 * Create a manual CreateEvent instruction
 * This bypasses Anchor's serialization issues by manually constructing the instruction
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
  debug("Art category before serialization:", args.art_category);
  
  // Manually serialize the instruction data
  // Handle both object format and string format for art_category
  let artCategoryKey: string;
  
  if (typeof args.art_category === 'object' && args.art_category !== null) {
    // Extract the key from the variant object (e.g., { standupComedy: {} })
    artCategoryKey = Object.keys(args.art_category)[0];
  } else if (typeof args.art_category === 'string') {
    // Direct string format (fallback handling)
    artCategoryKey = args.art_category;
  } else {
    // Default to performance art
    artCategoryKey = 'performanceArt';
  }
  
  const artCategoryIndex = getArtCategoryIndex(artCategoryKey);
  
  debug("Art category conversion:", {
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

  debug("Serialized instruction data:", instructionData);

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data: instructionData,
  });
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
    throw new Error(`Unknown art category: ${categoryKey}`);
  }

  return index;
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
}