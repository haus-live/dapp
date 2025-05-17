/**
 * Helper functions for minting events in the event factory
 */
import { useEvents } from "@/contexts/events-context";
import { mintEvent } from "@/lib/solana/event-minter";
import { Event } from "@/lib/types";

/**
 * Creates a new event from form data and mints it on the blockchain
 */
export async function createAndMintEvent(
  wallet: any,
  formData: any,
  userProfile: any,
  addEvent: (event: any) => Promise<any>
) {
  console.log("Starting event minting process with wallet:", wallet.publicKey.toString());

  // Mint the event on Solana - this will create ticket collection and mint the event NFT
  const { transactionSignature, realtimeAssetKey } = await mintEvent(wallet, formData);

  console.log("Minting successful", { realtimeAssetKey, transactionSignature });

  // Create a new event object from the form data and mint result
  const eventData: any = {
    title: formData.title,
    description: formData.description || '',
    category: formData.category,
    date: typeof formData.date === 'object' ? formData.date.toISOString() : String(formData.date),
    creator: userProfile?.username || 'Anonymous',
    creatorAddress: wallet.publicKey.toString(),
    duration: formData.duration || 60,
    participants: 0,
    maxParticipants: formData.ticketsAmount || 99,
    ticketPrice: formData.ticketPrice || 0.1,
    image: formData.banner ? URL.createObjectURL(formData.banner) : '',
    status: "created", // Limited to valid status values
    contentUri: `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`,
    ticketCollection: realtimeAssetKey
  };

  // Add the event to global state
  const result = await addEvent(eventData);
  
  return {
    transactionSignature,
    realtimeAssetKey,
    event: result
  };
}