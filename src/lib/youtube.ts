// YouTube Data API v3 utilities and helpers
import { ParsedUrl, VideoData, ChannelData, CommentData } from '@/types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Parse YouTube URL to extract video or channel ID
 */
export function parseYouTubeUrl(url: string): ParsedUrl {
  try {
    const urlObj = new URL(url);
    
    // Video URL patterns
    const videoIdMatch = 
      url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/) ||
      url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
    
    if (videoIdMatch) {
      return { type: 'video', id: videoIdMatch[1] };
    }

    // Channel URL patterns
    const channelIdMatch = 
      url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/) ||
      url.match(/youtube\.com\/c\/([a-zA-Z0-9_-]+)/) ||
      url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/) ||
      url.match(/youtube\.com\/user\/([a-zA-Z0-9_-]+)/);
    
    if (channelIdMatch) {
      return { type: 'channel', id: channelIdMatch[1] };
    }

    return { type: null, id: '' };
  } catch {
    return { type: null, id: '' };
  }
}

/**
 * Fetch video data from YouTube Data API v3
 */
export async function fetchVideoData(videoId: string): Promise<VideoData | null> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?` +
      `id=${videoId}&` +
      `part=snippet,statistics,contentDetails&` +
      `key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const stats = video.statistics;

    return {
      id: video.id,
      title: snippet.title,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: parseInt(stats.viewCount || '0'),
      likeCount: parseInt(stats.likeCount || '0'),
      commentCount: parseInt(stats.commentCount || '0'),
      description: snippet.description,
      thumbnails: snippet.thumbnails,
      category: snippet.categoryId || 'Unknown',
      tags: snippet.tags || []
    };
  } catch (error) {
    console.error('Error fetching video data:', error);
    return null;
  }
}

/**
 * Fetch comprehensive channel data from YouTube Data API v3
 */
export async function fetchChannelData(channelId: string): Promise<ChannelData | null> {
  try {
    // Get comprehensive channel info including branding settings
    const channelResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?` +
      `id=${channelId}&` +
      `part=snippet,statistics,brandingSettings&` +
      `key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!channelResponse.ok) {
      throw new Error(`YouTube API error: ${channelResponse.status}`);
    }

    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      return null;
    }

    const channel = channelData.items[0];
    const snippet = channel.snippet;
    const stats = channel.statistics;
    const branding = channel.brandingSettings;

    // Then get recent videos
    const videosResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?` +
      `channelId=${channelId}&` +
      `part=snippet&` +
      `order=date&` +
      `type=video&` +
      `maxResults=20&` +
      `key=${process.env.YOUTUBE_API_KEY}`
    );

    const videosData = await videosResponse.json();
    const videos: VideoData[] = [];

    if (videosData.items) {
      // Fetch detailed stats for each video
      const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');
      const videoStatsResponse = await fetch(
        `${YOUTUBE_API_BASE}/videos?` +
        `id=${videoIds}&` +
        `part=statistics,contentDetails&` +
        `key=${process.env.YOUTUBE_API_KEY}`
      );

      const videoStatsData = await videoStatsResponse.json();
      const statsMap = new Map();
      
      if (videoStatsData.items) {
        videoStatsData.items.forEach((item: any) => {
          statsMap.set(item.id, item);
        });
      }

      for (const item of videosData.items) {
        const videoId = item.id.videoId;
        const videoStats = statsMap.get(videoId);
        
        videos.push({
          id: videoId,
          title: item.snippet.title,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          duration: videoStats?.contentDetails?.duration || 'PT0S',
          viewCount: parseInt(videoStats?.statistics?.viewCount || '0'),
          likeCount: parseInt(videoStats?.statistics?.likeCount || '0'),
          commentCount: parseInt(videoStats?.statistics?.commentCount || '0'),
          description: item.snippet.description,
          thumbnails: item.snippet.thumbnails,
          category: 'Unknown',
          tags: []
        });
      }
    }

    return {
      id: channel.id,
      title: snippet.title,
      description: snippet.description || branding?.channel?.description || 'No description available',
      subscriberCount: parseInt(stats.subscriberCount || '0'),
      videoCount: parseInt(stats.videoCount || '0'),
      viewCount: parseInt(stats.viewCount || '0'),
      publishedAt: snippet.publishedAt,
      thumbnails: snippet.thumbnails,
      profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || null,
      customUrl: snippet.customUrl,
      country: snippet.country,
      videos
    };
  } catch (error) {
    console.error('Error fetching channel data:', error);
    return null;
  }
}

/**
 * Fetch comments from YouTube Data API v3
 */
export async function fetchVideoComments(
  videoId: string, 
  maxResults: number = 25,
  pageToken?: string
): Promise<{ comments: CommentData[], nextPageToken?: string } | null> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/commentThreads?` +
      `videoId=${videoId}&` +
      `part=snippet&` +
      `order=relevance&` +
      `maxResults=${maxResults}&` +
      `${pageToken ? `pageToken=${pageToken}&` : ''}` +
      `key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items) {
      return { comments: [] };
    }

    const comments: CommentData[] = data.items.map((item: any) => {
      const topComment = item.snippet.topLevelComment.snippet;
      
      return {
        id: item.id,
        authorDisplayName: topComment.authorDisplayName,
        authorProfileImageUrl: topComment.authorProfileImageUrl,
        textDisplay: topComment.textDisplay,
        publishedAt: topComment.publishedAt,
        likeCount: topComment.likeCount || 0,
        authorChannelId: topComment.authorChannelId?.value
      };
    });

    return {
      comments,
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return null;
  }
}

/**
 * Format number for display (K, M notation)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Parse ISO 8601 duration to readable format
 */
export function parseDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1]?.slice(0, -1) || '0');
  const minutes = parseInt(match[2]?.slice(0, -1) || '0');
  const seconds = parseInt(match[3]?.slice(0, -1) || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate time elapsed since publication
 */
export function getTimeElapsed(publishedAt: string): string {
  const now = new Date();
  const published = new Date(publishedAt);
  const diffMs = now.getTime() - published.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  return 'Recently';
}

/**
 * Fetch video transcript/captions (fallback to description if unavailable)
 */
export async function fetchVideoTranscript(videoId: string): Promise<string> {
  try {
    // Note: YouTube Data API v3 doesn't provide transcript access
    // This would require a separate transcript API or service
    // For now, we'll return a placeholder and use video description
    
    // In a real implementation, you might use:
    // - youtube-transcript-api (Python equivalent)
    // - YouTube transcript API (if available)
    // - Third-party transcript services
    
    console.log(`Transcript not available for video ${videoId} via YouTube Data API v3`);
    return '';
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return '';
  }
}

/**
 * Fetch latest comments sorted by time (for display)
 */
export async function fetchLatestVideoComments(videoId: string, maxComments: number = 25): Promise<CommentData[]> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/commentThreads?` +
      `videoId=${videoId}&` +
      `part=snippet&` +
      `order=time&` +
      `maxResults=${Math.min(maxComments, 100)}&` +
      `key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items) {
      return [];
    }

    const comments: CommentData[] = data.items.map((item: any) => {
      const topComment = item.snippet.topLevelComment.snippet;
      
      return {
        id: item.id,
        authorDisplayName: topComment.authorDisplayName,
        authorProfileImageUrl: topComment.authorProfileImageUrl,
        textDisplay: topComment.textDisplay,
        publishedAt: topComment.publishedAt,
        likeCount: topComment.likeCount || 0,
        authorChannelId: topComment.authorChannelId?.value
      };
    });

    return comments;
  } catch (error) {
    console.error('Error fetching latest video comments:', error);
    return [];
  }
}

/**
 * Fetch ALL comments from a video (top comments by relevance for pie chart)
 */
export async function fetchAllVideoComments(videoId: string): Promise<CommentData[]> {
  try {
    const allComments: CommentData[] = [];
    let nextPageToken: string | undefined;
    let requestCount = 0;
    const maxRequests = 20; // Increased limit for comprehensive comment analysis
    
    do {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/commentThreads?` +
        `videoId=${videoId}&` +
        `part=snippet&` +
        `order=relevance&` +
        `maxResults=100&` +
        `${nextPageToken ? `pageToken=${nextPageToken}&` : ''}` +
        `key=${process.env.YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items) {
        const comments: CommentData[] = data.items.map((item: any) => {
          const topComment = item.snippet.topLevelComment.snippet;
          
          return {
            id: item.id,
            authorDisplayName: topComment.authorDisplayName,
            authorProfileImageUrl: topComment.authorProfileImageUrl,
            textDisplay: topComment.textDisplay,
            publishedAt: topComment.publishedAt,
            likeCount: topComment.likeCount || 0,
            authorChannelId: topComment.authorChannelId?.value
          };
        });
        
        allComments.push(...comments);
      }

      nextPageToken = data.nextPageToken;
      requestCount++;
      
    } while (nextPageToken && requestCount < maxRequests);

    return allComments;
  } catch (error) {
    console.error('Error fetching all video comments:', error);
    return [];
  }
}