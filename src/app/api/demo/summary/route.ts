import { NextRequest, NextResponse } from 'next/server';
import { generateVideoSummaryWithMistral } from '@/lib/ai-services-pro';
import { fetchVideoTranscript } from '@/lib/youtube';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, videoTitle, description, comments } = body;

    if (!videoTitle || !Array.isArray(comments)) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'videoTitle and comments array are required'
      }, { status: 400 });
    }

    // Try to fetch transcript, fallback to description if unavailable
    let transcript = '';
    if (videoId) {
      transcript = await fetchVideoTranscript(videoId);
    }
    
    // If no transcript, use description as content source
    if (!transcript && description) {
      transcript = description;
    }

    const summary = await generateVideoSummaryWithMistral(
      videoTitle,
      description || '',
      comments
    );

    return NextResponse.json<APIResponse<{ summary: string[] }>>({
      success: true,
      data: { summary }
    });

  } catch (error) {
    console.error('Error in /api/demo/summary:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}