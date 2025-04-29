import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ArtCategoryIcon } from "@/components/art-category-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Event, EventCategory } from "@/lib/types"
import { colors } from "@/lib/design-tokens"
import { Eye, Calendar, Clock, Users, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventCardProps {
  event: Event
  onView?: (eventId: string) => void
  onPurchase?: (eventId: string) => void
  compact?: boolean
  className?: string
}

export function EventCard({ event, onView, onPurchase, compact = false, className }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const formattedDate = format(new Date(event.date), "MMM d, yyyy • h:mm a")
  const statusColor = getStatusColor(event.status)
  
  // Format for ticket price
  const formattedPrice = event.ticketPrice === 0 
    ? "Free" 
    : `${event.ticketPrice} ETH`
  
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 h-full flex flex-col",
        isHovered 
          ? "shadow-lg translate-y-[-4px]" 
          : "shadow-md hover:shadow-lg",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Category Badge */}
      <div className="absolute top-2 left-2 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-background/80 backdrop-blur-sm p-1.5 rounded-full border border-border/40 shadow-sm transition-all duration-300">
                <ArtCategoryIcon category={event.category as EventCategory} className="h-5 w-5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="capitalize">{event.category.replace(/-/g, " ")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge 
          variant="outline" 
          className={`${statusColor} text-xs capitalize font-medium transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}
        >
          {event.status}
        </Badge>
      </div>

      {/* Image Background */}
      <div 
        className="w-full aspect-video bg-secondary relative overflow-hidden group"
        style={{
          backgroundImage: event.image ? `url(${event.image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        
        {event.videoUrl && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => onView?.(event.id)}
              className="font-medium shadow-md transition-all duration-300 hover:scale-105"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </div>
        )}
      </div>

      <CardHeader className={cn(
        compact ? "p-3 pb-1" : "p-4 pb-2",
        "transition-all duration-300"
      )}>
        <CardTitle className={cn(
          "line-clamp-1 transition-colors duration-300",
          isHovered ? "text-primary-600" : "text-foreground",
          compact ? "text-base" : "text-lg"
        )}>
          {event.title}
        </CardTitle>
        <CardDescription className="flex items-center text-xs">
          by {event.creator}
        </CardDescription>
      </CardHeader>

      {!compact && (
        <CardContent className="p-4 pt-0 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 transition-all duration-300">
            {event.description}
          </p>
          
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-primary-400" />
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-primary-400" />
              <span>{event.duration} min</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="mr-1.5 h-3.5 w-3.5 text-primary-400" />
              <span>
                {event.participants}/{event.maxParticipants}
              </span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Ticket className="mr-1.5 h-3.5 w-3.5 text-primary-400" />
              <span>{formattedPrice}</span>
            </div>
          </div>
        </CardContent>
      )}

      <CardFooter className={cn(
        compact ? "p-3 pt-2" : "p-4 pt-2",
        "mt-auto transition-all duration-300"
      )}>
        {onPurchase ? (
          <Button 
            className={cn(
              "w-full font-medium transition-all duration-300",
              isHovered ? "bg-primary hover:bg-primary-600" : "bg-primary/90 hover:bg-primary"
            )}
            onClick={() => onPurchase(event.id)}
          >
            {event.ticketPrice === 0 ? "Register" : "Purchase Ticket"}
          </Button>
        ) : (
          <Link href={`/event-room/${event.id}`} className="w-full">
            <Button 
              className={cn(
                "w-full font-medium transition-all duration-300", 
                isHovered ? "bg-primary hover:bg-primary-600" : "bg-primary/90 hover:bg-primary"
              )}
            >
              View Event
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

// Helper to get appropriate color for status badge
function getStatusColor(status: string): string {
  const statusColors = {
    live: "bg-red-500/20 text-red-500 border-red-500/50",
    upcoming: "bg-blue-500/20 text-blue-500 border-blue-500/50",
    completed: "bg-green-500/20 text-green-500 border-green-500/50",
    created: "bg-amber-500/20 text-amber-500 border-amber-500/50",
    finalized: "bg-purple-500/20 text-purple-500 border-purple-500/50",
    default: "bg-gray-500/20 text-gray-500 border-gray-500/50",
  }
  
  return statusColors[status as keyof typeof statusColors] || statusColors.default
} 