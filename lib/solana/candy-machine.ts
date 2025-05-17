/**
 * Ticket collection creation for HAUS events
 * Production implementation for RTA ticket collection integration
 */

import { 
  Connection, 
  PublicKey
} from '@solana/web3.js';
import { createTokenCollection } from './metaplex-client';

// Debug logging for ticket collection operations
const debug = (message: string, data?: any) => {
  console.log(`%c[TICKET-COLLECTION] ${message}`, 'background: #330033; color: #ffff99', data || '');
};

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
 * This function will create a new token collection for the event tickets
 * and trigger wallet signing to approve the transaction
 * 
 * @param connection Solana connection
 * @param wallet User wallet (must implement publicKey, signTransaction)
 * @param config Ticket collection configuration
 * @returns Created collection public key
 */
export async function createTicketCollection(
  connection: Connection,
  wallet: any,
  config: TicketCollectionConfig
): Promise<PublicKey> {
  try {
    debug('Creating ticket collection', {
      name: config.name,
      maxSupply: config.maxSupply,
      price: config.price
    });

    // Validate wallet is connected
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    debug('Using wallet', wallet.publicKey.toString());

    // Create the collection using our Metaplex client
    const collectionPubkey = await createTokenCollection(
      connection,
      wallet,
      {
        name: config.name,
        symbol: "HAUS", // Using HAUS as symbol for all RTAs
        description: config.description || `Ticket collection for ${config.name}`,
        bannerUrl: config.bannerUrl,
        maxSupply: config.maxSupply,
        price: config.price,
        creators: config.creators
      }
    );
    
    debug('Ticket collection created successfully', collectionPubkey.toString());
    return collectionPubkey;
  } catch (error) {
    debug('Error in ticket collection creation', error);
    throw error;
  }
}

/**
 * Creates complete metadata for a ticket collection
 * @param eventTitle Event title
 * @param eventDescription Event description
 * @param creatorAddress Creator wallet address
 * @param ticketsAmount Maximum number of tickets
 * @param ticketPrice Price per ticket in SOL
 * @param bannerUrl URL of the event banner image
 * @param eventDate Date of the event
 * @returns Ticket collection configuration
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