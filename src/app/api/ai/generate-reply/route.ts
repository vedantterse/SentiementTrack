import { NextRequest, NextResponse } from 'next/server';
import { APIResponse } from '@/types';
import { 
  generateReplyWithMistral, 
  type ReplyGenerationContext,
  cleanText
} from '@/lib/ai-services-pro';

/**
 * POST /api/ai/generate-reply
 * 
 * Generate AI reply using Mistral medium-2508 (preview only, no posting)
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    const body = await request.json();
    const { 
      videoId,
      commentId,
      commentText,
      videoTitle,
      videoDescription,
      transcript,
      channelTitle,
      replyTone = 'friendly'
    } = body;

    // Validate required fields
    if (!videoId || !commentId || !commentText) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'videoId, commentId, and commentText are required'
      }, { status: 400 });
    }

    if (!videoTitle) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'videoTitle is required for context'
      }, { status: 400 });
    }

    console.log(`🤖 Generating AI reply for comment: "${commentText.substring(0, 50)}..."`);
    console.log(`📹 Video: "${videoTitle}" (${videoId})`);

    // Clean and prepare context
    const replyContext: ReplyGenerationContext = {
      commentText: cleanText(commentText),
      videoTitle: cleanText(videoTitle),
      videoDescription: videoDescription ? cleanText(videoDescription) : '',
      transcript: transcript ? cleanText(transcript) : '',
      channelName: channelTitle ? cleanText(channelTitle) : 'Creator',
      replyTone: replyTone as 'friendly' | 'professional' | 'casual' | 'humorous'
    };

    console.log(`🧠 Generating AI reply with Mistral medium-2508`);
    console.log(`🌍 Detected language: ${detectLanguage(commentText)}, Tone: ${replyTone}`);

    // Generate reply using Mistral medium-2508
    const generatedReply = await generateReplyWithMistral(replyContext);

    if (!generatedReply || generatedReply.length < 3) {
      throw new Error('Generated reply is too short or empty');
    }

    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Generated AI reply: "${generatedReply}"`);

    return NextResponse.json<APIResponse<{
      reply: string;
      metadata: {
        videoId: string;
        commentId: string;
        tone: string;
        processingTimeMs: number;
        model: string;
        generatedAt: string;
      }
    }>>({
      success: true,
      data: {
        reply: generatedReply,
        metadata: {
          videoId,
          commentId,
          tone: replyTone,
          processingTimeMs: processingTime,
          model: 'mistral-medium-2508',
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ AI reply generation failed:', error);
    
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Reply generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        : 'Failed to generate reply'
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/generate-reply
 * 
 * API documentation and health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'AI Reply Generation API',
    model: 'mistral-medium-2508',
    version: '1.0.0',
    description: 'Generate AI-powered replies for YouTube comments (preview only)',
    features: [
      'Context-aware reply generation',
      'Multiple tone options (friendly, professional, casual)',
      'Multilingual support',
      'Preview before posting',
      'Custom reply editing',
      'Performance optimized'
    ],
    usage: {
      endpoint: 'POST /api/ai/generate-reply',
      requiredFields: ['videoId', 'commentId', 'commentText', 'videoTitle'],
      optionalFields: ['videoDescription', 'transcript', 'channelTitle', 'replyTone']
    },
    toneOptions: ['friendly', 'professional', 'casual', 'humorous'],
    healthCheck: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mistralAPI: process.env.MISTRAL_API_KEY ? 'configured' : 'missing'
    }
  });
}

/**
 * Simple language detection for reply context
 */
function detectLanguage(text: string): string {
  const hindiPattern = /[\u0900-\u097F]/;
  const arabicPattern = /[\u0600-\u06FF]/;
  const chinesePattern = /[\u4e00-\u9fff]/;
  const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanPattern = /[\uac00-\ud7af]/;
  
  if (hindiPattern.test(text)) return 'hi';
  if (arabicPattern.test(text)) return 'ar';
  if (chinesePattern.test(text)) return 'zh';
  if (japanesePattern.test(text)) return 'ja';
  if (koreanPattern.test(text)) return 'ko';
  
  // Check for common Spanish words
  if (/\b(gracias|muy|bien|bueno|hola|como)\b/i.test(text)) return 'es';
  
  // Check for common French words
  if (/\b(merci|très|bien|bonjour|comment)\b/i.test(text)) return 'fr';
  
  return 'en'; // Default to English
}