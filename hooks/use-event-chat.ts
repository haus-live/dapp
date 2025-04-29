import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { ChatMessage } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"

interface UseEventChatOptions {
  eventId: string
  autoFetch?: boolean
  pollingInterval?: number
}

export function useEventChat(options: UseEventChatOptions) {
  const { eventId, autoFetch = true, pollingInterval = 5000 } = options
  const { userProfile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all messages for the event
  const fetchMessages = async () => {
    if (!eventId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchedMessages = await apiClient.getEventMessages(eventId)
      setMessages(fetchedMessages)
    } catch (err) {
      setError("Failed to fetch chat messages")
      console.error(`Error fetching messages for event ${eventId}:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fetch messages when component mounts
  useEffect(() => {
    if (autoFetch && eventId) {
      fetchMessages()
    }
  }, [eventId, autoFetch])

  // Set up polling for new messages
  useEffect(() => {
    if (!autoFetch || !eventId) return

    const intervalId = setInterval(() => {
      fetchMessages()
    }, pollingInterval)

    return () => clearInterval(intervalId)
  }, [eventId, autoFetch, pollingInterval])

  // Send a new message
  const sendMessage = async (content: string) => {
    if (!eventId || !userProfile) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
        eventId,
        sender: userProfile.ensName || userProfile.address.substring(0, 8) + '...',
        senderAddress: userProfile.address,
        message: content
      }
      
      const sentMessage = await apiClient.sendMessage(eventId, message)
      
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage])
        return sentMessage
      }
      return null
    } catch (err) {
      setError("Failed to send message")
      console.error(`Error sending message for event ${eventId}:`, err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage
  }
} 