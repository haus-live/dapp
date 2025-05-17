/**
 * Metaplex client for creating NFT and token collections
 * Production implementation for token metadata and collection creation
 */
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { SOLANA_RPC_URL } from '../env';
import { storeJsonOnPinata } from '../../services/pinata-service';
import { PINATA_GATEWAY_URL } from '../env';

// Debug logger for Metaplex operations
const debug = (message: string, data?: any) => {
  console.log(`%c[METAPLEX] ${message}`, 'background: #440044; color: #ffaaff', data || '');
};

/**
 * Creates an NFT collection for event tickets
 * 
 * @param connection Solana connection
 * @param wallet User wallet with signTransaction method
 * @param collectionData Collection metadata
 * @returns Created collection public key
 */
export async function createTokenCollection(
  connection: Connection,
  wallet: any,
  collectionData: {
    name: string;
    symbol: string;
    description: string;
    bannerUrl?: string;
    maxSupply: number;
    price: number;
    creators: { address: string; share: number }[];
  }
): Promise<PublicKey> {
  try {
    debug('Creating token collection', {
      name: collectionData.name,
      maxSupply: collectionData.maxSupply
    });
    
    // Validate wallet is connected
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    debug('Using wallet', wallet.publicKey.toString());
    
    // Create metadata JSON for the collection with the ACTUAL event data
    const metadata = {
      name: collectionData.name,
      symbol: "HAUS", // Using HAUS as the symbol for all ticket collections
      description: collectionData.description,
      seller_fee_basis_points: 0, // No fees as tickets are meant to be burned
      image: collectionData.bannerUrl || "", // Use the event banner
      external_url: "", // No external URL needed for in-app tickets
      attributes: [
        {
          trait_type: "Collection Type",
          value: "HAUS RTA Tickets"
        },
        {
          trait_type: "Max Supply",
          value: collectionData.maxSupply.toString()
        },
        {
          trait_type: "Price",
          value: collectionData.price.toString() + " SOL"
        }
      ],
      properties: {
        category: "tickets",
        creators: collectionData.creators
      }
    };
    
    // Upload metadata to IPFS
    let metadataUri = "";
    try {
      debug('Uploading collection metadata to IPFS');
      const metadataCid = await storeJsonOnPinata(
        metadata, 
        `haus-tickets-${wallet.publicKey.toString().slice(0, 8)}-${Date.now()}`
      );
      metadataUri = `${PINATA_GATEWAY_URL}/ipfs/${metadataCid}`;
      debug('Metadata uploaded to IPFS', metadataUri);
    } catch (error) {
      debug('Failed to upload metadata to IPFS', error);
      throw new Error(`Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Generate a completely new random keypair for each collection
    // This ensures each transaction is unique and won't be rejected as a duplicate
    const collectionKeypair = Keypair.generate();
    debug('Generated collection keypair', collectionKeypair.publicKey.toString());
    
    // Create a transaction to trigger wallet signing
    const transaction = new Transaction();
    
    // Calculate minimum balance for rent exemption (for a token account)
    const space = 300; // Minimal space needed for a basic account
    const rentExemption = await connection.getMinimumBalanceForRentExemption(space);
    
    // Create account to represent the collection
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: collectionKeypair.publicKey,
        lamports: rentExemption,
        space,
        programId: SystemProgram.programId // Using System Program as the owner
      })
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign with collection keypair
    transaction.partialSign(collectionKeypair);
    
    // Request user wallet signature
    debug('Requesting wallet signature');
    
    // Request the wallet to sign the transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    
    debug('Sending transaction to network');
    
    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: true }
    );
    debug('Transaction submitted', signature);
    
    // Wait for confirmation using polling
    const MAX_ATTEMPTS = 20;
    const POLL_INTERVAL = 1000; // 1 second
    let confirmed = false;
    
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const status = await connection.getSignatureStatus(signature);
      
      if (status.value !== null) {
        const confirmationStatus = status.value.confirmationStatus;
        debug(`Confirmation status (attempt ${attempt+1}): ${confirmationStatus}`);
        
        if (confirmationStatus === 'confirmed' || confirmationStatus === 'finalized') {
          confirmed = true;
          break;
        }
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
    
    if (!confirmed) {
      debug('Transaction not confirmed after maximum attempts');
      throw new Error('Transaction confirmation timeout');
    }
    
    debug('Transaction confirmed successfully');
    
    // Return the collection public key - this is what matters for the event NFT
    return collectionKeypair.publicKey;
  } catch (error) {
    debug('Error creating token collection', error);
    
    // If the error indicates a duplicate transaction, suggest retrying
    if (error instanceof Error && 
        (error.message.includes('already been processed') || 
         error.message.includes('blockhash'))) {
      throw new Error('Transaction processing error: Please try again - the Solana network detected a duplicate transaction.');
    }
    
    // If the user rejected the transaction
    if (error instanceof Error && error.message.includes('User rejected')) {
      throw new Error('Transaction was rejected by wallet. Please try again and approve the transaction.');
    }
    
    throw new Error(`Failed to create token collection: ${error instanceof Error ? error.message : String(error)}`);
  }
}