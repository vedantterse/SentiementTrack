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

    // Set up YouTube API client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const youtube = google.youtube({ version: 'v3', auth });

    // Get channel data only - fast endpoint
    const channelResponse = await youtube.channels.list({
      part: ['snippet', 'statistics', 'brandingSettings'],
      mine: true,
    });

    const channel = channelResponse.data.items?.[0];
    if (!channel) {
      return NextResponse.json({
        success: false,
        error: 'No YouTube channel found. Please create a YouTube channel first.'
      }, { status: 404 });
    }

    const channelData = {
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

    return NextResponse.json({
      success: true,
      data: {
        channel: channelData,
        user: {
          name: session.user?.name,
          email: session.user?.email,
          image: session.user?.image
        }
      }
    });

  } catch (error) {
    console.error('Error fetching channel info:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch channel information'
    }, { status: 500 });
  }
}