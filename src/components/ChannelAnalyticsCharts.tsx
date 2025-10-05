import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Users, Eye, Calendar } from 'lucide-react';

interface AnalyticsData {
  views: Array<{ date: string; views: number }>;
  subscribers: Array<{ date: string; gained: number; lost: number; net: number }>;
  dateRange: { start: string; end: string; days: number };
  isMockData?: boolean;
}

interface ChannelAnalyticsChartsProps {
  className?: string;
}

export default function ChannelAnalyticsCharts({ className }: ChannelAnalyticsChartsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // Add cache-busting parameter to ensure fresh data
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/youtube/analytics-charts?days=10&t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalyticsData(data.data);
        setError(null);
        console.log('📊 Analytics data refreshed:', data.data.dateRange);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Custom tooltip for views chart
  const ViewsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleDateString();
      const isToday = new Date(label).toDateString() === new Date().toDateString();
      const isFuture = new Date(label) > new Date();
      
      return (
        <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold text-black">
            {date} {isToday ? '(Today)' : ''} {isFuture ? '(Future)' : ''}
          </p>
          <p className="text-[#4DA6FF] font-bold">
            <Eye className="w-4 h-4 inline mr-1" />
            {isFuture ? 'No data yet' : `${payload[0].value.toLocaleString()} views`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for subscribers chart
  const SubscribersTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleDateString();
      const isToday = new Date(label).toDateString() === new Date().toDateString();
      const isFuture = new Date(label) > new Date();
      
      return (
        <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold text-black">
            {date} {isToday ? '(Today)' : ''} {isFuture ? '(Future)' : ''}
          </p>
          <p className="text-[#C8FF3D] font-bold">
            <Users className="w-4 h-4 inline mr-1" />
            {isFuture ? 'Projected growth' : `+${payload[0].value} net subscribers`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
        {/* Loading Views Chart */}
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <CardHeader className="bg-gradient-to-r from-[#4DA6FF]/10 to-[#7A3BFF]/10 border-b-4 border-black">
            <div className="h-6 bg-gray-200 border-2 border-gray-300 animate-pulse w-1/2"></div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 bg-gray-100 border-2 border-gray-200 animate-pulse"></div>
          </CardContent>
        </Card>

        {/* Loading Subscribers Chart */}
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <CardHeader className="bg-gradient-to-r from-[#C8FF3D]/20 to-[#FF6A4D]/10 border-b-4 border-black">
            <div className="h-6 bg-gray-200 border-2 border-gray-300 animate-pulse w-1/2"></div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 bg-gray-100 border-2 border-gray-200 animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-red-50">
          <CardContent className="p-8 text-center">
            <h3 className="font-bold text-red-700 text-lg mb-2">📊 Analytics Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-4 py-2 border-2 border-black font-bold hover:bg-red-600"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) return null;

  const totalViews = analyticsData.views.filter(day => day.views > 0).reduce((sum, day) => sum + day.views, 0);
  const totalNetSubscribers = analyticsData.subscribers.filter(day => day.net !== 0).reduce((sum, day) => sum + day.net, 0);
  const actualDataDays = analyticsData.views.filter(day => day.views > 0).length || 1;
  const avgDailyViews = Math.round(totalViews / actualDataDays);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Channel Views Trend - Line Chart */}
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
        <CardHeader className="bg-gradient-to-r from-[#4DA6FF]/10 to-[#7A3BFF]/10 border-b-4 border-black">
          <CardTitle className="font-bold text-lg text-black flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4DA6FF] border-2 border-black flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            📈 Channel Views Trend
          </CardTitle>
          <div className="flex items-center gap-4 mt-2">
            <Badge className="bg-[#4DA6FF] text-white border-2 border-black font-bold text-xs">
              LAST 10 DAYS + FORECAST
            </Badge>
            <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold text-xs">
              NEW CHANNEL
            </Badge>
            {analyticsData.isMockData && (
              <Badge className="bg-yellow-500 text-black border-2 border-black font-bold text-xs">
                DEMO DATA
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.views}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  stroke="#000"
                  strokeWidth={2}
                />
                <YAxis 
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  stroke="#000"
                  strokeWidth={2}
                />
                <Tooltip content={<ViewsTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#4DA6FF" 
                  strokeWidth={4}
                  dot={{ fill: '#4DA6FF', strokeWidth: 3, stroke: '#000', r: 6 }}
                  activeDot={{ r: 8, stroke: '#000', strokeWidth: 3, fill: '#C8FF3D' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 border-2 border-blue-200">
              <div className="text-lg font-bold text-blue-700">{totalViews.toLocaleString()}</div>
              <div className="text-xs text-blue-600 font-medium">Total Views</div>
            </div>
            <div className="p-3 bg-purple-50 border-2 border-purple-200">
              <div className="text-lg font-bold text-purple-700">{avgDailyViews.toLocaleString()}</div>
              <div className="text-xs text-purple-600 font-medium">Avg/Day</div>
            </div>
            <div className="p-3 bg-green-50 border-2 border-green-200">
              <div className="text-lg font-bold text-green-700">
                {analyticsData.views.length > 1 && analyticsData.views[analyticsData.views.length - 1].views > analyticsData.views[analyticsData.views.length - 2].views ? '+' : ''}
                {(((analyticsData.views[analyticsData.views.length - 1]?.views || 0) - (analyticsData.views[analyticsData.views.length - 2]?.views || 0)) / (analyticsData.views[analyticsData.views.length - 2]?.views || 1) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-green-600 font-medium">vs Yesterday</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriber Growth - Bar Chart */}
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
        <CardHeader className="bg-gradient-to-r from-[#C8FF3D]/20 to-[#FF6A4D]/10 border-b-4 border-black">
          <CardTitle className="font-bold text-lg text-black flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF6A4D] border-2 border-black flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            📊 Subscriber Growth
          </CardTitle>
          <div className="flex items-center gap-4 mt-2">
            <Badge className="bg-[#FF6A4D] text-white border-2 border-black font-bold text-xs">
              LAST 10 DAYS + FORECAST
            </Badge>
            <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold text-xs">
              NEW CHANNEL
            </Badge>
            {analyticsData.isMockData && (
              <Badge className="bg-yellow-500 text-black border-2 border-black font-bold text-xs">
                DEMO DATA
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.subscribers}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  stroke="#000"
                  strokeWidth={2}
                />
                <YAxis 
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  stroke="#000"
                  strokeWidth={2}
                />
                <Tooltip content={<SubscribersTooltip />} />
                <Bar 
                  dataKey="net" 
                  fill="#C8FF3D"
                  stroke="#000"
                  strokeWidth={2}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-orange-50 border-2 border-orange-200">
              <div className="text-lg font-bold text-orange-700">{totalNetSubscribers > 0 ? '+' : ''}{totalNetSubscribers}</div>
              <div className="text-xs text-orange-600 font-medium">Net Growth</div>
            </div>
            <div className="p-3 bg-yellow-50 border-2 border-yellow-200">
              <div className="text-lg font-bold text-yellow-700">
                +{analyticsData.subscribers.reduce((sum, day) => sum + day.gained, 0)}
              </div>
              <div className="text-xs text-yellow-600 font-medium">Total Gained</div>
            </div>
            <div className="p-3 bg-red-50 border-2 border-red-200">
              <div className="text-lg font-bold text-red-700">
                -{analyticsData.subscribers.reduce((sum, day) => sum + day.lost, 0)}
              </div>
              <div className="text-xs text-red-600 font-medium">Total Lost</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}