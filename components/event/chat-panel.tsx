"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: number
  isTip?: boolean
  tipAmount?: number
}

interface ChatPanelProps {
  eventId: string
  isLive: boolean
}

export default function ChatPanel({ eventId, isLive }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const wallet = useWallet()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Connect to WebSocket chat service
  useEffect(() => {
    // Create WebSocket connection
    const socket = new WebSocket(`wss://chat.haus.art/events/${eventId}`)
    socketRef.current = socket

    // Connection opened
    socket.addEventListener("open", () => {
      setIsConnected(true)

      // Send authentication message
      if (wallet.connected && wallet.publicKey) {
        socket.send(
          JSON.stringify({
            type: "auth",
            publicKey: wallet.publicKey.toString(),
          }),
        )
      }

      // Send join message
      socket.send(
        JSON.stringify({
          type: "join",
          eventId,
        }),
      )
    })

    // Listen for messages
    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "message") {
          const message: ChatMessage = {
            id: data.id,
            sender: data.sender,
            message: data.message,
            timestamp: data.timestamp,
            isTip: data.isTip,
            tipAmount: data.tipAmount,
          }

          setMessages((prev) => [...prev, message])
        } else if (data.type === "history") {
          // Initial message history
          setMessages(data.messages)
        }
      } catch (error) {
        console.error("Error parsing message:", error)
      }
    })

    // Connection closed
    socket.addEventListener("close", () => {
      setIsConnected(false)
    })

    // Connection error
    socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error)
      setIsConnected(false)
    })

    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [eventId, wallet.connected, wallet.publicKey])

  // Send a new message
  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected || !socketRef.current) return

    const messageData = {
      type: "message",
      eventId,
      message: newMessage,
      sender: wallet.connected ? wallet.publicKey?.toString() : "Guest",
    }

    socketRef.current.send(JSON.stringify(messageData))
    setNewMessage("")
  }

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Get display name from public key
  const getDisplayName = (publicKey: string): string => {
    // If it's the current user
    if (wallet.connected && wallet.publicKey && publicKey === wallet.publicKey.toString()) {
      return "You"
    }

    // Otherwise, shorten the public key
    return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>Live Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-start">
                <span className="font-semibold text-sm">{getDisplayName(msg.sender)}</span>
                <span className="text-xs text-gray-500 ml-2">{formatTime(msg.timestamp)}</span>
              </div>
              <div className={`mt-1 ${msg.isTip ? "text-green-600 font-medium" : ""}`}>
                {msg.isTip && "🎁 "}
                {msg.message}
                {msg.isTip && msg.tipAmount && ` (${msg.tipAmount} SOL)`}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-auto">
          <div className="flex">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={!isConnected}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!isConnected || !newMessage.trim()} className="ml-2">
              <Send size={18} />
            </Button>
          </div>
          {!isConnected && (
            <p className="text-sm text-red-500 mt-2">Disconnected from chat. Please refresh the page.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
