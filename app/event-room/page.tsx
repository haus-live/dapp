"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { TipModal } from "@/components/tip-modal";

export default function EventRoom() {
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(1);
  const { hasDelegation } = useAuth();

  const handleTipSuccess = () => {
    // Handle successful tip
    setIsTipModalOpen(false);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Event Room</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden aspect-video">
          {/* Video player would go here */}
          <div className="flex items-center justify-center h-full text-white">
            Video stream will appear here
          </div>
        </div>

        <div className="bg-card rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
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
        hasDelegation={hasDelegation}
      />
    </div>
  );
}