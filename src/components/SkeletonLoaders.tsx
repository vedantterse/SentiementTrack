import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 border-2 border-gray-300 ${className}`}></div>
  );
}

export function VideoAnalysisSkeleton() {
  return (
    <div className="space-y-6">
      {/* Video Header Skeleton */}
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-4 border-black">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>

      {/* Metrics Skeleton */}
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-4 border-black">
          <CardTitle className="text-xl font-bold text-black">📊 Loading Analytics...</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="w-12 h-12" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments Skeleton */}
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-4 border-black">
          <CardTitle className="text-xl font-bold text-black">💬 Loading Comments...</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-2 border-gray-200 p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights Skeleton */}
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-4 border-black">
          <CardTitle className="text-xl font-bold text-black">🧠 Generating Insights...</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-4 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-10 h-10" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="border-2 border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-4 mt-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="w-12 h-12" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}