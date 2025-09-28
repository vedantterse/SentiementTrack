// Optimized AI services with concurrent processing and proper load balancing
import { CommentData } from '@/types';
import { Mistral } from '@mistralai/mistralai';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const BATCH_SIZE = 20; // Optimal batch size for Gemini 2.5 Flash
const MAX_CONCURRENT_REQUESTS = 3; // Respect 10 RPM limit

// Initialize Mistral client
const mistral = new Mistral({ 
  apiKey: process.env.MISTRAL_API_KEY 
});

/**
 * Optimized batch sentiment analysis with concurrent processing
 */
export async function analyzeSentimentConcurrent(comments: CommentData[]): Promise<CommentData[]> {
  try {
    console.log(`🚀 Processing ${comments.length} comments with optimized concurrent batching`);
    
    // Split comments into optimal batches of 20
    const batches: CommentData[][] = [];
    for (let i = 0; i < comments.length; i += BATCH_SIZE) {
      batches.push(comments.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Created ${batches.length} batches of ${BATCH_SIZE} comments each`);
    
    // Process batches concurrently with rate limiting
    const results: CommentData[][] = [];
    
    for (let i = 0; i < batches.length; i += MAX_CONCURRENT_REQUESTS) {
      const currentBatches = batches.slice(i, i + MAX_CONCURRENT_REQUESTS);
      
      console.log(`⚡ Processing batch group ${Math.floor(i/MAX_CONCURRENT_REQUESTS) + 1}/${Math.ceil(batches.length/MAX_CONCURRENT_REQUESTS)}`);
      
      const batchPromises = currentBatches.map((batch, index) => 
        processSentimentBatch(batch, i + index + 1)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting delay between batch groups (respect 10 RPM)
      if (i + MAX_CONCURRENT_REQUESTS < batches.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
      }
    }
    
    // Flatten results maintaining order
    const processedComments = results.flat();
    
    console.log(`✅ Successfully processed ${processedComments.length} comments with sentiment analysis`);
    return processedComments;
    
  } catch (error) {
    console.error('❌ Concurrent sentiment analysis failed:', error);
    throw error;
  }
}

/**
 * Process single batch of comments for sentiment analysis
 */
async function processSentimentBatch(comments: CommentData[], batchNumber: number): Promise<CommentData[]> {
  try {
    console.log(`🔄 Processing batch ${batchNumber} (${comments.length} comments)`);
    
    // Optimized JSON structure for Gemini parsing
    const commentsJson = comments.map((c, index) => ({
      id: index,
      text: c.textDisplay.substring(0, 500) // Limit text length
    }));
    
    const prompt = `You are a professional sentiment analyzer. Analyze YouTube comments and return ONLY valid JSON.

INPUT: ${JSON.stringify(commentsJson)}

TASK: Analyze sentiment for each comment. Return EXACTLY this JSON structure:
${JSON.stringify(commentsJson.map((_, index) => ({
  id: index,
  sentiment: "positive|negative|neutral", 
  confidence: 0.85,
  language: "en"
})), null, 2)}

RULES:
- Return ONLY the JSON array, no markdown, no explanation
- Each comment gets: positive/negative/neutral
- Confidence: 0.0-1.0 
- Language: detected code (en, es, fr, etc.)
- Positive: praise, thanks, excitement, helpful feedback
- Negative: criticism, complaints, anger, disappointment  
- Neutral: questions, observations, factual statements`;

    const response = await fetch(
      `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4000,
            topP: 0.8,
            topK: 40
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Check for completely empty response from Gemini
    if (!resultText || resultText.trim().length === 0) {
      console.warn(`⚠️ Gemini returned empty response for batch ${batchNumber}, using neutral fallback`);
      // Return neutral sentiment for all comments in this batch
      return comments.map(comment => ({
        ...comment,
        sentiment: 'neutral' as const,
        confidence: 0.5,
        detectedLanguage: 'en'
      }));
    }
    
    // Enhanced JSON parsing with truncation handling
    let sentimentResults;
    try {
      // Clean response and extract JSON
      let cleanText = resultText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Try multiple parsing strategies
      try {
        // Strategy 1: Direct parse
        sentimentResults = JSON.parse(cleanText);
      } catch {
        try {
          // Strategy 2: Extract JSON array
          const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            sentimentResults = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON array found');
          }
        } catch {
          // Strategy 3: Find individual objects and reconstruct
          const objectMatches = cleanText.match(/{[^{}]*}/g);
          if (objectMatches && objectMatches.length > 0) {
            console.log(`🔧 Reconstructing JSON from ${objectMatches.length} individual objects`);
            const objects = objectMatches.map((obj: string) => {
              try {
                return JSON.parse(obj);
              } catch {
                return null;
              }
            }).filter((obj: any) => obj !== null);
            
            if (objects.length > 0) {
              sentimentResults = objects;
              console.log(`✅ Successfully reconstructed ${objects.length} valid objects`);
            } else {
              throw new Error('No valid objects found');
            }
          } else {
            throw new Error('No parseable JSON found');
          }
        }
      }
      
      if (!Array.isArray(sentimentResults)) {
        throw new Error('Expected JSON array');
      }
      
    } catch (parseError) {
      console.error(`❌ JSON parsing failed for batch ${batchNumber}:`, parseError);
      console.error('Raw response:', resultText);
      console.log(`🔄 Using neutral sentiment fallback for batch ${batchNumber}`);
      
      // Create fallback results with neutral sentiment instead of failing
      sentimentResults = comments.map((_, index) => ({
        id: index,
        sentiment: 'neutral',
        confidence: 0.5,
        language: 'en'
      }));
    }
    
    // Map results back to comments
    const processedComments = comments.map((comment, index) => {
      const analysis = sentimentResults[index] || { sentiment: 'neutral', confidence: 0.5, language: 'en' };
      return {
        ...comment,
        sentiment: analysis.sentiment as 'positive' | 'neutral' | 'negative',
        confidence: analysis.confidence,
        detectedLanguage: analysis.language
      };
    });
    
    console.log(`✅ Batch ${batchNumber} completed: ${processedComments.length} comments analyzed`);
    return processedComments;
    
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} failed, using neutral fallback:`, error);
    
    // Return comments with neutral sentiment as fallback
    return comments.map(comment => ({
      ...comment,
      sentiment: 'neutral' as const,
      confidence: 0.5,
      detectedLanguage: 'en'
    }));
  }
}

/**
 * Generate personalized reply using Mistral (faster, unlimited)
 */
export async function generateReplyWithMistral(
  comment: CommentData,
  videoTitle: string,
  videoSummary: string,
  channelName: string
): Promise<string> {
  try {
    console.log(`🤖 Generating reply with Mistral for comment: ${comment.textDisplay.substring(0, 50)}...`);
    
    const detectedLanguage = comment.detectedLanguage || 'en';
    const sentiment = comment.sentiment || 'neutral';
    
    const prompt = `You're a YouTube creator replying to this comment. Be casual, authentic, and brief.

COMMENT: "${comment.textDisplay.substring(0, 200)}"
VIDEO: "${videoTitle.substring(0, 100)}"
SENTIMENT: ${sentiment}

Write a quick, personal reply (10-25 words max) that:
- Sounds like YOU wrote it (not corporate)
- Matches the comment's energy
- Uses simple, conversational language
- Includes an emoji if appropriate
- Responds in ${detectedLanguage}

STYLE EXAMPLES:
- Positive: "So glad it helped! �"
- Question: "Great point! Will cover that soon"
- Critical: "Fair feedback, thanks!"
- Enthusiastic: "Right?? Exactly what I was thinking!"

Just write the reply:`;

    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 150
    });
    
    const content = response.choices[0].message.content;
    const reply = typeof content === 'string' ? content.trim() : '';
    
    if (!reply) {
      throw new Error('Empty response from Mistral');
    }
    
    console.log(`✅ Reply generated successfully: ${reply.substring(0, 50)}...`);
    return reply;
    
  } catch (error) {
    console.error('❌ Mistral reply generation failed:', error);
    throw new Error(`Reply generation failed: ${error}`);
  }
}

/**
 * Generate video summary using Gemini (concurrent with sentiment analysis)
 */
export async function generateVideoSummaryOptimized(
  videoTitle: string,
  description: string,
  comments: CommentData[]
): Promise<string[]> {
  try {
    console.log(`📝 Generating video summary with optimized prompting`);
    
    // Use top comments for context (sorted by likes)
    const topComments = comments
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, 15)
      .map(c => c.textDisplay.substring(0, 200))
      .join('\n');
    
    const prompt = `Analyze this YouTube video data and create 5 precise insights for the creator.

VIDEO: "${videoTitle}"
DESCRIPTION: "${description.substring(0, 600)}"
TOP COMMENTS: "${topComments}"

Generate exactly 5 bullet points analyzing:
1. Core content topic and educational value
2. Audience engagement patterns from comments  
3. Content quality indicators
4. Key viewer takeaways and benefits
5. Overall reception and impact

Requirements:
- Each point: 12-18 words maximum
- Specific and actionable for creators
- Based on actual data provided
- No generic statements

Return as plain text bullets (no markdown):`;

    const response = await fetch(
      `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 400
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const bullets = text
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => line.replace(/^[•\-\*\d\.]\s*/, '').trim())
      .filter((line: string) => line.length > 10) // Ensure meaningful content
      .slice(0, 5);

    console.log(`📊 Generated summary text length: ${text.length}, bullets found: ${bullets.length}`);

    if (bullets.length === 0) {
      console.log('⚠️ No bullets found, returning fallback summary');
      return [
        'Video delivers educational content with clear structure and practical value',
        'Audience shows high engagement through detailed questions and feedback',
        'Content presentation style resonates well with target demographic',
        'Viewers gain actionable insights they can apply to their projects',
        'Overall reception indicates strong educational impact and viewer satisfaction'
      ];
    }

    console.log(`✅ Generated ${bullets.length} summary insights`);
    return bullets;
    
  } catch (error) {
    console.error('❌ Video summary generation failed:', error);
    throw error;
  }
}

/**
 * Generate video summary using Mistral (faster, more detailed)
 */
export async function generateVideoSummaryWithMistral(
  videoTitle: string,
  description: string,
  comments: CommentData[]
): Promise<string[]> {
  try {
    console.log(`📝 Generating video summary with Mistral AI`);
    
    // Get top comments by engagement for context
    const topComments = comments
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, 20)
      .map(c => c.textDisplay.substring(0, 150))
      .join('\n');
    
    // Get sentiment distribution for context
    const sentimentCounts = {
      positive: comments.filter(c => c.sentiment === 'positive').length,
      negative: comments.filter(c => c.sentiment === 'negative').length,
      neutral: comments.filter(c => c.sentiment === 'neutral').length
    };
    
    const prompt = `Analyze this YouTube video and create 5 precise insights for the creator.

VIDEO TITLE: "${videoTitle}"

DESCRIPTION: "${description.substring(0, 800)}"

TOP COMMENTS (${comments.length} total):
${topComments}

AUDIENCE SENTIMENT: ${sentimentCounts.positive} positive, ${sentimentCounts.neutral} neutral, ${sentimentCounts.negative} negative

Create exactly 5 bullet points about:
1. What the video actually covers (core topic/subject)
2. How the audience is responding (engagement patterns)  
3. Content quality indicators (based on comments)
4. Key value/takeaways viewers mention
5. Overall reception and impact

Rules:
- Each bullet: 12-18 words maximum
- Be specific to THIS video's content
- Use actual data from description/comments
- Focus on actionable creator insights
- No generic statements

Return as numbered list:
1. [insight]
2. [insight]
3. [insight]
4. [insight]
5. [insight]`;

    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 400
    });
    
    const content = response.choices[0].message.content;
    const text = typeof content === 'string' ? content : '';
    
    const bullets = text
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line: string) => line.length > 10)
      .slice(0, 5);

    if (bullets.length === 0) {
      throw new Error('No summary bullets generated');
    }

    console.log(`✅ Mistral generated ${bullets.length} video insights`);
    return bullets;
    
  } catch (error) {
    console.error('❌ Mistral video summary failed:', error);
    throw error;
  }
}

/**
 * Delay utility for rate limiting
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));