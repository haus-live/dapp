import { BN } from '@project-serum/anchor';
import { 
  PublicKey, 
  Connection, 
  Keypair, 
  SystemProgram,
  Transaction
} from '@solana/web3.js';
import { CreateEventParams } from '../event-metadata';
import { SOLANA_PROGRAM_ID } from '../env';
import { createAnchorProvider, createHausProgram, getEventPDA } from './anchor-utils';

// Debug logging for program interactions
const debug = (message: string, data?: any) => {
  console.log(`%c[PROGRAM] ${message}`, 'background: #111155; color: #ffff22', data || '');
};

// Core Metaplex program ID
const MPL_CORE_PROGRAM = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

/**
 * Client for interacting with the Haus Solana program
 * Production implementation with no mocks or placeholders
 */
export class HausProgramClient {
  private program: any;
  private connection: Connection;
  private wallet: any;
  private programId: PublicKey;

  /**
   * Creates a new instance of the HausProgramClient
   * @param connection Solana connection
   * @param wallet User's wallet
   * @param programId Program ID (optional, will use default from env)
   */
  constructor(
    connection: Connection, 
    wallet: any, 
    programId?: PublicKey
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.programId = programId || new PublicKey(SOLANA_PROGRAM_ID);

    try {
      // Create an Anchor provider with our wallet
      const provider = createAnchorProvider(connection, wallet);
      
      // Initialize the program with our provider
      this.program = createHausProgram(provider);
      
      debug("Program client initialized with:", {
        programId: this.programId.toString(),
        walletAddress: wallet.publicKey?.toString(),
        providerCommitment: provider.connection.commitment
      });
    } catch (error) {
      debug("Error during program initialization", error);
      throw new Error(`Failed to initialize Solana program client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get the program instance
   * @returns Anchor program instance
   */
  getProgram(): any {
    return this.program;
  }
  
  /**
   * Creates a new event on the blockchain
   * @param realtimeAsset Keypair for the realtime asset
   * @param eventParams Event parameters
   * @returns Transaction signature (not a mock - actual blockchain signature)
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
        endTimestamp: eventParams.endTimestamp.toString(),
        ticketCollection: eventParams.ticketCollection.toString()
      });

      // Find the event PDA
      const eventPda = await getEventPDA(this.programId, realtimeAsset.publicKey);

      debug("Accounts for transaction", {
        eventPda: eventPda.toString(),
        realtimeAsset: realtimeAsset.publicKey.toString(),
        authority: this.wallet.publicKey.toString()
      });

      // Validate the ticket collection parameter - this is critical
      if (!eventParams.ticketCollection || eventParams.ticketCollection.equals(PublicKey.default)) {
        throw new Error("Invalid ticket collection public key");
      }
      
      // The art category should already be in the correct Borsh-compatible variant format
      // The Rust program expects a variant object like { poetrySlam: {} }, not a numeric value
      const artCategoryVariant = eventParams.artCategory;
      
      debug("Using art category enum variant", {
        variant: artCategoryVariant
      });

      // Send the transaction directly with all parameters as simple types
      try {
        // Create a transaction manually with simple parameter types
        const transaction = new Transaction();
        
        // Get a recent blockhash
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey;
        
        // Create a system program instruction to fund the realtime asset account
        // This is needed so the account can be owned by our program
        const rentExemption = await this.connection.getMinimumBalanceForRentExemption(0);
        
        // Add an instruction to create the realtime asset account
        transaction.add(
          SystemProgram.createAccount({
            fromPubkey: this.wallet.publicKey,
            newAccountPubkey: realtimeAsset.publicKey,
            lamports: rentExemption,
            space: 0,
            programId: this.programId
          })
        );
        
        // Construct parameters exactly as the Solana program's Borsh deserialization expects
        // NOTE: For enums, Borsh expects a numeric value, not a variant object
        // The art_category must be a NUMBER (enum index), not an object

        // For Anchor-based programs, we need to pass the art category as a variant object
        // Anchor expects { variantName: {} } format for enum serialization
        
        // Handle the art category consistently - it should already be a variant object
        // from mapCategoryToVariant, but let's add safeguards
        let artCategoryForAnchor = eventParams.artCategory;
        
        // Validate category format and convert if needed
        if (typeof artCategoryForAnchor === 'number') {
          // If we received a numeric index, convert it to the variant object
          debug("Converting numeric art category to variant object", artCategoryForAnchor);
          
          // Use our helper to convert numbers to variant objects
          const { numberToVariant } = require('./art-category');
          artCategoryForAnchor = numberToVariant(artCategoryForAnchor);
        }
        
        debug("Using category for Anchor instruction", {
          originalFormat: eventParams.artCategory,
          finalFormat: artCategoryForAnchor
        });
        
        // Log timestamp validation for debugging
        debug("Validating event timestamps", {
          beginTimestamp: new Date(eventParams.beginTimestamp * 1000).toISOString(),
          endTimestamp: new Date(eventParams.endTimestamp * 1000).toISOString(),
          durationSeconds: eventParams.endTimestamp - eventParams.beginTimestamp,
          durationMinutes: (eventParams.endTimestamp - eventParams.beginTimestamp) / 60
        });
        
        // Build instruction data with snake_case names and correct types
        const createEventInstructionData = {
          name: eventParams.name,
          uri: eventParams.uri,
          begin_timestamp: new BN(eventParams.beginTimestamp),
          end_timestamp: new BN(eventParams.endTimestamp),
          reserve_price: new BN(eventParams.reservePrice),
          ticket_collection: eventParams.ticketCollection,
          art_category: artCategoryForAnchor // Use Anchor's expected format for the enum
        };
        
        debug("Final instruction data", JSON.stringify(createEventInstructionData, (_, v) => 
          typeof v === 'bigint' ? v.toString() : v, 2));
        
        // Add the create event instruction - use low-level instruction builder
        const createEventIx = await this.program.instruction.createEvent(
          createEventInstructionData,
          {
            accounts: {
              realtimeAsset: realtimeAsset.publicKey,
              authority: this.wallet.publicKey,
              event: eventPda,
              systemProgram: SystemProgram.programId,
              mplCoreProgram: MPL_CORE_PROGRAM
            }
          }
        );
        
        transaction.add(createEventIx);
        
        // Sign the transaction with the realtime asset keypair
        transaction.partialSign(realtimeAsset);
        
        // Get the wallet to sign the transaction
        const signedTransaction = await this.wallet.signTransaction(transaction);
        
        // Send the signed transaction to the network
        const signature = await this.connection.sendRawTransaction(
          signedTransaction.serialize(),
          { skipPreflight: true }
        );
        
        debug("Transaction submitted", signature);
        
        // Wait for confirmation using polling
        const MAX_ATTEMPTS = 20;
        const POLL_INTERVAL = 1000;
        let confirmed = false;
        
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          try {
            const status = await this.connection.getSignatureStatus(signature);
            
            if (status.value !== null) {
              const confirmationStatus = status.value.confirmationStatus;
              debug(`Confirmation status (attempt ${attempt+1}): ${confirmationStatus}`);
              
              if (confirmationStatus === 'confirmed' || confirmationStatus === 'finalized') {
                confirmed = true;
                break;
              }
            }
          } catch (err) {
            debug(`Error checking status (attempt ${attempt+1})`, err);
          }
          
          // Wait before polling again
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        }
        
        if (!confirmed) {
          debug("Transaction not confirmed after maximum attempts");
          throw new Error("Transaction confirmation timeout");
        }
        
        debug("Transaction confirmed");
        return signature;
      } catch (err) {
        debug("Error with transaction creation", err);
        throw err;
      }
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
      const eventPda = await getEventPDA(this.programId, realtimeAssetKey);
      
      // Find the tipping calculator PDA
      const tippingCalculatorPda = await PublicKey.findProgramAddress(
        [
          Buffer.from('tipping_calculator'),
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
          tippingCalculator: tippingCalculatorPda[0],
          signer: this.wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      return tx;
    } catch (error) {
      debug("Error initializing tipping calculator", error);
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
      const eventPda = await getEventPDA(this.programId, realtimeAssetKey);
      
      // Find the tipping calculator PDA
      const [tippingCalculatorPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('tipping_calculator'),
          realtimeAssetKey.toBuffer(),
          this.wallet.publicKey.toBuffer()
        ],
        this.programId
      );
      
      // Make the tip
      const tx = await this.program.methods
        .makeTip({
          amount: new BN(amount),
          realtime_asset_key: realtimeAssetKey
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
      debug("Error making tip", error);
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
      const eventPda = await getEventPDA(this.programId, realtimeAssetKey);
      
      // Claim the asset
      const tx = await this.program.methods
        .claimRealtimeAsset()
        .accounts({
          event: eventPda,
          realtimeAsset: realtimeAssetKey,
          authority: this.wallet.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM
        })
        .rpc();
      
      return tx;
    } catch (error) {
      debug("Error claiming realtime asset", error);
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
      const eventPda = await getEventPDA(this.programId, realtimeAssetKey);
      
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
      debug("Error withdrawing tips", error);
      throw error;
    }
  }
}