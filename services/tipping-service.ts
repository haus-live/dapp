// Add a new file for tipping service

import { Connection, PublicKey } from "@solana/web3.js"
import type { WalletContextState } from "@solana/wallet-adapter-react"
import { CONTRACT_ADDRESSES } from "../lib/constants"
import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor"
import { idl } from "../idl/live-tipping"

/**
 * Sends a tip to an event creator
 * @param eventId The ID of the event
 * @param amount The amount to tip in SOL
 * @param wallet The wallet to send the tip from
 * @returns The transaction hash
 */
export async function sendTip(eventId: string, amount: number, wallet: WalletContextState): Promise<string> {
  if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected")
  }

  try {
    // Connect to Solana
    const connection = new Connection(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC!)

    // Create provider
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions!,
      },
      { commitment: "confirmed" },
    )

    // Create program instance
    const program = new Program(idl as any, new PublicKey(CONTRACT_ADDRESSES.LIVE_TIPPING), provider)

    // Convert amount to lamports
    const lamports = new BN(amount * web3.LAMPORTS_PER_SOL)

    // Find the event PDA
    const [eventPda] = await PublicKey.findProgramAddress(
      [Buffer.from("event"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(eventId)]).buffer))],
      new PublicKey(CONTRACT_ADDRESSES.EVENT_FACTORY),
    )

    // Find the tip PDA
    const [tipPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("tip"),
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(eventId)]).buffer)),
        wallet.publicKey.toBuffer(),
      ],
      new PublicKey(CONTRACT_ADDRESSES.LIVE_TIPPING),
    )

    // Create the transaction
    const tx = await program.methods
      .tipCreator(new BN(eventId), lamports)
      .accounts({
        event: eventPda,
        tip: tipPda,
        tipper: wallet.publicKey,
        payment: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .transaction()

    // Sign and send the transaction
    const signedTx = await wallet.signTransaction(tx)
    const txHash = await connection.sendRawTransaction(signedTx.serialize())

    // Wait for confirmation
    await connection.confirmTransaction(txHash)

    return txHash
  } catch (error) {
    console.error("Error sending tip:", error)
    throw error
  }
}
