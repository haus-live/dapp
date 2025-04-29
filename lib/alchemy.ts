import { Alchemy, Network } from "alchemy-sdk"
import { createAlchemyProvider } from "@alchemy/aa-alchemy"
import { LightSmartContractAccount, getDefaultLightAccountFactoryAddress } from "@alchemy/aa-accounts"
import { LocalAccountSigner, type SmartAccountSigner } from "@alchemy/aa-core"
import { ethers } from "ethers"
import { ALCHEMY_API_KEY, GAS_MANAGER_POLICY_ID, POLYGON_AMOY_RPC } from "./constants"

// Define the Polygon Amoy chain configuration
const polygonAmoy = {
  id: 80001,
  name: "Polygon Amoy",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [POLYGON_AMOY_RPC],
    },
    public: {
      http: [POLYGON_AMOY_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: "Polygon Amoy Explorer",
      url: "https://www.oklink.com/amoy",
    },
  },
  testnet: true,
}

// Initialize Alchemy SDK
export const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.MATIC_AMOY,
})

// Create a provider for read-only operations
export const provider = new ethers.providers.JsonRpcProvider(POLYGON_AMOY_RPC)

// Helper function to create a local account signer
export const createLocalSigner = (privateKey?: string): SmartAccountSigner => {
  // If no private key is provided, generate a random one
  const signerKey = privateKey || ethers.Wallet.createRandom().privateKey
  return LocalAccountSigner.privateKeyToAccountSigner(signerKey)
}

// Create a smart account provider with gas management
export const createSmartAccountProvider = async (signer: SmartAccountSigner) => {
  // Create a provider for the smart account
  const provider = await createAlchemyProvider({
    apiKey: ALCHEMY_API_KEY,
    chain: polygonAmoy,
    entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // Entry point for ERC-4337
  }).connect(
    (rpcClient) =>
      new LightSmartContractAccount({
        rpcClient,
        owner: signer,
        chain: polygonAmoy,
        factoryAddress: getDefaultLightAccountFactoryAddress(polygonAmoy),
      }),
  )

  // Enable gas management for gasless transactions
  if (GAS_MANAGER_POLICY_ID) {
    provider.withAlchemyGasManager({
      policyId: GAS_MANAGER_POLICY_ID,
      entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    })
  }

  return provider
}

// Helper to get the smart account address
export const getSmartAccountAddress = async (provider: any): Promise<string> => {
  return await provider.getAddress()
}

// Helper to check if a transaction is mined
export const waitForTransaction = async (txHash: string): Promise<ethers.providers.TransactionReceipt> => {
  return await provider.waitForTransaction(txHash)
}

// Helper to format date to Unix timestamp
export const dateToUnixTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000)
}

// Helper to convert Unix timestamp to Date
export const unixTimestampToDate = (timestamp: number): Date => {
  return new Date(timestamp * 1000)
}

// Helper to upload metadata to IPFS (mock implementation)
export const uploadMetadataToIPFS = async (metadata: any): Promise<string> => {
  // In a real implementation, this would upload to IPFS using Pinata
  console.log("Uploading metadata to IPFS:", metadata)
  return `bafybeihvjwa5r2rjzuuqrxs2twjjpfhqzgvgzjjir6giiaaaaaaaaaaa`
}

// Create a contract instance
export const getContract = (address: string, abi: any, signerOrProvider: any) => {
  return new ethers.Contract(address, abi, signerOrProvider)
}
