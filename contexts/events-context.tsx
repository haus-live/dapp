"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Event } from "@/lib/types"
import { apiClient } from "@/lib/api-client"

interface EventsContextType {
  events: Event[]
  userEvents: Event[]
  isLoading: boolean
  error: string | null
  addEvent: (event: Omit<Event, 'id'>) => Promise<Event | null>
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<Event | null>
  getEventById: (id: string) => Event | undefined
  fetchEvents: () => Promise<void>
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

const STORAGE_KEYS = {
  EVENTS: "haus_events"
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const { userProfile, isConnected } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load events from localStorage on mount, then fetch from API
  useEffect(() => {
    const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS)
    if (storedEvents) {
      try {
        setEvents(JSON.parse(storedEvents))
      } catch (error) {
        console.error("Failed to parse stored events:", error)
      }
    }
    
    // Fetch events from API
    fetchEvents()
  }, [])

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events))
  }, [events])

  // Filter events created by the current user
  const userEvents = 
    isConnected && userProfile
      ? events.filter((event) => event.creatorAddress === userProfile.address || event.creator === userProfile.ensName)
      : []

  // Fetch all events from API
  const fetchEvents = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchedEvents = await apiClient.getEvents()
      setEvents(fetchedEvents)
    } catch (err) {
      setError("Failed to fetch events")
      console.error("Error fetching events:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new event
  const addEvent = async (eventData: Omit<Event, 'id'>) => {
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

  // Update an existing event
  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedEvent = await apiClient.updateEvent(id, eventData)
      
      if (updatedEvent) {
        setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event))
        return updatedEvent
      }
      return null
    } catch (err) {
      setError("Failed to update event")
      console.error("Error updating event:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Get an event by ID
  const getEventById = (id: string) => {
    return events.find((event) => event.id === id)
  }

  return (
    <EventsContext.Provider
      value={{
        events,
        userEvents,
        isLoading,
        error,
        addEvent,
        updateEvent,
        getEventById,
        fetchEvents
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

// Custom hook to use the events context
export function useEvents() {
  const context = useContext(EventsContext)
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventsProvider")
  }
  return context
}
