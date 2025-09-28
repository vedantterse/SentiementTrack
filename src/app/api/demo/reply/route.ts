import { NextRequest, NextResponse } from 'next/server';
import { generateReplyWithMistral } from '@/lib/ai-optimized';
import { APIResponse, CommentData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      comment, 
      videoTitle, 
      videoDescription, 
      videoSummary, 
      channelTitle, 
      commentLanguage, 
      commentSentiment 
    } = body;

    if (!comment || !videoTitle) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'comment and videoTitle are required'
      }, { status: 400 });
    }

    // Create a mock CommentData object for the existing function
    const mockComment: CommentData = {
      id: 'temp-' + Date.now(),
      authorDisplayName: 'User',
      authorProfileImageUrl: '',
      textDisplay: comment,
      publishedAt: new Date().toISOString(),
      likeCount: 0,
      detectedLanguage: commentLanguage || 'en',
      sentiment: (commentSentiment as 'positive' | 'negative' | 'neutral') || 'neutral'
    };

    const reply = await generateReplyWithMistral(
      mockComment,
      videoTitle,
      videoSummary || videoDescription?.substring(0, 300) || 'Educational content with practical insights',
      channelTitle || 'Creator'
    );

    return NextResponse.json<APIResponse<{ reply: string }>>({
      success: true,
      data: { reply }
    });

  } catch (error) {
    console.error('Error in /api/demo/reply:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}