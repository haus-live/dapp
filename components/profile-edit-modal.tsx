"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Check, Upload, UserCircle2, AtSign } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { Label } from "@/components/ui/label"
import { uploadFileToPinata } from "@/services/pinata-service"
import { UserProfile } from "@/lib/types"
import { ProfileUpdateData } from "@/contexts/auth-context"

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { userProfile, saveProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("basic")
  const [bio, setBio] = useState("")
  const [uploading, setUploading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarCid, setAvatarCid] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [web3Socials, setWeb3Socials] = useState({
    ens: "",
    lens: "",
    farcaster: "",
    twitter: "",
    telegram: ""
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Initialize form with user profile data
  useEffect(() => {
    if (userProfile) {
      setBio(userProfile.bio || "")
      setAvatarCid(userProfile.avatarCid)
      setAvatarPreview(userProfile.avatar)
      setSelectedCategories(userProfile.favoriteCategories)
      setWeb3Socials({
        ens: userProfile.web3Socials.ens || "",
        lens: userProfile.web3Socials.lens || "",
        farcaster: userProfile.web3Socials.farcaster || "",
        twitter: userProfile.web3Socials.twitter || "",
        telegram: userProfile.web3Socials.telegram || ""
      })
    }
  }, [userProfile, isOpen])

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

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : prev.length < 3 ? [...prev, category] : prev,
    )
  }

  const handleSaveProfile = async () => {
    if (!userProfile) return
    
    try {
      setUploading(true)
      setLoadingMessage("Saving profile changes...")
      
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
        username: userProfile.username, // Username cannot be changed
        avatarCid,
        categories: selectedCategories,
        bio: bio || null,
        web3Socials: filteredSocials
      }
      
      await saveProfile(profileData)
      
      setUploading(false)
      onClose()
    } catch (error) {
      console.error("Failed to save profile:", error)
      setUploading(false)
      alert('Failed to save profile. Please try again.')
    }
  }
  
  if (!userProfile) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !uploading && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and preferences
          </DialogDescription>
        </DialogHeader>
        
        {uploading && (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold mb-2">{loadingMessage}</h3>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="socials">Web3 Socials</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6 py-4">
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
              <p className="text-sm text-muted-foreground mt-2">Click to change avatar</p>
            </div>
            
            {/* Username (readonly) */}
            <div>
              <Label htmlFor="username" className="font-medium text-lg">
                Username
              </Label>
              <p className="text-sm text-muted-foreground mb-2">Your unique identifier</p>
              <Input
                id="username"
                value={userProfile.username}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
            </div>
            
            {/* Bio */}
            <div>
              <Label htmlFor="bio" className="text-base font-medium mb-2 block">
                Bio
              </Label>
              <div className="relative">
                <textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  className="w-full min-h-24 p-3 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
            
            {/* Categories */}
            <div>
              <Label className="text-base font-medium mb-2 block">Your Favorites (Up to 3)</Label>
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
          </TabsContent>
          
          <TabsContent value="socials" className="space-y-6 py-4">
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
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={handleSaveProfile} disabled={uploading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 