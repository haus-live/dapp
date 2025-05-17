/**
 * Type definitions for IDL interaction with the Solana program
 * These match the exact structure expected by the on-chain program
 */

import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

/**
 * Art Category variants as defined in the Solana program
 * Must match exactly what the program expects for proper deserialization
 */
export type ArtCategoryVariant = 
  | { standupComedy: {} } 
  | { performanceArt: {} } 
  | { poetrySlam: {} }
  | { openMicImprov: {} }
  | { livePainting: {} }
  | { creatingWorkshop: {} };

/**
 * The exact structure of CreateEventArgs as defined in the Solana program
 * Critical for proper instruction deserialization
 */
export interface CreateEventArgs {
  name: string;
  uri: string;
  begin_timestamp: BN;
  end_timestamp: BN;
  reserve_price: BN;
  ticket_collection: PublicKey;
  art_category: ArtCategoryVariant;
}