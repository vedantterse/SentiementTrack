import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchAllVideoComments } from '@/lib/youtube';
import { analyzeSentimentWithGroq } from '@/lib/ai-services-pro';
import { APIResponse, CommentData } from '@/types';

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
    const limit = parseInt(searchParams.get('limit') || '100'); // No limit for authenticated users
    const includeReplies = searchParams.get('includeReplies') === 'true';

    if (!videoId) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'videoId parameter is required'
      }, { status: 400 });
    }

    // Validate videoId format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Invalid video ID format'
      }, { status: 400 });
    }

    console.log(`Fetching ALL comments for video ${videoId} (authenticated request)`);

    // Fetch ALL comments for authenticated users
    const allComments = await fetchAllVideoComments(videoId);

    if (!allComments || allComments.length === 0) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Comments not available or video not found'
      }, { status: 404 });
    }

    console.log(`Retrieved ${allComments.length} comments, analyzing sentiment with Groq llama-3.3-70b-versatile...`);

    // Use optimized concurrent sentiment analysis with self-healing
    // Analyze sentiment with Groq llama-3.3-70b-versatile
    const commentsWithSentiment = await analyzeSentimentWithGroq(allComments);

    // Calculate sentiment distribution
    const sentimentCounts = commentsWithSentiment.reduce(
      (acc, comment) => {
        const sentiment = comment.sentiment || 'neutral';
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    const totalComments = commentsWithSentiment.length;
    const sentimentDistribution = {
      positive: {
        count: sentimentCounts.positive,
        percentage: ((sentimentCounts.positive / totalComments) * 100).toFixed(1)
      },
      neutral: {
        count: sentimentCounts.neutral,
        percentage: ((sentimentCounts.neutral / totalComments) * 100).toFixed(1)
      },
      negative: {
        count: sentimentCounts.negative,
        percentage: ((sentimentCounts.negative / totalComments) * 100).toFixed(1)
      }
    };

    // Sort comments by engagement (likes)
    const sortedComments = commentsWithSentiment.sort((a, b) => {
      const aEngagement = a.likeCount || 0;
      const bEngagement = b.likeCount || 0;
      return bEngagement - aEngagement;
    });

    // Apply limit if specified
    const limitedComments = limit > 0 ? sortedComments.slice(0, limit) : sortedComments;

    const response = NextResponse.json<APIResponse<{
      comments: CommentData[];
      sentimentDistribution: typeof sentimentDistribution;
      totalComments: number;
      analyzedComments: number;
    }>>({
      success: true,
      data: {
        comments: limitedComments,
        sentimentDistribution,
        totalComments: allComments.length,
        analyzedComments: commentsWithSentiment.length
      }
    });

    // Cache for 30 minutes for authenticated requests
    response.headers.set('Cache-Control', 'private, s-maxage=1800, stale-while-revalidate=900');
    
    return response;

  } catch (error) {
    console.error('Error in /api/youtube/video-comments:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}