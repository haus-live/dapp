import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60 dark:bg-muted/40",
        className
      )}
      {...props}
    />
  )
}

interface CardSkeletonProps {
  imageHeight?: string
  hasImage?: boolean
  hasFooter?: boolean
  className?: string
}

export function CardSkeleton({
  imageHeight = "aspect-video",
  hasImage = true,
  hasFooter = true,
  className,
}: CardSkeletonProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-background", className)}>
      {hasImage && <div className={cn("w-full bg-muted animate-pulse", imageHeight)} />}
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-2 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        {hasFooter && (
          <div className="pt-2">
            <Skeleton className="h-9 w-full mt-4" />
          </div>
        )}
      </div>
    </div>
  )
}
