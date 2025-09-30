import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    // Set up YouTube API client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const youtube = google.youtube({ version: 'v3', auth });

    // First get the uploads playlist ID and channel info
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails', 'snippet'],
      mine: true,
    });

    const channel = channelResponse.data.items?.[0];
    const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      return NextResponse.json({
        success: true,
        data: { 
          videos: [],
          channelInfo: null
        }
      });
    }

    // Extract channel info
    const channelInfo = {
      title: channel?.snippet?.title || '',
      profileImageUrl: channel?.snippet?.thumbnails?.high?.url || channel?.snippet?.thumbnails?.medium?.url || channel?.snippet?.thumbnails?.default?.url || null,
      customUrl: channel?.snippet?.customUrl || null
    };

    // Get videos from uploads playlist
    const playlistResponse = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults,
    });

    const videoIds = playlistResponse.data.items?.map(item => item.snippet?.resourceId?.videoId).filter((id): id is string => Boolean(id)) || [];

    if (videoIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { videos: [] }
      });
    }

    // Get detailed video information
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: videoIds,
    });

    const videos = videosResponse.data.items?.map((video: any) => ({
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

    return NextResponse.json({
      success: true,
      data: { 
        videos,
        channelInfo
      }
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch videos'
    }, { status: 500 });
  }
}