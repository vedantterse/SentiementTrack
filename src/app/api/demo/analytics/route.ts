import { NextRequest, NextResponse } from 'next/server';
import { generateCreatorAnalytics } from '@/lib/metrics';
import { APIResponse, VideoData, CommentData, AnalyticsData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { video, comments, allVideos } = body;

    if (!video || !Array.isArray(comments)) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'video and comments array are required'
      }, { status: 400 });
    }

    const analytics = generateCreatorAnalytics(
      video as VideoData,
      comments as CommentData[],
      allVideos as VideoData[] || []
    );

    return NextResponse.json<APIResponse<{ analytics: AnalyticsData }>>({
      success: true,
      data: { analytics }
    });

  } catch (error) {
    console.error('Error in /api/demo/analytics:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}