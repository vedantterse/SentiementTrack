/**
 * Professional AI Services Architecture for Creator Intelligence Platform
 * 
 * Architecture:
 * - Groq (llama-3.3-70b-versatile) for sentiment analysis
 * - Mistral (mistral-medium-2508) for personalized, multilingual reply generation  
 * - Mistral (mistral-large-latest) for creator hub analytics and insights
 * 
 * Features:
 * - Proper TypeScript interfaces with strict typing
 * - Professional error handling with retry logic
 * - Rate limiting and backoff strategies
 * - Multilingual support (EN, HI, MR, ES, FR, DE)
 * - Context-aware response generation
 * - Character encoding fixes for proper \n handling
 */

import { CommentData } from '@/types';
import { Groq } from 'groq-sdk';
import { Mistral } from '@mistralai/mistralai';

// ===== TYPE DEFINITIONS =====

interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  language: string;
  reasoning: string;
  keywords: string[];
}

interface ReplyGenerationContext {
  commentText: string;
  videoTitle: string;
  videoDescription?: string;
  transcript?: string;
  channelName?: string;
  commentLanguage?: string;
  commentSentiment?: 'positive' | 'negative' | 'neutral';
  replyTone: 'friendly' | 'professional' | 'casual' | 'humorous';
}

interface CreatorInsights {
  audienceInsights: {
    whatTheyLoved: string[];
    whatTheyDidntLike: string[];
    commonQuestions: string[];
    suggestedTopics: string[];
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  contentRecommendations: {
    nextVideoIdeas: string[];
    improvementAreas: string[];
    strengthsToKeep: string[];
    hashtags: string[];
    title: string[];
    thumbnail: string[];
  };
  engagementStrategy: {
    replyPriority: string[];
    communityBuilding: string[];
    contentStrategy: string[];
  };
  performancePrediction: {
    score: number;
    reasoning: string;
    optimizationTips: string[];
    expectedGrowth: string;
    viralPotential: number;
  };
}

// ===== CLIENT INITIALIZATION =====

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const mistralClient = new Mistral({ 
  apiKey: process.env.MISTRAL_API_KEY 
});

// ===== CONFIGURATION =====

const CONFIG = {
  groq: {
    model: 'llama-3.3-70b-versatile',
    batchSize: 20,
    delayMs: 1000,
    maxRetries: 3,
    temperature: 0.1,
  },
  mistral: {
    replyModel: 'mistral-medium-2508',
    analyticsModel: 'mistral-large-latest',
    maxRetries: 3,
    delayMs: 500,
    temperature: 0.7,
  }
} as const;

// ===== UTILITY FUNCTIONS =====

/**
 * Delay utility with proper async handling
 */
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exponential backoff calculation
 */
const calculateBackoff = (attempt: number, baseDelay: number): number =>
  Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds

/**
 * Clean text for proper encoding (fixes \n issues)
 */
const cleanText = (text: string): string => {
  return text
    .replace(/\\n/g, '\n')      // Convert escaped newlines to actual newlines
    .replace(/\\t/g, '\t')      // Convert escaped tabs  
    .replace(/\\r/g, '\r')      // Convert escaped carriage returns
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .trim();
};

/**
 * Detect comment language with high accuracy
 */
const detectLanguage = (text: string): string => {
  const patterns = {
    hi: /[\u0900-\u097F]|धन्यवाद|अच्छा|बहुत|क्या|है|मजा|वीडियो/,
    mr: /[\u0900-\u097F]|धन्यवाद|छान|मस्त|व्हिडिओ|आहे/,
    es: /¿|¡|muy|que|para|este|video|gracias|hola/i,
    fr: /très|que|pour|cette|vidéo|merci|bonjour|c'est/i,
    de: /sehr|dass|für|diese|video|danke|hallo|ist/i,
    pt: /muito|que|para|este|vídeo|obrigado|olá/i,
    ar: /[\u0600-\u06FF]|شكرا|جميل|فيديو|رائع/,
    zh: /[\u4e00-\u9fff]|谢谢|很好|视频|棒/,
    ja: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]|ありがとう|いい|動画|素晴らしい/,
    ko: /[\uac00-\ud7af]|감사|좋은|비디오|멋진/,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return lang;
  }
  
  return 'en'; // Default to English
};

// ===== GROQ SENTIMENT ANALYSIS =====

/**
 * Analyze sentiment using Groq llama-3.3-70b-versatile with batching
 */
export async function analyzeSentimentWithGroq(comments: CommentData[]): Promise<CommentData[]> {
  try {
    console.log(`🚀 Starting Groq sentiment analysis for ${comments.length} comments`);
    
    if (!comments.length) {
      console.warn('⚠️ No comments provided for sentiment analysis');
      return [];
    }

    // Create optimized batches
    const batches: CommentData[][] = [];
    for (let i = 0; i < comments.length; i += CONFIG.groq.batchSize) {
      batches.push(comments.slice(i, i + CONFIG.groq.batchSize));
    }
    
    console.log(`📦 Processing ${batches.length} batches with Groq`);
    
    // Process batches with proper rate limiting
    const results: CommentData[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batchResult = await processGroqBatch(batches[i], i + 1);
      results.push(...batchResult);
      
      // Rate limiting between batches
      if (i < batches.length - 1) {
        await delay(CONFIG.groq.delayMs);
      }
    }
    
    console.log(`✅ Groq sentiment analysis completed: ${results.length} comments processed`);
    return results;
    
  } catch (error) {
    console.error('❌ Groq sentiment analysis failed:', error);
    throw new Error(`Sentiment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process a single batch with Groq
 */
async function processGroqBatch(comments: CommentData[], batchNumber: number): Promise<CommentData[]> {
  for (let attempt = 1; attempt <= CONFIG.groq.maxRetries; attempt++) {
    try {
      console.log(`⚡ Processing Groq batch ${batchNumber}, attempt ${attempt}`);
      
      // Prepare clean comment data
      const cleanComments = comments.map((comment, index) => ({
        id: index,
        text: cleanText(comment.textDisplay.substring(0, 800)), // Increased limit
        author: comment.authorDisplayName,
        likes: comment.likeCount || 0,
        language: detectLanguage(comment.textDisplay)
      }));

      const sentimentPrompt = createGroqSentimentPrompt(cleanComments);
      
      // Call Groq API
      const response = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert multilingual sentiment analyzer for YouTube comments. You understand context, sarcasm, and cultural nuances across languages."
          },
          {
            role: "user", 
            content: sentimentPrompt
          }
        ],
        model: CONFIG.groq.model,
        temperature: CONFIG.groq.temperature,
        max_completion_tokens: 4000,
        top_p: 0.9,
        stream: false
      });

      const responseText = response.choices[0]?.message?.content?.trim();
      
      if (!responseText) {
        throw new Error('Empty response from Groq');
      }

      // Parse response with proper error handling
      const sentimentResults = parseGroqResponse(responseText, batchNumber);
      
      // Map results back to comments
      const processedComments = comments.map((comment, index) => {
        const analysis = sentimentResults[index] || {
          sentiment: 'neutral',
          confidence: 0.5,
          language: 'en',
          reasoning: 'Fallback analysis',
          keywords: []
        };
        
        return {
          ...comment,
          sentiment: analysis.sentiment,
          confidence: Math.max(0.1, Math.min(1.0, analysis.confidence)),
          detectedLanguage: analysis.language,
          analysisReasoning: analysis.reasoning,
          keywords: analysis.keywords
        };
      });
      
      console.log(`✅ Groq batch ${batchNumber} completed successfully`);
      return processedComments;
      
    } catch (error) {
      console.error(`❌ Groq batch ${batchNumber} attempt ${attempt} failed:`, error);
      
      if (attempt === CONFIG.groq.maxRetries) {
        console.log(`🔄 Using enhanced fallback for batch ${batchNumber}`);
        return applyEnhancedFallback(comments);
      }
      
      // Exponential backoff
      const backoffDelay = calculateBackoff(attempt, CONFIG.groq.delayMs);
      console.log(`⏳ Retrying Groq batch ${batchNumber} in ${backoffDelay}ms`);
      await delay(backoffDelay);
    }
  }
  
  // This should never be reached due to the fallback in the loop
  return applyEnhancedFallback(comments);
}

/**
 * Create optimized prompt for Groq sentiment analysis
 */
function createGroqSentimentPrompt(comments: Array<{id: number, text: string, author: string, likes: number, language: string}>): string {
  return `Analyze the sentiment of these YouTube comments with high accuracy. Consider context, cultural nuances, and multiple languages.

COMMENTS DATA:
${JSON.stringify(comments, null, 2)}

ANALYSIS GUIDELINES:
🟢 POSITIVE: Gratitude, praise, excitement, love, appreciation, constructive feedback, compliments, support, enthusiasm
🔴 NEGATIVE: Criticism, complaints, anger, disappointment, frustration, hate, mean comments, destructive feedback
🔵 NEUTRAL: Questions, factual statements, neutral observations, requests, timestamps, mild opinions

MULTILINGUAL CONSIDERATIONS:
- Hindi/Marathi: "धन्यवाद", "छान", "मस्त" = positive
- Spanish: "muy bueno", "gracias" = positive  
- French: "très bien", "merci" = positive
- Detect sarcasm and cultural context

RETURN EXACTLY THIS JSON FORMAT:
[
  {
    "id": 0,
    "sentiment": "positive",
    "confidence": 0.92,
    "language": "en",
    "reasoning": "Contains clear gratitude and appreciation",
    "keywords": ["thanks", "helpful", "great"]
  },
  {
    "id": 1,
    "sentiment": "negative", 
    "confidence": 0.88,
    "language": "hi",
    "reasoning": "Expresses frustration in Hindi",
    "keywords": ["बुरा", "disappointing"]
  }
]

Return ONLY the JSON array with no additional text.`;
}

/**
 * Parse Groq response with enhanced error handling
 */
function parseGroqResponse(responseText: string, batchNumber: number): SentimentAnalysisResult[] {
  try {
    // Clean the response text
    const cleanResponse = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^[^[\{]*/, '')
      .replace(/[^}\]]*$/, '')
      .trim();
    
    const parsed = JSON.parse(cleanResponse);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    return parsed.map(item => ({
      sentiment: ['positive', 'negative', 'neutral'].includes(item.sentiment) ? item.sentiment : 'neutral',
      confidence: Math.max(0.1, Math.min(1.0, item.confidence || 0.5)),
      language: item.language || 'en',
      reasoning: item.reasoning || 'No reasoning provided',
      keywords: Array.isArray(item.keywords) ? item.keywords : []
    }));
    
  } catch (error) {
    console.error(`❌ Failed to parse Groq response for batch ${batchNumber}:`, error);
    throw new Error('Could not parse Groq sentiment response');
  }
}

/**
 * Enhanced fallback sentiment analysis
 */
function applyEnhancedFallback(comments: CommentData[]): CommentData[] {
  console.log('🔄 Applying enhanced keyword-based fallback analysis');
  
  return comments.map(comment => {
    const text = comment.textDisplay.toLowerCase();
    const language = detectLanguage(comment.textDisplay);
    
    // Comprehensive multilingual keywords
    const positiveKeywords = [
      // English
      'good', 'great', 'awesome', 'amazing', 'perfect', 'love', 'like', 'thanks', 'thank you',
      'excellent', 'fantastic', 'wonderful', 'brilliant', 'helpful', 'useful', 'best',
      // Hindi/Marathi
      'धन्यवाद', 'छान', 'मस्त', 'अच्छा', 'बहुत अच्छा', 'शानदार', 'कमाल',
      // Spanish
      'bueno', 'muy bueno', 'excelente', 'gracias', 'perfecto', 'increíble',
      // French  
      'très bien', 'excellent', 'merci', 'parfait', 'incroyable',
      // Emojis
      '👍', '❤️', '😍', '🔥', '💯', '⭐', '🙌', '👏', '💪', '✨'
    ];

    const negativeKeywords = [
      // English
      'bad', 'terrible', 'awful', 'hate', 'dislike', 'worst', 'horrible', 'useless',
      'boring', 'stupid', 'sucks', 'waste', 'disappointed', 'disappointing',
      // Hindi/Marathi
      'बुरा', 'खराब', 'गंदा', 'बकवास',
      // Spanish
      'malo', 'terrible', 'horrible', 'odio',
      // French
      'mauvais', 'terrible', 'horrible', 'déteste',
      // Emojis
      '👎', '😡', '😤', '💩', '🤮', '😞', '😭'
    ];

    const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
    const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));
    const isQuestion = text.includes('?') || text.includes('कैसे') || text.includes('क्या');

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidence = 0.6;

    if (hasPositive && !hasNegative) {
      sentiment = 'positive';
      confidence = 0.75;
    } else if (hasNegative && !hasPositive) {
      sentiment = 'negative';
      confidence = 0.75;
    } else if (isQuestion) {
      sentiment = 'neutral';
      confidence = 0.8;
    }

    return {
      ...comment,
      sentiment,
      confidence,
      detectedLanguage: language,
      analysisReasoning: 'Keyword-based fallback analysis',
      keywords: []
    };
  });
}

// ===== MISTRAL REPLY GENERATION =====

/**
 * Generate personalized, multilingual replies using Mistral medium-2508
 */
export async function generateReplyWithMistral(context: ReplyGenerationContext): Promise<string> {
  for (let attempt = 1; attempt <= CONFIG.mistral.maxRetries; attempt++) {
    try {
      console.log(`🤖 Generating reply with Mistral medium-2508, attempt ${attempt}`);
      
      const replyPrompt = createMistralReplyPrompt(context);
      
      const response = await mistralClient.chat.complete({
        model: CONFIG.mistral.replyModel,
        messages: [
          {
            role: 'system',
            content: 'You are a creative YouTube content creator who writes authentic, engaging replies to comments. You understand multiple languages and cultural contexts, and you respond with appropriate humor and personality.'
          },
          {
            role: 'user',
            content: replyPrompt
          }
        ],
        temperature: CONFIG.mistral.temperature,
        maxTokens: 150,
        topP: 0.9,
        safePrompt: false // Allow creative responses
      });

      const replyContent = response.choices[0]?.message?.content;
      const replyText = typeof replyContent === 'string' ? replyContent.trim() : '';
      
      if (!replyText) {
        throw new Error('Empty response from Mistral');
      }

      // Clean and validate the reply
      const cleanReply = cleanText(replyText)
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/^(Reply:|Response:|Creator:|YouTuber:)\s*/i, '') // Remove prefixes
        .trim();
      
      if (cleanReply.length < 3) {
        throw new Error('Generated reply too short');
      }
      
      if (cleanReply.length > 280) {
        throw new Error('Generated reply too long');
      }
      
      console.log(`✅ Generated personalized reply: "${cleanReply.substring(0, 50)}..."`);
      return cleanReply;
      
    } catch (error) {
      console.error(`❌ Mistral reply attempt ${attempt} failed:`, error);
      
      if (attempt === CONFIG.mistral.maxRetries) {
        console.log('🔄 Using intelligent fallback reply generation');
        return generateIntelligentFallbackReply(context);
      }
      
      // Exponential backoff
      const backoffDelay = calculateBackoff(attempt, CONFIG.mistral.delayMs);
      console.log(`⏳ Retrying Mistral reply in ${backoffDelay}ms`);
      await delay(backoffDelay);
    }
  }
  
  // Fallback (should never reach here)
  return generateIntelligentFallbackReply(context);
}

/**
 * Create comprehensive prompt for Mistral reply generation
 */
function createMistralReplyPrompt(context: ReplyGenerationContext): string {
  const { 
    commentText, 
    videoTitle, 
    videoDescription, 
    transcript, 
    channelName,
    commentLanguage,
    commentSentiment,
    replyTone 
  } = context;

  const detectedLang = commentLanguage || detectLanguage(commentText);
  
  return `Generate an authentic YouTube creator reply to this comment. Be natural, engaging, and respond in the same language as the comment.

CONTEXT:
- Video: "${videoTitle}"
- Channel: ${channelName || 'Your Channel'}
- Comment Language: ${detectedLang}
- Comment Sentiment: ${commentSentiment || 'neutral'}
- Desired Tone: ${replyTone}

COMMENT TO REPLY TO:
"${cleanText(commentText)}"

ADDITIONAL CONTEXT:
${videoDescription ? `Description: ${videoDescription.substring(0, 200)}...` : ''}
${transcript ? `Video Content: ${transcript.substring(0, 300)}...` : ''}

REPLY GUIDELINES:
1. LANGUAGE: Respond in the same language as the comment
2. LENGTH: 5-30 words maximum (YouTube-appropriate)
3. TONE: Match the ${replyTone} tone while being authentic
4. PERSONALITY: Sound like a real creator, not an AI
5. ENGAGEMENT: Encourage further interaction when appropriate
6. CULTURAL: Respect cultural context and references

EXAMPLES BY LANGUAGE:
English: "Thanks! That part was actually super tricky to film 😅"
Hindi: "धन्यवाद! आपको पसंद आया, बहुत खुशी हुई! 🙏"
Spanish: "¡Gracias! Me alegra que te haya gustado el video 😊"
French: "Merci ! Content que ça t'ait plu ! 🎉"

TONE EXAMPLES:
- Friendly: Use emojis, contractions, warm language
- Professional: Polite, clear, informative responses  
- Casual: Relaxed, conversational, like talking to a friend
- Humorous: Light jokes, wordplay, fun responses (when appropriate)

Generate ONLY the reply text with no quotes or prefixes:`;
}

/**
 * Intelligent fallback reply generation based on comment analysis
 */
function generateIntelligentFallbackReply(context: ReplyGenerationContext): string {
  const { commentText, commentSentiment, replyTone, commentLanguage } = context;
  const text = commentText.toLowerCase();
  const language = commentLanguage || detectLanguage(commentText);
  
  // Language-specific reply templates
  const replyTemplates = {
    en: {
      friendly: {
        positive: [
          "Thank you so much! Really appreciate the support! 😊",
          "So glad you enjoyed it! More content coming soon! 🙌",
          "Your comment made my day! Thanks for watching! ❤️"
        ],
        negative: [
          "Thanks for the feedback! Always trying to improve 💪",
          "I hear you! Will definitely work on that for next time 👍",
          "Appreciate the honest feedback! Helps me grow as a creator 🙏"
        ],
        neutral: [
          "Thanks for watching and commenting! 😊",
          "Great question! Thanks for engaging with the content! 💭",
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
      },
      casual: {
        positive: [
          "Thanks! You're awesome! 😎",
          "Yay! So happy you liked it! 🎉",
          "Thanks for the love! You rock! 🤘"
        ],
        negative: [
          "Thanks for keeping it real! Working on it 💪",
          "Fair point! Always learning and improving 📚",
          "Gotcha! Will do better next time 👊"
        ],
        neutral: [
          "Hey thanks for watching! 👋",
          "Cool, thanks for commenting! 😊",
          "Appreciate you! Thanks for being here! 🙏"
        ]
      },
      humorous: {
        positive: [
          "You're officially my favorite human today! 😂❤️",
          "Stop, you're making me blush! 😊💕",
          "Did we just become best friends?! 🤝😄"
        ],
        negative: [
          "Ouch! But fair point... back to the drawing board! 😅",
          "Well, can't win them all! Thanks for the reality check! 😂",
          "Noted! Filing this under 'things to improve' 📝😊"
        ],
        neutral: [
          "Thanks for stopping by my little corner of the internet! 😄",
          "You commented, I replied - teamwork! 🙌😊",
          "Hey there! Thanks for being part of the community! 👋"
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
  
  // Select appropriate reply based on context
  const langTemplates = replyTemplates[language as keyof typeof replyTemplates] || replyTemplates.en;
  const toneTemplates = langTemplates[replyTone as keyof typeof langTemplates] || langTemplates.friendly;
  const sentimentTemplates = toneTemplates[commentSentiment || 'neutral'];
  
  // Random selection for variety
  const selectedReply = sentimentTemplates[Math.floor(Math.random() * sentimentTemplates.length)];
  
  return selectedReply;
}

// ===== MISTRAL ANALYTICS =====

/**
 * Generate creator insights using Mistral large-latest
 */
export async function generateCreatorInsightsWithMistral(
  videoTitle: string,
  transcript: string,
  comments: CommentData[],
  sentimentDistribution: any
): Promise<CreatorInsights> {
  try {
    console.log(`🧠 Generating creator insights with Mistral large-latest`);
    
    const positiveComments = comments.filter(c => c.sentiment === 'positive').slice(0, 15);
    const negativeComments = comments.filter(c => c.sentiment === 'negative').slice(0, 10);
    const neutralComments = comments.filter(c => c.sentiment === 'neutral').slice(0, 8);
    
    const insightsPrompt = `You are an expert YouTube analytics consultant and growth strategist. Analyze this video's performance and provide comprehensive, actionable insights for the creator.

🎬 VIDEO ANALYSIS:
Title: "${videoTitle}"
Transcript: "${cleanText(transcript.substring(0, 2000))}..."

📊 AUDIENCE ENGAGEMENT DATA:
- Total Comments Analyzed: ${comments.length}
- Positive Sentiment: ${sentimentDistribution.positive?.count || 0} comments (${sentimentDistribution.positive?.percentage || 0}%)
- Neutral Sentiment: ${sentimentDistribution.neutral?.count || 0} comments (${sentimentDistribution.neutral?.percentage || 0}%)  
- Negative Sentiment: ${sentimentDistribution.negative?.count || 0} comments (${sentimentDistribution.negative?.percentage || 0}%)

❤️ TOP POSITIVE FEEDBACK:
${positiveComments.map((c, i) => `${i+1}. "${cleanText(c.textDisplay.substring(0, 200))}"`).join('\n')}

🔧 CONSTRUCTIVE CRITICISM & IMPROVEMENT AREAS:
${negativeComments.map((c, i) => `${i+1}. "${cleanText(c.textDisplay.substring(0, 200))}"`).join('\n')}

🤔 AUDIENCE QUESTIONS & NEUTRAL FEEDBACK:
${neutralComments.map((c, i) => `${i+1}. "${cleanText(c.textDisplay.substring(0, 200))}"`).join('\n')}

Provide COMPREHENSIVE analysis with detailed insights in this EXACT JSON format:

{
  "audienceInsights": {
    "whatTheyLoved": ["Specific things audience praised", "Strengths they highlighted", "Elements they appreciated"],
    "whatTheyDidntLike": ["Areas for improvement", "Common complaints", "Things to fix"],
    "commonQuestions": ["What are they asking about?", "What do they want to know?", "Confusion points"],
    "suggestedTopics": ["Future video ideas based on questions", "Topics they want covered", "Follow-up content"],
    "sentimentBreakdown": {
      "positive": ${sentimentDistribution.positive?.percentage || 0},
      "neutral": ${sentimentDistribution.neutral?.percentage || 0},
      "negative": ${sentimentDistribution.negative?.percentage || 0}
    }
  },
  "contentRecommendations": {
    "nextVideoIdeas": ["Specific video ideas based on comments", "Follow-up content suggestions", "Trending topics to cover"],
    "improvementAreas": ["Technical improvements needed", "Content structure changes", "Presentation enhancements"],
    "strengthsToKeep": ["What's working well", "Unique selling points", "Signature elements to maintain"],
    "hashtags": ["trending hashtag 1", "relevant hashtag 2", "niche hashtag 3", "viral hashtag 4", "community hashtag 5"],
    "title": ["Include power words", "Add numbers/lists", "Create urgency", "Use question format"],
    "thumbnail": ["Use bright colors", "Include facial expressions", "Add text overlay", "Show the result"]
  },
  "engagementStrategy": {
    "replyPriority": ["Which comments to reply to first", "Priority engagement areas", "Quick response strategies"],
    "communityBuilding": ["How to build stronger community", "Engagement tactics", "Connection strategies"],
    "contentStrategy": ["Long-term content planning", "Series ideas", "Collaboration opportunities"]
  },
  "performancePrediction": {
    "score": 85,
    "reasoning": "Detailed explanation of why this score was given based on audience feedback",
    "optimizationTips": ["Specific actionable tips", "Performance boosters", "Growth strategies"],
    "expectedGrowth": "Projected growth based on current performance",
    "viralPotential": 75
  }
}

ANALYSIS GUIDELINES:
🔍 Extract specific, actionable insights from comments
🎯 Focus on data-driven recommendations
📈 Predict performance based on audience engagement patterns
💡 Suggest creative content ideas based on audience requests
🏷️ Recommend trending hashtags relevant to the content
🔮 Provide realistic performance predictions
📱 Consider viral potential and growth opportunities

Return ONLY the JSON object with comprehensive, actionable insights.`;

    const response = await mistralClient.chat.complete({
      model: CONFIG.mistral.analyticsModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert YouTube analytics consultant specializing in creator growth and audience engagement optimization.'
        },
        {
          role: 'user',
          content: insightsPrompt
        }
      ],
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: { type: 'json_object' }
    });

    const responseText = response.choices[0]?.message?.content;
    
    if (!responseText || typeof responseText !== 'string') {
      throw new Error('Empty or invalid response from Mistral analytics');
    }

    const insights = JSON.parse(responseText);
    console.log(`✅ Creator insights generated successfully with Mistral`);
    return insights;
    
  } catch (error) {
    console.error('❌ Mistral creator insights failed:', error);
    throw new Error(`Analytics generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate video summary using Mistral large-latest
 */
export async function generateVideoSummaryWithMistral(
  videoTitle: string,
  description: string,
  comments: CommentData[]
): Promise<string[]> {
  try {
    console.log(`📝 Generating video summary with Mistral large-latest for: "${videoTitle}"`);
    
    const cleanTitle = cleanText(videoTitle);
    const cleanDescription = cleanText(description || '');
    const sampleComments = comments.slice(0, 10).map(c => cleanText(c.textDisplay));
    
    const summaryPrompt = `You are an expert content summarizer. Create a concise summary of this YouTube video based on available information.

VIDEO TITLE: "${cleanTitle}"

VIDEO DESCRIPTION: "${cleanDescription}"

SAMPLE AUDIENCE COMMENTS:
${sampleComments.map(comment => `- "${comment}"`).join('\n')}

Create a comprehensive summary as an array of 3-5 bullet points that capture:
1. The main topic/theme of the video
2. Key points covered (inferred from title, description, and comments)
3. Audience reception/engagement insights
4. Notable aspects or unique elements

Return only a JSON array of strings:
["Main topic summary point", "Key content insight", "Audience engagement insight"]`;

    const response = await mistralClient.chat.complete({
      model: CONFIG.mistral.analyticsModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert video content summarizer. Create concise, informative summaries.'
        },
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      temperature: 0.3,
      maxTokens: 800,
      responseFormat: { type: 'json_object' }
    });

    const responseText = response.choices[0]?.message?.content;
    
    if (!responseText || typeof responseText !== 'string') {
      throw new Error('Empty or invalid response from Mistral');
    }

    let summaryArray;
    try {
      const parsed = JSON.parse(responseText);
      summaryArray = Array.isArray(parsed) ? parsed : (parsed.summary || []);
    } catch {
      // Fallback parsing
      const lines = responseText.split('\n').filter(line => line.trim());
      summaryArray = lines.slice(0, 5);
    }

    if (!Array.isArray(summaryArray) || summaryArray.length === 0) {
      throw new Error('Invalid summary format from Mistral');
    }

    console.log(`✅ Video summary generated successfully: ${summaryArray.length} points`);
    return summaryArray;

  } catch (error) {
    console.error('❌ Mistral summary generation failed:', error);
    
    // Intelligent fallback summary
    const fallbackSummary = [
      `Video titled "${videoTitle}" covers the main topic indicated by the title`,
      description ? `Content includes: ${description.substring(0, 100)}...` : 'No description available',
      `Audience engagement: ${comments.length} comments indicating ${comments.length > 50 ? 'high' : comments.length > 20 ? 'moderate' : 'low'} interaction`,
      comments.length > 0 ? 'Comments suggest audience interest and engagement' : 'Limited audience feedback available'
    ];

    return fallbackSummary;
  }
}

// ===== EXPORTS =====

export {
  type SentimentAnalysisResult,
  type ReplyGenerationContext,
  type CreatorInsights,
  CONFIG,
  delay,
  cleanText,
  detectLanguage
};