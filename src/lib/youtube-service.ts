import { google } from 'googleapis';

export interface YouTubeChannelData {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  country?: string;
  bannerImageUrl?: string;
}

export interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration: string;
  tags?: string[];
}

export class YouTubeService {
  private youtube;
  private youtubeAnalytics;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.youtube = google.youtube({ version: 'v3', auth });
    this.youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });
  }

  async getChannelData(): Promise<YouTubeChannelData | null> {
    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'brandingSettings'],
        mine: true,
      });

      const channel = response.data.items?.[0];
      if (!channel) {
        return null;
      }

      return {
        id: channel.id!,
        title: channel.snippet?.title || '',
        description: channel.snippet?.description || '',
        customUrl: channel.snippet?.customUrl || undefined,
        publishedAt: channel.snippet?.publishedAt || '',
        thumbnails: {
          default: channel.snippet?.thumbnails?.default?.url || '',
          medium: channel.snippet?.thumbnails?.medium?.url || '',
          high: channel.snippet?.thumbnails?.high?.url || '',
        },
        subscriberCount: channel.statistics?.subscriberCount || '0',
        videoCount: channel.statistics?.videoCount || '0',
        viewCount: channel.statistics?.viewCount || '0',
        country: channel.snippet?.country || undefined,
        bannerImageUrl: channel.brandingSettings?.image?.bannerExternalUrl || undefined,
      };
    } catch (error) {
      console.error('Error fetching channel data:', error);
      return null;
    }
  }

  async getChannelVideos(maxResults: number = 10): Promise<YouTubeVideoData[]> {
    try {
      // First get the uploads playlist ID
      const channelResponse = await this.youtube.channels.list({
        part: ['contentDetails'],
        mine: true,
      });

      const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        return [];
      }

      // Get videos from uploads playlist
      const playlistResponse = await this.youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults,
      });

      const videoIds = playlistResponse.data.items?.map(item => item.snippet?.resourceId?.videoId).filter((id): id is string => Boolean(id)) || [];

      if (videoIds.length === 0) {
        return [];
      }

      // Get detailed video information
      const videosResponse = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: videoIds,
      });

      return videosResponse.data.items?.map((video: any) => ({
        id: video.id!,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        publishedAt: video.snippet?.publishedAt || '',
        thumbnails: {
          default: video.snippet?.thumbnails?.default?.url || '',
          medium: video.snippet?.thumbnails?.medium?.url || '',
          high: video.snippet?.thumbnails?.high?.url || '',
        },
        viewCount: video.statistics?.viewCount || '0',
        likeCount: video.statistics?.likeCount || '0',
        commentCount: video.statistics?.commentCount || '0',
        duration: video.contentDetails?.duration || '',
        tags: video.snippet?.tags,
      })) || [];
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      return [];
    }
  }

  async getChannelAnalytics(startDate: string, endDate: string) {
    try {
      const response = await this.youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate,
        endDate,
        metrics: 'views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration',
        dimensions: 'day',
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  }
}