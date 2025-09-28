// Analytics and metrics calculation utilities
import { VideoData, CommentData, SentimentAnalysis, AnalyticsData } from '@/types';

/**
 * Calculate engagement ratio (likes + comments) / views * 100
 */
export function calculateEngagementRatio(video: VideoData): number {
  if (video.viewCount === 0) return 0;
  return ((video.likeCount + video.commentCount) / video.viewCount) * 100;
}

/**
 * Calculate comment velocity (comments per hour since publish)
 */
export function calculateCommentVelocity(video: VideoData): number {
  const now = new Date();
  const published = new Date(video.publishedAt);
  const hoursElapsed = Math.max(1, (now.getTime() - published.getTime()) / (1000 * 60 * 60));
  
  return Math.round(video.commentCount / hoursElapsed);
}

/**
 * Calculate sentiment distribution from comments
 */
export function calculateSentimentAnalysis(comments: CommentData[]): SentimentAnalysis {
  const counts = {
    positive: 0,
    neutral: 0,
    negative: 0
  };

  comments.forEach(comment => {
    if (comment.sentiment) {
      counts[comment.sentiment]++;
    }
  });

  const total = counts.positive + counts.neutral + counts.negative;

  return {
    ...counts,
    total
  };
}

/**
 * Derive best posting hour heuristic from video publish time
 */
export function deriveBestPostingHour(videos: VideoData[]): number {
  if (videos.length === 0) return 14; // Default 2 PM

  const hourCounts = new Map<number, number>();
  
  videos.forEach(video => {
    const publishDate = new Date(video.publishedAt);
    const hour = publishDate.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  // Find hour with highest frequency
  let maxCount = 0;
  let bestHour = 14;
  
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count;
      bestHour = hour;
    }
  });

  return bestHour;
}

/**
 * Calculate keyword density from text
 */
export function calculateKeywordDensity(text: string, topKeyword: string): number {
  if (!text || !topKeyword) return 0;
  
  const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const keywordCount = words.filter(word => 
    word.includes(topKeyword.toLowerCase())
  ).length;
  
  return words.length > 0 ? (keywordCount / words.length) * 100 : 0;
}

/**
 * Calculate creator-focused analytics data
 */
export function generateCreatorAnalytics(
  video: VideoData,
  comments: CommentData[],
  allVideos: VideoData[] = []
): AnalyticsData {
  const sentiment = calculateSentimentAnalysis(comments);
  const engagementRatio = calculateEngagementRatio(video);
  
  // Calculate view-to-like ratio (higher is better)
  const viewToLikeRatio = video.viewCount > 0 ? (video.likeCount / video.viewCount) * 100 : 0;
  
  // Calculate comment response rate (comments creator would want to reply to)
  const meaningfulComments = comments.filter(c => 
    c.textDisplay.length > 20 && // Substantial comments
    !c.textDisplay.toLowerCase().includes('first') && // Not just "first" comments
    !c.textDisplay.toLowerCase().includes('🔥🔥🔥') // Not just emoji spam
  ).length;
  const commentResponseRate = comments.length > 0 ? (meaningfulComments / comments.length) * 100 : 0;
  
  // Calculate audience retention proxy (likes per 1000 views)
  const likesPerThousandViews = video.viewCount > 0 ? (video.likeCount / video.viewCount) * 1000 : 0;
  
  // Calculate positive percentage
  const positivePercentage = sentiment.total > 0 
    ? (sentiment.positive / sentiment.total) * 100 
    : 0;

  // Calculate subscriber growth potential (engagement vs views ratio)
  const subscriberGrowthPotential = video.viewCount > 0 
    ? ((video.likeCount + video.commentCount * 2) / video.viewCount) * 100 
    : 0;

  return {
    totalComments: video.commentCount,
    commentsRetrieved: comments.length,
    engagementRatio: Math.round(engagementRatio * 100) / 100,
    viewToLikeRatio: Math.round(viewToLikeRatio * 1000) / 1000, // Likes per view percentage 
    positivePercentage: Math.round(positivePercentage),
    commentResponseRate: Math.round(commentResponseRate),
    likesPerThousandViews: Math.round(likesPerThousandViews * 10) / 10,
    subscriberGrowthPotential: Math.round(subscriberGrowthPotential * 100) / 100
  };
}

/**
 * Format analytics numbers for display
 */
export function formatAnalyticsNumber(value: number, type: 'count' | 'percentage' | 'ratio' | 'hour'): string {
  switch (type) {
    case 'count':
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toString();
    
    case 'percentage':
      return `${value}%`;
    
    case 'ratio':
      return `${value}%`;
    
    case 'hour':
      const hour12 = value === 0 ? 12 : value > 12 ? value - 12 : value;
      const ampm = value < 12 ? 'AM' : 'PM';
      return `${hour12} ${ampm}`;
    
    default:
      return value.toString();
  }
}

/**
 * Calculate engagement trends (simplified version for demo)
 */
export function calculateEngagementTrend(videos: VideoData[]): { label: string; value: number }[] {
  if (videos.length === 0) return [];

  // Sort by publish date
  const sortedVideos = videos
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .slice(-7); // Last 7 videos

  return sortedVideos.map((video, index) => ({
    label: `Video ${index + 1}`,
    value: calculateEngagementRatio(video)
  }));
}

/**
 * Calculate View-to-Subscriber Ratio (Virality Index)
 */
export function calculateViralityIndex(video: VideoData, subscriberCount: number): number {
  if (subscriberCount === 0) return 0;
  return (video.viewCount / subscriberCount) * 100;
}

/**
 * Calculate Like-to-View Ratio (Approval Rating)
 */
export function calculateApprovalRating(video: VideoData): number {
  if (video.viewCount === 0) return 0;
  return (video.likeCount / video.viewCount) * 100;
}

/**
 * Calculate Tag Performance Score (SEO Score)
 * Note: This is a simplified version as we don't have topicDetails in current API
 */
export function calculateTagPerformanceScore(video: VideoData): number {
  // Simplified scoring based on engagement relative to views
  const engagementScore = video.viewCount > 0 
    ? ((video.likeCount + video.commentCount) / video.viewCount) * 10000 
    : 0;
  
  // Cap at 100 and provide meaningful score
  return Math.min(100, Math.round(engagementScore));
}

/**
 * Generate accurate key metrics for dashboard
 */
export function generateKeyMetrics(
  video: VideoData,
  channelData: { subscriberCount: number },
  comments: CommentData[]
) {
  return {
    engagementRatio: calculateEngagementRatio(video),
    viralityIndex: calculateViralityIndex(video, channelData.subscriberCount),
    approvalRating: calculateApprovalRating(video),
    tagPerformanceScore: calculateTagPerformanceScore(video)
  };
}

/**
 * Generate sparkline data for metrics
 */
export function generateSparklineData(values: number[]): { x: number; y: number }[] {
  return values.map((value, index) => ({
    x: index,
    y: value
  }));
}