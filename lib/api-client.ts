import { Event, ChatMessage, Ticket, Tip, EventCategory } from './types';
import { mockEvents, getEventsByCategory } from '@/data/mock-events';

/**
 * Centralized API client for all data fetching operations
 * This allows us to easily switch between mock data and real API calls
 */
class ApiClient {
  private useMockData = true; // Toggle for development/testing

  // Event-related API calls
  async getEvents(): Promise<Event[]> {
    if (this.useMockData) {
      // Return mock events with proper typing
      return mockEvents.map(event => ({
        id: event.id.toString(),
        title: event.title,
        creator: event.creator,
        creatorAddress: `0x${Math.random().toString(16).substring(2, 14)}`, // Mock creator address
        category: event.category,
        date: event.date,
        duration: event.duration,
        participants: event.participants,
        maxParticipants: event.maxParticipants,
        ticketPrice: event.ticketPrice,
        description: event.description,
        image: event.image,
        status: "upcoming", // Default status
        videoUrl: event.videoUrl,
      }));
    }
    
    try {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return await response.json();
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  async getEventById(id: string): Promise<Event | null> {
    if (this.useMockData) {
      const event = mockEvents.find(e => e.id.toString() === id);
      if (!event) return null;
      
      return {
        id: event.id.toString(),
        title: event.title,
        creator: event.creator,
        creatorAddress: `0x${Math.random().toString(16).substring(2, 14)}`,
        category: event.category,
        date: event.date,
        duration: event.duration,
        participants: event.participants,
        maxParticipants: event.maxParticipants,
        ticketPrice: event.ticketPrice,
        description: event.description,
        image: event.image,
        status: "upcoming",
        videoUrl: event.videoUrl,
      };
    }
    
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch event ${id}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      return null;
    }
  }

  async getEventsByCategory(category: EventCategory): Promise<Event[]> {
    if (this.useMockData) {
      const events = getEventsByCategory(category);
      
      return events.map(event => ({
        id: event.id.toString(),
        title: event.title,
        creator: event.creator,
        creatorAddress: `0x${Math.random().toString(16).substring(2, 14)}`,
        category: event.category,
        date: event.date,
        duration: event.duration,
        participants: event.participants,
        maxParticipants: event.maxParticipants,
        ticketPrice: event.ticketPrice,
        description: event.description,
        image: event.image,
        status: "upcoming",
        videoUrl: event.videoUrl,
      }));
    }
    
    try {
      const response = await fetch(`/api/events/category/${category}`);
      if (!response.ok) throw new Error(`Failed to fetch events for category ${category}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching events for category ${category}:`, error);
      return [];
    }
  }

  async createEvent(event: Omit<Event, 'id'>): Promise<Event | null> {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      
      if (!response.ok) throw new Error('Failed to create event');
      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }

  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event | null> {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) throw new Error(`Failed to update event ${id}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating event ${id}:`, error);
      return null;
    }
  }

  // Chat-related API calls
  async getEventMessages(eventId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`/api/events/${eventId}/messages`);
      if (!response.ok) throw new Error(`Failed to fetch messages for event ${eventId}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching messages for event ${eventId}:`, error);
      return [];
    }
  }

  async sendMessage(eventId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage | null> {
    try {
      const response = await fetch(`/api/events/${eventId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) throw new Error(`Failed to send message for event ${eventId}`);
      return await response.json();
    } catch (error) {
      console.error(`Error sending message for event ${eventId}:`, error);
      return null;
    }
  }

  // Ticketing API calls
  async verifyTicket(eventId: string, userAddress: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/events/${eventId}/verify-ticket?address=${userAddress}`);
      if (!response.ok) throw new Error(`Failed to verify ticket for event ${eventId}`);
      return await response.json();
    } catch (error) {
      console.error(`Error verifying ticket for event ${eventId}:`, error);
      return false;
    }
  }

  async purchaseTicket(eventId: string, userAddress: string): Promise<Ticket | null> {
    try {
      const response = await fetch(`/api/events/${eventId}/purchase-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress }),
      });
      
      if (!response.ok) throw new Error(`Failed to purchase ticket for event ${eventId}`);
      return await response.json();
    } catch (error) {
      console.error(`Error purchasing ticket for event ${eventId}:`, error);
      return null;
    }
  }

  // Tipping API calls
  async sendTip(tip: Omit<Tip, 'id' | 'timestamp'>): Promise<Tip | null> {
    try {
      const response = await fetch(`/api/events/${tip.eventId}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tip),
      });
      
      if (!response.ok) throw new Error(`Failed to send tip for event ${tip.eventId}`);
      return await response.json();
    } catch (error) {
      console.error(`Error sending tip for event ${tip.eventId}:`, error);
      return null;
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Export a type that combines all API methods for reusability
export type ApiService = typeof apiClient; 