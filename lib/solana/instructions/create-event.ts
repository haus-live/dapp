import { Haus } from "./haus";
import idl from "./haus-idl.json";
import * as anchor from "@coral-xyz/anchor";
import { IdlTypes } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react"
import BN from "bn.js";

const HAUS_PROGRAM_ID = "GZtbVznhmHTqn6PbiSN6PdJNPBboMW5gkCYszq9caNQ1";
const CHUNK_UPLOADER_PUBKEY = "Aiv3M1rtPqMDMYUhbWFTjNWZWLcYqqrKghz9nL8Qq9Ut";  // V2
const SOLANA_PUBLIC_RPC = "https://solana-devnet.g.alchemy.com/v2/hQ3pyvJGx66ieRT9hyuPNA0o2e17yWCK"; // "https://api.devnet.solana.com"

export async function createEventDirectlyAdapter(connection: Connection, wallet: any, realtimeAsset: Keypair, eventParams: any): Promise<string> {
    return createEvent(
        connection,
        wallet as WalletContextState,
        realtimeAsset,
        {
            name: eventParams.name as string,
            uri: eventParams.uri as string,
            beginTimestamp: eventParams.beginTimestamp as number,
            endTimestamp: eventParams.endTimestamp as number,
            reservePrice: eventParams.reservePrice as number,
            ticketColletion: eventParams.ticketCollection as string,
            artCategory: 0, // fixme
        }
    );
}

async function createEvent(connection: Connection, wallet: WalletContextState, realtimeAsset: Keypair, args: {
    name: string,
    uri: string,
    beginTimestamp: number,
    endTimestamp: number,
    reservePrice: number,
    ticketColletion: String,
    artCategory: number,
}): Promise<string> {
    // const connection = new Connection(SOLANA_PUBLIC_RPC, 'confirmed');
    
    const provider = new anchor.AnchorProvider(
        connection,
        {
            publicKey: wallet.publicKey!,
            signTransaction: wallet.signTransaction!,
            signAllTransactions: wallet.signAllTransactions!,
        },
        { commitment: "confirmed" },
    )
    
    const hausProgram = new anchor.Program<Haus>(idl as Haus, provider);  // maybe add provider options
    type ArtCategoryEnum = IdlTypes<Haus>['artCategory'];

    const artCategoryChoices = [
        { standupComedy: {} },
        { performanceArt: {} },
        { poetrySlam: {} },
        { openMicImprov: {} },
        { livePainting: {} },
        { creatingWorkshop: {} }
    ];
    const artCategory: ArtCategoryEnum = artCategoryChoices.at(args.artCategory) as ArtCategoryEnum;
    
    // const realtimeAsset = new Keypair();

    const createEventArgs = {
      name: args.name,
      uri: args.uri,
      beginTimestamp: new BN(args.beginTimestamp),
      endTimestamp: new BN(args.endTimestamp),
      reservePrice: new BN(args.reservePrice),
      ticketCollection: provider.wallet.publicKey,
      artCategory: artCategory,
      chunkUploader: new anchor.web3.PublicKey(CHUNK_UPLOADER_PUBKEY),
    };

    let eventSeeds = [
      Buffer.from(anchor.utils.bytes.utf8.encode("event")),
      realtimeAsset.publicKey.toBuffer(),
    ];
    const [eventPubkey, _] = anchor.web3.PublicKey.findProgramAddressSync(
      eventSeeds,
      hausProgram.programId
    );

    try {
        const tx = await hausProgram.methods
            .createEvent(createEventArgs)
            .accountsPartial({
                realtimeAsset: realtimeAsset.publicKey,
                authority: provider.wallet.publicKey,
                event: eventPubkey
            })
            // .signers([realtimeAsset])
            .transaction();
        
        tx.feePayer = provider.wallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        tx.sign(realtimeAsset);
        const signedTx = await provider.wallet.signTransaction(tx);
        const txId = await connection.sendRawTransaction(signedTx.serialize({ requireAllSignatures: false }));
        await provider.connection.confirmTransaction(txId, 'confirmed');
        return txId;
    } catch (e) {
        console.error(e);
        return 'fail';
    }
}
