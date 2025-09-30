"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Users, MessageSquare, TrendingUp, Clock, Target, Zap, Heart, Award, Lock as LockIcon } from "lucide-react";
import Link from "next/link";
import { ConnectAccountButton } from "@/components/ConnectAccountButton";
import { VideoData, CommentData, AnalyticsData, ParsedUrl } from "@/types";
import { formatNumber, parseDuration, getTimeElapsed } from "@/lib/youtube";
import { formatAnalyticsNumber } from "@/lib/metrics";
import SentimentPieChart from "@/components/SentimentPieChart";
import NicheTrendFinder from "@/components/NicheTrendFinder";
import AIRecommendations from "@/components/AIRecommendations";

interface AnalysisState {
  loading: boolean;
  completed: boolean;
  error?: string;
  videoData?: VideoData;
  channelData?: any; // Channel info from video
  comments?: CommentData[];
  displayedComments?: CommentData[];
  analytics?: AnalyticsData;
  summary?: string[];
  totalCommentsAnalyzed?: number;
  totalCommentsAvailable?: number;
  nextPageToken?: string;
  expandedReplies?: Record<string, string>; // commentId -> reply text
  pieChartSentiment?: { positive: number; negative: number; neutral: number; total: number };
  nicheTrends?: any; // Niche trends analysis results
}

export default function TryItPage() {
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisState>({
    loading: false,
    completed: false,
    error: undefined,
    videoData: undefined,
    channelData: undefined,
    comments: undefined,
    displayedComments: undefined,
    analytics: undefined,
    summary: undefined,
    totalCommentsAnalyzed: undefined,
    totalCommentsAvailable: undefined,
    nextPageToken: undefined,
    expandedReplies: {},
    pieChartSentiment: undefined,
    nicheTrends: undefined
  });

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    
    setAnalysis({ 
      loading: true, 
      completed: false,
      error: undefined,
      videoData: undefined,
      channelData: undefined,
      comments: undefined,
      displayedComments: undefined,
      analytics: undefined,
      summary: undefined,
      totalCommentsAnalyzed: undefined,
      totalCommentsAvailable: undefined,
      nextPageToken: undefined,
      expandedReplies: {},
      pieChartSentiment: undefined
    });
    
    try {
      // Step 1: Resolve URL type
      const resolveResponse = await fetch(`/api/demo/resolve?url=${encodeURIComponent(url)}`);
      const resolveData = await resolveResponse.json();
      
      if (!resolveData.success) {
        throw new Error(resolveData.error || 'Invalid URL');
      }
      
      const parsedUrl: ParsedUrl = resolveData.data;
      
      if (parsedUrl.type !== 'video') {
        throw new Error('Channel URLs are not supported in this demo version');
      }
      
      // Step 2: Fetch video data
      const videoResponse = await fetch(`/api/demo/video?videoId=${parsedUrl.id}`);
      const videoData = await videoResponse.json();
      
      if (!videoData.success) {
        throw new Error(videoData.error || 'Video not found');
      }
      
      // Step 2.5: Fetch channel data using channelId from video
      const channelResponse = await fetch(`/api/demo/channel?channelId=${videoData.data.channelId}`);
      const channelData = await channelResponse.json();
      
      // Step 3: Make concurrent requests for optimal performance
      const [pieChartCommentsResponse, displayCommentsResponse] = await Promise.all([
        // Get ALL comments for pie chart sentiment analysis
        fetch(`/api/demo/comments?videoId=${parsedUrl.id}&getAllComments=true`),
        // Get display comments (top 25) for UI
        fetch(`/api/demo/comments?videoId=${parsedUrl.id}&limit=25`)
      ]);
      
      const [pieChartCommentsData, displayCommentsData] = await Promise.all([
        pieChartCommentsResponse.json(),
        displayCommentsResponse.json()
      ]);
      
      if (!pieChartCommentsData.success || !displayCommentsData.success) {
        throw new Error(pieChartCommentsData.error || displayCommentsData.error || 'Comments not available');
      }
      
      // Get comments for different purposes
      const allCommentsForPieChart = pieChartCommentsData.data || [];
      const displayComments = displayCommentsData.data?.comments || [];
      
      // Step 4: Calculate pie chart sentiment from already analyzed comments + get analytics  
      const analyticsResponse = await fetch('/api/demo/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video: videoData.data,
          comments: displayComments,
          allVideos: [videoData.data]
        })
      });
      
      const analyticsResult = await analyticsResponse.json();
      
      // Calculate pie chart sentiment from already analyzed pie chart comments
      const pieChartSentiment = {
        positive: allCommentsForPieChart.filter((c: CommentData) => c.sentiment === 'positive').length,
        negative: allCommentsForPieChart.filter((c: CommentData) => c.sentiment === 'negative').length,
        neutral: allCommentsForPieChart.filter((c: CommentData) => c.sentiment === 'neutral').length,
        total: allCommentsForPieChart.length
      };
      
      // Display comments already have sentiment from the API (they come with sentiment analysis)
      const commentsWithSentiment = displayComments;
      
      // Step 5: Generate AI summary
      const summaryResponse = await fetch('/api/demo/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: parsedUrl.id,
          videoTitle: videoData.data.title,
          description: videoData.data.description,
          comments: displayComments
        })
      });
      
      const summaryResult = await summaryResponse.json();
      
      // Step 6: Analyze niche trends (replacing keywords)
      const trendsResponse = await fetch('/api/demo/niche-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoData: videoData.data
        })
      });
      
      const trendsResult = await trendsResponse.json();
      console.log('Niche Trends API Response:', trendsResult);
      console.log('Trends Response Status:', trendsResponse.status);
      console.log('Video Data sent to API:', videoData.data);
      
      // Update state with all data including sentiment analysis
      setAnalysis({
        loading: false,
        completed: true,
        videoData: videoData.data,
        channelData: channelData.success ? channelData.data : null,
        comments: commentsWithSentiment,
        displayedComments: commentsWithSentiment.slice(0, 10), // Show first 10
        analytics: analyticsResult.success ? analyticsResult.data.analytics : undefined,
        summary: summaryResult.success ? summaryResult.data.summary : undefined,
        totalCommentsAnalyzed: allCommentsForPieChart.length,
        totalCommentsAvailable: videoData.data.commentCount,
        nextPageToken: displayCommentsData.data?.nextPageToken,
        expandedReplies: {},
        pieChartSentiment: pieChartSentiment,
        nicheTrends: (trendsResponse.ok && trendsResult && !trendsResult.error) ? trendsResult : undefined
      });
      
    } catch (error) {
      setAnalysis({
        loading: false,
        completed: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        videoData: undefined,
        channelData: undefined,
        comments: undefined,
        displayedComments: undefined,
        analytics: undefined,
        summary: undefined,
        totalCommentsAnalyzed: undefined,
        totalCommentsAvailable: undefined,
        nextPageToken: undefined,
        expandedReplies: {},
        pieChartSentiment: undefined
      });
    }
  };

  const handleSuggestReply = async (comment: CommentData) => {
    if (!analysis.videoData) return;
    
    // Set loading state for this specific comment
    setAnalysis(prev => ({
      ...prev,
      expandedReplies: {
        ...prev.expandedReplies,
        [comment.id]: 'loading'
      }
    }));
    
    try {
      const response = await fetch('/api/demo/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: comment.textDisplay,
          videoTitle: analysis.videoData.title,
          videoDescription: analysis.videoData.description,
          videoSummary: analysis.summary?.join('. ') || analysis.videoData.description?.substring(0, 300) || 'Educational content',
          channelTitle: analysis.channelData?.title || 'Creator',
          commentLanguage: comment.detectedLanguage || 'en',
          commentSentiment: comment.sentiment || 'neutral'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Set the reply in state for inline display
        setAnalysis(prev => ({
          ...prev,
          expandedReplies: {
            ...prev.expandedReplies,
            [comment.id]: result.data.reply
          }
        }));
      } else {
        console.error('Reply generation error:', result.error);
        setAnalysis(prev => ({
          ...prev,
          expandedReplies: {
            ...prev.expandedReplies,
            [comment.id]: `Error: ${result.error || 'Failed to generate reply'}`
          }
        }));
      }
    } catch (error) {
      console.error('Reply generation fetch error:', error);
      setAnalysis(prev => ({
        ...prev,
        expandedReplies: {
          ...prev.expandedReplies,
          [comment.id]: 'Error: Failed to generate reply. Please try again.'
        }
      }));
    }
  };

  const handleToggleReply = (commentId: string) => {
    setAnalysis(prev => {
      const newExpandedReplies = { ...prev.expandedReplies };
      if (newExpandedReplies[commentId]) {
        delete newExpandedReplies[commentId];
      } else {
        newExpandedReplies[commentId] = '';
      }
      return {
        ...prev,
        expandedReplies: newExpandedReplies
      };
    });
  };

  const handleLoadMoreComments = () => {
    if (!analysis.comments) return;
    
    // Show all available comments instead of just first 10
    const allAvailableComments = analysis.comments;
    setAnalysis(prev => ({
      ...prev,
      displayedComments: allAvailableComments
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" />
              <div className="font-bold text-2xl tracking-tight">
                <span className="text-black">Sentiment</span>
                <span className="text-[#7A3BFF]">Track</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold">DEMO MODE</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-block bg-[#7A3BFF] text-white px-6 py-3 border-4 border-black transform rotate-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-bold text-lg">🚀 TRY IT LIVE</span>
          </div>
          <h1 className="font-bold text-4xl lg:text-5xl text-black">
            YouTube Analytics Demo
          </h1>
          <p className="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
            Paste any YouTube video  URL to see our AI-powered sentiment analysis in action
          </p>
        </div>

        {/* Input Panel */}
        <Card className="max-w-4xl mx-auto border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <CardHeader className="bg-gradient-to-r from-[#C8FF3D] to-[#B8EF2D] border-b-4 border-black">
            <CardTitle className="text-2xl font-bold text-black flex items-center gap-3">
              <Play className="w-6 h-6" />
              YouTube URL Analyzer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-800">
                Paste YouTube Video  URL:
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full p-4 border-4 border-black bg-white font-mono text-sm focus:outline-none focus:ring-4 focus:ring-[#7A3BFF]/30 transition-all"
                disabled={analysis.loading}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={analysis.loading || !url.trim()}
                  className="bg-[#FF6A4D] hover:bg-[#FF5A3D] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-lg px-8 py-4 flex-1"
                >
                  {analysis.loading ? "🔄 Analyzing..." : "🔍 Analyze Now"}
                </Button>
                <Button
                  variant="outline"
                  className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-lg px-8 py-4"
                  onClick={() => setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}
                >
                  📺 Use Sample
                </Button>
              </div>
            </div>
            
            {/* Helper Text */}
            <div className="bg-gradient-to-r from-[#4DA6FF]/10 to-[#7A3BFF]/10 border-2 border-[#4DA6FF] p-4">
              <p className="text-sm text-gray-700">
                <strong>💡 Demo Limits:</strong> Analysis limited to 25 comments for demonstration. 
                Full platform provides unlimited analysis with advanced AI insights.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progressive Loading State */}
        {analysis.loading && (
          <div className="max-w-6xl mx-auto space-y-6">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border-4 border-[#7A3BFF] border-t-transparent rounded-full animate-spin"></div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-black">Analyzing Video with AI</h3>
                    <p className="text-gray-600">Processing YouTube data and sentiment analysis...</p>
                  </div>
                </div>
                
                {/* Progressive loading steps */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Video Analysis */}
                    <div className="p-4 border-2 border-[#4DA6FF] bg-[#4DA6FF]/10 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-[#4DA6FF] rounded-full animate-pulse"></div>
                        <span className="font-semibold text-sm">Video Data</span>
                      </div>
                      <p className="text-xs text-gray-600">Fetching metadata & statistics</p>
                    </div>
                    
                    {/* Comments Analysis */}
                    <div className="p-4 border-2 border-[#FF6A4D] bg-[#FF6A4D]/10 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-[#FF6A4D] rounded-full animate-pulse"></div>
                        <span className="font-semibold text-sm">Comments</span>
                      </div>
                      <p className="text-xs text-gray-600">Analyzing sentiment with Groq + Mistral AI</p>
                    </div>
                    
                    {/* Pie Chart Analysis */}
                    <div className="p-4 border-2 border-[#7A3BFF] bg-[#7A3BFF]/10 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-[#7A3BFF] rounded-full animate-pulse"></div>
                        <span className="font-semibold text-sm">Sentiment Distribution</span>
                      </div>
                      <p className="text-xs text-gray-600">Processing all comments</p>
                    </div>
                    
                    {/* AI Summary */}
                    <div className="p-4 border-2 border-[#C8FF3D] bg-[#C8FF3D]/10 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-[#C8FF3D] rounded-full animate-pulse"></div>
                        <span className="font-semibold text-sm">AI Insights</span>
                      </div>
                      <p className="text-xs text-gray-600">Generating summary</p>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-2 border-[#7A3BFF]">
                    <p className="text-sm text-gray-700 font-medium">
                      ⏱️ <strong>Processing Time:</strong> 30-90 seconds for comprehensive AI analysis
                    </p>
                   
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {analysis.error && (
          <div className="max-w-4xl mx-auto">
            <Card className="border-4 border-[#FF6A4D] shadow-[8px_8px_0px_0px_rgba(255,106,77,1)] bg-white">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="font-bold text-2xl text-[#FF6A4D] mb-4">Analysis Failed</h2>
                <p className="text-gray-700 font-medium mb-6">{analysis.error}</p>
                <Button 
                  onClick={() => setAnalysis({ 
                    loading: false, 
                    completed: false,
                    error: undefined,
                    videoData: undefined,
                    comments: undefined,
                    analytics: undefined,
                    summary: undefined
                  })}
                  className="bg-[#FF6A4D] hover:bg-[#FF5A3D] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section - Real Data from Backend */}
        {analysis.completed && analysis.videoData && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Comprehensive Channel Overview Section - Enhanced Neo-Brutalist Style */}
            {analysis.channelData && (
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-[#C8FF3D] via-[#B8EF2D] to-[#A8DF1D] border-b-4 border-black relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>
                  </div>
                  <CardTitle className="font-bold text-2xl text-black relative z-10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-black flex items-center justify-center">
                      <span className="text-[#C8FF3D] text-lg">📺</span>
                    </div>
                    Channel Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Channel Header with Profile & Description */}
                  <div className="p-8 border-b-4 border-black bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
                    {/* Retro Grid Background */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="w-full h-full" style={{
                        backgroundImage: `
                          linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                      }}></div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                      {/* Channel Profile Picture */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200 group">
                          {analysis.channelData.profileImageUrl ? (
                            <img 
                              src={analysis.channelData.profileImageUrl} 
                              alt={analysis.channelData.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-gradient-to-br from-[#7A3BFF] via-[#9D5BFF] to-[#4DA6FF] flex items-center justify-center text-white font-bold text-4xl ${analysis.channelData.profileImageUrl ? 'hidden' : ''}`}>
                            {analysis.channelData.title?.charAt(0) || '📺'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Channel Info & Description */}
                      <div className="flex-1 space-y-6">
                        {/* Channel Title & Handle */}
                        <div>
                          <h3 className="text-4xl font-bold text-black mb-3 leading-tight">{analysis.channelData.title}</h3>
                          {analysis.channelData.customUrl && (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#7A3BFF] text-white border-2 border-black font-bold px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                @{analysis.channelData.customUrl.replace('@', '')}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* Channel Description - Neo-Brutalist Scrollable Box */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-lg text-black flex items-center gap-2">
                            <div className="w-4 h-4 bg-[#FF6A4D] border border-black"></div>
                            Channel Description
                          </h4>
                          <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative group hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200">
                            {/* Retro Corner Accent */}
                            <div className="absolute top-0 right-0 w-6 h-6 bg-[#C8FF3D] border-l-4 border-b-4 border-black"></div>
                            
                            <div className="h-32 overflow-y-auto p-4 pr-8 custom-scrollbar">
                              <p className="text-sm text-gray-800 leading-relaxed font-medium">
                                {analysis.channelData.description || 'No description available for this channel.'}
                              </p>
                            </div>
                            
                            {/* Scroll Indicator */}
                            <div className="absolute bottom-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
                              <div className="w-3 h-3 border-2 border-black bg-[#4DA6FF] animate-bounce"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Channel Statistics Grid - Enhanced Neo-Brutalist */}
                  <div className="grid grid-cols-2 lg:grid-cols-4">
                    {/* Subscribers */}
                    <div className="p-8 border-r-4 border-b-4 lg:border-b-0 border-black bg-gradient-to-br from-[#7A3BFF]/15 to-[#7A3BFF]/5 text-center professional-fade group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#7A3BFF] subtle-glow-static"></div>
                      <div className="mb-3 group-hover:scale-105 transition-transform duration-300">
                        <Users className="w-10 h-10 mx-auto text-[#7A3BFF]" />
                      </div>
                      <div className="text-4xl font-black text-[#7A3BFF] mb-2">
                        {formatNumber(analysis.channelData.subscriberCount)}
                      </div>
                      <div className="text-xs font-black text-gray-800 uppercase tracking-widest bg-white px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        SUBSCRIBERS
                      </div>
                    </div>

                    {/* Total Videos */}
                    <div className="p-8 border-r-4 lg:border-r-4 border-b-4 lg:border-b-0 border-black bg-gradient-to-br from-[#C8FF3D]/25 to-[#C8FF3D]/10 text-center professional-fade group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#A8DF1D] subtle-glow-static"></div>
                      <div className="mb-3 group-hover:scale-105 transition-transform duration-300">
                        <Play className="w-10 h-10 mx-auto text-[#6B8E00]" />
                      </div>
                      <div className="text-4xl font-black text-[#6B8E00] mb-2">
                        {formatNumber(analysis.channelData.videoCount)}
                      </div>
                      <div className="text-xs font-black text-gray-800 uppercase tracking-widest bg-white px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        VIDEOS
                      </div>
                    </div>

                    {/* Total Channel Views */}
                    <div className="p-8 border-r-4 lg:border-r-4 border-b-4 lg:border-b-0 border-black bg-gradient-to-br from-[#FF6A4D]/15 to-[#FF6A4D]/5 text-center professional-fade group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6A4D] subtle-glow-static"></div>
                      <div className="mb-3 group-hover:scale-105 transition-transform duration-300">
                        <TrendingUp className="w-10 h-10 mx-auto text-[#FF6A4D]" />
                      </div>
                      <div className="text-4xl font-black text-[#FF6A4D] mb-2">
                        {formatNumber(analysis.channelData.viewCount)}
                      </div>
                      <div className="text-xs font-black text-gray-800 uppercase tracking-widest bg-white px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        TOTAL VIEWS
                      </div>
                    </div>

                    {/* Joined Date */}
                    <div className="p-8 bg-gradient-to-br from-[#4DA6FF]/15 to-[#4DA6FF]/5 text-center professional-fade group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#4DA6FF] subtle-glow-static"></div>
                      <div className="mb-3 group-hover:scale-105 transition-transform duration-300">
                        <Clock className="w-10 h-10 mx-auto text-[#4DA6FF]" />
                      </div>
                      <div className="text-3xl font-black text-[#4DA6FF] mb-2 leading-tight">
                        {analysis.channelData.publishedAt ? 
                          new Date(analysis.channelData.publishedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) 
                          : 'Unknown'
                        }
                      </div>
                      <div className="text-xs font-black text-gray-800 uppercase tracking-widest bg-white px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        JOINED
                      </div>
                    </div>
                  </div>

                  {/* Additional Channel Info - Enhanced */}
                  {(analysis.channelData.country || analysis.channelData.customUrl) && (
                    <div className="p-6 bg-gradient-to-r from-slate-100 to-gray-100 border-t-4 border-black relative overflow-hidden">
                      {/* Retro Corner Decorations */}
                      <div className="absolute top-0 left-0 w-4 h-4 bg-[#C8FF3D] border-r-2 border-b-2 border-black"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 bg-[#FF6A4D] border-l-2 border-b-2 border-black"></div>
                      
                      <div className="flex flex-wrap gap-4 text-sm relative z-10">
                        {analysis.channelData.country && (
                          <Badge className="bg-[#7A3BFF] text-white border-3 border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 px-3 py-2">
                            🌍 {analysis.channelData.country}
                          </Badge>
                        )}
                        {analysis.channelData.customUrl && (
                          <Badge className="bg-[#4DA6FF] text-white border-3 border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 px-3 py-2">
                            🔗 Custom URL
                          </Badge>
                        )}
                        <Badge className="bg-[#C8FF3D] text-black border-3 border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 px-3 py-2">
                          ✓ VERIFIED CREATOR
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Video Info Strip */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD]">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#FF6A4D] border-4 border-black flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-2xl text-black mb-2">{analysis.videoData.title}</h2>
                    <div className="flex gap-4 text-sm font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {analysis.videoData.channelTitle}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {formatNumber(analysis.videoData.viewCount)} views
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {formatNumber(analysis.videoData.commentCount)} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {parseDuration(analysis.videoData.duration)} • {getTimeElapsed(analysis.videoData.publishedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics Row - Accurate Creator Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {analysis.analytics && (() => {
                // Calculate accurate metrics from real data
                const engagementRatio = analysis.videoData.viewCount > 0 
                  ? (((analysis.videoData.likeCount + analysis.videoData.commentCount) / analysis.videoData.viewCount) * 100)
                  : 0;
                
                const viralityIndex = analysis.channelData.subscriberCount > 0 
                  ? ((analysis.videoData.viewCount / analysis.channelData.subscriberCount) * 100)
                  : 0;
                
                const approvalRating = analysis.videoData.viewCount > 0 
                  ? ((analysis.videoData.likeCount / analysis.videoData.viewCount) * 100)
                  : 0;
                
                // SEO Performance Score Calculation (0-100)
                const calculateSEOScore = (): number => {
                  if (!analysis.videoData) return 0;
                  
                  const title = analysis.videoData.title?.toLowerCase() || '';
                  const description = analysis.videoData.description?.toLowerCase() || '';
                  
                  // 1. Keyword Consistency (40% weight)
                  const extractKeywords = (text: string) => {
                    return text.split(' ')
                      .filter((word: string) => word.length > 3 && !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will'].includes(word))
                      .slice(0, 4); // Top 4 keywords
                  };
                  
                  const coreKeywords = extractKeywords(title);
                  const descriptionFirst150 = description.substring(0, 150);
                  
                  let keywordConsistency = 0;
                  if (coreKeywords.length > 0) {
                    const foundInDesc = coreKeywords.filter((kw: string) => descriptionFirst150.includes(kw)).length;
                    keywordConsistency = (foundInDesc / coreKeywords.length) * 40;
                  }
                  
                  // 2. Description Quality (20% weight)
                  let descQuality = 0;
                  const wordCount = description.split(' ').length;
                  if (wordCount > 200) descQuality += 10;
                  if (/\d{1,2}:\d{2}/.test(description)) descQuality += 5; // Timestamps
                  if ((description.match(/https?:\/\//g) || []).length >= 2) descQuality += 5; // Links
                  
                  // 3. Tag Relevance & Volume (40% weight)
                  let tagScore = 0;
                  const contentCorpus = (title + ' ' + description).toLowerCase();
                  
                  // Simulate tag analysis (in real implementation, you'd get tags from API)
                  const estimatedTagRelevance = Math.min(40, (keywordConsistency * 0.8) + (descQuality * 0.5));
                  tagScore = estimatedTagRelevance;
                  
                  return Math.round(keywordConsistency + descQuality + tagScore);
                };
                
                const tagPerformanceScore = calculateSEOScore();

                const metrics = [
                  { 
                    label: "Engagement Ratio", 
                    value: `${engagementRatio.toFixed(2)}%`, 
                    icon: Target, 
                    color: "bg-[#C8FF3D]",
                    textColor: "text-black" 
                  },
                  { 
                    label: "Virality Ratio", 
                    value: `${viralityIndex.toFixed(0)}%`, 
                    icon: TrendingUp, 
                    color: "bg-[#FF6A4D]",
                    textColor: "text-black" 
                  },
                  { 
                    label: "Like-to-View Ratio", 
                    value: `${approvalRating.toFixed(2)}%`, 
                    icon: Heart, 
                    color: "bg-[#4DA6FF]",
                    textColor: "text-black" 
                  },
                  { 
                    label: "SEO Performance", 
                    value: `${tagPerformanceScore}/100`, 
                    icon: Award, 
                    color: "bg-[#7A3BFF]",
                    textColor: "text-black" 
                  }
                ];

                return [...metrics.map((kpi, i) => (
                  <Card key={i} className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] professional-fade">
                    <CardContent className={`p-6 ${kpi.color} relative`}>
                      <div className="text-center space-y-3">
                        <kpi.icon className={`w-8 h-8 mx-auto ${kpi.textColor}`} />
                        <div className={`text-3xl font-black ${kpi.textColor}`}>{kpi.value}</div>
                        <div className={`text-xs font-black uppercase tracking-wider ${kpi.textColor} bg-white/90 text-black px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block`}>
                          {kpi.label}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )), 
                // Locked Premium Box
                <Card key="premium" className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                  <CardContent className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    {/* Blur Overlay */}
                    <div className="absolute inset-0 backdrop-blur-sm bg-white/30 z-10"></div>
                    
                    {/* Lock Icon */}
                    <div className="absolute top-3 right-3 z-20">
                      <div className="bg-[#7A3BFF] p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <LockIcon className="w-4 h-4 text-black" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-center space-y-3 relative z-5">
                      <Zap className="w-8 h-8 mx-auto text-gray-400" />
                      <div className="text-3xl font-black text-gray-400">100%</div>
                      <div className="text-xs font-black uppercase tracking-wider text-gray-600 bg-white/50 px-2 py-1 border-2 border-gray-400 inline-block">
                        Response Worthy
                      </div>
                    </div>
                    
                    {/* CTA Button */}
                    <div className="absolute bottom-2 left-2 right-2 z-20">
                      <ConnectAccountButton
                        className="w-full bg-[#7A3BFF] text-white text-xs font-black py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase tracking-wide"
                        unauthenticatedText="Connect Account"
                      />
                    </div>
                  </CardContent>
                </Card>
                ];
              })()}
            </div>

            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                <CardHeader className="bg-[#E8F5E8] border-b-4 border-black">
                  <CardTitle className="font-bold text-xl text-black">📊 Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-0 relative">
                  {analysis.comments && analysis.comments.length > 0 ? (
                    <SentimentPieChart 
                      comments={analysis.comments} 
                      pieChartSentiment={analysis.pieChartSentiment} 
                    />
                  ) : (
                    <div className="p-6 h-80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">�</div>
                        <p className="font-bold text-gray-600">Analyzing sentiment...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <NicheTrendFinder 
                nicheTrends={analysis.nicheTrends}
                loading={analysis.loading && !analysis.videoData}
                error={analysis.error}
              />
            </div>

            {/* AI Optimization Recommendations */}
            <AIRecommendations 
              nicheTrends={analysis.nicheTrends}
              loading={analysis.loading && !analysis.videoData}
              videoData={analysis.videoData}
            />

            {/* Comments Panel - Real Comments Data */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
              <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-bold text-xl text-black flex items-center gap-3">
                    <MessageSquare className="w-6 h-6" />
                    Comments ({analysis.comments?.length || 0} analyzed, {analysis.displayedComments?.length || 0} showing)
                  </CardTitle>
                  <Badge className="bg-[#7A3BFF] text-white border-2 border-black font-bold">
                    Live Sentiment Analysis
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {/* Real Comments Data */}
                  {analysis.displayedComments ? analysis.displayedComments.map((comment, index) => {
                    // Generate avatar initials from author name
                    const getAvatarInitials = (name: string) => {
                      const words = name.split(' ').filter(word => word.length > 0);
                      if (words.length >= 2) {
                        return (words[0][0] + words[1][0]).toUpperCase();
                      }
                      return name.slice(0, 2).toUpperCase();
                    };

                    const avatarInitials = getAvatarInitials(comment.authorDisplayName);
                    
                    return (
                      <div key={comment.id} className="border-b-2 border-gray-200 p-4 hover:bg-gray-50/50 transition-colors group">
                        <div className="flex items-start gap-4">
                          {/* Profile Avatar */}
                          <div className={`w-10 h-10 border-2 border-black flex items-center justify-center font-bold text-sm ${
                            comment.sentiment === 'positive' ? 'bg-[#C8FF3D]' :
                            comment.sentiment === 'negative' ? 'bg-[#FF6A4D] text-white' :
                            'bg-[#94a3b8] text-white'
                          }`}>
                            {avatarInitials}
                          </div>
                          
                          {/* Comment Content */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-black">{comment.authorDisplayName}</span>
                              
                              {/* Sentiment Badge */}
                              <Badge className={`border-2 border-black font-bold text-xs ${
                                comment.sentiment === 'positive' ? 'bg-[#C8FF3D] text-black' :
                                comment.sentiment === 'negative' ? 'bg-[#FF6A4D] text-white' :
                                'bg-[#94a3b8] text-white'
                              }`}>
                                {comment.sentiment === 'positive' ? '😊 POSITIVE' :
                                 comment.sentiment === 'negative' ? '😞 NEGATIVE' :
                                 '😐 NEUTRAL'}
                              </Badge>
                              
                              <span className="text-sm text-gray-500 font-medium">{getTimeElapsed(comment.publishedAt)}</span>
                            </div>
                            
                            <p className="text-gray-800 font-medium leading-relaxed">{comment.textDisplay}</p>
                            
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {comment.likeCount} likes
                              </span>
                              
                              {/* Suggest Reply Button */}
                              <Button
                                size="sm"
                                className="bg-[#7A3BFF] hover:bg-[#6A2BEF] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold text-xs opacity-0 group-hover:opacity-100"
                                onClick={() => handleSuggestReply(comment)}
                              >
                                💬 Suggest Reply
                              </Button>
                            </div>
                          </div>
                          
                          {/* Neo-Brutalist Inline Reply Section */}
                          {analysis.expandedReplies?.[comment.id] !== undefined && (
                            <div className="mt-4 border-t-4 border-black bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-[#7A3BFF] rounded-full animate-pulse"></div>
                                <span className="font-bold text-sm text-black">AI SUGGESTED REPLY</span>
                                <div className="w-2 h-2 bg-[#C8FF3D] rounded-full animate-pulse"></div>
                              </div>
                              
                              {analysis.expandedReplies[comment.id] === 'loading' ? (
                                /* Retro Loading Animation */
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex space-x-1">
                                      {[1, 2, 3].map((i) => (
                                        <div
                                          key={i}
                                          className="w-2 h-2 bg-[#7A3BFF] rounded-full animate-bounce"
                                          style={{ animationDelay: `${i * 0.2}s` }}
                                        ></div>
                                      ))}
                                    </div>
                                    <span className="text-sm font-mono text-gray-600 animate-pulse">
                                      GENERATING PERSONALIZED REPLY...
                                    </span>
                                  </div>
                                  
                                  {/* Skeleton text lines */}
                                  <div className="space-y-2">
                                    <div className="h-3 bg-gray-300 border-2 border-black animate-pulse w-3/4"></div>
                                    <div className="h-3 bg-gray-300 border-2 border-black animate-pulse w-1/2"></div>
                                  </div>
                                </div>
                              ) : (
                                /* Generated Reply Display */
                                <div className="space-y-4">
                                  <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                                    <p className="text-gray-800 font-medium leading-relaxed">
                                      {analysis.expandedReplies[comment.id]}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <Button
                                      size="sm"
                                      className="bg-[#C8FF3D] hover:bg-[#B8EF2D] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold"
                                      onClick={() => {
                                        navigator.clipboard.writeText(analysis.expandedReplies?.[comment.id] || '');
                                        // Could add a toast notification here
                                      }}
                                    >
                                      📋 Copy Reply
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold"
                                      onClick={() => handleSuggestReply(comment)}
                                    >
                                      🔄 Regenerate
                                    </Button>
                                    
                                    <span className="text-xs text-gray-500 font-mono ml-auto">
                                      Connect account to post replies
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }) : [
                    {
                      id: 1,
                      author: "TechReviewer99",
                      avatar: "TR",
                      text: "This tutorial was incredibly helpful! The step-by-step breakdown made everything so clear.",
                      sentiment: "positive",
                      timestamp: "2h ago",
                      liked: true,
                      likes: 24
                    },
                    {
                      id: 2,
                      author: "CodeNewbie2024",
                      avatar: "CN",
                      text: "I'm still confused about the implementation part. Could you explain it more clearly?",
                      sentiment: "neutral",
                      timestamp: "4h ago",
                      liked: false,
                      likes: 8
                    },
                    {
                      id: 3,
                      author: "DevMaster",
                      avatar: "DM",
                      text: "Great content as always! Love how you explain complex concepts in simple terms.",
                      sentiment: "positive",
                      timestamp: "6h ago",
                      liked: true,
                      likes: 45
                    },
                    {
                      id: 4,
                      author: "SkepticalViewer",
                      avatar: "SV",
                      text: "This approach seems outdated. There are much better ways to handle this now.",
                      sentiment: "negative",
                      timestamp: "8h ago",
                      liked: false,
                      likes: 3
                    },
                    {
                      id: 5,
                      author: "LearnerLife",
                      avatar: "LL",
                      text: "Perfect timing! I was just working on a similar project. This saved me hours of research.",
                      sentiment: "positive",
                      timestamp: "12h ago",
                      liked: true,
                      likes: 67
                    }
                  ].map((comment) => (
                    <div key={comment.id} className="border-b-2 border-gray-200 p-4 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        {/* Profile Avatar */}
                        <div className={`w-10 h-10 border-2 border-black flex items-center justify-center font-bold text-sm ${
                          comment.sentiment === 'positive' ? 'bg-[#C8FF3D]' :
                          comment.sentiment === 'negative' ? 'bg-[#FF6A4D] text-white' :
                          'bg-[#94a3b8] text-white'
                        }`}>
                          {comment.avatar}
                        </div>
                        
                        {/* Comment Content */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-black">{comment.author}</span>
                            
                            {/* Sentiment Badge */}
                            <Badge className={`border-2 border-black font-bold text-xs ${
                              comment.sentiment === 'positive' ? 'bg-[#C8FF3D] text-black' :
                              comment.sentiment === 'negative' ? 'bg-[#FF6A4D] text-white' :
                              'bg-[#94a3b8] text-white'
                            }`}>
                              {comment.sentiment === 'positive' ? '😊 POSITIVE' :
                               comment.sentiment === 'negative' ? '😞 NEGATIVE' :
                               '😐 NEUTRAL'}
                            </Badge>
                            
                            {/* Author Liked */}
                            {comment.liked && (
                              <Badge className="bg-[#7A3BFF] text-white border-2 border-black font-bold text-xs">
                                ❤️ AUTHOR LIKED
                              </Badge>
                            )}
                            
                            <span className="text-sm text-gray-500 font-medium">{comment.timestamp}</span>
                          </div>
                          
                          <p className="text-gray-800 font-medium leading-relaxed">{comment.text}</p>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {comment.likes} likes
                            </span>
                            
                            {/* Suggest Reply Button */}
                            <Button
                              size="sm"
                              className="bg-[#7A3BFF] hover:bg-[#6A2BEF] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold text-xs opacity-0 group-hover:opacity-100"
                            >
                              💬 Suggest Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Load More Comments */}
                {analysis.comments && analysis.displayedComments && analysis.comments.length > analysis.displayedComments.length && (
                  <div className="p-4 border-t-4 border-black bg-gray-50">
                    <Button
                      onClick={handleLoadMoreComments}
                      variant="outline"
                      className="w-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                    >
                      📄 Load More Comments ({analysis.comments.length - analysis.displayedComments.length} remaining)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transcript & AI Summary Section - Reduced Height */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                <CardHeader className="bg-[#E8F4FD] border-b-4 border-black">
                  <CardTitle className="font-bold text-xl text-black">📝 Video Transcript</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-48 overflow-y-auto font-mono text-sm border-r-4 border-black">
                    <div className="p-4 space-y-2">
                      <div className="flex gap-3">
                        <span className="text-[#7A3BFF] font-bold min-w-[60px]">00:00</span>
                        <span>Welcome back to another tutorial! Today we're diving into...</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-[#7A3BFF] font-bold min-w-[60px]">00:15</span>
                        <span>First, let's understand the core concepts behind this approach...</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-[#7A3BFF] font-bold min-w-[60px]">00:32</span>
                        <span>The key advantage here is the performance improvement you get...</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-[#7A3BFF] font-bold min-w-[60px]">01:05</span>
                        <span>Now, let me show you the practical implementation...</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-[#7A3BFF] font-bold min-w-[60px]">01:28</span>
                        <span>As you can see in the code editor, we start by setting up...</span>
                      </div>
                      
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                <CardHeader className="bg-[#FFF0E8] border-b-4 border-black">
                  <CardTitle className="font-bold text-xl text-black">🤖 AI Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {analysis.summary && analysis.summary.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.summary.map((point, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-[#C8FF3D] font-bold">•</span>
                          <span className="font-medium">{point}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-[#C8FF3D] font-bold">•</span>
                        <span className="font-medium">Generating AI-powered summary...</span>
                      </div>
                    </div>
                  )}
                  
                 
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-[#FF6A4D] to-[#FF5A3D]">
              <CardContent className="p-8 text-center space-y-6">
                <h3 className="font-bold text-3xl text-white">🚀 Ready for Full Analytics?</h3>
                <p className="text-xl text-white/90 font-medium">
                  Connect your channel for unlimited analysis, AI replies, and advanced insights
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <ConnectAccountButton
                    className="bg-white hover:bg-gray-100 text-[#FF6A4D] border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-lg px-8 py-4"
                    unauthenticatedText="🔗 Connect Account"
                  />
                  <Button
                    variant="outline"
                    className="border-4 border-white text-black hover:bg-black/10 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-lg px-8 py-4"
                    onClick={() => {
                      setUrl("");
                      setAnalysis({ 
                        loading: false, 
                        completed: false,
                        error: undefined,
                        videoData: undefined,
                        channelData: undefined,
                        comments: undefined,
                        displayedComments: undefined,
                        analytics: undefined,
                        summary: undefined,
                        totalCommentsAnalyzed: undefined,
                        totalCommentsAvailable: undefined,
                        nextPageToken: undefined,
                        expandedReplies: {},
                        pieChartSentiment: undefined
                      });
                    }}
                  >
                    🔄 Try Another Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}