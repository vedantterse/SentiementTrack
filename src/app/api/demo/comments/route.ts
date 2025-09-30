import { NextRequest, NextResponse } from 'next/server';
import { fetchAllVideoComments, fetchLatestVideoComments } from '@/lib/youtube';
import { analyzeSentimentWithGroq } from '@/lib/ai-services-pro';
import { APIResponse, CommentData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const limit = parseInt(searchParams.get('limit') || '25');
    const pageToken = searchParams.get('pageToken') || undefined;
    const getAllComments = searchParams.get('getAllComments') === 'true';

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

    // Fetch ALL comments first
    const allComments = await fetchAllVideoComments(videoId);

    if (!allComments || allComments.length === 0) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Comments not available or video not found'
      }, { status: 404 });
    }

    if (getAllComments) {
      // For pie chart: return TOP 100 comments by relevance with sentiment analysis
      const topCommentsForPieChart = allComments.slice(0, 100);
      console.log(`Processing TOP ${topCommentsForPieChart.length} comments for pie chart analysis`);
      
      try {
        // Analyze sentiment with Groq llama-3.3-70b-versatile
        const allCommentsWithSentiment = await analyzeSentimentWithGroq(topCommentsForPieChart);
        console.log(`Successfully analyzed ${allCommentsWithSentiment.length} top comments for pie chart`);
        
        return NextResponse.json<APIResponse<CommentData[]>>({
          success: true,
          data: allCommentsWithSentiment
        });
      } catch (error) {
        console.error('Error analyzing pie chart comments:', error);
        // Return comments without sentiment analysis as fallback
        return NextResponse.json<APIResponse<CommentData[]>>({
          success: true,
          data: topCommentsForPieChart.map(comment => ({
            ...comment,
            sentiment: 'neutral' as const,
            confidence: 0.5,
            detectedLanguage: 'en'
          }))
        });
      }
    }

    // For display: fetch LATEST 25 comments sorted by time, analyze sentiment
    const latestComments = await fetchLatestVideoComments(videoId, 25);
    // Analyze sentiment with Groq llama-3.3-70b-versatile
    const commentsWithSentiment = await analyzeSentimentWithGroq(latestComments);

    // Return paginated results - use requested limit (up to 25 for display)
    const startIndex = pageToken ? parseInt(pageToken) : 0;
    const endIndex = Math.min(startIndex + limit, commentsWithSentiment.length);
    const paginatedComments = commentsWithSentiment.slice(startIndex, endIndex);
    
    const hasMore = endIndex < commentsWithSentiment.length;
    const nextPageToken = hasMore ? endIndex.toString() : undefined;

    return NextResponse.json<APIResponse<{
      comments: CommentData[];
      nextPageToken?: string;
      totalAnalyzed: number;
      totalAvailable: number;
    }>>({
      success: true,
      data: {
        comments: paginatedComments,
        nextPageToken: nextPageToken,
        totalAnalyzed: commentsWithSentiment.length,
        totalAvailable: latestComments.length
      }
    });

  } catch (error) {
    console.error('Error in /api/demo/comments:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}