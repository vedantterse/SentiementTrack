import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set up authenticated Google API client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const youtube = google.youtube({ version: 'v3', auth });
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

    // Get channel data
    const channelResponse = await youtube.channels.list({
      part: ['snippet', 'statistics', 'brandingSettings', 'contentDetails'],
      mine: true,
    });

    const channel = channelResponse.data.items?.[0];
    if (!channel) {
      return NextResponse.json({ 
        error: 'No YouTube channel found',
        message: 'Please create a YouTube channel first and then come back.'
      }, { status: 404 });
    }

    // Get uploads playlist ID
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    let videos: any[] = [];

    if (uploadsPlaylistId) {
      // Get ALL videos from uploads playlist (paginated)
      let nextPageToken: string | undefined = undefined;
      const allVideoItems: any[] = [];
      
      do {
        const playlistResponse: any = await youtube.playlistItems.list({
          part: ['snippet'],
          playlistId: uploadsPlaylistId,
          maxResults: 50,
          pageToken: nextPageToken,
        });
        
        if (playlistResponse.data.items) {
          allVideoItems.push(...playlistResponse.data.items);
        }
        
        nextPageToken = playlistResponse.data.nextPageToken || undefined;
      } while (nextPageToken && allVideoItems.length < 200); // Limit to 200 videos for performance

      // Get detailed video information in batches
      const videoIds = allVideoItems
        .map((item: any) => item.snippet?.resourceId?.videoId)
        .filter((id): id is string => Boolean(id))
        .slice(0, 50); // Get details for latest 50 videos

      if (videoIds.length > 0) {
        const videosResponse = await youtube.videos.list({
          part: ['snippet', 'statistics', 'contentDetails'],
          id: videoIds,
        });

        videos = videosResponse.data.items?.map((video: any) => ({
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
          tags: video.snippet?.tags || [],
        })) || [];
      }
    }

    // Get analytics for last 30 days
    let analytics = null;
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const analyticsResponse = await youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate,
        endDate,
        metrics: 'views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration,subscribersGained',
        dimensions: 'day',
      });
      
      analytics = analyticsResponse.data;
    } catch (analyticsError) {
      console.warn('Analytics data not available:', analyticsError);
    }

    const channelData = {
      id: channel.id!,
      title: channel.snippet?.title || '',
      description: channel.snippet?.description || '',
      customUrl: channel.snippet?.customUrl,
      publishedAt: channel.snippet?.publishedAt || '',
      thumbnails: {
        default: channel.snippet?.thumbnails?.default?.url || '',
        medium: channel.snippet?.thumbnails?.medium?.url || '',
        high: channel.snippet?.thumbnails?.high?.url || '',
      },
      subscriberCount: channel.statistics?.subscriberCount || '0',
      videoCount: channel.statistics?.videoCount || '0',
      viewCount: channel.statistics?.viewCount || '0',
      country: channel.snippet?.country,
      bannerImageUrl: channel.brandingSettings?.image?.bannerExternalUrl,
    };

    return NextResponse.json({
      channel: channelData,
      videos,
      analytics,
      user: session.user
    });

  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch YouTube data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}