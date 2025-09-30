import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { APIResponse } from '@/types';

// YouTube Transcript API using authenticated access with proper retry logic
async function fetchTranscriptFromYoutube(videoId: string, accessToken: string, retryCount: number = 0): Promise<string> {
  try {
    console.log(`🎬 Attempting to fetch captions for video ${videoId} (attempt ${retryCount + 1}/2)`);
    
    // First, get the list of available caption tracks with proper scopes
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&part=id`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!captionsResponse.ok) {
      const errorText = await captionsResponse.text();
      console.error(`❌ YouTube Captions API error: ${captionsResponse.status} - ${errorText}`);
      
      // If unauthorized, the OAuth token might be missing the required scope
      if (captionsResponse.status === 403) {
        throw new Error('YouTube captions access requires youtube.force-ssl scope. Please re-authenticate.');
      }
      
      throw new Error(`YouTube Captions API error: ${captionsResponse.status}`);
    }

    const captionsData = await captionsResponse.json();
    console.log(`📄 Found ${captionsData.items?.length || 0} caption tracks for video ${videoId}`);
    
    if (!captionsData.items || captionsData.items.length === 0) {
      throw new Error('No captions available for this video');
    }

    // Prioritize caption tracks: English manual > English auto > any manual > any auto
    const availableTracks = captionsData.items;
    
    let selectedTrack = availableTracks.find((track: any) => 
      (track.snippet.language === 'en' || track.snippet.language === 'en-US') && 
      track.snippet.trackKind === 'standard'
    ) || availableTracks.find((track: any) => 
      track.snippet.language === 'en' || track.snippet.language === 'en-US'
    ) || availableTracks.find((track: any) => 
      track.snippet.trackKind === 'standard'
    ) || availableTracks[0];

    console.log(`🎯 Selected caption track: ${selectedTrack.snippet.language} (${selectedTrack.snippet.trackKind})`);

    // Download the caption track with optimal format
    const transcriptResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions/${selectedTrack.id}?tfmt=vtt`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'text/vtt, text/plain',
        },
      }
    );

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error(`❌ YouTube Caption Download error: ${transcriptResponse.status} - ${errorText}`);
      throw new Error(`YouTube Caption Download error: ${transcriptResponse.status}`);
    }

    const transcriptText = await transcriptResponse.text();
    
    if (!transcriptText || transcriptText.trim().length === 0) {
      throw new Error('Empty transcript content received');
    }

    // Parse VTT format and extract clean text content
    const cleanTranscript = transcriptText
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed !== '' && 
               !trimmed.startsWith('WEBVTT') &&
               !trimmed.startsWith('NOTE') &&
               !trimmed.match(/^\d+$/) && 
               !trimmed.match(/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}$/) &&
               !trimmed.match(/^<\d{2}:\d{2}:\d{2}\.\d{3}><c>/) &&
               !trimmed.includes('-->')
      })
      .map(line => line.replace(/<[^>]*>/g, '')) // Remove VTT tags
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanTranscript || cleanTranscript.length < 50) {
      throw new Error('Transcript content too short or empty');
    }

    console.log(`✅ Successfully extracted ${cleanTranscript.length} characters from captions`);
    return cleanTranscript;

  } catch (error) {
    console.error(`❌ Error fetching transcript (attempt ${retryCount + 1}):`, error);
    
    // Retry once if first attempt fails
    if (retryCount === 0 && error instanceof Error && !error.message.includes('No captions available')) {
      console.log(`🔄 Retrying caption fetch for video ${videoId}...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return fetchTranscriptFromYoutube(videoId, accessToken, retryCount + 1);
    }
    
    throw error;
  }
}

// Fallback: Fetch video details and use description as pseudo-transcript
async function fetchVideoDescription(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const description = data.items[0].snippet.description || '';
    const title = data.items[0].snippet.title || '';
    
    // Combine title and description as fallback content
    return `${title}\n\n${description}`;

  } catch (error) {
    console.error('Error fetching video description:', error);
    return '';
  }
}

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

    console.log(`Fetching transcript for video ${videoId} with authenticated access`);

    let transcript = '';
    let source: 'captions' | 'description' = 'captions';

    try {
      // Try to fetch official YouTube captions first
      transcript = await fetchTranscriptFromYoutube(videoId, session.accessToken);
      console.log(`Successfully fetched ${transcript.length} characters from YouTube captions`);
    } catch (captionError) {
      console.log('Captions not available, falling back to video description');
      
      try {
        // Fallback to video title + description
        transcript = await fetchVideoDescription(videoId);
        source = 'description';
        console.log(`Using video description as fallback: ${transcript.length} characters`);
      } catch (descriptionError) {
        console.error('Failed to fetch video description:', descriptionError);
        return NextResponse.json<APIResponse<null>>({
          success: false,
          error: 'Transcript and description not available'
        }, { status: 404 });
      }
    }

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'No transcript content available'
      }, { status: 404 });
    }

    // Calculate basic transcript metrics
    const wordCount = transcript.split(/\s+/).length;
    const estimatedDuration = Math.ceil(wordCount / 150); // Assuming 150 words per minute

    const response = NextResponse.json<APIResponse<{
      transcript: string;
      source: 'captions' | 'description';
      wordCount: number;
      estimatedDuration: number;
      characterCount: number;
    }>>({
      success: true,
      data: {
        transcript,
        source,
        wordCount,
        estimatedDuration,
        characterCount: transcript.length
      }
    });

    // Cache for 2 hours for authenticated requests
    response.headers.set('Cache-Control', 'private, s-maxage=7200, stale-while-revalidate=3600');
    
    return response;

  } catch (error) {
    console.error('Error in /api/youtube/video-transcript:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}