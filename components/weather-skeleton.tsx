
import { Skeleton } from "@/components/ui/skeleton"

export function WeatherSkeleton() {
  return (
    <div className="container mx-auto max-w-[800px] w-full mt-5 rounded-[28px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-white/15 backdrop-blur-lg px-7 py-7">
      <div className="flex flex-col items-center mb-8">
        <Skeleton className="h-10 w-48 mb-2 bg-white/20" />
        <Skeleton className="h-6 w-64 bg-white/10" />
      </div>

      <div className="flex justify-center mb-8">
        <Skeleton className="h-14 w-full max-w-[500px] rounded-full bg-white/20" />
      </div>

      <div className="flex flex-col items-center my-8">
        <Skeleton className="h-8 w-64 mb-4 bg-white/20" />
        <Skeleton className="h-40 w-40 rounded-full mb-4 bg-white/20" />
        <Skeleton className="h-24 w-48 mb-4 bg-white/20" />
        <Skeleton className="h-8 w-32 mb-2 bg-white/20" />
        <Skeleton className="h-6 w-40 bg-white/10" />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 my-7">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/10" />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[200px] w-full rounded-xl bg-white/10" />
        <Skeleton className="h-[300px] w-full rounded-xl bg-white/10" />
      </div>
    </div>
  )
}
