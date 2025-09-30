import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchVideoData } from '@/lib/youtube';
import { APIResponse, VideoData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

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

    // Fetch comprehensive video data
    const videoData = await fetchVideoData(videoId);

    if (!videoData) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Video not found or unavailable'
      }, { status: 404 });
    }

    // Calculate advanced metrics
    const engagementRate = videoData.viewCount > 0 
      ? ((videoData.likeCount + videoData.commentCount) / videoData.viewCount * 100).toFixed(2)
      : '0.00';
    
    const likeToViewRatio = videoData.viewCount > 0 
      ? (videoData.likeCount / videoData.viewCount * 100).toFixed(2)
      : '0.00';
    
    const commentToViewRatio = videoData.viewCount > 0 
      ? (videoData.commentCount / videoData.viewCount * 100).toFixed(2)
      : '0.00';

    // Calculate virality score based on engagement and view velocity
    const publishDate = new Date(videoData.publishedAt);
    const daysSincePublish = Math.max(1, Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24)));
    const viewVelocity = videoData.viewCount / daysSincePublish;
    const viralityScore = Math.min(100, Math.sqrt(viewVelocity) * parseFloat(engagementRate) / 10).toFixed(1);

    // Enhanced video data with analytics
    const enhancedVideoData = {
      ...videoData,
      analytics: {
        engagementRate: parseFloat(engagementRate),
        likeToViewRatio: parseFloat(likeToViewRatio),
        commentToViewRatio: parseFloat(commentToViewRatio),
        viralityScore: parseFloat(viralityScore),
        viewVelocity: Math.round(viewVelocity),
        daysSincePublish,
        estimatedReach: Math.round(videoData.viewCount * 1.2), // Conservative estimate
        estimatedImpressions: Math.round(videoData.viewCount * 3.5) // Industry average
      }
    };

    const response = NextResponse.json<APIResponse<typeof enhancedVideoData>>({
      success: true,
      data: enhancedVideoData
    });
    
    // Cache for 1 hour for authenticated requests
    response.headers.set('Cache-Control', 'private, s-maxage=3600, stale-while-revalidate=1800');
    
    return response;

  } catch (error) {
    console.error('Error in /api/youtube/video-details:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}