"use client"

import { useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HausLogo } from "@/components/logo"
import { Loader2, Check } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  redirectPath?: string // Add this parameter
}

type LoginStep = "initial" | "connecting" | "detecting-ens" | "name-selection" | "profile-setup" | "social-login"

export function LoginModal({ isOpen, onClose, redirectPath }: LoginModalProps) {
  const { connect, updateProfile } = useAuth()
  const router = useRouter() // Add router
  const [activeTab, setActiveTab] = useState("web3")
  const [step, setStep] = useState<LoginStep>("initial")
  const [loadingMessage, setLoadingMessage] = useState("")
  const [selectedWallet, setSelectedWallet] = useState("")
  const [nameChoice, setNameChoice] = useState<"detected" | "custom">("detected")
  const [customName, setCustomName] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [bio, setBio] = useState("")

  const handleWeb3Login = async (walletType: string) => {
    setSelectedWallet(walletType)
    setStep("connecting")
    setLoadingMessage(`Connecting to ${walletType}...`)

    // Simulate connection delay
    setTimeout(() => {
      setStep("detecting-ens")
      setLoadingMessage("Detecting ENS or Lens profile...")

      // Simulate ENS detection
      setTimeout(() => {
        setStep("name-selection")
      }, 2000)
    }, 2000)
  }

  const handleSocialLogin = (provider: string) => {
    setStep("social-login")
    setLoadingMessage(`Connecting to ${provider}...`)

    // Simulate connection delay
    setTimeout(() => {
      setLoadingMessage("Creating your decentralized identity...")
      setTimeout(() => {
        setLoadingMessage("Generating smart account...")
        setTimeout(() => {
          setLoadingMessage("Setting up gasless transactions...")
          setTimeout(() => {
            setStep("name-selection")
          }, 1500)
        }, 1500)
      }, 2000)
    }, 1500)
  }

  const handleNameSelection = () => {
    if (nameChoice === "custom" && !customName.trim()) {
      return // Don't proceed if custom name is empty
    }

    // Update profile with selected name
    updateProfile({
      ensName: nameChoice === "detected" ? "jabyl.eth" : customName,
    })

    setStep("profile-setup")
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : prev.length < 3 ? [...prev, category] : prev,
    )
  }

  const handleCompleteSetup = async () => {
    // Update profile with bio and categories
    updateProfile({
      bio: bio || null,
      favoriteCategories: selectedCategories,
      isProfileComplete: true,
    })

    // Connect the wallet
    await connect(selectedWallet)

    // Close the modal
    onClose()

    // Redirect to the specified path if provided
    if (redirectPath) {
      router.push(redirectPath)
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
                Connect with your preferred method to access the platform
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="web3" className="bauhaus-text">
                  WEB3 WALLET
                </TabsTrigger>
                <TabsTrigger value="social" className="bauhaus-text">
                  SOCIAL LOGIN
                </TabsTrigger>
              </TabsList>

              <TabsContent value="web3" className="mt-4 space-y-4">
                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center h-14 px-4"
                  onClick={() => handleWeb3Login("Phantom")}
                >
                  <span className="font-medium">Phantom Wallet</span>
                  <Image src="/placeholder.svg?height=32&width=32" alt="Phantom" width={32} height={32} />
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center h-14 px-4"
                  onClick={() => handleWeb3Login("Alchemy")}
                >
                  <span className="font-medium">Alchemy Wallet</span>
                  <Image src="/placeholder.svg?height=32&width=32" alt="Alchemy" width={32} height={32} />
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center h-14 px-4"
                  onClick={() => handleWeb3Login("MetaMask")}
                >
                  <span className="font-medium">MetaMask</span>
                  <Image src="/placeholder.svg?height=32&width=32" alt="MetaMask" width={32} height={32} />
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Connect with your existing web3 wallet to access all features
                </p>
              </TabsContent>

              <TabsContent value="social" className="mt-4 space-y-4">
                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center h-14 px-4"
                  onClick={() => handleSocialLogin("Google")}
                >
                  <span className="font-medium">Continue with Google</span>
                  <Image src="/placeholder.svg?height=32&width=32" alt="Google" width={32} height={32} />
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center h-14 px-4"
                  onClick={() => handleSocialLogin("GitHub")}
                >
                  <span className="font-medium">Continue with GitHub</span>
                  <Image src="/placeholder.svg?height=32&width=32" alt="GitHub" width={32} height={32} />
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center h-14 px-4"
                  onClick={() => handleSocialLogin("X")}
                >
                  <span className="font-medium">Continue with X</span>
                  <Image src="/placeholder.svg?height=32&width=32" alt="X" width={32} height={32} />
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center h-14 px-4"
                  onClick={() => handleSocialLogin("Instagram")}
                >
                  <span className="font-medium">Continue with Instagram</span>
                  <Image src="/placeholder.svg?height=32&width=32" alt="Instagram" width={32} height={32} />
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  We'll create a decentralized identity for you behind the scenes
                </p>
              </TabsContent>
            </Tabs>

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
      case "detecting-ens":
      case "social-login":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold mb-2">{loadingMessage}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {step === "social-login"
                ? "We're setting up your account with account abstraction for a seamless web3 experience."
                : "Please wait while we connect to your wallet and retrieve your information."}
            </p>
          </div>
        )

      case "name-selection":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Choose Your Identity</DialogTitle>
              <DialogDescription>
                We detected an ENS name associated with your wallet. Would you like to use it or create a custom handle?
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/21c09ec3-fb44-40b5-9ffc-6fedc032fe3b-I36E2znZKmldANSRQFL5kgjSSjYRka.jpeg"
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <RadioGroup value={nameChoice} onValueChange={(value) => setNameChoice(value as "detected" | "custom")}>
                <div className="flex items-start space-x-2 p-4 rounded-lg border">
                  <RadioGroupItem value="detected" id="detected" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="detected" className="font-medium text-lg">
                      jabyl.eth
                    </Label>
                    <p className="text-sm text-muted-foreground">Use the ENS name we detected from your wallet</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-4 rounded-lg border mt-2">
                  <RadioGroupItem value="custom" id="custom" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="custom" className="font-medium text-lg">
                      Custom Handle
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">Create your own unique handle</p>
                    <Input
                      placeholder="Enter your custom handle"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      disabled={nameChoice !== "custom"}
                    />
                  </div>
                </div>
              </RadioGroup>

              <p className="text-sm text-amber-600">Please note: You won't be able to change your handle later.</p>
            </div>

            <DialogFooter>
              <Button onClick={handleNameSelection} disabled={nameChoice === "custom" && !customName.trim()}>
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
              <Button onClick={handleCompleteSetup}>Complete Setup</Button>
            </DialogFooter>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">{renderContent()}</DialogContent>
    </Dialog>
  )
}
