export default function Loading() {
  return (
    <div className="container mx-auto py-6 flex items-center justify-center">
      <div className="animate-pulse text-center">
        <h1 className="text-3xl font-bold mb-6">Loading Event...</h1>
        <div className="h-[400px] w-full max-w-4xl bg-muted/20 rounded-lg"></div>
      </div>
    </div>
  );
} 