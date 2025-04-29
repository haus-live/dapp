import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { Event } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"

interface UseEventOptions {
  initialId?: string
  autoFetch?: boolean
}

export function useEvent(options: UseEventOptions = {}) {
  const { initialId, autoFetch = true } = options
  const { userProfile } = useAuth()
  const [eventId, setEventId] = useState<string | undefined>(initialId)
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvent = async (id?: string) => {
    const targetId = id || eventId
    if (!targetId) return

    setIsLoading(true)
    setError(null)

    try {
      const fetchedEvent = await apiClient.getEventById(targetId)
      setEvent(fetchedEvent)
    } catch (err) {
      setError("Failed to fetch event")
      console.error(`Error fetching event ${targetId}:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch event when id changes if autoFetch is enabled
  useEffect(() => {
    if (eventId && autoFetch) {
      fetchEvent()
    }
  }, [eventId, autoFetch])

  // Check if current user is the event creator
  const isCreator = 
    event && userProfile ? 
    (event.creatorAddress === userProfile.address || event.creator === userProfile.ensName) : 
    false

  const updateEvent = async (eventData: Partial<Event>) => {
    if (!eventId) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedEvent = await apiClient.updateEvent(eventId, eventData)
      
      if (updatedEvent) {
        setEvent(updatedEvent)
        return updatedEvent
      }
      return null
    } catch (err) {
      setError("Failed to update event")
      console.error(`Error updating event ${eventId}:`, err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    event,
    isLoading,
    error,
    fetchEvent,
    updateEvent,
    setEventId,
    isCreator
  }
} 