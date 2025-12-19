import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { YouTubeService } from '@/lib/youtube-service';
import { APIResponse } from '@/types';
import { 
  generateReplyWithMistral, 
  type ReplyGenerationContext,
  cleanText,
  detectLanguage 
} from '@/lib/ai-services-pro';

/**
 * POST /api/youtube/comment-reply
 * 
 * Generate and post AI replies using Mistral medium-2508
 * Features:
 * - Context-aware replies using video data
 * - Multilingual support 
 * - Creator-authentic tone
 * - Professional error handling
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Authentication required for comment replies'
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      videoId,
      commentId,
      commentText,
      videoTitle,
      videoDescription,
      transcript,
      channelTitle,
      customReply,
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
        error: 'videoTitle is required for context-aware replies'
      }, { status: 400 });
    }

    console.log(`🤖 Generating reply for comment: "${commentText.substring(0, 50)}..."`);
    console.log(`📹 Video: "${videoTitle}" (${videoId})`);

    let replyText: string;

    if (customReply?.trim()) {
      // Use custom reply if provided
      replyText = cleanText(customReply.trim());
      console.log(`✅ Using custom reply: "${replyText.substring(0, 50)}..."`);
    } else {
      // Generate AI reply using Mistral medium-2508
      const cleanComment = cleanText(commentText);
      const detectedLanguage = detectLanguage(cleanComment);
      
      console.log(`🧠 Generating AI reply with Mistral medium-2508`);
      console.log(`🌍 Detected language: ${detectedLanguage}, Tone: ${replyTone}`);

      // Build comprehensive context for Mistral
      const replyContext: ReplyGenerationContext = {
        commentText: cleanComment,
        videoTitle: cleanText(videoTitle),
        videoDescription: videoDescription ? cleanText(videoDescription) : undefined,
        transcript: transcript ? cleanText(transcript) : undefined,
        channelName: channelTitle ? cleanText(channelTitle) : undefined,
        commentLanguage: detectedLanguage,
        commentSentiment: 'neutral', // Could be enhanced with sentiment analysis
        replyTone: replyTone as 'friendly' | 'professional' | 'casual' | 'humorous'
      };

      try {
        replyText = await generateReplyWithMistral(replyContext);
        console.log(`✅ Generated AI reply: "${replyText}"`);
      } catch (aiError) {
        console.error('❌ Mistral reply generation failed:', aiError);
        
        // Intelligent fallback based on comment analysis
        replyText = generateIntelligentFallback(cleanComment, detectedLanguage, replyTone);
        console.log(`🔄 Using intelligent fallback: "${replyText}"`);
      }
    }

    // Validate reply length and content
    if (!replyText || replyText.length < 3) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Generated reply is too short or empty'
      }, { status: 400 });
    }

    if (replyText.length > 280) {
      replyText = replyText.substring(0, 277) + '...';
    }

    // Post reply to YouTube
    try {
      console.log(`📤 Posting reply to YouTube comment ${commentId}`);
      
      // Initialize YouTube service with access token
      const youtubeService = new YouTubeService(session.accessToken as string);
      
      // Use the google.youtube API directly from the service
      const youtube = (youtubeService as any).youtube;
      
      const replyResponse = await youtube.comments.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            parentId: commentId,
            textOriginal: replyText
          }
        }
      });

      const postedReply = replyResponse.data;
      const processingTime = Date.now() - startTime;

      console.log(`✅ Reply posted successfully in ${processingTime}ms`);
      console.log(`📝 Reply ID: ${postedReply.id}`);

      return NextResponse.json<APIResponse<{
        replyId: string;
        replyText: string;
        metadata: {
          videoId: string;
          commentId: string;
          processingTimeMs: number;
          model: string;
          language: string;
          tone: string;
          isCustomReply: boolean;
        }
      }>>({
        success: true,
        data: {
          replyId: postedReply.id!,
          replyText: replyText,
          metadata: {
            videoId,
            commentId,
            processingTimeMs: processingTime,
            model: customReply ? 'custom' : 'mistral-medium-latest',
            language: detectLanguage(commentText),
            tone: replyTone,
            isCustomReply: !!customReply
          }
        }
      });

    } catch (youtubeError: any) {
      console.error('❌ YouTube API error:', youtubeError);
      
      // Handle specific YouTube API errors
      let errorMessage = 'Failed to post reply to YouTube';
      if (youtubeError.response?.status === 403) {
        errorMessage = 'Insufficient permissions to reply to this comment';
      } else if (youtubeError.response?.status === 404) {
        errorMessage = 'Comment not found or video unavailable';
      } else if (youtubeError.response?.status === 400) {
        errorMessage = 'Invalid comment or reply content';
      }

      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: errorMessage
      }, { status: youtubeError.response?.status || 500 });
    }

  } catch (error) {
    const processingTime = Date.now() - (Date.now() - 10000); // Approximate
    
    console.error('❌ Comment reply generation failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Reply generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        : 'Failed to generate and post reply'
    }, { status: 500 });
  }
}

/**
 * Generate intelligent fallback reply when AI fails
 */
function generateIntelligentFallback(
  commentText: string, 
  language: string, 
  tone: string
): string {
  const text = commentText.toLowerCase();
  
  // Language-specific fallback replies
  const fallbackReplies = {
    en: {
      friendly: {
        positive: [
          "Thank you so much! Really appreciate your support! 😊",
          "So glad you enjoyed it! More content coming soon! 🙌",
          "Your comment made my day! Thanks for watching! ❤️"
        ],
        negative: [
          "Thanks for the feedback! Always working to improve 💪",
          "I hear you! Will definitely consider this for next time 👍",
          "Appreciate the honest feedback! Helps me grow as a creator 🙏"
        ],
        neutral: [
          "Thanks for watching and commenting! 😊",
          "Great question! Thanks for engaging! 💭",
          "Appreciate you taking the time to comment! 🙌"
        ]
      },
      professional: {
        positive: [
          "Thank you for your positive feedback. I'm glad you found the content valuable.",
          "I appreciate your support and am pleased the video met your expectations.",
          "Thank you for watching and for your encouraging comment."
        ],
        negative: [
          "Thank you for your feedback. I'll consider your suggestions for future content.",
          "I appreciate your perspective and will work to address these concerns.",
          "Your feedback is valuable and helps me improve my content."
        ],
        neutral: [
          "Thank you for your comment and for watching the video.",
          "I appreciate your engagement with the content.",
          "Thank you for taking the time to comment."
        ]
      }
    },
    hi: {
      friendly: {
        positive: [
          "धन्यवाद! आपका प्यार बहुत अच्छा लगा! 🙏❤️",
          "खुशी हुई कि आपको पसंद आया! और भी वीडियो आएंगे! 😊",
          "आपका comment देखकर दिन बन गया! धन्यवाद! 🌟"
        ],
        negative: [
          "सुझाव के लिए धन्यवाद! अगली बार बेहतर करूंगा! 💪",
          "आपकी बात सही है! मेहनत करता रहूंगा! 👍",
          "फीडबैक के लिए शुक्रिया! इससे सीखने मिलता है! 🙏"
        ],
        neutral: [
          "देखने के लिए धन्यवाद! 😊",
          "comment करने के लिए शुक्रिया! 🙌",
          "आपका साथ बहुत अच्छा लगता है! ❤️"
        ]
      }
    },
    es: {
      friendly: {
        positive: [
          "¡Muchísimas gracias! Me alegra que te haya gustado! 😊❤️",
          "¡Qué bueno que lo disfrutaste! ¡Más contenido pronto! 🙌",
          "¡Tu comentario me hizo el día! ¡Gracias por ver! 🌟"
        ],
        negative: [
          "Gracias por el feedback! Siempre tratando de mejorar 💪",
          "Tienes razón! Trabajaré en eso para la próxima 👍",
          "Aprecio tu honestidad! Me ayuda a crecer 🙏"
        ],
        neutral: [
          "¡Gracias por ver y comentar! 😊",
          "¡Buena pregunta! Gracias por participar 💭",
          "¡Aprecio que te tomes el tiempo de comentar! 🙌"
        ]
      }
    }
  };

  // Detect sentiment based on keywords
  const positiveKeywords = ['good', 'great', 'awesome', 'amazing', 'love', 'like', 'thanks', 'अच्छा', 'बहुत', 'छान', 'bueno', 'gracias'];
  const negativeKeywords = ['bad', 'terrible', 'hate', 'dislike', 'worst', 'बुरा', 'खराब', 'malo', 'horrible'];
  
  const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
  const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));
  
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (hasPositive && !hasNegative) sentiment = 'positive';
  else if (hasNegative && !hasPositive) sentiment = 'negative';

  // Get appropriate fallback
  const langReplies = fallbackReplies[language as keyof typeof fallbackReplies] || fallbackReplies.en;
  const toneReplies = langReplies[tone as keyof typeof langReplies] || langReplies.friendly;
  const sentimentReplies = toneReplies[sentiment];
  
  // Random selection for variety
  return sentimentReplies[Math.floor(Math.random() * sentimentReplies.length)];
}

/**
 * GET /api/youtube/comment-reply
 * 
 * API documentation and health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'YouTube Comment Reply API',
    model: 'mistral-medium-2508',
    version: '2.0.0',
    description: 'Generate and post context-aware replies to YouTube comments',
    features: [
      'Context-aware reply generation',
      'Multilingual support (10+ languages)',
      'Creator-authentic tone',
      'Custom reply support',
      'Intelligent fallbacks',
      'YouTube API integration'
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
    supportedTones: ['friendly', 'professional', 'casual', 'humorous'],
    usage: {
      endpoint: 'POST /api/youtube/comment-reply',
      requiredFields: ['videoId', 'commentId', 'commentText', 'videoTitle'],
      optionalFields: [
        'videoDescription',
        'transcript', 
        'channelTitle',
        'customReply',
        'replyTone'
      ]
    },
    healthCheck: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mistralAPI: process.env.MISTRAL_API_KEY ? 'configured' : 'missing',
      youtubeAPI: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing'
    }
  });
}
