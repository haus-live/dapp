"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { HausLogo } from "@/components/logo"
import { Loader2, Check, Upload, UserCircle2, AtSign, Hash } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { uploadFileToPinata } from "@/services/pinata-service"
import { ProfileUpdateData } from "@/contexts/auth-context"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  redirectPath?: string
}

type LoginStep = "initial" | "connecting" | "profile-setup" | "name-selection" | "web3-socials"

export function LoginModal({ isOpen, onClose, redirectPath }: LoginModalProps) {
  const { connect, saveProfile, isNewUser, isConnected, isLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>("initial")
  const [loadingMessage, setLoadingMessage] = useState("")
  const [username, setUsername] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [bio, setBio] = useState("")
  const [uploading, setUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarCid, setAvatarCid] = useState<string | null>(null)
  const [web3Socials, setWeb3Socials] = useState({
    ens: "",
    lens: "",
    farcaster: "",
    twitter: "",
    telegram: ""
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep("initial")
      setLoadingMessage("")
      setUploading(false)
    }
  }, [isOpen])
  
  // Handle automatic profile setup for new users
  useEffect(() => {
    if (isOpen && isConnected && isNewUser && step === "initial") {
      setStep("name-selection")
    }
  }, [isOpen, isConnected, isNewUser, step])
  
  // Handle completed connection
  useEffect(() => {
    if (step === "connecting" && isConnected) {
      if (isNewUser) {
        setStep("name-selection")
      } else if (redirectPath) {
        router.push(redirectPath)
        onClose()
      } else {
        onClose()
      }
    }
  }, [isConnected, isNewUser, step, redirectPath, router, onClose])

  const handlePhantomLogin = async () => {
    setStep("connecting")
    setLoadingMessage("Connecting to Phantom...")

    try {
      const success = await connect()
      if (!success) {
        setStep("initial")
      }
      // The connected state & redirect will be handled by the useEffect
    } catch (error) {
      console.error("Connection error:", error)
      setStep("initial")
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB')
      return
    }

    try {
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to IPFS
      setUploading(true)
      setLoadingMessage("Uploading avatar to IPFS...")
      
      const cid = await uploadFileToPinata(file, `user-avatar-${Date.now()}`)
      setAvatarCid(cid)
      
      setUploading(false)
    } catch (error) {
      console.error("Avatar upload failed:", error)
      setUploading(false)
      alert('Failed to upload avatar. Please try again.')
    }
  }

  const handleNameSelection = () => {
    if (!username.trim()) {
      return // Don't proceed if username is empty
    }

    setStep("web3-socials")
  }
  
  const handleWeb3SocialsComplete = () => {
    setStep("profile-setup")
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : prev.length < 3 ? [...prev, category] : prev,
    )
  }

  const handleCompleteSetup = async () => {
    try {
      setLoadingMessage("Saving profile to IPFS...")
      setUploading(true)
      
      // Filter out empty social values
      const filteredSocials = {
        ens: web3Socials.ens.trim() || null,
        lens: web3Socials.lens.trim() || null,
        farcaster: web3Socials.farcaster.trim() || null,
        twitter: web3Socials.twitter.trim() || null,
        telegram: web3Socials.telegram.trim() || null
      }
      
      // Save profile to IPFS
      const profileData: ProfileUpdateData = {
        username,
        avatarCid,
        categories: selectedCategories,
        bio: bio || null,
        web3Socials: filteredSocials
      }
      
      await saveProfile(profileData)
      
      setUploading(false)
      
      // Close the modal
      onClose()

      // Redirect to the specified path if provided
      if (redirectPath) {
        router.push(redirectPath)
      }
    } catch (error) {
      console.error("Failed to save profile:", error)
      setUploading(false)
      alert('Failed to save profile. Please try again.')
    }
  }

  const renderContent = () => {
    switch (step) {
      case "initial":
        return (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <HausLogo className="w-12 h-6 mr-2" />
                <DialogTitle className="text-2xl bauhaus-text">WELCOME TO HAUS</DialogTitle>
              </div>
              <DialogDescription className="text-center">
                Connect your Solana wallet to access the platform
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center h-14 px-4"
                onClick={handlePhantomLogin}
                disabled={isLoading}
              >
                <span className="font-medium">Phantom</span>
                <Image src="/phantom-icon.svg" alt="Phantom" width={32} height={32} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg?height=32&width=32"; 
                  }}
                />
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Connect your Phantom wallet to access all features on Solana Devnet
              </p>
            </div>

            <div className="mt-4 text-xs text-center text-muted-foreground">
              By connecting, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </div>
          </>
        )

      case "connecting":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold mb-2">{loadingMessage}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Please approve the connection request in your Phantom wallet.
            </p>
          </div>
        )

      case "name-selection":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Choose Your Identity</DialogTitle>
              <DialogDescription>
                Choose a username and avatar to identify yourself on the platform.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <div
                  className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary cursor-pointer group"
                  onClick={handleAvatarClick}
                >
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <UserCircle2 className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-muted-foreground mt-2">Click to upload avatar</p>
                {uploading && (
                  <div className="flex items-center mt-2">
                    <Loader2 className="h-4 w-4 text-primary animate-spin mr-2" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
                {avatarCid && (
                  <p className="text-xs text-green-600 mt-1">Avatar uploaded successfully!</p>
                )}
              </div>

              {/* Username Input */}
              <div>
                <Label htmlFor="username" className="font-medium text-lg">
                  Username
                </Label>
                <p className="text-sm text-muted-foreground mb-2">Create your unique username</p>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <p className="text-sm text-amber-600">Please note: You won't be able to change your username later.</p>
            </div>

            <DialogFooter>
              <Button 
                onClick={handleNameSelection} 
                disabled={!username.trim() || uploading}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )
        
      case "web3-socials":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Your Web3 Socials</DialogTitle>
              <DialogDescription>
                Link your decentralized identities (optional)
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ens" className="font-medium">ENS</Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="ens"
                      placeholder="yourname.eth"
                      value={web3Socials.ens}
                      onChange={(e) => setWeb3Socials({...web3Socials, ens: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="lens" className="font-medium">Lens</Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="lens"
                      placeholder="yourname.lens"
                      value={web3Socials.lens}
                      onChange={(e) => setWeb3Socials({...web3Socials, lens: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="farcaster" className="font-medium">Farcaster</Label>
                  <div className="flex items-center mt-1">
                    <AtSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Input
                      id="farcaster"
                      placeholder="username"
                      value={web3Socials.farcaster}
                      onChange={(e) => setWeb3Socials({...web3Socials, farcaster: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="twitter" className="font-medium">X / Twitter</Label>
                  <div className="flex items-center mt-1">
                    <AtSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Input
                      id="twitter"
                      placeholder="username"
                      value={web3Socials.twitter}
                      onChange={(e) => setWeb3Socials({...web3Socials, twitter: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="telegram" className="font-medium">Telegram</Label>
                  <div className="flex items-center mt-1">
                    <AtSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Input
                      id="telegram"
                      placeholder="username"
                      value={web3Socials.telegram}
                      onChange={(e) => setWeb3Socials({...web3Socials, telegram: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleWeb3SocialsComplete}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )

      case "profile-setup":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Profile</DialogTitle>
              <DialogDescription>Add a few more details to personalize your experience</DialogDescription>
            </DialogHeader>

            {uploading && (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-bold mb-2">{loadingMessage}</h3>
              </div>
            )}

            <div className="py-6 space-y-6">
              <div>
                <Label htmlFor="bio" className="text-base font-medium mb-2 block">
                  Add Bio (Optional)
                </Label>
                <div className="relative">
                  <textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    className="w-full min-h-24 p-3 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-auto py-1 px-2 text-xs"
                    onClick={() => document.getElementById("bio")?.focus()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">Pick Your Favorites (Up to 3)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "standup-comedy",
                    "performance-art",
                    "poetry-slam",
                    "open-mic",
                    "live-painting",
                    "creative-workshop",
                  ].map((category) => (
                    <div
                      key={category}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center ${
                        selectedCategories.includes(category) ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {selectedCategories.includes(category) && <Check className="h-4 w-4 text-primary mr-2" />}
                      <span className="capitalize">{category.replace(/-/g, " ")}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{selectedCategories.length}/3 categories selected</p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={handleCompleteSetup} 
                disabled={selectedCategories.length === 0 || uploading}
              >
                Complete Setup
              </Button>
            </DialogFooter>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !uploading && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">{renderContent()}</DialogContent>
    </Dialog>
  )
}
