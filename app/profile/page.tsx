"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { ArtCategoryIcon } from "@/components/art-category-icons"
import {
  Brush,
  Ticket,
  Settings,
  Wallet,
  Edit,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Twitter,
  Send,
  Camera,
  ImageIcon,
  Check,
  PlusCircle,
  User,
} from "lucide-react"
import { QuickAccess } from "@/components/quick-access"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { useAuth } from "@/contexts/auth-context"
import { useEvents } from "@/contexts/events-context"

// Mock data for user tickets
const userTickets = [
  {
    id: 1,
    eventTitle: "Comedy Night with John Doe",
    creator: "johndoe.eth",
    category: "standup-comedy",
    date: "2025-04-15T19:00:00",
    ticketPrice: 5,
    status: "upcoming",
    image: "/placeholder.svg?height=200&width=400",
  },
  {
    id: 2,
    eventTitle: "Poetry Night: Urban Verses",
    creator: "poet.eth",
    category: "poetry-slam",
    date: "2025-04-20T18:30:00",
    ticketPrice: 3,
    status: "upcoming",
    image: "/placeholder.svg?height=200&width=400",
  },
]

export default function Profile() {
  const router = useRouter()
  const { userProfile, updateProfile } = useAuth()
  const { userEvents } = useEvents()
  const [editMode, setEditMode] = useState(false)
  const [profileData, setProfileData] = useState({
    name: userProfile?.ensName || "jabyl.eth",
    username: userProfile?.ensName || "jabyl.eth",
    bio: userProfile?.bio || "",
    avatar:
      userProfile?.avatar ||
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/21c09ec3-fb44-40b5-9ffc-6fedc032fe3b-I36E2znZKmldANSRQFL5kgjSSjYRka.jpeg",
    banner: "/placeholder.svg?height=400&width=1200",
    socials: {
      ens: userProfile?.ensName || "jabyl.eth",
      lens: "jabyl.lens",
      farcaster: "@jabyl",
      twitter: "@jabyl0x",
      telegram: "@jabyl",
    },
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>(userProfile?.favoriteCategories || [])
  const [bio, setBio] = useState(userProfile?.bio || "")

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleAvatarUpload = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.click()
    }
  }

  const handleBannerUpload = () => {
    if (bannerInputRef.current) {
      bannerInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const imageUrl = URL.createObjectURL(file)

      if (type === "avatar") {
        setProfileData({ ...profileData, avatar: imageUrl })
      } else {
        setProfileData({ ...profileData, banner: imageUrl })
      }
    }
  }

  const handleSaveProfile = () => {
    setEditMode(false)
    // Update profile in auth context
    updateProfile({
      bio: profileData.bio,
      favoriteCategories: selectedCategories,
      isProfileComplete: true,
    })
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : prev.length < 3 ? [...prev, category] : prev,
    )
  }

  const handleSaveBio = () => {
    updateProfile({
      bio: bio,
      isProfileComplete: true,
    })
  }

  const handleSaveCategories = () => {
    updateProfile({
      favoriteCategories: selectedCategories,
      isProfileComplete: true,
    })
  }

  // Check if profile needs completion
  const isProfileIncomplete = !userProfile?.isProfileComplete

  return (
    <div className="min-h-screen flex flex-col texture-bg">
      <Navbar />
      <QuickAccess />

      <main className="flex-1 container py-12">
        <Breadcrumbs items={[{ label: "Profile" }]} />

        {/* Profile Header */}
        <div className="mb-8">
          <div className="relative">
            <div
              className={`h-48 rounded-lg overflow-hidden ${editMode ? "cursor-pointer group" : ""}`}
              onClick={editMode ? handleBannerUpload : undefined}
            >
              <img
                src={profileData.banner || "/placeholder.svg"}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
              {editMode && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-background/80 p-3 rounded-full">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              )}
            </div>
            <div className="absolute -bottom-16 left-8">
              <div
                className={`relative ${editMode ? "cursor-pointer group" : ""}`}
                onClick={editMode ? handleAvatarUpload : undefined}
              >
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src={profileData.avatar} alt={profileData.name} />
                  <AvatarFallback>{profileData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {editMode && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                    <div className="bg-background/80 p-2 rounded-full">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute top-4 right-4">
              {editMode ? (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary text-primary-foreground"
                  onClick={handleSaveProfile}
                >
                  Save Profile
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="bg-background/80" onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
          <div className="mt-20 ml-8">
            <h1 className="text-3xl font-bold">{profileData.name}</h1>
            <p className="text-muted-foreground">{profileData.username}</p>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={avatarInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileChange(e, "avatar")}
        />
        <input
          type="file"
          ref={bannerInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileChange(e, "banner")}
        />

        {/* Profile Completion Cards (shown only if profile is incomplete) */}
        {isProfileIncomplete && (
          <div className="mb-8 space-y-4">
            <h2 className="text-xl font-bold">Complete Your Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bio Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    Add Your Bio
                  </CardTitle>
                  <CardDescription>Tell the community about yourself</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Share your story, interests, or expertise..."
                    className="min-h-24"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveBio} className="w-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Bio
                  </Button>
                </CardFooter>
              </Card>

              {/* Categories Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brush className="h-5 w-5 mr-2 text-primary" />
                    Pick Your Favorites
                  </CardTitle>
                  <CardDescription>Select up to 3 art categories you're interested in</CardDescription>
                </CardHeader>
                <CardContent>
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
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedCategories.length}/3 categories selected
                  </p>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveCategories} className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        className="min-h-32"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {userProfile?.bio || "No bio added yet. Click 'Edit Profile' to add one."}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Web3 Socials</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ens">ENS</Label>
                      <Input
                        id="ens"
                        value={profileData.socials.ens}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            socials: { ...profileData.socials, ens: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lens">Lens</Label>
                      <Input
                        id="lens"
                        value={profileData.socials.lens}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            socials: { ...profileData.socials, lens: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farcaster">Farcaster</Label>
                      <Input
                        id="farcaster"
                        value={profileData.socials.farcaster}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            socials: { ...profileData.socials, farcaster: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="flex items-center">
                        <Twitter className="h-4 w-4 mr-2" />X / Twitter
                      </Label>
                      <div className="flex">
                        <Input
                          id="twitter"
                          value={profileData.socials.twitter.replace("@", "")}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              socials: { ...profileData.socials, twitter: `@${e.target.value.replace("@", "")}` },
                            })
                          }
                          placeholder="username (without @)"
                        />
                        <Button
                          variant="outline"
                          className="ml-2"
                          onClick={() =>
                            window.open(`https://x.com/${profileData.socials.twitter.replace("@", "")}`, "_blank")
                          }
                        >
                          Link
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram" className="flex items-center">
                        <Send className="h-4 w-4 mr-2" />
                        Telegram
                      </Label>
                      <div className="flex">
                        <Input
                          id="telegram"
                          value={profileData.socials.telegram.replace("@", "")}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              socials: { ...profileData.socials, telegram: `@${e.target.value.replace("@", "")}` },
                            })
                          }
                          placeholder="username (without @)"
                        />
                        <Button
                          variant="outline"
                          className="ml-2"
                          onClick={() =>
                            window.open(`https://t.me/${profileData.socials.telegram.replace("@", "")}`, "_blank")
                          }
                        >
                          Link
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ENS</span>
                      <span>{profileData.socials.ens}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Lens</span>
                      <span>{profileData.socials.lens}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Farcaster</span>
                      <span>{profileData.socials.farcaster}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Twitter className="h-4 w-4 mr-1" /> X / Twitter
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-primary hover:text-primary/80"
                        onClick={() =>
                          window.open(`https://x.com/${profileData.socials.twitter.replace("@", "")}`, "_blank")
                        }
                      >
                        {profileData.socials.twitter}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Send className="h-4 w-4 mr-1" /> Telegram
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-primary hover:text-primary/80"
                        onClick={() =>
                          window.open(`https://t.me/${profileData.socials.telegram.replace("@", "")}`, "_blank")
                        }
                      >
                        {profileData.socials.telegram}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-mono">
                      {userProfile?.address.substring(0, 6) +
                        "..." +
                        userProfile?.address.substring(userProfile?.address.length - 4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <span>0.83 SOL</span>
                  </div>
                </div>
                <Button className="w-full mt-4" onClick={() => router.push("/profile/wallet")}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Manage Wallet
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="events">
              <TabsList className="w-full">
                <TabsTrigger value="events" className="flex-1">
                  <Brush className="h-4 w-4 mr-2" />
                  Your Events
                </TabsTrigger>
                <TabsTrigger value="tickets" className="flex-1">
                  <Ticket className="h-4 w-4 mr-2" />
                  Your Tickets
                </TabsTrigger>
                <TabsTrigger value="curation" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Curation
                </TabsTrigger>
              </TabsList>

              <TabsContent value="events" className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Your Events</h2>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Create New Event</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <div className="relative h-48">
                        <img
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                          <ArtCategoryIcon category={event.category as any} size="sm" />
                        </div>
                        <div className="absolute top-2 left-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              event.status === "upcoming"
                                ? "bg-blue-500 text-white"
                                : event.status === "completed"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-500 text-white"
                            }`}
                          >
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription>{event.category.replace("-", " ")}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{event.duration} minutes</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-2" />
                          <span>
                            {event.participants}/{event.maxParticipants} participants
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>{event.ticketPrice} SOL</span>
                        </div>
                      </CardContent>
                      <div className="p-4 pt-0 flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Edit
                        </Button>
                        {event.status === "upcoming" && (
                          <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                            Go Live
                          </Button>
                        )}
                        {event.status === "completed" && (
                          <Button size="sm" className="flex-1">
                            View NFT
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tickets" className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Your Tickets</h2>
                  <Button variant="outline" onClick={() => router.push("/event-market")}>
                    Browse Events
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userTickets.map((ticket) => (
                    <Card key={ticket.id} className="overflow-hidden">
                      <div className="relative h-48">
                        <img
                          src={ticket.image || "/placeholder.svg"}
                          alt={ticket.eventTitle}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                          <ArtCategoryIcon category={ticket.category as any} size="sm" />
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-500 text-white">
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{ticket.eventTitle}</CardTitle>
                        <CardDescription>by {ticket.creator}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(ticket.date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>{ticket.ticketPrice} SOL</span>
                        </div>
                      </CardContent>
                      <div className="p-4 pt-0 flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                          Join Event
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="curation" className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Curation</h2>
                </div>

                <Card className="p-6 text-center">
                  <div className="py-12">
                    <h3 className="text-xl font-medium mb-2">No Curation Proposals Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't made or received any curation proposals yet.
                    </p>
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => router.push("/event-market")}
                    >
                      Browse Events to Curate
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
