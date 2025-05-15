/**
 * Event metadata structure for integration with Solana program
 */
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { uploadFileToPinata, storeJsonOnPinata } from "@/services/pinata-service";
import { PINATA_GATEWAY_URL } from "@/lib/env";

// Enum for art categories matching the Solana program's ArtCategory enum
export enum ArtCategory {
  StandupComedy = "StandupComedy",
  PerformanceArt = "PerformanceArt",
  PoetrySlam = "PoetrySlam",
  OpenMicImprov = "OpenMicImprov",
  LivePainting = "LivePainting",
  CreatingWorkshop = "CreatingWorkshop"
}

// Map frontend category string to Solana program ArtCategory enum
const categoryMapping: Record<string, ArtCategory> = {
  "standup-comedy": ArtCategory.StandupComedy,
  "performance-art": ArtCategory.PerformanceArt,
  "poetry-slam": ArtCategory.PoetrySlam,
  "open-mic": ArtCategory.OpenMicImprov,
  "live-painting": ArtCategory.LivePainting,
  "creative-workshop": ArtCategory.CreatingWorkshop
};

// Event metadata structure for IPFS storage
export interface EventMetadata {
  title: string;
  description: string;
  bannerUrl: string | null;
  bannerCid: string | null;
  creator: string;
  creatorAddress: string;
  category: string;
  date: string;
  duration: number;
  ticketPrice: number;
  ticketsAmount: number;
  reservePrice: number;
}

// Parameters for creating an event on Solana, matching the CreateEventArgs struct in lib.rs
export interface CreateEventParams {
  name: string;               // title from EventFactory
  uri: string;                // IPFS URI with metadata
  beginTimestamp: BN;         // Event Date + Time
  endTimestamp: BN;           // Begin + Duration
  reservePrice: BN;           // Reserve Price from EventFactory
  ticketCollection: PublicKey; // Ticket collection NFT (to be created)
  artCategory: { [key: string]: {} }; // Category in format expected by the program
}

/**
 * Prepares the metadata for an event and uploads it to IPFS
 * @param formData Data from the EventFactory form
 * @param userAddress Creator's wallet address
 * @returns The IPFS URI and complete metadata
 */
export async function prepareEventMetadata(
  formData: any,
  userAddress: string,
  username: string
): Promise<{ uri: string, metadata: EventMetadata }> {
  console.log("Preparing event metadata with form data:", formData);

  // Upload banner to IPFS if exists
  let bannerCid = null;
  if (formData.banner) {
    try {
      console.log("Uploading banner to IPFS via Pinata...");
      bannerCid = await uploadFileToPinata(formData.banner, `event-banner-${Date.now()}`);
      console.log("Banner uploaded with CID:", bannerCid);
    } catch (error) {
      console.error("Error uploading banner:", error);
      // Continue without banner if upload fails
    }
  }

  // Calculate the date and time
  const eventDate = formData.date ? new Date(formData.date) : new Date();
  if (formData.time) {
    const [hours, minutes] = formData.time.split(':').map(Number);
    eventDate.setHours(hours, minutes, 0, 0);
  }

  // Prepare the metadata object
  const metadata: EventMetadata = {
    title: formData.title,
    description: formData.description || "",
    bannerUrl: bannerCid ? `${PINATA_GATEWAY_URL}/${bannerCid}` : null,
    bannerCid: bannerCid,
    creator: username || "Anonymous",
    creatorAddress: userAddress,
    category: formData.category || "performance-art", // Default if not provided
    date: eventDate.toISOString(),
    duration: parseInt(formData.duration) || 60, // Default to 60 minutes if not specified
    ticketPrice: parseFloat(formData.ticketPrice) || 0,
    ticketsAmount: formData.noCap ? 1000 : (parseInt(formData.ticketsAmount) || 100),
    reservePrice: parseFloat(formData.reservePrice) || 0
  };

  console.log("Created metadata object:", metadata);

  try {
    // Store the metadata on IPFS
    console.log("Storing metadata on IPFS via Pinata...");
    const metadataCid = await storeJsonOnPinata(metadata, `event-metadata-${userAddress.substring(0, 8)}-${Date.now()}`);
    console.log("Metadata stored with CID:", metadataCid);
    
    // Return the IPFS URI and metadata
    const uri = `${PINATA_GATEWAY_URL}/${metadataCid}`;
    console.log("Final URI:", uri);
    
    return { uri, metadata };
  } catch (error) {
    console.error("Error storing metadata on IPFS:", error);
    throw new Error("Failed to store event metadata on IPFS: " + 
      (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Converts EventFactory form data to Solana program CreateEventArgs
 * @param formData Data from the EventFactory form
 * @param metadataUri IPFS URI for event metadata
 * @param userPublicKey User's wallet public key
 * @returns Parameters formatted for the Solana program
 */
export function createSolanaEventParams(
  formData: any,
  metadataUri: string,
  userPublicKey: PublicKey
): CreateEventParams {
  console.log("Creating Solana event parameters with form data:", {
    title: formData.title,
    category: formData.category,
    hasDate: !!formData.date,
    time: formData.time,
    duration: formData.duration,
    reservePrice: formData.reservePrice
  });

  try {
    // 1. Calculate timestamps
    const eventDate = formData.date ? new Date(formData.date) : new Date();
    if (formData.time) {
      const [hours, minutes] = formData.time.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);
    }
    
    const beginTimestamp = Math.floor(eventDate.getTime() / 1000); // Convert to Unix timestamp (seconds)
    const duration = parseInt(formData.duration) || 60; // Default to 60 minutes if not specified
    const endTimestamp = beginTimestamp + (duration * 60); // Convert minutes to seconds
    
    console.log("Calculated timestamps:", { 
      beginTimestamp, 
      endTimestamp, 
      date: eventDate.toISOString() 
    });
    
    // 2. Get the correct art category enum value and format for program
    // Ensure we have a valid category or use a default
    const category = formData.category || "performance-art";
    const artCategoryEnum = categoryMapping[category];
    
    if (!artCategoryEnum) {
      console.warn(`Invalid category '${category}', defaulting to PerformanceArt`);
    }
    
    // Create the format expected by Anchor: { categoryName: {} }
    // The key must match EXACTLY what the program expects
    const artCategory = { 
      [artCategoryEnum || ArtCategory.PerformanceArt]: {} 
    };
    
    console.log("Art category for program:", artCategory);
    
    // 3. Convert reserve price to lamports (SOL × 10^9)
    const reservePriceValue = parseFloat(formData.reservePrice) || 0;
    const reservePriceInLamports = new BN(Math.floor(reservePriceValue * 1_000_000_000));
    console.log("Reserve price in lamports:", reservePriceInLamports.toString());
    
    // 4. Use the user's wallet public key as the ticket collection
    // In a real implementation, you would mint a collection NFT first and use its public key
    const ticketCollection = userPublicKey;
    
    // Create the complete parameters object
    const params: CreateEventParams = {
      name: formData.title || "Untitled Event",
      uri: metadataUri,
      beginTimestamp: new BN(beginTimestamp),
      endTimestamp: new BN(endTimestamp),
      reservePrice: reservePriceInLamports,
      ticketCollection: ticketCollection,
      artCategory
    };
    
    console.log("Final params created successfully:", params);
    
    return params;
  } catch (error) {
    console.error("Error creating Solana event parameters:", error);
    throw error;
  }
} 