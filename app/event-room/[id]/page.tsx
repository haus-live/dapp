"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { TipModal } from "@/components/tip-modal";
import { useEvent } from "@/hooks/use-event";

export default function EventRoom() {
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(1);
  const { userProfile } = useAuth();
  const params = useParams();
  const eventId = params.id as string;
  
  // Use the event hook to fetch details with the correct options format
  const { event, isLoading, error } = useEvent({ initialId: eventId });

  const handleTipSuccess = () => {
    // Handle successful tip
    setIsTipModalOpen(false);
  };

  if (isLoading) {
    return <div className="container mx-auto py-6">Loading event...</div>;
  }

  if (error || !event) {
    return <div className="container mx-auto py-6">Error loading event. Please check the event ID and try again.</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">{event?.title || "Event Room"}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden aspect-video">
          {/* Video player would go here */}
          <div className="flex items-center justify-center h-full text-white">
            Video stream will appear here
          </div>
        </div>

        <div className="bg-card rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
          {event && (
            <div className="mb-4">
              <p>{event.description}</p>
            </div>
          )}
          <button 
            className="bg-primary text-white rounded-lg px-4 py-2 w-full"
            onClick={() => setIsTipModalOpen(true)}
          >
            Tip Artist
          </button>
        </div>
      </div>

      <TipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        onSuccess={handleTipSuccess}
        tipAmount={tipAmount}
        onTipAmountChange={setTipAmount}
        hasDelegation={!!userProfile}
      />
    </div>
  );
} 