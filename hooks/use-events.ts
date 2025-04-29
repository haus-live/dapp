import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { Event, EventCategory } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"

interface UseEventsOptions {
  initialCategory?: EventCategory
  autoFetch?: boolean
}

export function useEvents(options: UseEventsOptions = {}) {
  const { initialCategory, autoFetch = true } = options
  const { userProfile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [category, setCategory] = useState<EventCategory | undefined>(initialCategory)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all events or events by category
  const fetchEvents = async (newCategory?: EventCategory) => {
    setIsLoading(true)
    setError(null)
    
    try {
      let fetchedEvents: Event[]
      
      if (newCategory) {
        fetchedEvents = await apiClient.getEventsByCategory(newCategory)
        setCategory(newCategory)
      } else if (category) {
        fetchedEvents = await apiClient.getEventsByCategory(category)
      } else {
        fetchedEvents = await apiClient.getEvents()
      }
      
      setEvents(fetchedEvents)
    } catch (err) {
      setError("Failed to fetch events")
      console.error("Error fetching events:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fetch events when component mounts or category changes
  useEffect(() => {
    if (autoFetch) {
      fetchEvents()
    }
  }, [category, autoFetch])

  // Filter for user's events
  const userEvents = userProfile 
    ? events.filter(event => 
        event.creatorAddress === userProfile.address || 
        event.creator === userProfile.ensName)
    : []

  // Create a new event
  const createEvent = async (eventData: Omit<Event, 'id'>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newEvent = await apiClient.createEvent(eventData)
      
      if (newEvent) {
        setEvents(prev => [...prev, newEvent])
        return newEvent
      }
      return null
    } catch (err) {
      setError("Failed to create event")
      console.error("Error creating event:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Get an event by ID
  const getEventById = (id: string) => {
    return events.find(event => event.id === id)
  }

  return {
    events,
    userEvents,
    isLoading,
    error,
    fetchEvents,
    setCategory,
    createEvent,
    getEventById
  }
} 