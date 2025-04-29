import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventCard } from "@/components/event/event-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Event, EventCategory } from "@/lib/types"
import { Search, Filter, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Event category options
const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "standup-comedy", label: "Standup Comedy" },
  { value: "performance-art", label: "Performance Art" },
  { value: "poetry-slam", label: "Poetry Slam" },
  { value: "open-mic", label: "Open Mic" },
  { value: "live-painting", label: "Live Painting" },
  { value: "creative-workshop", label: "Creative Workshop" },
  { value: "music-performance", label: "Music Performance" },
  { value: "dance-performance", label: "Dance Performance" },
  { value: "digital-art", label: "Digital Art" },
  { value: "storytelling", label: "Storytelling" },
]

interface EventGridProps {
  events: Event[]
  isLoading?: boolean
  showFilters?: boolean
  onEventView?: (eventId: string) => void
  onEventSelect?: (eventId: string) => void
  title?: string
  emptyMessage?: string
  compact?: boolean
  className?: string
}

export function EventGrid({
  events,
  isLoading = false,
  showFilters = true,
  onEventView,
  onEventSelect,
  title = "Events",
  emptyMessage = "No events found",
  compact = false,
  className,
}: EventGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events)
  const [isFiltering, setIsFiltering] = useState(false)

  // Filter events based on search query and category
  useEffect(() => {
    setIsFiltering(true)
    
    const timer = setTimeout(() => {
      const filtered = events.filter((event) => {
        const matchesSearch =
          searchQuery === "" ||
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.creator.toLowerCase().includes(searchQuery.toLowerCase())
  
        const matchesCategory = categoryFilter === "all" || event.category === categoryFilter
  
        return matchesSearch && matchesCategory
      })
      
      setFilteredEvents(filtered)
      setIsFiltering(false)
    }, 300) // Small delay for better performance
    
    return () => clearTimeout(timer)
  }, [events, searchQuery, categoryFilter])

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
  }

  // Event grid layout responsive classes
  const gridClasses = "grid gap-6 transition-all duration-300"
  const gridColsClasses = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Title and Mobile Filter Toggle */}
      {(title || showFilters) && (
        <div className="flex items-center justify-between">
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          
          {showFilters && (
            <Button 
              variant="outline" 
              size="icon" 
              className="md:hidden"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Filters - Responsive Design */}
      {showFilters && (
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          showMobileFilters ? "max-h-96" : "max-h-0 md:max-h-96",
        )}>
          <div className="flex flex-col md:flex-row gap-4 pb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search events..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EVENT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || categoryFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="self-center text-muted-foreground hover:text-foreground"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Display Count and Applied Filters Summary */}
      {filteredEvents.length > 0 && !isLoading && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Displaying {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}</p>
          
          {categoryFilter !== "all" && (
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3" />
              <span className="capitalize">{categoryFilter.replace(/-/g, " ")}</span>
            </div>
          )}
        </div>
      )}

      {/* Loading State with Skeletons */}
      {(isLoading || isFiltering) ? (
        <div className={cn(gridClasses, gridColsClasses)}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="w-full aspect-video bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-2 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="pt-2">
                  <Skeleton className="h-9 w-full mt-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className={cn(gridClasses, gridColsClasses)}>
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onView={onEventView}
              onPurchase={onEventSelect}
              compact={compact}
              className="opacity-0 animate-fade-in [animation-fill-mode:forwards] [animation-delay:100ms]"
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
          {(searchQuery || categoryFilter !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleResetFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 