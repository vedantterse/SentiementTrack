export interface VideoData {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  description: string;
  thumbnails: {
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  category: string;
  tags: string[];
}

export interface ChannelData {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
  thumbnails: {
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  profileImageUrl?: string;
  customUrl?: string;
  country?: string;
  videos: VideoData[];
}

export interface CommentData {
  id: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  textDisplay: string;
  publishedAt: string;
  likeCount: number;
  authorChannelId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence?: number;
  detectedLanguage?: string;
}

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface KeywordData {
  word: string;
  count: number;
  weight: number;
}

export interface AIInsight {
  summary: string[];
  keywords: KeywordData[];
  suggestedReply?: string;
}

export interface AnalyticsData {
  totalComments: number;
  commentsRetrieved: number;
  engagementRatio: number;
  viewToLikeRatio: number;
  positivePercentage: number;
  commentResponseRate: number;
  likesPerThousandViews: number;
  subscriberGrowthPotential: number;
}

export interface ParsedUrl {
  type: 'video' | 'channel' | null;
  id: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}