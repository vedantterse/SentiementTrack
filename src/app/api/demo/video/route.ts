import { NextRequest, NextResponse } from 'next/server';
import { fetchVideoData } from '@/lib/youtube';
import { APIResponse, VideoData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'videoId parameter is required'
      }, { status: 400 });
    }

    // Validate videoId format (YouTube video IDs are 11 characters)
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Invalid video ID format'
      }, { status: 400 });
    }

    const videoData = await fetchVideoData(videoId);

    if (!videoData) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Video not found or unavailable'
      }, { status: 404 });
    }

    const response = NextResponse.json<APIResponse<VideoData>>({
      success: true,
      data: videoData
    });
    
    // Cache for 6 hours
    response.headers.set('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=3600');
    
    return response;

  } catch (error) {
    console.error('Error in /api/demo/video:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}