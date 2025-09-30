'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, Eye, Calendar, Activity } from 'lucide-react';

interface DataVisualizationProps {
  videoId?: string;
  sentimentData?: {
    positive: { count: number; percentage: string };
    negative: { count: number; percentage: string };
    neutral: { count: number; percentage: string };
  };
  totalComments: number;
  analyzedComments?: number;
  loading?: boolean;
  className?: string;
}

interface ViewsData {
  date: string;
  views: number;
  dailyViews: number;
}

interface AnalyticsData {
  viewsPerDay: ViewsData[];
  totalViews: number;
  averageDailyViews: number;
  dataSource: 'analytics' | 'fallback';
  errorReason?: string;
  summary: {
    totalWatchTime: number;
    averageViewDuration: number;
    likes: number;
    comments: number;
  };
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  videoId,
  sentimentData,
  totalComments,
  analyzedComments,
  loading = false,
  className = ''
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch real analytics data
  useEffect(() => {
    if (!videoId) return;

    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        console.log('📊 Fetching real YouTube Analytics data...');
        const response = await fetch(`/api/youtube/analytics?videoId=${videoId}`);
        const data = await response.json();

        if (data.success) {
          setAnalyticsData(data.data);
          console.log(`✅ Analytics loaded: ${data.data.dataSource} data with ${data.data.viewsPerDay.length} days`);
        } else {
          console.error('Failed to fetch analytics:', data.error);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [videoId]);

  // Prepare sentiment chart data with validation
  const sentimentChartData = sentimentData ? [
    {
      name: 'Positive',
      value: sentimentData.positive.count,
      percentage: parseFloat(sentimentData.positive.percentage),
      color: '#C8FF3D'
    },
    {
      name: 'Neutral',
      value: sentimentData.neutral.count,
      percentage: parseFloat(sentimentData.neutral.percentage),
      color: '#6B7280'
    },
    {
      name: 'Negative',
      value: sentimentData.negative.count,
      percentage: parseFloat(sentimentData.negative.percentage),
      color: '#FF6A4D'
    }
  ].filter(item => item.value > 0) : [];

  // Calculate total for validation
  const calculatedTotal = sentimentChartData.reduce((sum, item) => sum + item.value, 0);
  const percentageSum = sentimentChartData.reduce((sum, item) => sum + item.percentage, 0);
  
  // Debug sentiment data accuracy
  useEffect(() => {
    if (sentimentData && totalComments > 0) {
      const actualAnalyzed = analyzedComments || totalComments;
      console.log('📊 Sentiment Analysis Debug:', {
        totalCommentsProvided: totalComments,
        actualAnalyzedComments: actualAnalyzed,
        pieChartTotal: calculatedTotal,
        sentimentBreakdown: sentimentChartData,
        percentageSum: percentageSum.toFixed(1) + '%',
        dataAccuracy: calculatedTotal === actualAnalyzed ? '✅ ACCURATE' : '❌ MISMATCH'
      });
      
      if (calculatedTotal !== actualAnalyzed) {
        console.warn(`⚠️ Data mismatch: Pie chart shows ${calculatedTotal} analyzed but ${actualAnalyzed} were actually processed`);
      }
    }
  }, [sentimentData, totalComments, analyzedComments, calculatedTotal, percentageSum]);

  // Custom tooltip for sentiment pie chart
  const SentimentTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
          <p className="font-bold text-black text-lg">{data.name}</p>
          <p className="text-gray-700 font-medium">{data.value} comments ({data.percentage.toFixed(1)}%)</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for views chart
  const ViewsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(label);
      return (
        <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
          <p className="font-bold text-black text-lg">{date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}</p>
          <p className="text-purple-700 font-medium">Daily Views: {data.dailyViews.toLocaleString()}</p>
          <p className="text-gray-700 font-medium">Total Views: {data.views.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.ceil((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))} days since publish
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={`p-8 border-4 border-purple-400 bg-white shadow-[8px_8px_0px_0px_#7A3BFF] ${className}`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-purple-800 uppercase tracking-wide">DATA VISUALIZATION</h3>
                <p className="text-purple-600 font-bold">Loading professional analytics...</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Sentiment Chart Skeleton */}
            <div className="h-80 bg-gradient-to-br from-purple-100 to-blue-100 border-4 border-purple-300 animate-pulse rounded-lg"></div>
            
            {/* Views Chart Skeleton */}
            <div className="h-80 bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-blue-300 animate-pulse rounded-lg"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-8 border-4 border-purple-400 bg-white shadow-[8px_8px_0px_0px_#7A3BFF] ${className}`}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-purple-800 uppercase tracking-wide">DATA VISUALIZATION</h3>
              <p className="text-purple-600 font-bold">Professional analytics and insights</p>
            </div>
          </div>
          {analyticsData && (
            <Badge className={`font-bold px-4 py-2 text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              analyticsData.dataSource === 'analytics' 
                ? 'bg-lime-400 text-black' 
                : 'bg-orange-400 text-black'
            }`}>
              {analyticsData.dataSource === 'analytics' ? '📊 REAL ANALYTICS DATA' : '🔄 INTELLIGENT FALLBACK'}
            </Badge>
          )}
          {analyticsLoading && (
            <Badge className="bg-blue-400 text-black font-bold px-4 py-2 text-sm border-2 border-black">
              📡 Checking Analytics Access...
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Sentiment Distribution Chart */}
          <Card className="p-6 border-4 border-lime-400 bg-lime-50 shadow-[6px_6px_0px_0px_#65A30D]">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <Activity className="h-6 w-6 text-lime-700" />
                <h4 className="text-xl font-black text-lime-800 uppercase tracking-wide">Comment Sentiment</h4>
              </div>
              <div className="flex items-center space-x-4">
                <p className="text-lime-700 font-medium">
                  {analyzedComments || totalComments} analyzed 
                  {analyzedComments && analyzedComments !== totalComments && (
                    <span className="text-lime-600">/ {totalComments} total</span>
                  )} comments
                </p>
                {calculatedTotal !== (analyzedComments || totalComments) && (
                  <Badge className="bg-red-500 text-white border-2 border-red-700 font-bold text-xs">
                    ⚠️ MISMATCH: {calculatedTotal} in chart
                  </Badge>
                )}
                <Badge className="bg-lime-600 text-white border-2 border-lime-800 font-bold text-xs">
                  {percentageSum.toFixed(1)}% distributed
                </Badge>
              </div>
            </div>

            {sentimentChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="#000000"
                      strokeWidth={3}
                    >
                      {sentimentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<SentimentTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-lime-700">
                <p className="font-medium">No sentiment data available</p>
              </div>
            )}

            {/* Sentiment Legend */}
            {sentimentChartData.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                {sentimentChartData.map((item, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="w-6 h-6 mx-auto mb-2 border-2 border-black"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <p className="font-bold text-sm text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-600 font-medium">{item.percentage.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Views Timeline Chart */}
          <Card className="p-6 border-4 border-blue-400 bg-blue-50 shadow-[6px_6px_0px_0px_#2563EB]">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <Eye className="h-6 w-6 text-blue-700" />
                <h4 className="text-xl font-black text-blue-800 uppercase tracking-wide">Views Per Day</h4>
              </div>
              {analyticsData && (
                <div className="flex items-center space-x-4">
                  <p className="text-blue-700 font-medium">
                    {analyticsData.totalViews.toLocaleString()} total views
                  </p>
                  <Badge className="bg-blue-600 text-white font-bold text-xs border-2 border-blue-800">
                    {analyticsData.averageDailyViews.toLocaleString()}/day avg
                  </Badge>
                </div>
              )}
            </div>

            {analyticsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse mx-auto mb-4"></div>
                  <p className="text-blue-700 font-medium">Loading analytics...</p>
                </div>
              </div>
            ) : analyticsData && analyticsData.viewsPerDay.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.viewsPerDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeWidth={1} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                      stroke="#374151"
                      strokeWidth={2}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                      tickFormatter={(value) => value.toLocaleString()}
                      stroke="#374151"
                      strokeWidth={2}
                    />
                    <Tooltip content={<ViewsTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="dailyViews" 
                      stroke="#2563EB" 
                      strokeWidth={4}
                      dot={{ fill: '#2563EB', strokeWidth: 3, stroke: '#000000', r: 5 }}
                      activeDot={{ r: 8, stroke: '#000000', strokeWidth: 3, fill: '#C8FF3D' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-blue-700">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="font-medium">No analytics data available</p>
                  <p className="text-sm text-blue-600">Connect your channel for detailed insights</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Analytics Summary */}
        {analyticsData && (
          <Card className="p-6 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 text-white border-4 border-purple-800 shadow-[6px_6px_0px_0px_#5B21B6]">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-black mb-2">{analyticsData.totalViews.toLocaleString()}</div>
                <div className="text-purple-100 font-bold uppercase tracking-wide">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black mb-2">{Math.round(analyticsData.summary.totalWatchTime / 60).toLocaleString()}</div>
                <div className="text-purple-100 font-bold uppercase tracking-wide">Watch Hours</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black mb-2">{analyticsData.summary.likes.toLocaleString()}</div>
                <div className="text-purple-100 font-bold uppercase tracking-wide">Total Likes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black mb-2">{Math.round(analyticsData.summary.averageViewDuration / 60)}m</div>
                <div className="text-purple-100 font-bold uppercase tracking-wide">Avg Duration</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
};

export default DataVisualization;