/**
 * Event metadata utilities for HAUS
 * Production-ready implementation with no placeholders or mocks
 */
import { PublicKey } from '@solana/web3.js';
import { PINATA_GATEWAY_URL } from './env';
import { storeFileOnPinata, storeJsonOnPinata } from '../services/pinata-service';

/**
 * Metadata structure for an event
 */
export interface EventMetadata {
  title: string;
  description: string;
  bannerUrl: string;
  bannerCid: string;
  creator: string;
  creatorWallet: string;
  category: string;
  startDate: Date;
  endDate: Date;
  ticketPrice: number;
  maxAttendees: number;
}

/**
 * Parameters required for creating an event on-chain
 */
export interface CreateEventParams {
  name: string;
  uri: string;
  beginTimestamp: number;
  endTimestamp: number;
  reservePrice: number;
  ticketCollection: PublicKey;
  artCategory: any; // Must be a variant object for Anchor serialization
}

/**
 * Prepares event metadata for IPFS storage
 * @param formData Form data from event creation flow
 * @param creatorWallet Creator's wallet address
 * @returns Metadata URI and processed event data
 */
export async function prepareEventMetadata(
  formData: any,
  creatorWallet: string
): Promise<{ uri: string; metadata: EventMetadata }> {
  console.log('Preparing event metadata with form data:', formData);
  
  // Default dates if not provided
  const defaultStartDate = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 1);
  
  // Upload banner to IPFS
  console.log('Uploading banner to IPFS via Pinata...');
  let bannerCid = '';
  let bannerUrl = '';
  
  if (formData.banner && formData.banner instanceof File) {
    try {
      bannerCid = await storeFileOnPinata(
        formData.banner, 
        `event-banner-${Date.now()}`
      );
      console.log('Banner uploaded with CID:', bannerCid);
      bannerUrl = `${PINATA_GATEWAY_URL}/ipfs/${bannerCid}`;
    } catch (error) {
      console.error('Error uploading banner:', error);
      throw new Error(`Failed to upload banner: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    throw new Error('No banner image provided. A banner is required for event creation.');
  }
  
  // Parse ticketPrice to ensure it's a number
  const ticketPrice = typeof formData.ticketPrice === 'string' 
    ? parseFloat(formData.ticketPrice) 
    : (formData.ticketPrice || 0);
  
  // Parse maxAttendees to ensure it's a number  
  const maxAttendees = typeof formData.ticketsAmount === 'string'
    ? parseInt(formData.ticketsAmount, 10)
    : (formData.ticketsAmount || 99);
  
  // Create the event metadata object
  const metadata: EventMetadata = {
    title: formData.title || 'Untitled Event',
    description: formData.description || '',
    bannerUrl,
    bannerCid,
    creator: formData.creator || 'Anonymous',
    creatorWallet,
    category: formData.category || 'default',
    startDate: formData.date instanceof Date ? formData.date : defaultStartDate,
    endDate: formData.endDate instanceof Date ? formData.endDate : defaultEndDate,
    ticketPrice,
    maxAttendees
  };
  
  console.log('Created metadata object:', metadata);
  
  // Store metadata on IPFS
  console.log('Storing metadata on IPFS via Pinata...');
  const metadataCid = await storeJsonOnPinata(
    metadata, 
    `event-metadata-${creatorWallet.slice(0, 8)}-${Date.now()}`
  );
  console.log('Metadata stored with CID:', metadataCid);
  
  // Construct full URI
  const uri = `${PINATA_GATEWAY_URL}/ipfs/${metadataCid}`;
  console.log('Final URI:', uri);
  
  return { uri, metadata };
}