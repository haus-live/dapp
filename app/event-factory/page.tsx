"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArtCategoryIcon } from "@/components/art-category-icons"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { X, CalendarIcon, Clock, Plus } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { QuickAccess } from "@/components/quick-access"
import { useAuth } from "@/contexts/auth-context"
import { useEvents } from "@/contexts/events-context"
import { v4 as uuidv4 } from "uuid"
import { mintEvent } from "@/lib/solana/event-minter"
import { useSolanaWallet } from "@/contexts/solana-wallet-context"
import { toast } from "@/components/ui/use-toast"
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"

type Step = "category" | "details" | "format" | "sales" | "mint"
type Category =
  | "standup-comedy"
  | "performance-art"
  | "poetry-slam"
  | "open-mic"
  | "live-painting"
  | "creative-workshop"
type SaleType = "cumulative-tips" | "blind-auction" | "quadratic-tipping"
type Duration = 15 | 30 | 60

export default function EventFactory() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const { addEvent } = useEvents()
  const { publicKey, signTransaction, signAllTransactions, connected } = useSolanaWallet()

  const [step, setStep] = useState<Step>("details")
  const [formData, setFormData] = useState({
    category: "" as Category,
    title: "",
    description: "",
    banner: null as File | null,
    date: null as Date | null,
    time: "19:00",
    duration: 30 as Duration,
    saleType: "cumulative-tips" as SaleType,
    reservePrice: 30 / 500, // Default based on duration/500
    useCustomReservePrice: false,
    ticketsAmount: 100,
    ticketPrice: 30 / 500, // Default based on duration/500
    useCustomTicketPrice: false,
    noCap: false,
  })
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  // Update default prices when duration changes
  useEffect(() => {
    const defaultPrice = formData.duration / 500

    if (!formData.useCustomReservePrice) {
      setFormData((prev) => ({ ...prev, reservePrice: defaultPrice }))
    }

    if (!formData.useCustomTicketPrice) {
      setFormData((prev) => ({ ...prev, ticketPrice: defaultPrice }))
    }
  }, [formData.duration, formData.useCustomReservePrice, formData.useCustomTicketPrice])

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData((prev) => ({ ...prev, banner: file }))

      // Create a preview URL for the image
      const url = URL.createObjectURL(file)
      setBannerPreviewUrl(url)
    }
  }

  // Add this debugging function at the top after the state declarations
  const debug = (message: string, data?: any) => {
    console.log(`%c[DEBUG] ${message}`, 'background: #333; color: lime', data || '');
  };

  // Enhanced handleMintEvent function with improved wallet handling
  const handleMintEvent = async () => {
    debug("Mint button clicked");

    // Check for window.solana and window.phantom (Phantom wallet global)
    if (typeof window === 'undefined') {
      debug("Not running in browser context");
      return;
    }
    
    debug("Environment check:", {
      hasPhantom: !!window.phantom?.solana,
      hasWindowSolana: !!window.solana,
      isPhantomConnected: window.phantom?.solana?.isConnected
    });
      
    if (!window.phantom?.solana) {
      debug("Phantom not found in window");
      toast({
        title: "Phantom wallet not detected",
        description: "Please install Phantom wallet extension and refresh",
        variant: "destructive"
      });
      return;
    }
    
    // Check wallet connection status
    debug("Connection status:", { 
      userProfile: !!userProfile, 
      publicKey: !!publicKey, 
      signTransaction: !!signTransaction, 
      signAllTransactions: !!signAllTransactions,
      phantomConnected: window.phantom?.solana?.isConnected
    });

    // If not connected, try direct connection
    if (!publicKey || !window.phantom.solana.isConnected) {
      debug("No connected wallet found, attempting direct connection");
      
      try {
        const resp = await window.phantom.solana.connect();
        debug("Direct connection successful", resp.publicKey.toString());
        
        // We'll need to refresh the page to update context state
        toast({
          title: "Wallet connected",
          description: "Your wallet is now connected. Please try minting again.",
          variant: "default"
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      } catch (error) {
        debug("Direct wallet connection failed", error);
        toast({
          title: "Wallet connection failed",
          description: "Please try connecting your wallet manually first",
          variant: "destructive"
        });
        return;
      }
    }

    // Validate form data
    if (!formData.category || !formData.title || !formData.date) {
      debug("Form data incomplete");
      toast({
        title: "Incomplete form data",
        description: "Please fill in all required fields before minting",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      debug("Creating wallet adapter for Anchor");
      
      // For consistent behavior, prefer the window.phantom.solana methods
      // which are directly tied to the Phantom extension
      const phantomSolana = window.phantom.solana;
      
      // Create wallet adapter with the most reliable signing methods
      const wallet = {
        publicKey: new PublicKey(phantomSolana.publicKey?.toString() || publicKey?.toString() || ''),
        signTransaction: async (transaction: Transaction) => {
          debug("Signing transaction...");
          const signedTx = await phantomSolana.signTransaction(transaction);
          debug("Transaction signed successfully");
          return signedTx;
        },
        signAllTransactions: async (transactions: Transaction[]) => {
          debug("Signing multiple transactions...");
          const signedTxs = await phantomSolana.signAllTransactions(transactions);
          debug("All transactions signed successfully");
          return signedTxs;
        }
      };
      
      // Extra validation to ensure we have signing methods
      if (!wallet.publicKey) {
        debug("No public key available");
        throw new Error("No wallet public key available. Please reconnect your wallet.");
      }
      
      debug("Starting event minting process with wallet:", wallet.publicKey.toString());
      
      // Mint the event on Solana
      const { event, signature } = await mintEvent(
        formData, 
        wallet,
        userProfile?.username || 'Anonymous' // Add fallback in case userProfile is null
      );
      
      debug("Minting successful", { eventId: event.id, signature });
      
      // Store transaction signature
      setTxSignature(signature);
      
      // Add the event to global state
      await addEvent(event);
      
      // Show success message
      toast({
        title: "Event created successfully!",
        description: "Your event has been minted on Solana Devnet",
        variant: "default"
      });
      
      // Redirect to the event market with a delay to allow toast to be visible
      setTimeout(() => {
        router.push("/event-market");
      }, 2000);
    } catch (error) {
      debug("Error minting event", error);
      toast({
        title: "Error creating event",
        description: error instanceof Error ? error.message : "Failed to mint your event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a direct connect helper function
  const connectWalletDirectly = async () => {
    debug("Connecting wallet directly");
    try {
      if (window.phantom?.solana) {
        debug("Phantom wallet found, connecting...");
        const resp = await window.phantom.solana.connect();
        debug("Direct connection successful", resp.publicKey.toString());
        toast({
          title: "Wallet connected",
          description: "Your wallet is now connected. Try minting again.",
          variant: "default"
        });
        // Reload page to ensure wallet state is updated properly
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        debug("Phantom wallet not found");
        toast({
          title: "Wallet not found",
          description: "Please install Phantom wallet and refresh the page.",
          variant: "destructive"
        });
      }
    } catch (error) {
      debug("Direct connection error", error);
      toast({
        title: "Connection failed",
        description: "Could not connect to wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Add this test function that bypasses our complex integration and directly tests Phantom
  const testWalletDirectly = async () => {
    debug("Testing wallet directly with simple transaction");
    
    try {
      if (!window.phantom?.solana) {
        debug("Phantom not detected");
        toast({
          title: "Phantom not detected",
          description: "Please install Phantom wallet extension",
          variant: "destructive"
        });
        return;
      }
      
      // First make sure we're connected
      if (!window.phantom.solana.isConnected) {
        debug("Connecting to Phantom directly");
        await window.phantom.solana.connect();
      }
      
      const phantomWallet = window.phantom.solana;
      debug("Phantom wallet state", {
        isConnected: phantomWallet.isConnected,
        publicKey: phantomWallet.publicKey?.toString(),
        isPhantom: phantomWallet.isPhantom,
        hasSignTransaction: !!phantomWallet.signTransaction
      });
      
      // Create a simple test transaction (very small SOL transfer to self)
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      
      if (!phantomWallet.publicKey) {
        throw new Error("No public key available");
      }
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: phantomWallet.publicKey,
          toPubkey: phantomWallet.publicKey,
          lamports: 100, // Very small amount
        })
      );
      
      // Get a recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = phantomWallet.publicKey;
      
      debug("Transaction created, requesting signature");
      
      // Sign the transaction
      const signedTransaction = await phantomWallet.signTransaction(transaction);
      debug("Transaction signed successfully", signedTransaction);
      
      // This toast indicates success - if you see this, wallet interaction works
      toast({
        title: "Wallet interaction successful!",
        description: "Phantom wallet responded correctly to signature request",
        variant: "default"
      });
      
    } catch (error) {
      debug("Direct wallet test failed", error);
      toast({
        title: "Wallet test failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleNext = () => {
    console.log("Next button clicked, current step:", step);
    
    if (step === "details") {
      if (!formData.title) {
        toast({
          title: "Title required",
          description: "Please enter a title for your event",
          variant: "destructive"
        });
        return;
      }
      setStep("category");
    }
    else if (step === "category") {
      if (!formData.category) {
        toast({
          title: "Category required",
          description: "Please select a category for your event",
          variant: "destructive"
        });
        return;
      }
      setStep("format");
    }
    else if (step === "format") {
      if (!formData.date) {
        toast({
          title: "Date required",
          description: "Please select a date for your event",
          variant: "destructive"
        });
        return;
      }
      setStep("sales");
    }
    else if (step === "sales") setStep("mint");
    else if (step === "mint") {
      console.log("Calling handleMintEvent from Next button");
      handleMintEvent();
    }
  }

  const handleBack = () => {
    if (step === "category") setStep("details")
    else if (step === "format") setStep("category")
    else if (step === "sales") setStep("format")
    else if (step === "mint") setStep("sales")
  }

  const toggleCustomReservePrice = (checked: boolean) => {
    updateFormData({
      useCustomReservePrice: checked,
      reservePrice: checked ? formData.reservePrice : formData.duration / 500,
    })
  }

  const toggleCustomTicketPrice = (checked: boolean) => {
    updateFormData({
      useCustomTicketPrice: checked,
      ticketPrice: checked ? formData.ticketPrice : formData.duration / 500,
    })
  }

  const renderStepContent = () => {
    switch (step) {
      case "category":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-8">Choose a Category</h2>
            <div className="grid grid-cols-2 gap-6">
              {[
                { id: "standup-comedy", label: "Standup Comedy" },
                { id: "performance-art", label: "Performance Art" },
                { id: "poetry-slam", label: "Poetry Slam" },
                { id: "open-mic", label: "Open Mic/Improv" },
                { id: "live-painting", label: "Live Painting" },
                { id: "creative-workshop", label: "Creative Workshop" },
              ].map((category) => (
                <div
                  key={category.id}
                  className={`border rounded-lg p-6 cursor-pointer transition-all flex flex-col items-center justify-center ${
                    formData.category === category.id ? "border-primary" : "hover:border-muted-foreground"
                  }`}
                  onClick={() => updateFormData({ category: category.id as Category })}
                >
                  <ArtCategoryIcon category={category.id as any} size="lg" className="mb-4 text-foreground" />
                  <span className="text-lg">{category.label}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case "details":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-8">Your Event</h2>
            <div className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Event title..."
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  className="border"
                />
                <div className="text-right text-xs text-muted-foreground">{formData.title.length}/50 characters</div>
              </div>

              <div className="space-y-2">
                <Label>Banner Image</Label>
                <div className="border rounded-lg p-4 h-40 flex flex-col items-center justify-center">
                  {formData.banner ? (
                    <div className="relative w-full h-full">
                      <img
                        src={bannerPreviewUrl || "/placeholder.svg"}
                        alt="Event banner"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          updateFormData({ banner: null })
                          setBannerPreviewUrl("")
                        }}
                        className="absolute top-2 right-2 bg-background/80 p-1 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2">
                        <Plus className="h-8 w-8" />
                      </div>
                      <p className="text-center text-sm mb-2">Add Event Banner</p>
                      <p className="text-xs text-muted-foreground mb-2">Recommended size: 1200×630px</p>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="banner-upload"
                        onChange={handleFileChange}
                      />
                      <Label htmlFor="banner-upload" className="cursor-pointer text-primary text-sm">
                        Browse files
                      </Label>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event..."
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  className="min-h-32 border"
                />
                <div className="text-right text-xs text-muted-foreground">
                  {formData.description.length}/600 characters
                </div>
              </div>
            </div>
          </div>
        )

      case "format":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-8">Event Format</h2>
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Date & Time</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Event Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date || undefined}
                          onSelect={(date) => updateFormData({ date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Event Time</Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => updateFormData({ time: e.target.value })}
                        className="border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-medium">Duration</h3>
                <p className="text-sm text-muted-foreground">
                  Select how long your event will last. This will affect the default pricing.
                </p>

                <div className="flex space-x-4">
                  {[15, 30, 60].map((duration) => (
                    <button
                      key={duration}
                      className={`border rounded-lg p-4 flex items-center ${
                        formData.duration === duration ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => updateFormData({ duration: duration as Duration })}
                    >
                      <span className="mr-2">{duration}</span>
                      <span>minutes</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "sales":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-8">Sale Type</h2>
            <div className="space-y-8">
              <div className="space-y-4">
                <RadioGroup
                  value={formData.saleType}
                  onValueChange={(value) => updateFormData({ saleType: value as SaleType })}
                >
                  <div
                    className={`border rounded-lg p-4 mb-4 ${formData.saleType === "cumulative-tips" ? "border-primary" : ""}`}
                  >
                    <div className="flex items-center mb-2">
                      <RadioGroupItem value="cumulative-tips" id="cumulative-tips" />
                      <Label htmlFor="cumulative-tips" className="ml-2 font-medium">
                        Cumulative Tips
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Artwork value accumulates from all tips received during the event.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 mb-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center mb-2">
                      <RadioGroupItem value="blind-auction" id="blind-auction" disabled />
                      <Label htmlFor="blind-auction" className="ml-2 font-medium">
                        Blind Auction
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Viewers bid on the artwork without seeing others' bids.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center mb-2">
                      <RadioGroupItem value="quadratic-tipping" id="quadratic-tipping" disabled />
                      <Label htmlFor="quadratic-tipping" className="ml-2 font-medium">
                        Quadratic Tipping
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      The impact of tips scales with the square root of the amount, favoring many small tips over few
                      large ones.
                    </p>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-medium">Reserve Price</h3>
                <p className="text-sm text-muted-foreground">
                  The minimum amount required to claim ownership of the RTA after the event.
                </p>

                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-4">
                    {[0.3, 1, 2].map((price) => (
                      <button
                        key={price}
                        className={`border rounded-lg p-4 flex items-center ${
                          formData.reservePrice === price && formData.useCustomReservePrice
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                        onClick={() => updateFormData({ reservePrice: price, useCustomReservePrice: true })}
                      >
                        <span className="mr-2">{price}</span>
                        <span>SOL</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="custom-reserve"
                      checked={formData.useCustomReservePrice}
                      onCheckedChange={(checked) => toggleCustomReservePrice(checked === true)}
                    />
                    <Label htmlFor="custom-reserve">Custom price</Label>

                    <div className="flex items-center border rounded-lg p-2 ml-4">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-16 h-8 border-0"
                        value={formData.reservePrice}
                        onChange={(e) => updateFormData({ reservePrice: Number.parseFloat(e.target.value) || 0 })}
                        disabled={!formData.useCustomReservePrice}
                      />
                      <span className="ml-2">SOL</span>
                    </div>
                  </div>

                  <div className="flex items-center p-2 bg-muted/30 rounded-md">
                    <span className="text-sm text-muted-foreground">
                      Default price: {(formData.duration / 500).toFixed(4)} SOL (based on duration)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-medium">Tickets Amount</h3>
                <div className="flex items-center space-x-4">
                  <Input
                    type="number"
                    className="w-24"
                    value={formData.noCap ? "" : formData.ticketsAmount}
                    onChange={(e) => updateFormData({ ticketsAmount: Number.parseInt(e.target.value) || 0 })}
                    disabled={formData.noCap}
                  />
                  <span># participants</span>
                  <div className="flex items-center space-x-2 ml-4">
                    <Checkbox
                      id="no-cap"
                      checked={formData.noCap}
                      onCheckedChange={(checked) => updateFormData({ noCap: checked === true })}
                    />
                    <Label htmlFor="no-cap">No cap</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-medium">Ticket Price</h3>

                <div className="flex flex-col space-y-4">
                  <RadioGroup
                    value={formData.useCustomTicketPrice ? "custom" : "default"}
                    onValueChange={(value) => {
                      if (value === "default") {
                        toggleCustomTicketPrice(false)
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="default-price" />
                      <Label htmlFor="default-price">Default price ({(formData.duration / 500).toFixed(4)} SOL)</Label>
                    </div>
                  </RadioGroup>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="custom-ticket"
                      checked={formData.useCustomTicketPrice}
                      onCheckedChange={(checked) => toggleCustomTicketPrice(checked === true)}
                    />
                    <Label htmlFor="custom-ticket">Custom price</Label>

                    <div className="flex items-center border rounded-lg p-2 ml-4">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-16 h-8 border-0"
                        value={formData.ticketPrice}
                        onChange={(e) => updateFormData({ ticketPrice: Number.parseFloat(e.target.value) || 0 })}
                        disabled={!formData.useCustomTicketPrice}
                      />
                      <span className="ml-2">SOL</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  * The ticket price gives attendees access to the live event and the ability to tip during the
                  performance.
                </p>
              </div>
            </div>
          </div>
        )

      case "mint":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-8">Mint Your Event</h2>
            <div className="space-y-8">
              <div className="border rounded-lg p-8 text-center">
                <h3 className="text-2xl mb-4">Ready to Mint Your Event</h3>
                <p className="text-muted-foreground mb-6">
                  Your event details are complete. Click the button below to mint your event NFT on Solana Devnet and make it available
                  in the marketplace.
                </p>
                {isLoading ? (
                  <div className="flex flex-col items-center py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p>Creating your event on Solana...</p>
                  </div>
                ) : txSignature ? (
                  <div className="mb-6">
                    <p className="text-green-600 mb-2">Event successfully minted!</p>
                    <div className="font-mono text-xs bg-muted p-2 rounded truncate">
                      Tx: {txSignature}
                    </div>
                    <a 
                      href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline mt-2 inline-block"
                    >
                      View on Solana Explorer
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        debug("Mint button clicked directly");
                        try {
                          // Force the focus to be removed from the button
                          (document.activeElement as HTMLElement)?.blur();
                          
                          // Add a small delay to ensure UI events have finished processing
                          setTimeout(() => {
                            handleMintEvent();
                          }, 100);
                        } catch (error) {
                          debug("Error in mint button click handler", error);
                        }
                      }}
                    >
                      Mint Event NFT
                    </Button>
                    
                    {(!publicKey || !connected) && (
                      <div className="mt-4">
                        <p className="text-amber-500 mb-2">Wallet not connected!</p>
                        <Button 
                          variant="outline" 
                          onClick={connectWalletDirectly}
                          className="w-full mb-2"
                        >
                          Connect Phantom Wallet
                        </Button>
                      </div>
                    )}

                    {/* Add test wallet button */}
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        onClick={testWalletDirectly}
                        className="w-full"
                      >
                        Test Wallet Interaction
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try this to verify basic wallet functionality
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">Event Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{formData.category ? formData.category.replace("-", " ") : "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span>{formData.title || "Untitled Event"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span>
                      {formData.date ? format(formData.date, "PPP") : "Not set"} at {formData.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{formData.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sale Type:</span>
                    <span>{formData.saleType.replace("-", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reserve Price:</span>
                    <span>{formData.reservePrice} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tickets:</span>
                    <span>{formData.noCap ? "Unlimited" : formData.ticketsAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Price:</span>
                    <span>{formData.ticketPrice} SOL</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6 text-muted-foreground text-sm">
                <h4 className="font-medium mb-4 text-foreground">Technical Details</h4>
                <p className="mb-2">This process will:</p>
                <ol className="list-decimal list-inside space-y-1 mb-3">
                  <li>Upload event metadata to IPFS via Pinata</li>
                  <li>Create a Realtime Asset (RTA) on Solana Devnet</li>
                  <li>Store event details in the program's on-chain data</li>
                  <li>Enable tipping during the event livestream</li>
                  <li>Set up claiming of the RTA based on the reserve price</li>
                </ol>
                <p>All transactions happen on Solana Devnet using test SOL.</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <QuickAccess />

      <main className="flex-1 container max-w-5xl py-12">
        <Breadcrumbs items={[{ label: "Event Factory" }]} />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Event Factory</h1>
          <p className="text-muted-foreground">
            Performance art, in its creation. The RTA protocol introduces dynamic, real-time assets to the NFT space,
            and brings you directly into an artist's studio.
          </p>
        </div>

        <div className="flex mb-12">
          {/* Progress Sidebar */}
          <div className="mr-8 relative">
            <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-muted"></div>

            {[
              { id: "details", label: "Your Event" },
              { id: "category", label: "Labels" },
              { id: "format", label: "Event Format" },
              { id: "sales", label: "Sales & Tickets" },
              { id: "mint", label: "Mint Your Event" },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center mb-16 relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    step === s.id
                      ? "bg-primary text-white"
                      : i < ["details", "category", "format", "sales", "mint"].indexOf(step)
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`ml-4 ${step === s.id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1">{renderStepContent()}</div>
        </div>

        <div className="flex justify-between">
          {step !== "category" ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div></div> // Empty div to maintain flex spacing
          )}

          <Button
            onClick={handleNext}
            disabled={step === "details" && !formData.title}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {step === "mint" ? "Finish" : "Next"}
          </Button>
        </div>
      </main>
    </div>
  )
}
