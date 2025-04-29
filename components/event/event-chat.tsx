import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEventChat } from "@/hooks/use-event-chat"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { ChatMessage } from "@/lib/types"
import { Send, DollarSign, Info } from "lucide-react"

interface EventChatProps {
  eventId: string
  showTipButton?: boolean
  onOpenTipModal?: () => void
  maxHeight?: string
  className?: string
}

export function EventChat({
  eventId,
  showTipButton = true,
  onOpenTipModal,
  maxHeight = "400px",
  className = "",
}: EventChatProps) {
  const { isConnected } = useAuth()
  const [messageInput, setMessageInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, sendMessage } = useEventChat({
    eventId,
    autoFetch: true,
    pollingInterval: 5000,
  })

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    await sendMessage(messageInput)
    setMessageInput("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={`flex flex-col h-full border rounded-lg overflow-hidden ${className}`}>
      <div className="p-3 border-b bg-background flex items-center justify-between">
        <h3 className="font-semibold">Event Chat</h3>
        {showTipButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                  onClick={onOpenTipModal}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Tip
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send a tip to the event creator</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <ScrollArea className="flex-grow p-4" style={{ maxHeight }}>
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Info className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t">
        {isConnected ? (
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-10 resize-none"
              rows={1}
            />
            <Button
              variant="default"
              size="icon"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground">
            Connect your wallet to join the conversation
          </p>
        )}
      </div>
    </div>
  )
}

interface ChatMessageItemProps {
  message: ChatMessage
}

function ChatMessageItem({ message }: ChatMessageItemProps) {
  // Format the timestamp relative to now (e.g., "2 minutes ago")
  const formattedTime = message.timestamp 
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true }) 
    : "just now"

  return (
    <div className={`flex flex-col ${message.isTip ? "bg-amber-50 p-2 rounded" : ""}`}>
      <div className="flex justify-between items-start">
        <span className="font-medium text-sm">{message.sender}</span>
        <span className="text-xs text-muted-foreground">{formattedTime}</span>
      </div>
      <p className="text-sm mt-1">{message.message}</p>
      {message.isTip && message.tipAmount && (
        <div className="text-xs mt-1 text-amber-600 flex items-center">
          <DollarSign className="h-3 w-3 mr-1" />
          Tipped {message.tipAmount} ETH
        </div>
      )}
    </div>
  )
} 