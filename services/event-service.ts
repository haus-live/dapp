import { Connection, PublicKey } from "@solana/web3.js"
import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor"
import { eventFactoryIdl } from "../lib/solana/idl"
import { ticketFactoryIdl } from "../lib/solana/idl"
import { CONTRACT_ADDRESSES } from "../lib/constants"
import { SOLANA_RPC_URL, SOLANA_PROGRAM_ID } from "../lib/env"

// Set up program ID and RPC from centralized environment variables
const programId = new PublicKey(SOLANA_PROGRAM_ID);
const rpcEndpoint = SOLANA_RPC_URL;

/**
 * Fetches an event from the blockchain
 * @param eventId The ID of the event to fetch
 * @returns The event data
 */
export async function fetchEvent(eventId: string): Promise<any> {
  try {
    console.log("Fetching event with ID:", eventId);
    
    // Connect to Solana
    const connection = new Connection(rpcEndpoint);

    // Create a read-only provider
    const provider = AnchorProvider.local(rpcEndpoint);

    console.log("Creating program instance with ID:", programId.toString());
    
    // Create program instance
    const program = new Program(eventFactoryIdl as any, programId, provider);

    // Find the event PDA
    const [eventPda] = await PublicKey.findProgramAddress(
      [Buffer.from("event"), new PublicKey(eventId).toBuffer()],
      program.programId,
    );
    
    console.log("Event PDA:", eventPda.toString());

    // Fetch the event account
    const eventAccount = await program.account.event.fetch(eventPda);
    console.log("Event account fetched:", eventAccount);

    // Type assertion to work with Anchor account data
    const eventData = eventAccount as any;

    // Format the event data
    return {
      id: eventId,
      title: eventData.name || "Untitled Event",
      description: "Event on Solana blockchain", // Default description
      category: getEventCategory(eventData.artCategory),
      creator: eventData.authority.toString(),
      creatorAddress: eventData.authority.toString(),
      status: getEventStatus(eventData.status),
      ticketPrice: eventData.reservePrice.toNumber() / web3.LAMPORTS_PER_SOL,
      maxParticipants: 100, // Default value
      participants: 0, // Default value
      date: new Date(eventData.beginTimestamp.toNumber() * 1000).toISOString(),
      duration: (eventData.endTimestamp.toNumber() - eventData.beginTimestamp.toNumber()) / 60,
      image: "/placeholder.svg?height=200&width=400", // Default image
      contentUri: eventData.uri || "",
    }
  } catch (error) {
    console.error("Error fetching event:", error)
    throw error
  }
}

/**
 * Verifies if a user has a ticket for an event
 * @param eventId The ID of the event
 * @param userPublicKey The public key of the user
 * @returns True if the user has a ticket, false otherwise
 */
export async function verifyTicket(eventId: string, userPublicKey: string): Promise<boolean> {
  try {
    console.log("Verifying ticket for event:", eventId, "user:", userPublicKey);
    
    // Connect to Solana
    const connection = new Connection(rpcEndpoint);

    // Create a read-only provider
    const provider = AnchorProvider.local(rpcEndpoint);

    // Create program instance
    const program = new Program(ticketFactoryIdl as any, programId, provider);

    // Find the event PDA
    const [eventPda] = await PublicKey.findProgramAddress(
      [Buffer.from("event"), new PublicKey(eventId).toBuffer()],
      program.programId,
    );
    
    // This is a simplified implementation since the actual ticketing
    // would require querying token accounts or NFT ownership
    console.log("This is a mock implementation - will return false");
    
    return false; // Mock implementation
  } catch (error) {
    console.error("Error verifying ticket:", error)
    return false
  }
}

/**
 * Updates the content URI for an event
 */
export async function updateEventContent(eventId: string, contentUri: string): Promise<string> {
  try {
    console.log("Updating event content for event:", eventId, "with URI:", contentUri);
    
    // Connect to Solana
    const connection = new Connection(rpcEndpoint);

    // Get the provider from the wallet adapter
    const provider = getProvider(connection);
    if (!provider) throw new Error("Wallet not connected");

    // Create program instance
    const program = new Program(eventFactoryIdl as any, programId, provider);

    // Find the event PDA
    const [eventPda] = await PublicKey.findProgramAddress(
      [Buffer.from("event"), new PublicKey(eventId).toBuffer()],
      program.programId,
    );
    
    console.log("Event PDA:", eventPda.toString());
    
    console.log("This is a mock implementation since the actual updateContent instruction isn't yet implemented");
    
    // Mock transaction signature 
    return "mock_transaction_signature";
  } catch (error) {
    console.error("Error updating event content:", error)
    throw new Error("Failed to update event content")
  }
}

/**
 * Helper function to get the provider from the wallet adapter
 */
function getProvider(connection: Connection): AnchorProvider | null {
  // This would normally come from your wallet adapter
  // For simplicity, we're creating a mock provider
  if (typeof window === "undefined" || !window.solana) {
    return null
  }

  // Create a provider that wraps the wallet
  const wallet = {
    publicKey: window.solana.publicKey,
    signTransaction: window.solana.signTransaction,
    signAllTransactions: window.solana.signAllTransactions,
  }

  return new AnchorProvider(connection, wallet as any, { commitment: "processed" })
}

/**
 * Helper function to get the event status as a string
 */
function getEventStatus(status: any): string {
  // Default logic based on expected status structure
  if (status?.created) return "created"
  if (status?.live) return "live"
  if (status?.completed) return "completed"
  if (status?.finalized) return "finalized"
  
  // Default value if we can't determine the status
  return "created"
}

/**
 * Helper function to get the event category as a string
 */
function getEventCategory(artCategory: any): string {
  // Check each possible enum variant
  if (artCategory?.standupComedy) return "standup-comedy"
  if (artCategory?.performanceArt) return "performance-art"
  if (artCategory?.poetrySlam) return "poetry-slam" 
  if (artCategory?.openMicImprov) return "open-mic"
  if (artCategory?.livePainting) return "live-painting"
  if (artCategory?.creatingWorkshop) return "creative-workshop"
  
  // Default value if we can't determine the category
  return "performance-art"
}
