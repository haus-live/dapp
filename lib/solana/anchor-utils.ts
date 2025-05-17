/**
 * Anchor utility functions for working with Solana programs
 * Production implementation with proper typing and error handling
 */
import { Program, AnchorProvider, BN, Idl } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { HAUS_IDL } from './idl';
import { SOLANA_PROGRAM_ID } from '../env';

/**
 * Creates a provider that can be used with Anchor
 * @param connection - Solana connection
 * @param wallet - Wallet with publicKey, signTransaction, and signAllTransactions methods
 * @returns AnchorProvider
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
 * @param provider - Anchor provider
 * @returns Program
 */
export function createHausProgram(provider: AnchorProvider): Program {
  // The as any type cast is required because the IDL type doesn't match exactly
  // what Anchor expects, but the structure is correct and will work at runtime
  return new Program(HAUS_IDL as any, new PublicKey(SOLANA_PROGRAM_ID), provider);
}

/**
 * Utility function to convert a value to a BN (Big Number) 
 * appropriate for use with Anchor
 * @param value - Number or string value
 * @returns BN
 */
export function toBN(value: number | string | BN): BN {
  if (value instanceof BN) {
    return value;
  }
  if (typeof value === 'string') {
    return new BN(value);
  }
  return new BN(value);
}

/**
 * Gets the event PDA for a realtime asset
 * @param programId - Program ID
 * @param realtimeAssetKey - Public key of the realtime asset
 * @returns Event PDA
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
 * @param programId - Program ID
 * @param realtimeAssetKey - Public key of the realtime asset
 * @param userKey - Public key of the user
 * @returns Tipping calculator PDA
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

/**
 * Formats parameters for event creation to match what the program expects
 * @param params - Event parameters
 * @returns Formatted event parameters
 */
export function formatEventParams(params: any): any {
  return {
    name: params.name,
    uri: params.uri,
    begin_timestamp: toBN(params.beginTimestamp),
    end_timestamp: toBN(params.endTimestamp),
    reserve_price: toBN(params.reservePrice),
    ticket_collection: params.ticketCollection,
    art_category: params.artCategory
  };
}