// @ts-nocheck
import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, Idl, BN, Program } from '@coral-xyz/anchor';
import { PublicKey, Connection, Keypair, SystemProgram } from '@solana/web3.js';
import { CreateEventParams } from '../event-metadata';
import { SOLANA_PROGRAM_ID } from '../env';

// Add debugging for important program interactions
const debug = (message: string, data?: any) => {
  console.log(`%c[PROGRAM] ${message}`, 'background: #111155; color: #ffff22', data || '');
};

// Seeds used for PDAs
const EVENT_SEED = "event";
const TIPPING_CALCULATOR_SEED = "tipping_calculator";

/**
 * Client for interacting with the Haus Solana program
 */
export class HausProgramClient {
  private program: Program;
  private connection: Connection;
  private wallet: any;
  private programId: PublicKey;

  // Static constants for PDA seeds
  static EVENT_SEED = EVENT_SEED;
  static TIPPING_CALCULATOR_SEED = TIPPING_CALCULATOR_SEED;

  /**
   * Creates a new instance of the HausProgramClient
   * @param connection Solana connection
   * @param wallet User's wallet
   * @param idl Program IDL
   * @param programId Program ID (optional, will use default from env if not provided)
   */
  constructor(
    connection: Connection, 
    wallet: any, 
    idl: any,
    programId?: PublicKey
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.programId = programId || new PublicKey(SOLANA_PROGRAM_ID);

    // Create a provider from the wallet
    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );

    // Initialize the program with the IDL and program ID
    this.program = new Program(idl, this.programId, provider);
    
    debug("Program client initialized", {
      programId: this.programId.toString(),
      wallet: wallet.publicKey?.toString()
    });
  }
  
  /**
   * Creates a new event on the blockchain
   * @param realtimeAsset Keypair for the realtime asset
   * @param eventParams Event parameters
   * @returns Transaction signature
   */
  async createEvent(
    realtimeAsset: Keypair,
    eventParams: CreateEventParams
  ): Promise<string> {
    try {
      debug("Creating event with params", {
        name: eventParams.name,
        reservePrice: eventParams.reservePrice.toString(),
        beginTimestamp: eventParams.beginTimestamp.toString(),
        endTimestamp: eventParams.endTimestamp.toString()
      });

      // Find the event PDA
      const [eventPda] = await PublicKey.findProgramAddress(
        [Buffer.from(EVENT_SEED), realtimeAsset.publicKey.toBuffer()],
        this.programId
      );

      debug("Accounts for transaction", {
        eventPda: eventPda.toString(),
        realtimeAsset: realtimeAsset.publicKey.toString(),
        authority: this.wallet.publicKey.toString()
      });

      // Call the program's createEvent instruction
      const tx = await this.program.methods
        .createEvent(eventParams)
        .accounts({
          realtimeAsset: realtimeAsset.publicKey,
          authority: this.wallet.publicKey,
          event: eventPda,
          systemProgram: SystemProgram.programId,
          mplCoreProgram: new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d")
        })
        .signers([realtimeAsset])
        .rpc();

      debug("Transaction signature", tx);
      return tx;
    } catch (error) {
      debug("Error creating event", error);
      throw error;
    }
  }
  
  /**
   * Initialize a tipping calculator for an event
   * @param realtimeAssetKey Public key of the realtime asset
   * @returns Transaction signature
   */
  async initTippingCalculator(realtimeAssetKey: PublicKey): Promise<string> {
    try {
      // Find the event PDA
      const [eventPda] = await PublicKey.findProgramAddress(
        [Buffer.from(EVENT_SEED), realtimeAssetKey.toBuffer()],
        this.programId
      );
      
      // Find the tipping calculator PDA
      const [tippingCalculatorPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from(TIPPING_CALCULATOR_SEED),
          realtimeAssetKey.toBuffer(),
          this.wallet.publicKey.toBuffer()
        ],
        this.programId
      );
      
      // Initialize the tipping calculator
      const tx = await this.program.methods
        .initTippingCalculator()
        .accounts({
          realtimeAsset: realtimeAssetKey,
          event: eventPda,
          tippingCalculator: tippingCalculatorPda,
          signer: this.wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error initializing tipping calculator:', error);
      throw error;
    }
  }
  
  /**
   * Make a tip for an event
   * @param realtimeAssetKey Public key of the realtime asset
   * @param amount Amount to tip in lamports
   * @returns Transaction signature
   */
  async makeTip(realtimeAssetKey: PublicKey, amount: number): Promise<string> {
    try {
      // Find the event PDA
      const [eventPda] = await PublicKey.findProgramAddress(
        [Buffer.from(EVENT_SEED), realtimeAssetKey.toBuffer()],
        this.programId
      );
      
      // Find the tipping calculator PDA
      const [tippingCalculatorPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from(TIPPING_CALCULATOR_SEED),
          realtimeAssetKey.toBuffer(),
          this.wallet.publicKey.toBuffer()
        ],
        this.programId
      );
      
      // Make the tip
      const tx = await this.program.methods
        .makeTip({
          amount: new BN(amount),
          realtimeAssetKey: realtimeAssetKey
        })
        .accounts({
          event: eventPda,
          tippingCalculator: tippingCalculatorPda,
          signer: this.wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error making tip:', error);
      throw error;
    }
  }
  
  /**
   * Claim a realtime asset
   * @param realtimeAssetKey Public key of the realtime asset to claim
   * @returns Transaction signature
   */
  async claimRealtimeAsset(realtimeAssetKey: PublicKey): Promise<string> {
    try {
      // Find the event PDA
      const [eventPda] = await PublicKey.findProgramAddress(
        [Buffer.from(EVENT_SEED), realtimeAssetKey.toBuffer()],
        this.programId
      );
      
      // Claim the asset
      const tx = await this.program.methods
        .claimRealtimeAsset()
        .accounts({
          event: eventPda,
          realtimeAsset: realtimeAssetKey,
          authority: this.wallet.publicKey,
          mplCoreProgram: new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d")
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error claiming realtime asset:', error);
      throw error;
    }
  }
  
  /**
   * Withdraw tips from an event
   * @param realtimeAssetKey Public key of the realtime asset
   * @returns Transaction signature
   */
  async withdrawTips(realtimeAssetKey: PublicKey): Promise<string> {
    try {
      // Find the event PDA
      const [eventPda] = await PublicKey.findProgramAddress(
        [Buffer.from(EVENT_SEED), realtimeAssetKey.toBuffer()],
        this.programId
      );
      
      // Withdraw tips
      const tx = await this.program.methods
        .withdrawTips()
        .accounts({
          realtimeAsset: realtimeAssetKey,
          event: eventPda,
          authority: this.wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error withdrawing tips:', error);
      throw error;
    }
  }
} 