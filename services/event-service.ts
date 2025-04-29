import { Connection, PublicKey } from "@solana/web3.js"
import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor"
import { idl as eventFactoryIdl } from "../idl/event-factory"
import { idl as ticketFactoryIdl } from "../idl/ticket-factory"
import { CONTRACT_ADDRESSES } from "../lib/constants"

// Constants
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EVENT_FACTORY!)
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_POLYGON_MAINNET_RPC!

/**
 * Fetches an event from the blockchain
 * @param eventId The ID of the event to fetch
 * @returns The event data
 */
export async function fetchEvent(eventId: string): Promise<any> {
  try {
    // Connect to Solana
    const connection = new Connection(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC!)

    // Create a read-only provider
    const provider = AnchorProvider.local(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC!)

    // Create program instance
    const program = new Program(eventFactoryIdl as any, new PublicKey(CONTRACT_ADDRESSES.EVENT_FACTORY), provider)

    // Find the event PDA
    const [eventPda] = await PublicKey.findProgramAddress(
      [Buffer.from("event"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(eventId)]).buffer))],
      program.programId,
    )

    // Fetch the event account
    const eventAccount = await program.account.event.fetch(eventPda)

    // Format the event data
    return {
      id: eventId,
      name: eventAccount.name,
      description: eventAccount.description,
      category: eventAccount.category,
      artist: eventAccount.authority.toString(),
      status: getEventStatus(eventAccount.status),
      ticketPrice: eventAccount.ticketPrice.toNumber() / web3.LAMPORTS_PER_SOL,
      ticketsAmount: eventAccount.ticketsAmount.toNumber(),
      ticketsSold: eventAccount.ticketsSold.toNumber(),
      startTime: eventAccount.startTime.toNumber() * 1000, // Convert to milliseconds
      duration: eventAccount.duration.toNumber(),
      totalTips: eventAccount.totalTips.toNumber() / web3.LAMPORTS_PER_SOL,
      highestTipper: eventAccount.highestTipper.toString(),
      highestTipAmount: eventAccount.highestTipAmount.toNumber() / web3.LAMPORTS_PER_SOL,
      contentUri: getContentUri(eventAccount.metadata),
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
    // Connect to Solana
    const connection = new Connection(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC!)

    // Create a read-only provider
    const provider = AnchorProvider.local(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC!)

    // Create program instance
    const program = new Program(ticketFactoryIdl as any, new PublicKey(CONTRACT_ADDRESSES.TICKET_FACTORY), provider)

    // Find the ticket factory PDA
    const [ticketFactoryPda] = await PublicKey.findProgramAddress(
      [Buffer.from("ticket_factory"), new PublicKey(CONTRACT_ADDRESSES.EVENT_FACTORY).toBuffer()],
      program.programId,
    )

    // Fetch the ticket factory account
    const ticketFactoryAccount = await program.account.ticketFactory.fetch(ticketFactoryPda)

    // Get all tickets for the event
    const tickets = await program.account.ticket.all([
      {
        memcmp: {
          offset: 8, // Skip the discriminator
          bytes: new BN(eventId).toArrayLike(Buffer, "le", 8).toString("base64"),
        },
      },
    ])

    // Check if the user has a ticket
    return tickets.some((ticket) => ticket.account.owner.toString() === userPublicKey)
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
    // Connect to Solana
    const connection = new Connection(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC!)

    // Get the provider from the wallet adapter
    const provider = getProvider(connection)
    if (!provider) throw new Error("Wallet not connected")

    // Create program instance
    const program = new Program(eventFactoryIdl as any, PROGRAM_ID, provider)

    // Find the event PDA
    const [eventPda] = await PublicKey.findProgramAddress(
      [Buffer.from("event"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(eventId)]).buffer))],
      program.programId,
    )

    // Find the metadata PDA
    const eventAccount = await program.account.event.fetch(eventPda)
    const metadataPda = eventAccount.metadata

    // Get the token metadata program ID
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

    // Create the transaction
    const tx = await program.methods
      .addContentToEvent(`ipfs://${contentUri}`)
      .accounts({
        event: eventPda,
        creator: provider.publicKey,
        metadata: metadataPda,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .transaction()

    // Sign and send the transaction
    const txSignature = await provider.sendAndConfirm(tx)

    return txSignature
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

  return new AnchorProvider(connection, window.solana, { commitment: "processed" })
}

/**
 * Helper function to get the event status as a string
 */
function getEventStatus(status: any): string {
  if (status.created) return "created"
  if (status.live) return "live"
  if (status.completed) return "completed"
  if (status.finalized) return "finalized"
  return "unknown"
}

/**
 * Helper function to get the content URI from metadata
 */
async function getContentUri(metadataPda: PublicKey): Promise<string | null> {
  try {
    // Connect to Solana
    const connection = new Connection(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC!)

    // Fetch the metadata account
    const metadataAccount = await connection.getAccountInfo(metadataPda)
    if (!metadataAccount) return null

    // Parse the metadata
    // This is a simplified version - in production, you would use the proper metadata schema
    const data = metadataAccount.data
    const uri = data
      .slice(1 + 32 + 32 + 4 + 4 + 4)
      .toString("utf8")
      .replace(/\0/g, "")

    return uri
  } catch (error) {
    console.error("Error getting content URI:", error)
    return null
  }
}
