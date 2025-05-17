import { Connection, PublicKey } from "@solana/web3.js";
import { web3 } from "@project-serum/anchor";
import { SOLANA_RPC_URL, SOLANA_PROGRAM_ID } from "../lib/env";
import { createAnchorProvider, createHausProgram, getEventPDA } from "../lib/solana/anchor-utils";

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

    // Create a read-only provider - using empty wallet for read-only operations
    const readOnlyWallet = {
      publicKey: new PublicKey(eventId),
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs
    };
    
    const provider = createAnchorProvider(connection, readOnlyWallet);
    console.log("Creating program instance with ID:", programId.toString());
    
    // Create program instance using our utility
    const program = createHausProgram(provider);

    // Find the event PDA
    const eventPda = await getEventPDA(programId, new PublicKey(eventId));
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
    console.error("Error fetching event:", error);
    throw error;
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

    // Create a read-only provider - using empty wallet for read-only operations
    const readOnlyWallet = {
      publicKey: new PublicKey(eventId),
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs
    };
    
    const provider = createAnchorProvider(connection, readOnlyWallet);
    
    // Create program instance using our utility
    const program = createHausProgram(provider);

    // Find the event PDA
    const eventPda = await getEventPDA(programId, new PublicKey(eventId));
    
    // Get the ticket collection from the event
    const eventAccount = await program.account.event.fetch(eventPda);
    const ticketCollection = (eventAccount as any).ticketCollection;
    
    if (!ticketCollection) {
      console.log("No ticket collection found for this event");
      return false;
    }
    
    console.log("Checking if user owns a ticket NFT from collection:", ticketCollection.toString());
    
    // Implementation using Solana to check token ownership
    const userWallet = new PublicKey(userPublicKey);
    
    try {
      // Query token accounts owned by the user that belong to this collection
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        userWallet,
        { mint: ticketCollection }
      );
      
      // If user has token accounts for this mint, they have a ticket
      return tokenAccounts.value.length > 0;
    } catch (err) {
      console.error("Error checking ticket ownership:", err);
      return false;
    }
  } catch (error) {
    console.error("Error verifying ticket:", error);
    return false;
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

    // Create program instance using our utility
    const program = createHausProgram(provider);

    // Find the event PDA
    const eventPda = await getEventPDA(programId, new PublicKey(eventId));
    console.log("Event PDA:", eventPda.toString());
    
    // Update content URI instruction
    const tx = await program.methods
      .updateContentUri(contentUri)
      .accounts({
        event: eventPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("Content URI updated with transaction:", tx);
    
    // Return the actual transaction signature
    return tx;
  } catch (error) {
    console.error("Error updating event content:", error);
    throw new Error("Failed to update event content");
  }
}

/**
 * Helper function to get the provider from the wallet adapter
 */
function getProvider(connection: Connection): any {
  // This would normally come from your wallet adapter
  if (typeof window === "undefined" || !window.solana) {
    return null;
  }

  // Create a provider that wraps the wallet
  const wallet = {
    publicKey: window.solana.publicKey,
    signTransaction: window.solana.signTransaction,
    signAllTransactions: window.solana.signAllTransactions,
  };

  return createAnchorProvider(connection, wallet);
}

/**
 * Helper function to get the event status as a string
 */
function getEventStatus(status: any): string {
  // Default logic based on expected status structure
  if (status?.created) return "created";
  if (status?.live) return "live";
  if (status?.completed) return "completed";
  if (status?.finalized) return "finalized";
  
  // Default value if we can't determine the status
  return "created";
}

/**
 * Helper function to get the event category as a string
 */
function getEventCategory(artCategory: any): string {
  // Check each possible enum variant
  if (artCategory?.standupComedy) return "standup-comedy";
  if (artCategory?.performanceArt) return "performance-art";
  if (artCategory?.poetrySlam) return "poetry-slam"; 
  if (artCategory?.openMicImprov) return "open-mic";
  if (artCategory?.livePainting) return "live-painting";
  if (artCategory?.creatingWorkshop) return "creative-workshop";
  
  // Default value if we can't determine the category
  return "performance-art";
}