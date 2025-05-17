"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EventRoomRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to event market when no event ID is specified
    router.push("/event-market");
  }, [router]);

  return (
    <div className="container mx-auto py-6 flex items-center justify-center">
      <p>Redirecting to event market...</p>
    </div>
  );
}