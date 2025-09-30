"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChannelOverview from "@/components/ChannelOverview";
import ChannelAnalyticsCharts from "@/components/ChannelAnalyticsCharts";
import VideosList from "@/components/VideosList";
import AdvancedMetrics from "@/components/AdvancedMetrics";
import FeedbackInsights from "@/components/FeedbackInsights";
import CommentAnalysis from "@/components/CommentAnalysis";
import DataVisualization from "@/components/DataVisualization";
import { VideoAnalysisSkeleton } from "@/components/SkeletonLoaders";
import { 
  BarChart3, 
  TrendingUp, 
  LogOut,
  FileText,
  ChevronDown,
  ArrowLeft,
  Play,
  Calendar,
  Eye,
  MessageCircle,
  ThumbsUp,
  Clock,
  RefreshCw,
  ExternalLink,
  Users
} from 'lucide-react';
import { CommentData, VideoData } from '@/types';

// Cache management utilities
interface CachedVideoData {
  videoDetails: any;
  videoComments: CommentData[];
  videoTranscript: string;
  videoAnalysis: any;
  feedbackInsights: any;
  sentimentDistribution: any;
  timestamp: number;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const CACHE_PREFIX = 'sentimenttrack_video_';

const getCachedVideoData = (videoId: string): CachedVideoData | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${videoId}`);
    if (cached) {
      const data = JSON.parse(cached) as CachedVideoData;
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        console.log(`📦 Using cached data for video ${videoId}`);
        return data;
      } else {
        console.log(`⏰ Cache expired for video ${videoId}`);
        localStorage.removeItem(`${CACHE_PREFIX}${videoId}`);
      }
    }
  } catch (error) {
    console.error('❌ Error reading cache:', error);
  }
  return null;
};

const setCachedVideoData = (videoId: string, data: Omit<CachedVideoData, 'timestamp'>) => {
  try {
    const cacheData: CachedVideoData = {
      ...data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_PREFIX}${videoId}`, JSON.stringify(cacheData));
    console.log(`💾 Cached data for video ${videoId}`);
  } catch (error) {
    console.error('❌ Error saving cache:', error);
  }
};

const clearVideoCache = (videoId: string) => {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${videoId}`);
    console.log(`🗑️ Cleared cache for video ${videoId}`);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

export default function DashboardPage() {
  const { session, status, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<any>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Video analysis state
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [videoComments, setVideoComments] = useState<CommentData[]>([]);
  const [videoTranscript, setVideoTranscript] = useState<string>('');
  const [videoAnalysis, setVideoAnalysis] = useState<any>(null);
  const [feedbackInsights, setFeedbackInsights] = useState<any>(null);
  const [sentimentDistribution, setSentimentDistribution] = useState<any>(null);
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    video: false,
    comments: false,
    transcript: false,
    analysis: false,
    insights: false
  });
  
  // Cache and refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  const updateLoadingState = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/dashboard');
    }
  }, [status, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Video analysis effect with caching
  useEffect(() => {
    if (selectedVideo) {
      loadVideoAnalysis(selectedVideo, false); // false = try cache first
    }
  }, [selectedVideo]);

  // Trigger feedback insights when comments and sentiment data are ready
  useEffect(() => {
    console.log('🔍 Checking feedback insights conditions:', {
      videoComments: videoComments?.length || 0,
      hasSentimentDistribution: !!sentimentDistribution,
      hasVideoDetails: !!videoDetails,
      isInsightsLoading: loadingStates.insights,
      hasFeedbackInsights: !!feedbackInsights
    });
    
    if (videoComments && videoComments.length > 0 && sentimentDistribution && videoDetails && !loadingStates.insights && !feedbackInsights) {
      console.log(`🧠 Auto-triggering feedback insights: ${videoComments.length} comments ready`);
      triggerFeedbackInsights();
    }
  }, [videoComments, sentimentDistribution, videoDetails, loadingStates.insights, feedbackInsights]);

  const triggerFeedbackInsights = async () => {
    if (!videoDetails || !videoComments || videoComments.length === 0) {
      console.log('⚠️ Cannot trigger insights: missing required data');
      return;
    }

    updateLoadingState('insights', true);
    console.log(`🧠 Generating feedback insights with ${videoComments.length} comments`);
    
    try {
      const insightsResponse = await fetch('/api/ai/feedback-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: videoDetails.title,
          videoDescription: videoDetails.description || '',
          transcript: videoTranscript || '',
          comments: videoComments,
          sentimentDistribution: sentimentDistribution || {
            positive: { count: 0, percentage: '0' },
            neutral: { count: 0, percentage: '0' },
            negative: { count: 0, percentage: '0' }
          },
          channelName: videoDetails.channelTitle || '',
          videoMetrics: {
            views: videoDetails.viewCount || 0,
            likes: videoDetails.likeCount || 0,
            comments: videoDetails.commentCount || 0
          }
        })
      });

      const insightsData = await insightsResponse.json();
      console.log(`📈 Insights API response:`, insightsData);
      
      if (insightsData.success) {
        const insights = insightsData.data.insights || insightsData.data;
        setFeedbackInsights(insights);
        console.log('✅ Feedback insights generated successfully');
        
        // Update cache with new insights
        if (selectedVideo) {
          updateVideoCache(selectedVideo, { feedbackInsights: insights });
        }
      } else {
        console.error('❌ Insights API error:', insightsData.error);
      }
    } catch (error) {
      console.error('❌ Error loading feedback insights:', error);
    } finally {
      updateLoadingState('insights', false);
    }
  };

  const updateVideoCache = (videoId: string, updates: Partial<Omit<CachedVideoData, 'timestamp'>>) => {
    const currentCache = getCachedVideoData(videoId);
    if (currentCache) {
      setCachedVideoData(videoId, { ...currentCache, ...updates });
    }
  };

  const handleRefreshAnalysis = async () => {
    if (!selectedVideo) return;
    
    setIsRefreshing(true);
    setUsingCache(false);
    
    // Clear cache for this video
    clearVideoCache(selectedVideo);
    
    // Reset all states to force fresh data
    setVideoDetails(null);
    setVideoComments([]);
    setVideoTranscript('');
    setVideoAnalysis(null);
    setFeedbackInsights(null);
    setSentimentDistribution(null);
    
    // Force reload all data with no cache
    await loadVideoAnalysis(selectedVideo, true); // true = force refresh
    
    setIsRefreshing(false);
  };

  const handleVideoThumbnailClick = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  const loadVideoAnalysis = async (videoId: string, forceRefresh: boolean = false) => {
    console.log(`🚀 Loading analysis for video: ${videoId} (force: ${forceRefresh})`);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getCachedVideoData(videoId);
      if (cachedData) {
        console.log('📦 Loading from cache...');
        setUsingCache(true);
        
        // Load all cached data
        setVideoDetails(cachedData.videoDetails);
        setVideoComments(cachedData.videoComments);
        setVideoTranscript(cachedData.videoTranscript);
        setVideoAnalysis(cachedData.videoAnalysis);
        setFeedbackInsights(cachedData.feedbackInsights);
        setSentimentDistribution(cachedData.sentimentDistribution);
        
        console.log('✅ All data loaded from cache');
        return;
      }
    }
    
    setUsingCache(false);
    console.log('🔄 Loading fresh data...');
    
    // Reset all states
    setVideoDetails(null);
    setVideoComments([]);
    setVideoTranscript('');
    setVideoAnalysis(null);
    setFeedbackInsights(null);
    setSentimentDistribution(null);

    // Enhanced error handling with automatic fallback to demo endpoints
    const fetchWithFallback = async (authEndpoint: string, demoEndpoint: string) => {
      try {
        // Try authenticated endpoint first
        console.log(`🔐 Trying authenticated endpoint: ${authEndpoint}`);
        const authResponse = await fetch(authEndpoint);
        const authData = await authResponse.json();
        
        if (authResponse.ok && authData.success) {
          console.log(`✅ Authenticated endpoint succeeded`);
          return { data: authData, source: 'authenticated' };
        } else if (authResponse.status === 401) {
          console.log(`🔄 Authentication failed, trying demo endpoint: ${demoEndpoint}`);
          // Fall back to demo endpoint
          const demoResponse = await fetch(demoEndpoint);
          const demoData = await demoResponse.json();
          
          if (demoResponse.ok && demoData.success) {
            console.log(`✅ Demo endpoint succeeded`);
            return { data: demoData, source: 'demo' };
          } else {
            throw new Error(`Demo endpoint failed: ${demoResponse.status}`);
          }
        } else {
          throw new Error(`Authenticated endpoint failed: ${authResponse.status}`);
        }
      } catch (error) {
        console.log(`⚠️ Primary endpoint failed, trying demo fallback: ${error}`);
        // Last resort: try demo endpoint
        const demoResponse = await fetch(demoEndpoint);
        const demoData = await demoResponse.json();
        
        if (demoResponse.ok && demoData.success) {
          console.log(`✅ Fallback demo endpoint succeeded`);
          return { data: demoData, source: 'demo-fallback' };
        } else {
          throw new Error(`All endpoints failed for ${authEndpoint}`);
        }
      }
    };

    // Load video details with fallback
    updateLoadingState('video', true);
    let loadedVideoDetails = null;
    try {
      const result = await fetchWithFallback(
        `/api/youtube/video-details?videoId=${videoId}`,
        `/api/demo/video?videoId=${videoId}`
      );
      loadedVideoDetails = result.data.data;
      setVideoDetails(loadedVideoDetails);
      console.log(`✅ Video details loaded from ${result.source}:`, loadedVideoDetails);
    } catch (error) {
      console.error('❌ Failed to load video details from all sources:', error);
    } finally {
      updateLoadingState('video', false);
    }

    // Load comments with sentiment analysis and fallback
    updateLoadingState('comments', true);
    let loadedComments: CommentData[] = [];
    let loadedSentimentDistribution = null;
    try {
      const result = await fetchWithFallback(
        `/api/youtube/video-comments?videoId=${videoId}`,
        `/api/demo/comments?videoId=${videoId}&getAllComments=false`
      );
      
      if (result.source === 'authenticated') {
        // Authenticated endpoint format
        loadedComments = result.data.data.comments;
        loadedSentimentDistribution = result.data.data.sentimentDistribution;
      } else {
        // Demo endpoint format
        const comments = result.data.data.comments || result.data.data;
        loadedComments = comments;
        
        // Calculate sentiment distribution from demo comments
        if (Array.isArray(comments)) {
          const sentimentCounts = comments.reduce(
            (acc: any, comment: CommentData) => {
              const sentiment = comment.sentiment || 'neutral';
              acc[sentiment] = (acc[sentiment] || 0) + 1;
              return acc;
            },
            { positive: 0, neutral: 0, negative: 0 }
          );

          const totalComments = comments.length;
          loadedSentimentDistribution = {
            positive: {
              count: sentimentCounts.positive,
              percentage: ((sentimentCounts.positive / totalComments) * 100).toFixed(1)
            },
            neutral: {
              count: sentimentCounts.neutral,
              percentage: ((sentimentCounts.neutral / totalComments) * 100).toFixed(1)
            },
            negative: {
              count: sentimentCounts.negative,
              percentage: ((sentimentCounts.negative / totalComments) * 100).toFixed(1)
            }
          };
        }
      }
      
      setVideoComments(loadedComments);
      setSentimentDistribution(loadedSentimentDistribution);
      console.log(`✅ Comments loaded from ${result.source}: ${loadedComments.length || 0} comments with sentiment analysis`);
    } catch (error) {
      console.error('❌ Failed to load comments from all sources:', error);
      // Set empty state instead of leaving undefined
      loadedComments = [];
      loadedSentimentDistribution = {
        positive: { count: 0, percentage: '0' },
        neutral: { count: 0, percentage: '0' },
        negative: { count: 0, percentage: '0' }
      };
      setVideoComments(loadedComments);
      setSentimentDistribution(loadedSentimentDistribution);
    } finally {
      updateLoadingState('comments', false);
    }

    // Load transcript with fallback
    updateLoadingState('transcript', true);
    let finalTranscript = '';
    
    try {
      const result = await fetchWithFallback(
        `/api/youtube/video-transcript?videoId=${videoId}`,
        `/api/demo/summary?videoId=${videoId}` // Demo has summary instead of transcript
      );
      
      if (result.source === 'authenticated') {
        finalTranscript = result.data.data.transcript;
        setVideoTranscript(finalTranscript);
        console.log(`✅ Transcript loaded from ${result.source}: ${result.data.data.characterCount} characters`);
      } else {
        // Demo endpoint returns summary instead of transcript
        const summary = result.data.data.summary || '';
        finalTranscript = summary;
        setVideoTranscript(finalTranscript);
        console.log(`✅ Summary loaded from ${result.source}: ${summary.length} characters`);
      }
    } catch (error) {
      console.error('❌ Failed to load transcript from all sources:', error);
      finalTranscript = '';
      setVideoTranscript('');
    } finally {
      updateLoadingState('transcript', false);
    }

    // Load AI analysis
    let finalAnalysis = null;
    if (loadedVideoDetails) {
      finalAnalysis = await loadAIAnalysisForCache(videoId, finalTranscript, loadedVideoDetails);
    }
    
    // Cache all the loaded data (after everything is loaded)
    const cacheData = {
      videoDetails: loadedVideoDetails,
      videoComments: loadedComments,
      videoTranscript: finalTranscript,
      videoAnalysis: finalAnalysis,
      feedbackInsights: null, // Will be updated when insights are generated
      sentimentDistribution: loadedSentimentDistribution
    };
    
    setCachedVideoData(videoId, cacheData);
    console.log('💾 Video data cached successfully');
  };

  const loadAIAnalysisForCache = async (videoId: string, transcript: string, videoDetails: any) => {
    if (!videoDetails) return null;

    updateLoadingState('analysis', true);
    let analysisData = null;
    
    try {
      const analysisResponse = await fetch('/api/ai/video-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: videoDetails.title,
          transcript,
          description: videoDetails.description,
          tags: videoDetails.tags
        })
      });

      const response = await analysisResponse.json();
      if (response.success) {
        analysisData = response.data;
        setVideoAnalysis(analysisData);
        console.log('✅ AI video analysis completed');
      } else {
        console.error('❌ Video analysis failed:', response.error);
      }
    } catch (error) {
      console.error('❌ Error loading AI analysis:', error);
    } finally {
      updateLoadingState('analysis', false);
    }
    
    return analysisData;
  };

  const loadAIAnalysis = async (videoId: string, transcript: string) => {
    if (!videoDetails) return null;

    updateLoadingState('analysis', true);
    let analysisData = null;
    
    try {
      const analysisResponse = await fetch('/api/ai/video-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: videoDetails.title,
          transcript,
          description: videoDetails.description,
          tags: videoDetails.tags
        })
      });

      const response = await analysisResponse.json();
      if (response.success) {
        analysisData = response.data;
        setVideoAnalysis(analysisData);
        console.log('✅ AI video analysis completed');
      } else {
        console.error('❌ Video analysis failed:', response.error);
      }
    } catch (error) {
      console.error('❌ Error loading AI analysis:', error);
    } finally {
      updateLoadingState('analysis', false);
    }
    
    return analysisData;
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  const handleBackToDashboard = () => {
    setSelectedVideo(null);
    // Reset all analysis data
    setVideoDetails(null);
    setVideoComments([]);
    setVideoTranscript('');
    setVideoAnalysis(null);
    setFeedbackInsights(null);
    setSentimentDistribution(null);
  };

  const handleLogout = () => {
    logout();
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3E8FF] to-[#E8F4FD] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#7A3BFF] border-4 border-black flex items-center justify-center font-black text-white text-2xl mb-4 animate-pulse">
            S
          </div>
          <p className="font-bold text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3E8FF] to-[#E8F4FD] flex">
      {/* Dashboard Header - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="font-bold text-2xl tracking-tight">
              <span className="text-black">Sentiment</span>
              <span className="text-[#7A3BFF]">Track</span>
            </div>
            <div className="hidden md:block">
              <h1 className="font-bold text-xl text-black">
                Good evening, {channelData?.title || session?.user?.name || 'Creator'}!
              </h1>
              <p className="text-sm text-gray-600 font-medium">Ready to create amazing content?</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative user-dropdown">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors"
              >
                {/* Prioritize channel data profile image, then session image */}
                {channelData?.thumbnails?.high || channelData?.thumbnails?.medium || channelData?.thumbnails?.default || session?.user?.image ? (
                  <img 
                    src={channelData?.thumbnails?.high || channelData?.thumbnails?.medium || channelData?.thumbnails?.default || session?.user?.image} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[#7A3BFF] border-4 border-black rounded-full flex items-center justify-center font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {channelData?.title?.[0] || session?.user?.name?.[0] || 'U'}
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50">
                  <div className="p-4 border-b-2 border-gray-200">
                    <div className="font-bold text-sm text-black">{channelData?.title || session?.user?.name}</div>
                    <div className="text-xs text-gray-600">{session?.user?.email}</div>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-2 hover:bg-red-50 text-left transition-colors text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Left Sidebar - Clean ChatGPT Style */}
      <aside className="fixed left-0 top-[88px] bottom-0 w-[320px] bg-white border-r-4 border-black shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] flex flex-col">
        {/* Video List - Single Scroll Container */}
        <div className="flex-1 overflow-y-auto">
          <VideosList 
            onVideoSelect={handleVideoSelect} 
            selectedVideoId={selectedVideo} 
          />
        </div>
      </aside>

      {/* Main Content Area - ChatGPT Style with Left Margin */}
      <main className="flex-1 ml-[320px] pt-[88px] min-h-screen overflow-y-auto bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
        <div className="p-6 space-y-6">
          {selectedVideo ? (
            /* Video Analysis View - Comprehensive Dashboard */
            <div className="space-y-6">
              {/* Video Header */}
              {videoDetails ? (
                <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <Button 
                        onClick={handleBackToDashboard}
                        variant="outline"
                        className="border-2 border-black font-bold hover:bg-gray-50"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                      </Button>
                      
                      <div className="flex items-center gap-3">
                        {usingCache && (
                          <Badge className="bg-blue-100 text-blue-800 border-2 border-blue-300 font-bold">
                            📦 CACHED DATA
                          </Badge>
                        )}
                        
                        <Button
                          onClick={handleRefreshAnalysis}
                          disabled={isRefreshing}
                          variant="outline"
                          className="border-2 border-black font-bold hover:bg-gray-50"
                        >
                          {isRefreshing ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Refreshing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh Analysis
                            </>
                          )}
                        </Button>
                        
                        <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold">
                          ANALYZING
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Video Thumbnail & Info */}
                      <div className="space-y-4">
                        <div 
                          className="relative w-full h-64 bg-gradient-to-br from-[#7A3BFF] to-[#9D5BFF] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden cursor-pointer group"
                          onClick={() => handleVideoThumbnailClick(selectedVideo)}
                        >
                          {videoDetails.thumbnails?.high?.url ? (
                            <img 
                              src={videoDetails.thumbnails.high.url} 
                              alt={videoDetails.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-16 h-16 text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/90 border-4 border-black rounded-full flex items-center justify-center">
                              <ExternalLink className="w-8 h-8 text-[#7A3BFF]" />
                            </div>
                          </div>
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge className="bg-red-600 text-white border-2 border-white font-bold text-xs">
                              Watch on YouTube
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h1 className="font-bold text-2xl text-black leading-tight">
                            {videoDetails.title}
                          </h1>
                          <p className="text-gray-600 font-medium">
                            {videoDetails.channelTitle}
                          </p>
                        </div>
                      </div>

                      {/* Video Stats */}
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg text-black">📊 Video Performance</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white border-4 border-black text-center">
                            <Eye className="w-6 h-6 text-[#4DA6FF] mx-auto mb-2" />
                            <div className="text-2xl font-bold text-black">
                              {videoDetails.viewCount?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Views</div>
                          </div>
                          <div className="p-4 bg-white border-4 border-black text-center">
                            <ThumbsUp className="w-6 h-6 text-[#C8FF3D] mx-auto mb-2" />
                            <div className="text-2xl font-bold text-black">
                              {videoDetails.likeCount?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Likes</div>
                          </div>
                          <div className="p-4 bg-white border-4 border-black text-center">
                            <MessageCircle className="w-6 h-6 text-[#FF6A4D] mx-auto mb-2" />
                            <div className="text-2xl font-bold text-black">
                              {videoDetails.commentCount?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Comments</div>
                          </div>
                          <div className="p-4 bg-white border-4 border-black text-center">
                            <Calendar className="w-6 h-6 text-[#7A3BFF] mx-auto mb-2" />
                            <div className="text-sm font-bold text-black">
                              {new Date(videoDetails.publishedAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Published</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : loadingStates.video ? (
                <VideoAnalysisSkeleton />
              ) : null}

              {/* Advanced Metrics */}
              <AdvancedMetrics 
                analytics={videoDetails?.analytics} 
                loading={loadingStates.video}
              />

              {/* Data Visualization - Sentiment & Real YouTube Analytics */}
              <DataVisualization
                videoId={selectedVideo}
                sentimentData={sentimentDistribution}
                totalComments={videoComments.length}
                analyzedComments={videoComments.filter(c => c.sentiment).length}
                loading={loadingStates.comments}
              />

              {/* Comment Analysis */}
              <CommentAnalysis
                videoId={selectedVideo}
                videoTitle={videoDetails?.title}
                videoContext={videoTranscript}
                comments={videoComments}
                sentimentDistribution={sentimentDistribution}
                loading={loadingStates.comments}
              />

              {/* AI Feedback Insights */}
              <FeedbackInsights 
                insights={feedbackInsights}
                loading={loadingStates.insights || loadingStates.analysis}
              />
            </div>
          ) : (
            /* Dashboard Overview */
            <div className="space-y-6">
              {/* Channel Overview Component - Enhanced */}
              <ChannelOverview onChannelLoad={setChannelData} />

              {/* Channel Performance Analytics - Dynamic Charts */}
              {channelData && (
                <ChannelAnalyticsCharts />
              )}

              {/* Quick Actions - Enhanced Neo-Brutalist */}
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#7A3BFF] border-4 border-black flex items-center justify-center font-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      🚀
                    </div>
                    <div>
                      <CardTitle className="font-black text-xl text-black tracking-tight">CREATOR POWER TOOLS</CardTitle>
                      <p className="text-gray-600 font-bold text-sm">Supercharge your content strategy</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Button className="group bg-[#7A3BFF] text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-8 py-8 font-black hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 text-base h-auto relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rotate-45 translate-x-8 -translate-y-8"></div>
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-[#C8FF3D] border-3 border-black flex items-center justify-center font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <div className="font-black text-lg">ANALYZE COMPETITORS</div>
                          <div className="text-xs opacity-90 font-bold">See what's working in your niche</div>
                        </div>
                      </div>
                    </Button>
                    
                    <Button className="group bg-[#C8FF3D] text-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-8 py-8 font-black hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 text-base h-auto relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-black/10 rotate-45 translate-x-8 -translate-y-8"></div>
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-[#7A3BFF] border-3 border-black flex items-center justify-center font-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <div className="font-black text-lg">GENERATE CONTENT</div>
                          <div className="text-xs opacity-75 font-bold">AI scripts & strategy ideas</div>
                        </div>
                      </div>
                    </Button>
                    
                    <Button className="group bg-[#FF6A4D] text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-8 py-8 font-black hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 text-base h-auto relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rotate-45 translate-x-8 -translate-y-8"></div>
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white border-3 border-black flex items-center justify-center font-black text-[#FF6A4D] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <div className="font-black text-lg">VIEW TRENDS</div>
                          <div className="text-xs opacity-90 font-bold">Discover viral opportunities</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Getting Started */}
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-purple-100 to-blue-100">
                <CardContent className="p-8 text-center">
                  <h3 className="font-bold text-2xl text-black mb-4">🎯 Ready to Optimize Your Content?</h3>
                  <p className="text-lg text-gray-700 font-medium mb-6">
                    Select a video from the sidebar to start analyzing sentiment, engagement, and get AI-powered insights!
                  </p>
                  <div className="text-4xl">👈</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}