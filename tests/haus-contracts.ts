import * as anchor from "@project-serum/anchor"
import type { Program } from "@project-serum/anchor"
import type { EventFactory } from "../target/types/event_factory"
import type { TicketFactory } from "../target/types/ticket_factory"
import type { LiveTipping } from "../target/types/live_tipping"
import { expect } from "chai"
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"

describe("haus-contracts", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const eventFactoryProgram = anchor.workspace.EventFactory as Program<EventFactory>
  const ticketFactoryProgram = anchor.workspace.TicketFactory as Program<TicketFactory>
  const liveTippingProgram = anchor.workspace.LiveTipping as Program<LiveTipping>

  const eventFactory = Keypair.generate()
  const treasury = Keypair.generate()
  const creator = provider.wallet
  const buyer = Keypair.generate()
  const tipper = Keypair.generate()

  const eventId = 0
  let eventPda: PublicKey
  let eventBump: number
  let ticketFactoryPda: PublicKey
  let ticketFactoryBump: number
  const mintKeypair = Keypair.generate()
  let metadataPda: PublicKey
  let masterEditionPda: PublicKey
  let creatorTokenAccount: PublicKey

  before(async () => {
    // Airdrop SOL to accounts that need it
    await provider.connection.requestAirdrop(buyer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    await provider.connection.requestAirdrop(tipper.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    await provider.connection.requestAirdrop(treasury.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL)

    // Wait for confirmations
    await new Promise((resolve) => setTimeout(resolve, 2000))
  })

  it("Initializes the event factory", async () => {
    await eventFactoryProgram.methods
      .initialize(new anchor.BN(100)) // 10% fee
      .accounts({
        eventFactory: eventFactory.publicKey,
        authority: creator.publicKey,
        treasury: treasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([eventFactory])
      .rpc()

    const eventFactoryAccount = await eventFactoryProgram.account.eventFactory.fetch(eventFactory.publicKey)

    expect(eventFactoryAccount.authority.toString()).to.equal(creator.publicKey.toString())
    expect(eventFactoryAccount.treasury.toString()).to.equal(treasury.publicKey.toString())
    expect(eventFactoryAccount.treasuryFee.toNumber()).to.equal(100)
    expect(eventFactoryAccount.eventCount.toNumber()).to.equal(0)
  })

  it("Creates an event", async () => {
    // Find PDA for event
    ;[eventPda, eventBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("event"),
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]), // event_id = 0
      ],
      eventFactoryProgram.programId,
    )

    // Find PDA for ticket factory
    ;[ticketFactoryPda, ticketFactoryBump] = await PublicKey.findProgramAddress(
      [Buffer.from("ticket_factory"), eventPda.toBuffer()],
      ticketFactoryProgram.programId,
    )

    // Find PDAs for metadata and master edition
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

    metadataPda = await PublicKey.findProgramAddress(
      [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID,
    )[0]

    masterEditionPda = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )[0]

    // Find creator token account
    creatorTokenAccount = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: creator.publicKey,
    })

    // Create event
    await eventFactoryProgram.methods
      .createEvent(
        "Test Event",
        "EVENT",
        "https://haus.art/events/0",
        "This is a test event",
        "standup-comedy",
        new anchor.BN(100), // tickets_amount
        new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL), // ticket_price
        { cumulativeTips: {} }, // sale_type
        new anchor.BN(5 * anchor.web3.LAMPORTS_PER_SOL), // reserve_price
        new anchor.BN(Math.floor(Date.now() / 1000) + 3600), // start_time (1 hour from now)
        new anchor.BN(3600), // duration (1 hour)
      )
      .accounts({
        eventFactory: eventFactory.publicKey,
        event: eventPda,
        creator: creator.publicKey,
        mint: mintKeypair.publicKey,
        metadata: metadataPda,
        masterEdition: masterEditionPda,
        creatorTokenAccount: creatorTokenAccount,
        ticketFactory: ticketFactoryPda,
        ticketFactoryProgram: ticketFactoryProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc()

    // Fetch event account
    const eventAccount = await eventFactoryProgram.account.event.fetch(eventPda)

    expect(eventAccount.name).to.equal("Test Event")
    expect(eventAccount.description).to.equal("This is a test event")
    expect(eventAccount.category).to.equal("standup-comedy")
    expect(eventAccount.ticketsAmount.toNumber()).to.equal(100)
    expect(eventAccount.ticketPrice.toNumber()).to.equal(1 * anchor.web3.LAMPORTS_PER_SOL)
    expect(eventAccount.status).to.deep.equal({ created: {} })

    // Fetch ticket factory account
    const ticketFactoryAccount = await ticketFactoryProgram.account.ticketFactory.fetch(ticketFactoryPda)

    expect(ticketFactoryAccount.event.toString()).to.equal(eventPda.toString())
    expect(ticketFactoryAccount.ticketsAmount.toNumber()).to.equal(100)
    expect(ticketFactoryAccount.ticketPrice.toNumber()).to.equal(1 * anchor.web3.LAMPORTS_PER_SOL)
    expect(ticketFactoryAccount.ticketsSold.toNumber()).to.equal(0)
  })

  // Add more tests for buying tickets, tipping, and finalizing events
})
