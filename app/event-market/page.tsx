"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArtCategoryIcon } from "@/components/art-category-icons"
import { Search, Calendar, Clock, Users, Ticket, ChevronDown } from "lucide-react"
import { CurationProposalModal } from "@/components/curation-proposal-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { RecentlyViewed } from "@/components/recently-viewed"
import { TooltipHelper } from "@/components/tooltip-helper"
import { QuickAccess } from "@/components/quick-access"
import { useEvents } from "@/contexts/events-context"

type Category =
  | "standup-comedy"
  | "performance-art"
  | "poetry-slam"
  | "open-mic"
  | "live-painting"
  | "creative-workshop"

type SortOption = "date-earliest" | "date-latest" | "price-low-high" | "price-high-low"

export default function EventMarket() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null)
  const [isCurationModalOpen, setIsCurationModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1 })
  const [sortOption, setSortOption] = useState<SortOption>("date-earliest")

  const { events } = useEvents()

  const toggleCardExpansion = (id: number) => {
    if (expandedCardId === id) {
      setExpandedCardId(null)
    } else {
      setExpandedCardId(id)
    }
  }

  const openCurationModal = (event: any) => {
    setSelectedEvent(event)
    setIsCurationModalOpen(true)
  }

  const toggleCategory = (category: Category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const filteredEvents = events
    .filter((event) => {
      // Filter by search query
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.creator.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by selected categories
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category as Category)

      // Filter by price range
      const matchesPrice = event.ticketPrice >= priceRange.min && event.ticketPrice <= priceRange.max

      return matchesSearch && matchesCategory && matchesPrice
    })
    .sort((a, b) => {
      // Sort based on selected option
      switch (sortOption) {
        case "date-earliest":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "date-latest":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "price-low-high":
          return a.ticketPrice - b.ticketPrice
        case "price-high-low":
          return b.ticketPrice - a.ticketPrice
        default:
          return 0
      }
    })

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

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "date-earliest":
        return "Date (Earliest)"
      case "date-latest":
        return "Date (Latest)"
      case "price-low-high":
        return "Price (Low to High)"
      case "price-high-low":
        return "Price (High to Low)"
      default:
        return "Date (Earliest)"
    }
  }

  return (
    <div className="min-h-screen flex flex-col texture-bg">
      <Navbar />
      <QuickAccess />

      <main className="flex-1 container py-12">
        <Breadcrumbs items={[{ label: "Event Market" }]} />

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Event Market</h1>
          <p className="text-muted-foreground max-w-3xl">
            Discover and join upcoming live events. Purchase tickets to experience art in its creation and participate
            in the ownership of unique digital collectibles.
          </p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="relative flex-1 max-w-3xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, artists..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-4">
                {getSortLabel(sortOption)} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortOption("date-earliest")}>Date (Earliest)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("date-latest")}>Date (Latest)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("price-low-high")}>Price (Low to High)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("price-high-low")}>Price (High to Low)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <RecentlyViewed />

            <div className="bg-secondary/50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">Filters</h2>

              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  Categories
                  <TooltipHelper content="Select one or more categories to filter events" className="ml-2" />
                </h3>
                <div className="space-y-2">
                  {[
                    { id: "standup-comedy", label: "Standup Comedy" },
                    { id: "performance-art", label: "Performance Art" },
                    { id: "poetry-slam", label: "Poetry Slam" },
                    { id: "open-mic", label: "Open Mic" },
                    { id: "live-painting", label: "Live Painting" },
                    { id: "creative-workshop", label: "Creative Workshop" },
                  ].map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                        selectedCategories.includes(category.id as Category)
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => toggleCategory(category.id as Category)}
                    >
                      <ArtCategoryIcon
                        category={category.id as Category}
                        size="sm"
                        className={`mr-2 ${
                          selectedCategories.includes(category.id as Category)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          selectedCategories.includes(category.id as Category) ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {category.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  Price Range (SOL)
                  <TooltipHelper content="Set minimum and maximum ticket prices" className="ml-2" />
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="min-price" className="text-sm text-muted-foreground mb-1 block">
                      Min
                    </label>
                    <Input
                      id="min-price"
                      type="number"
                      min={0}
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label htmlFor="max-price" className="text-sm text-muted-foreground mb-1 block">
                      Max
                    </label>
                    <Input
                      id="max-price"
                      type="number"
                      min={0}
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-48">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                      <ArtCategoryIcon category={event.category as any} size="sm" className="text-primary" />
                    </div>
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>by {event.creator}</CardDescription>
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
                      <Ticket className="h-4 w-4 mr-2" />
                      <span>{event.ticketPrice.toFixed(4)} SOL</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => toggleCardExpansion(event.id)}>
                      {expandedCardId === event.id ? "Hide Details" : "Details"}
                    </Button>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Buy Ticket
                    </Button>
                  </CardFooter>

                  {/* Expanded Card Content */}
                  {expandedCardId === event.id && (
                    <div className="p-4 pt-0 border-t">
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Event Description</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Curation</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Propose to curate this event by offering your expertise to improve visibility, promotion, or
                          visuals.
                        </p>

                        <Button className="w-full" variant="outline" onClick={() => openCurationModal(event)}>
                          Propose to Curate
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No events found</h3>
                <p className="text-muted-foreground">Try adjusting your search or category filters</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedEvent && (
        <CurationProposalModal
          isOpen={isCurationModalOpen}
          onClose={() => setIsCurationModalOpen(false)}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
        />
      )}
    </div>
  )
}
