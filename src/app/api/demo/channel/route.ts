import { NextRequest, NextResponse } from 'next/server';
import { fetchChannelData } from '@/lib/youtube';
import { APIResponse, ChannelData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'channelId parameter is required'
      }, { status: 400 });
    }

    // YouTube channel IDs start with UC and are 24 characters long
    if (!/^UC[a-zA-Z0-9_-]{22}$/.test(channelId)) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Invalid channel ID format'
      }, { status: 400 });
    }

    const channelData = await fetchChannelData(channelId);

    if (!channelData) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Channel not found or unavailable'
      }, { status: 404 });
    }

    const response = NextResponse.json<APIResponse<ChannelData>>({
      success: true,
      data: channelData
    });
    
    // Cache for 6 hours
    response.headers.set('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=3600');
    
    return response;

  } catch (error) {
    console.error('Error in /api/demo/channel:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}