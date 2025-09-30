import { NextRequest, NextResponse } from 'next/server';
import { APIResponse, CommentData } from '@/types';
import { 
  generateCreatorInsightsWithMistral, 
  type CreatorInsights,
  cleanText
} from '@/lib/ai-services-pro';

/**
 * POST /api/ai/feedback-insights
 * 
 * Generate comprehensive creator insights using Mistral large-latest
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    const body = await request.json();
    const { 
      videoTitle,
      videoDescription,
      transcript,
      comments,
      sentimentDistribution,
      channelName,
      videoMetrics
    } = body;

    // Validate required fields
    if (!videoTitle?.trim()) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Video title is required for insights generation'
      }, { status: 400 });
    }

    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Comments array is required and must contain at least one comment'
      }, { status: 400 });
    }

    if (!sentimentDistribution) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Sentiment distribution data is required for insights'
      }, { status: 400 });
    }

    console.log(`🧠 Generating feedback insights for: "${videoTitle}"`);
    console.log(`📊 Processing ${comments.length} comments with sentiment data`);

    // Clean and prepare data
    const cleanVideoTitle = cleanText(videoTitle);
    const cleanTranscript = transcript ? cleanText(transcript) : 'Transcript not available';
    const validComments = comments.filter((comment: any) => 
      comment && typeof comment.textDisplay === 'string' && comment.textDisplay.trim()
    );

    if (validComments.length === 0) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'No valid comments found for analysis'
      }, { status: 400 });
    }

    console.log(`✅ Validated ${validComments.length} comments for insights generation`);

    // Generate comprehensive insights using Mistral large-latest
    const insights = await generateCreatorInsightsWithMistral(
      cleanVideoTitle,
      cleanTranscript,
      validComments,
      sentimentDistribution
    );

    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Feedback insights generated successfully in ${processingTime}ms`);

    // Return comprehensive insights
    return NextResponse.json<APIResponse<{
      insights: CreatorInsights;
      metadata: {
        videoTitle: string;
        commentsAnalyzed: number;
        processingTimeMs: number;
        model: string;
        analysisTimestamp: string;
      }
    }>>({
      success: true,
      data: {
        insights,
        metadata: {
          videoTitle: cleanVideoTitle,
          commentsAnalyzed: validComments.length,
          processingTimeMs: processingTime,
          model: 'mistral-large-latest',
          analysisTimestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Feedback insights generation failed:', error);
    
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Insights generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        : 'Failed to generate insights'
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/feedback-insights
 * API documentation and health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'Feedback Insights API',
    model: 'mistral-large-latest',
    version: '1.0.0',
    description: 'Generate comprehensive creator insights from video feedback and comments',
    features: [
      'Audience engagement analysis',
      'Content performance recommendations',
      'Strategic growth insights', 
      'Multilingual feedback processing',
      'Reply strategy optimization',
      'Performance prediction scoring'
    ],
    usage: {
      endpoint: 'POST /api/ai/feedback-insights',
      requiredFields: ['videoTitle', 'comments', 'sentimentDistribution'],
      optionalFields: ['videoDescription', 'transcript', 'channelName', 'videoMetrics']
    },
    healthCheck: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mistralAPI: process.env.MISTRAL_API_KEY ? 'configured' : 'missing'
    }
  });
}
