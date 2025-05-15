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
import { ProfileEditModal } from "@/components/profile-edit-modal"

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
  const { userProfile } = useAuth()
  const { userEvents } = useEvents()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [banner, setBanner] = useState("/placeholder.svg?height=400&width=1200")
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

  const handleBannerUpload = () => {
    if (bannerInputRef.current) {
      bannerInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const imageUrl = URL.createObjectURL(file)
      setBanner(imageUrl)
    }
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center texture-bg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Please connect your wallet</h1>
          <p className="text-muted-foreground mb-6">You need to connect your wallet to view your profile</p>
          <Button onClick={() => router.push('/')}>Return to Home</Button>
        </div>
      </div>
    )
  }

  // Get username or address for display
  const displayName = userProfile.username || userProfile.address.substring(0, 10) + '...'
  
  // Get web3 socials from profile
  const web3Socials = userProfile.web3Socials || {
    ens: null,
    lens: null,
    farcaster: null,
    twitter: null,
    telegram: null
  }

  return (
    <div className="min-h-screen flex flex-col texture-bg">
      <Navbar />
      <QuickAccess />

      <main className="flex-1 container py-12">
        <Breadcrumbs items={[{ label: "Profile" }]} />

        {/* Profile Header */}
        <div className="mb-8">
          <div className="relative">
            <div className="h-48 rounded-lg overflow-hidden cursor-pointer group" onClick={handleBannerUpload}>
              <img
                src={banner}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-background/80 p-3 rounded-full">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src={userProfile.avatar || "/placeholder.svg?height=128&width=128"} alt={displayName} />
                  <AvatarFallback>{(userProfile.username || "User").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-background/80"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
          <div className="mt-20 ml-8">
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <p className="text-muted-foreground">{userProfile.address}</p>
          </div>
        </div>

        {/* Hidden file input for banner */}
        <input
          type="file"
          ref={bannerInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {userProfile.bio || "No bio added yet. Click 'Edit Profile' to add one."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Web3 Socials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {web3Socials.ens && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ENS</span>
                      <span>{web3Socials.ens}</span>
                    </div>
                  )}
                  
                  {web3Socials.lens && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Lens</span>
                      <span>{web3Socials.lens}</span>
                    </div>
                  )}
                  
                  {web3Socials.farcaster && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Farcaster</span>
                      <span>{web3Socials.farcaster}</span>
                    </div>
                  )}
                  
                  {web3Socials.twitter && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Twitter className="h-4 w-4 mr-1" /> X / Twitter
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-primary hover:text-primary/80"
                        onClick={() =>
                          window.open(`https://x.com/${web3Socials.twitter.replace("@", "")}`, "_blank")
                        }
                      >
                        {web3Socials.twitter}
                      </Button>
                    </div>
                  )}
                  
                  {web3Socials.telegram && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Send className="h-4 w-4 mr-1" /> Telegram
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-primary hover:text-primary/80"
                        onClick={() =>
                          window.open(`https://t.me/${web3Socials.telegram.replace("@", "")}`, "_blank")
                        }
                      >
                        {web3Socials.telegram}
                      </Button>
                    </div>
                  )}
                  
                  {!web3Socials.ens && !web3Socials.lens && !web3Socials.farcaster && !web3Socials.twitter && !web3Socials.telegram && (
                    <p className="text-muted-foreground">No Web3 socials added yet. Click 'Edit Profile' to add some.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Favorite Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {userProfile.favoriteCategories && userProfile.favoriteCategories.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {userProfile.favoriteCategories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center p-2 rounded-md border bg-background/50"
                      >
                        <div className="mr-2">
                          <ArtCategoryIcon category={category as any} className="h-5 w-5" />
                        </div>
                        <span className="capitalize">{category.replace(/-/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No favorite categories selected yet. Click 'Edit Profile' to add some.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Edit Modal */}
          <ProfileEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />

          {/* Main Content - rest of page */}
          <div className="lg:col-span-2 space-y-6">
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
                <TabsTrigger value="wallet" className="flex-1">
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="events" className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Your Events</h2>
                    <Button onClick={() => router.push("/event-factory")}>Create New Event</Button>
                  </div>

                  {userEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userEvents.map((event) => (
                        <Card key={event.id} className="overflow-hidden">
                          <div className="aspect-video relative">
                            <img
                              src={event.image || "/placeholder.svg?height=200&width=400"}
                              alt={event.title}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs">
                              {event.status}
                            </div>
                          </div>
                          <CardHeader>
                            <CardTitle className="truncate">{event.title}</CardTitle>
                            <CardDescription className="truncate">
                              <div className="flex items-center">
                                <ArtCategoryIcon category={event.category as any} className="h-4 w-4 mr-1" />
                                <span className="capitalize">{event.category.replace(/-/g, " ")}</span>
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(event.date)}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Clock className="h-4 w-4 mr-2" />
                                {event.duration} minutes
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Users className="h-4 w-4 mr-2" />
                                {event.participants}/{event.maxParticipants} participants
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <DollarSign className="h-4 w-4 mr-2" />
                                {event.ticketPrice} SOL per ticket
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => router.push(`/event/${event.id}`)}
                            >
                              View
                            </Button>
                            {event.status === "upcoming" || event.status === "created" ? (
                              <Button
                                className="flex-1"
                                onClick={() => router.push(`/event-room/${event.id}`)}
                              >
                                Go Live
                              </Button>
                            ) : (
                              <Button
                                className="flex-1"
                                onClick={() => router.push(`/event-room/${event.id}`)}
                              >
                                Join Room
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center">
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">No Events Yet</h3>
                        <p className="text-muted-foreground">
                          You haven't created any events yet. Start your first event by clicking the button below.
                        </p>
                        <Button onClick={() => router.push("/event-factory")}>Create Your First Event</Button>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tickets" className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Your Tickets</h2>
                    <Button onClick={() => router.push("/event-market")}>Browse Events</Button>
                  </div>

                  {userTickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userTickets.map((ticket) => (
                        <Card key={ticket.id} className="overflow-hidden">
                          <div className="aspect-video relative">
                            <img
                              src={ticket.image}
                              alt={ticket.eventTitle}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs">
                              {ticket.status}
                            </div>
                          </div>
                          <CardHeader>
                            <CardTitle className="truncate">{ticket.eventTitle}</CardTitle>
                            <CardDescription className="truncate">
                              <div className="flex items-center">
                                <ArtCategoryIcon category={ticket.category as any} className="h-4 w-4 mr-1" />
                                <span className="capitalize">{ticket.category.replace(/-/g, " ")}</span>
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(ticket.date)}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <DollarSign className="h-4 w-4 mr-2" />
                                {ticket.ticketPrice} SOL ticket price
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              className="w-full"
                              onClick={() => router.push(`/event-room/${ticket.id}`)}
                            >
                              {new Date(ticket.date) > new Date() ? "Join When Live" : "Join Room"}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center">
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">No Tickets Yet</h3>
                        <p className="text-muted-foreground">
                          You haven't purchased any tickets yet. Browse events and get your first ticket.
                        </p>
                        <Button onClick={() => router.push("/event-market")}>Explore Events</Button>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="wallet" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Wallet Settings</CardTitle>
                    <CardDescription>Manage your wallet and transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border p-4 rounded-lg">
                        <div className="font-semibold mb-1">Connected Address</div>
                        <div className="font-mono text-sm break-all">{userProfile.address}</div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/profile/wallet')}
                        className="w-full"
                      >
                        View Wallet Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
