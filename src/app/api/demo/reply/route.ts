/**
 * Professional Reply Generation API
 * 
 * Uses Mistral medium-2508 for context-aware, multilingual, personalized replies
 * Features:
 * - Proper \n character handling
 * - Multilingual support (EN, HI, MR, ES, FR, DE, AR, ZH, JA, KO)
 * - Context-aware responses using video content
 * - Creator-authentic tone with humor when appropriate
 * - Professional error handling and fallbacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { APIResponse } from '@/types';
import { 
  generateReplyWithMistral, 
  type ReplyGenerationContext,
  cleanText,
  detectLanguage
} from '@/lib/ai-services-pro';

/**
 * POST /api/demo/reply
 * 
 * Generate personalized, context-aware replies using Mistral medium-2508
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Parse and validate request body
    const body = await request.json();
    const { 
      comment, 
      videoTitle, 
      videoDescription, 
      transcript,
      videoSummary, 
      channelTitle, 
      commentLanguage, 
      commentSentiment,
      replyTone = 'friendly',
      includeHumor = false
    } = body;

    // Validate required fields
    if (!comment?.trim()) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Comment text is required and cannot be empty'
      }, { status: 400 });
    }

    if (!videoTitle?.trim()) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Video title is required for contextual replies'
      }, { status: 400 });
    }

    // Validate reply tone
    const validTones = ['friendly', 'professional', 'casual', 'humorous'];
    if (replyTone && !validTones.includes(replyTone)) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: `Reply tone must be one of: ${validTones.join(', ')}`
      }, { status: 400 });
    }

    console.log(`🤖 Starting reply generation for comment: "${comment.substring(0, 50)}..."`);
    console.log(`📹 Video: "${videoTitle}"`);
    console.log(`🎯 Tone: ${replyTone}, Language: ${commentLanguage || 'auto-detect'}`);

    // Clean and prepare comment text
    const cleanComment = cleanText(comment);
    const detectedLanguage = commentLanguage || detectLanguage(cleanComment);
    
    // Determine optimal tone based on context
    let finalTone = replyTone;
    if (includeHumor && commentSentiment === 'positive') {
      finalTone = 'humorous';
    }

    // Build comprehensive context for Mistral
    const replyContext: ReplyGenerationContext = {
      commentText: cleanComment,
      videoTitle: cleanText(videoTitle),
      videoDescription: videoDescription ? cleanText(videoDescription) : undefined,
      transcript: transcript ? cleanText(transcript) : undefined,
      channelName: channelTitle ? cleanText(channelTitle) : undefined,
      commentLanguage: detectedLanguage,
      commentSentiment: commentSentiment || 'neutral',
      replyTone: finalTone as 'friendly' | 'professional' | 'casual' | 'humorous'
    };

    console.log(`🧠 Generating reply with Mistral medium-2508...`);
    console.log(`📊 Context: Language=${detectedLanguage}, Sentiment=${commentSentiment}, Tone=${finalTone}`);

    // Generate reply using Mistral
    const reply = await generateReplyWithMistral(replyContext);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Reply generated successfully in ${processingTime}ms`);
    console.log(`💬 Generated reply: "${reply}"`);

    // Return successful response
    return NextResponse.json<APIResponse<{
      reply: string;
      metadata: {
        tone: string;
        language: string;
        processingTimeMs: number;
        model: string;
        contextUsed: boolean;
      }
    }>>({
      success: true,
      data: {
        reply,
        metadata: {
          tone: finalTone,
          language: detectedLanguage,
          processingTimeMs: processingTime,
          model: 'mistral-medium-2508',
          contextUsed: !!(videoDescription || transcript)
        }
      }
    });

  } catch (error) {
    const processingTime = Date.now() - (Date.now() - 5000); // Approximate
    
    console.error('❌ Reply generation failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    // Return detailed error response for development
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to generate reply: ${error instanceof Error ? error.message : 'Unknown error'}`
        : 'Failed to generate reply'
    }, { status: 500 });
  }
}

/**
 * GET /api/demo/reply
 * 
 * API documentation and health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'Reply Generation API',
    model: 'mistral-medium-2508',
    version: '1.0.0',
    features: [
      'Multilingual support (10+ languages)',
      'Context-aware responses',
      'Multiple tone options',
      'Professional error handling',
      'Proper character encoding'
    ],
    supportedLanguages: [
      'English (en)',
      'Hindi (hi)', 
      'Marathi (mr)',
      'Spanish (es)',
      'French (fr)',
      'German (de)',
      'Arabic (ar)',
      'Chinese (zh)',
      'Japanese (ja)',
      'Korean (ko)'
    ],
    supportedTones: [
      'friendly',
      'professional', 
      'casual',
      'humorous'
    ],
    usage: {
      endpoint: 'POST /api/demo/reply',
      requiredFields: ['comment', 'videoTitle'],
      optionalFields: [
        'videoDescription',
        'transcript', 
        'channelTitle',
        'commentLanguage',
        'commentSentiment',
        'replyTone',
        'includeHumor'
      ]
    },
    healthCheck: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mistralAPI: process.env.MISTRAL_API_KEY ? 'configured' : 'missing'
    }
  });
}