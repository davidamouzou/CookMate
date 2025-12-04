import { Skeleton } from "../ui/skeleton";

export const DetailRecipeSkeleton = () => {
  return (
    <div className="relative h-screen overflow-hidden">
      <div className="absolute p-2 md:p-5 top-0 bottom-0 left-0 right-0 bg-background/80 backdrop-blur-3xl overflow-y-scroll md:overflow-y-hidden">
        <div className="rounded-lg bg-background/50 p-2 mb-4 flex items-center justify-between">
          <Skeleton className="w-32 h-10 rounded-lg" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>

        <div className="flex flex-col md:flex-row h-full gap-5">
          {/* Left skeleton */}
          <div className="md:w-80 rounded-xl md:h-full bg-white/50 p-2">
            <Skeleton className="w-full h-48 rounded-xl mb-5" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex flex-wrap gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="w-20 h-8 rounded-lg" />
                ))}
              </div>
            </div>
          </div>

          {/* Right skeleton */}
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};