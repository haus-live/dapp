"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Connection, PublicKey, clusterApiUrl, Transaction } from '@solana/web3.js'
import { useRouter } from 'next/navigation'

interface PhantomProvider {
  connect: () => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  on: (event: string, callback: (args: any) => void) => void
  isPhantom: boolean
  publicKey: PublicKey | null
  isConnected: boolean
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>
}

interface SolanaWalletContextType {
  wallet: PhantomProvider | null
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  connection: Connection
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array } | null>
  signTransaction: (transaction: Transaction) => Promise<Transaction | null>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[] | null>
}

const SolanaWalletContext = createContext<SolanaWalletContextType | undefined>(undefined)

// Use the env variable if it exists, otherwise fallback to devnet
const RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC || 'https://solana-devnet.g.alchemy.com/v2/hQ3pyvJGx66ieRT9hyuPNA0o2e17yWCK'
const connection = new Connection(RPC_URL)

// Add debugging near the top of the file
const debug = (message: string, data?: any) => {
  console.log(`%c[WALLET] ${message}`, 'background: #222; color: orange', data || '');
};

// Add this to the top of the file right after the imports 
declare global {
  interface Window {
    solana?: PhantomProvider;
    phantom?: {
      solana?: PhantomProvider;
    };
  }
}

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<PhantomProvider | null>(null)
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkForPhantom = async () => {
      debug("Checking for Phantom wallet");
      // Check if Phantom is installed
      if ('phantom' in window) {
        debug("Phantom found in window", window.phantom);
        const provider = window.phantom?.solana;
        
        if (provider?.isPhantom) {
          debug("Valid Phantom provider found", {
            isConnected: provider.isConnected,
            hasPublicKey: !!provider.publicKey
          });
          setWallet(provider as unknown as PhantomProvider);
          
          // Check if already connected
          if (provider.isConnected && provider.publicKey) {
            debug("Already connected", provider.publicKey.toString());
            setPublicKey(provider.publicKey);
            setConnected(true);
          }
          
          // Listen for connection events
          provider.on('connect', (publicKey: PublicKey) => {
            debug("Connect event", publicKey.toString());
            setPublicKey(publicKey);
            setConnected(true);
            setConnecting(false);
          });
          
          // Listen for disconnect events  
          provider.on('disconnect', () => {
            debug("Disconnect event");
            setPublicKey(null);
            setConnected(false);
          });
          
          // Listen for account change events
          provider.on('accountChanged', (publicKey: PublicKey | null) => {
            debug("Account changed event", publicKey?.toString());
            if (publicKey) {
              setPublicKey(publicKey);
              setConnected(true);
            } else {
              // Handle disconnection or account switching where new account hasn't authorized the app
              debug("Trying to reconnect after account change");
              provider.connect().catch(() => {
                debug("Reconnection failed");
                setPublicKey(null);
                setConnected(false);
              });
            }
          });
        } else {
          debug("Provider is not Phantom", provider);
        }
      } else {
        debug("Phantom not found in window");
      }
    };
    
    checkForPhantom();
  }, [])

  const connect = async () => {
    debug("Connect method called");
    
    if (!wallet) {
      debug("No wallet available, redirecting to Phantom website");
      // If Phantom is not installed, redirect to Phantom website
      window.open('https://phantom.app/', '_blank');
      return;
    }
    
    try {
      debug("Setting connecting state");
      setConnecting(true);
      
      // This will trigger the Phantom popup
      debug("Requesting wallet connection");
      const { publicKey } = await wallet.connect();
      debug("Connection successful", publicKey.toString());
      
      setPublicKey(publicKey);
      setConnected(true);
    } catch (error) {
      debug("Connection failed", error);
      console.error('Connection failed:', error);
    } finally {
      setConnecting(false);
    }
  }

  const disconnect = async () => {
    if (!wallet) return
    
    try {
      await wallet.disconnect()
      setPublicKey(null)
      setConnected(false)
    } catch (error) {
      console.error('Disconnection failed:', error)
    }
  }

  const signMessage = async (message: Uint8Array) => {
    if (!wallet || !connected) return null
    
    try {
      const result = await wallet.signMessage(message)
      return result
    } catch (error) {
      console.error('Signing failed:', error)
      return null
    }
  }

  const signTransaction = async (transaction: Transaction) => {
    if (!wallet || !connected) return null
    
    try {
      const signedTransaction = await wallet.signTransaction(transaction)
      return signedTransaction
    } catch (error) {
      console.error('Transaction signing failed:', error)
      return null
    }
  }
  
  const signAllTransactions = async (transactions: Transaction[]) => {
    if (!wallet || !connected) return null
    
    try {
      const signedTransactions = await wallet.signAllTransactions(transactions)
      return signedTransactions
    } catch (error) {
      console.error('Multiple transaction signing failed:', error)
      return null
    }
  }

  return (
    <SolanaWalletContext.Provider
      value={{
        wallet,
        publicKey,
        connected,
        connecting,
        connection,
        connect,
        disconnect,
        signMessage,
        signTransaction,
        signAllTransactions
      }}
    >
      {children}
    </SolanaWalletContext.Provider>
  )
}

export function useSolanaWallet() {
  const context = useContext(SolanaWalletContext)
  if (context === undefined) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider')
  }
  return context
} 