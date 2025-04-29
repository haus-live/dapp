"use client"

import { CardSkeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container py-10 space-y-8">
      <div className="h-8 w-1/3 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} hasImage imageHeight="h-[240px]" hasFooter />
        ))}
      </div>
    </div>
  )
}
