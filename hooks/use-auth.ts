"use client"

import { useState, useEffect, useCallback } from "react"
import type { SmartAccountSigner } from "@alchemy/aa-core"
import { createLocalSigner, createSmartAccountProvider, getSmartAccountAddress } from "@/lib/alchemy"
import { CHAIN_ID } from "@/lib/constants"

// Key for storing the private key in localStorage
const PRIVATE_KEY_STORAGE_KEY = "haus_account_key"

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accountAddress, setAccountAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<any>(null)
  const [signer, setSigner] = useState<SmartAccountSigner | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)

        // Check if we have a stored private key
        const storedKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY)

        if (storedKey) {
          // Create a signer from the stored key
          const localSigner = createLocalSigner(storedKey)
          setSigner(localSigner)

          // Create a provider with the signer
          const smartAccountProvider = await createSmartAccountProvider(localSigner)
          setProvider(smartAccountProvider)

          // Get the smart account address
          const address = await getSmartAccountAddress(smartAccountProvider)
          setAccountAddress(address)
          setIsAuthenticated(true)
        }
      } catch (err: any) {
        console.error("Error initializing auth:", err)
        setError(err.message || "Failed to initialize authentication")
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // Login function - creates a new account if one doesn't exist
  const login = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if we already have a stored key
      let storedKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY)

      // If no stored key, create a new one
      if (!storedKey) {
        // Create a random signer
        const localSigner = createLocalSigner()
        // Get the private key from the signer (this is a simplification)
        storedKey = (localSigner as any).privateKey
        // Store the key
        localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, storedKey)
        setSigner(localSigner)
      } else {
        // Use the existing key
        const localSigner = createLocalSigner(storedKey)
        setSigner(localSigner)
      }

      // Create a provider with the signer
      const smartAccountProvider = await createSmartAccountProvider(signer!)
      setProvider(smartAccountProvider)

      // Get the smart account address
      const address = await getSmartAccountAddress(smartAccountProvider)
      setAccountAddress(address)
      setIsAuthenticated(true)
    } catch (err: any) {
      console.error("Error logging in:", err)
      setError(err.message || "Failed to login")
    } finally {
      setIsLoading(false)
    }
  }, [signer])

  // Logout function
  const logout = useCallback(() => {
    // Clear the stored key
    localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY)

    // Reset state
    setIsAuthenticated(false)
    setAccountAddress(null)
    setProvider(null)
    setSigner(null)
  }, [])

  // Format address for display
  const formatAddress = useCallback((address: string | null) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }, [])

  return {
    isLoading,
    isAuthenticated,
    accountAddress,
    provider,
    signer,
    error,
    login,
    logout,
    formatAddress,
    chainId: CHAIN_ID,
  }
}
