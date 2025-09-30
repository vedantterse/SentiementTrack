import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { APIResponse } from '@/types';
import { 
  generateCreatorInsightsWithMistral, 
  cleanText
} from '@/lib/ai-services-pro';
import { Mistral } from '@mistralai/mistralai';

// Initialize Mistral client
const mistralClient = new Mistral({ 
  apiKey: process.env.MISTRAL_API_KEY 
});

/**
 * POST /api/ai/video-analysis
 * 
 * Comprehensive video analysis using Mistral large-latest
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { videoTitle, transcript, description, tags } = body;

    if (!videoTitle) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Video title is required'
      }, { status: 400 });
    }

    console.log(`🔍 Starting video analysis for: "${videoTitle}"`);

    const analysis = await analyzeVideoWithMistral(
      videoTitle,
      transcript || '',
      description || '',
      tags || []
    );

    const response = NextResponse.json<APIResponse<typeof analysis>>({
      success: true,
      data: analysis
    });

    // Cache for 2 hours
    response.headers.set('Cache-Control', 'private, s-maxage=7200, stale-while-revalidate=3600');
    
    return response;

  } catch (error) {
    console.error('Error in /api/ai/video-analysis:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Analyze video content using Mistral large-latest
 */
async function analyzeVideoWithMistral(
  videoTitle: string,
  transcript: string,
  description: string,
  tags: string[]
): Promise<{
  summary: string[];
  keyTopics: string[];
  contentQuality: {
    score: number;
    feedback: string[];
  };
  seoAnalysis: {
    score: number;
    titleScore: number;
    descriptionScore: number;
    tagsScore: number;
    recommendations: string[];
  };
  audienceEngagement: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
}> {
  try {
    console.log(`🤖 Analyzing video with Mistral large-latest: "${videoTitle}"`);
    
    const cleanTitle = cleanText(videoTitle);
    const cleanTranscript = cleanText(transcript.substring(0, 4000));
    const cleanDescription = cleanText(description.substring(0, 1000));
    
    const analysisPrompt = `You are an expert YouTube content analyst. Analyze this video comprehensively and provide structured insights.

VIDEO TITLE: "${cleanTitle}"

VIDEO TRANSCRIPT/CONTENT: "${cleanTranscript}..." 

VIDEO DESCRIPTION: "${cleanDescription}..."

VIDEO TAGS: ${tags.join(', ')}

Provide a comprehensive analysis in the following JSON format:

{
  "summary": [
    "Brief bullet point about main topic",
    "Key insight from content",
    "Notable aspect of presentation"
  ],
  "keyTopics": [
    "topic1",
    "topic2", 
    "topic3"
  ],
  "contentQuality": {
    "score": 85,
    "feedback": [
      "Specific feedback about content quality",
      "Areas where content excels",
      "Suggestions for improvement"
    ]
  },
  "seoAnalysis": {
    "score": 78,
    "titleScore": 85,
    "descriptionScore": 75,
    "tagsScore": 70,
    "recommendations": [
      "SEO recommendation 1",
      "SEO recommendation 2"
    ]
  },
  "audienceEngagement": {
    "score": 82,
    "strengths": [
      "What makes this content engaging",
      "Strong points for audience retention"
    ],
    "improvements": [
      "How to increase engagement",
      "Areas to enhance audience connection"
    ]
  }
}

Return only the JSON object, no additional text.`;

    const mistralResponse = await mistralClient.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: { type: 'json_object' }
    });

    const mistralContent = mistralResponse.choices[0]?.message?.content;
    if (!mistralContent || typeof mistralContent !== 'string') {
      throw new Error('Invalid response from Mistral');
    }

    const analysis = JSON.parse(mistralContent);
    console.log(`✅ Video analysis completed with Mistral large-latest`);
    return analysis;

  } catch (mistralError) {
    console.error(`❌ Mistral analysis failed, using smart fallback:`, mistralError);
    
    // Smart fallback analysis based on available data
    return {
      summary: [
        `Video titled "${videoTitle}" contains ${transcript.length > 100 ? 'detailed' : 'basic'} content`,
        `${tags.length > 0 ? 'Tagged with relevant keywords' : 'No tags provided'}`,
        `${description.length > 50 ? 'Includes description content' : 'Limited description'}`
      ],
      keyTopics: tags.slice(0, 5).length > 0 ? tags.slice(0, 5) : ['general', 'content', 'video'],
      contentQuality: {
        score: transcript.length > 1000 ? 75 : 60,
        feedback: [
          transcript.length > 1000 ? 'Substantial content provided' : 'Content length could be improved',
          'Manual review recommended for detailed analysis'
        ]
      },
      seoAnalysis: {
        score: 60,
        titleScore: videoTitle.length > 30 && videoTitle.length < 70 ? 80 : 60,
        descriptionScore: description.length > 100 ? 70 : 50,
        tagsScore: tags.length >= 3 ? 70 : 40,
        recommendations: [
          videoTitle.length < 30 ? 'Consider a more descriptive title' : 'Title length is good',
          description.length < 100 ? 'Add more detailed description' : 'Description length is adequate',
          tags.length < 3 ? 'Add more relevant tags' : 'Tag usage is appropriate'
        ]
      },
      audienceEngagement: {
        score: 65,
        strengths: [
          'Video content is available for analysis',
          tags.length > 0 ? 'Relevant categorization provided' : 'Basic content structure'
        ],
        improvements: [
          'Consider adding more interactive elements',
          'Analysis tools temporarily unavailable - manual review recommended'
        ]
      }
    };
  }
}