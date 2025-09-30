import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Zap, BarChart3, Activity, Users, Search, MessageCircle } from 'lucide-react';

interface AdvancedMetricsProps {
  analytics?: {
    engagementRate: number;
    likeToViewRatio: number;
    commentToViewRatio: number;
    viralityScore: number;
    viewVelocity: number;
    daysSincePublish: number;
    estimatedReach: number;
    estimatedImpressions: number;
  };
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

function MetricCard({ title, value, subtitle, icon, color, badge, trend, loading }: MetricCardProps) {
  if (loading) {
    return (
      <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 border-2 border-gray-300 mb-3"></div>
            <div className="h-8 bg-gray-200 border-2 border-gray-300 mb-2"></div>
            <div className="h-4 bg-gray-200 border-2 border-gray-300 w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Card className={`border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-gradient-to-br from-white to-${color}/10 group`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 bg-${color} border-4 border-black flex items-center justify-center group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          {badge && (
            <Badge className="bg-black text-white border-2 border-black font-bold text-xs">
              {badge}
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-black group-hover:text-gray-800 transition-colors">
            {title}
          </h3>
          
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black text-${color === '[#7A3BFF]' ? '[#7A3BFF]' : color}`}>
              {value}
            </span>
            {trend && getTrendIcon()}
          </div>
          
          <p className="text-sm font-medium text-gray-600">
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdvancedMetrics({ analytics, loading }: AdvancedMetricsProps) {
  if (loading) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
          <CardTitle className="text-xl font-bold text-black">📊 Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <MetricCard
                key={i}
                title=""
                value=""
                subtitle=""
                icon={<div className="w-6 h-6 bg-gray-300"></div>}
                color="gray-200"
                loading={true}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
          <CardTitle className="text-xl font-bold text-black">📊 Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Select a video to view advanced analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEngagementTrend = (rate: number) => {
    if (rate > 5) return 'up';
    if (rate < 2) return 'down';
    return 'neutral';
  };

  const getViralityLevel = (score: number) => {
    if (score > 70) return 'VIRAL';
    if (score > 40) return 'HIGH';
    if (score > 20) return 'MEDIUM';
    return 'LOW';
  };

  const getSEOScore = (analytics: any) => {
    // Simple SEO score calculation based on engagement metrics
    const base = analytics.engagementRate * 10;
    const bonus = analytics.commentToViewRatio * 50;
    return Math.min(100, Math.round(base + bonus));
  };

  return (
    <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-black">📊 Performance Analytics</CardTitle>
          <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold">
            LIVE DATA
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Engagement Rate */}
          <MetricCard
            title="Engagement Rate"
            value={`${analytics.engagementRate.toFixed(1)}%`}
            subtitle="Likes + Comments / Views"
            icon={<Users className="w-6 h-6 text-white" />}
            color="[#7A3BFF]"
            trend={getEngagementTrend(analytics.engagementRate)}
            badge={analytics.engagementRate > 5 ? "EXCELLENT" : analytics.engagementRate > 2 ? "GOOD" : "NEEDS WORK"}
          />

          {/* Virality Score */}
          <MetricCard
            title="Virality Score"
            value={analytics.viralityScore.toFixed(0)}
            subtitle="Potential for viral spread"
            icon={<Zap className="w-6 h-6 text-white" />}
            color="[#FF6A4D]"
            trend={analytics.viralityScore > 50 ? 'up' : analytics.viralityScore > 20 ? 'neutral' : 'down'}
            badge={getViralityLevel(analytics.viralityScore)}
          />

          {/* Like-to-View Ratio */}
          <MetricCard
            title="Like-to-View Ratio"
            value={`${analytics.likeToViewRatio.toFixed(2)}%`}
            subtitle="Audience approval rate"
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            color="[#C8FF3D]"
            trend={analytics.likeToViewRatio > 3 ? 'up' : analytics.likeToViewRatio > 1 ? 'neutral' : 'down'}
          />

          {/* View Velocity */}
          <MetricCard
            title="View Velocity"
            value={analytics.viewVelocity.toLocaleString()}
            subtitle={`Views per day (${analytics.daysSincePublish}d old)`}
            icon={<Activity className="w-6 h-6 text-white" />}
            color="[#4DA6FF]"
            trend={analytics.viewVelocity > 1000 ? 'up' : analytics.viewVelocity > 100 ? 'neutral' : 'down'}
          />

          {/* SEO Performance */}
          <MetricCard
            title="🔍 SEO Performance"
            value={getSEOScore(analytics)}
            subtitle="Search optimization score"
            icon={<Search className="w-6 h-6 text-white" />}
            color="purple-500"
            trend={getSEOScore(analytics) > 70 ? 'up' : getSEOScore(analytics) > 40 ? 'neutral' : 'down'}
            badge={getSEOScore(analytics) > 80 ? "OPTIMIZED" : "IMPROVE"}
          />

          {/* Comment Engagement */}
          <MetricCard
            title="💬 Comment Rate"
            value={`${analytics.commentToViewRatio.toFixed(3)}%`}
            subtitle="Comments per view"
            icon={<MessageCircle className="w-6 h-6 text-white" />}
            color="orange-500"
            trend={analytics.commentToViewRatio > 0.5 ? 'up' : analytics.commentToViewRatio > 0.1 ? 'neutral' : 'down'}
          />
        </div>

        {/* Performance Summary */}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-4 border-black">
          <h4 className="font-bold text-lg text-black mb-4">📈 Performance Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-bold text-sm text-gray-800 mb-2">Estimated Reach</h5>
              <p className="text-2xl font-bold text-[#7A3BFF]">{analytics.estimatedReach.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Unique viewers reached</p>
            </div>
            <div>
              <h5 className="font-bold text-sm text-gray-800 mb-2">Estimated Impressions</h5>
              <p className="text-2xl font-bold text-[#4DA6FF]">{analytics.estimatedImpressions.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Total times shown</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}