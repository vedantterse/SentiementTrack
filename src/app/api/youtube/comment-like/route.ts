import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const { commentId, action } = await request.json();

    if (!commentId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Comment ID and action are required'
      }, { status: 400 });
    }

    // Set up YouTube API client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const youtube = google.youtube({ version: 'v3', auth });

    try {
      // Use YouTube API v3 comments rate endpoint
      const rating = action === 'like' ? 'like' : 'none';
      
      // Call the rate endpoint directly using fetch since googleapis might not have it
      const rateResponse = await fetch(
        `https://youtube.googleapis.com/youtube/v3/comments/rate?id=${commentId}&rating=${rating}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!rateResponse.ok) {
        const errorData = await rateResponse.text();
        throw new Error(`YouTube API error: ${rateResponse.status} - ${errorData}`);
      }

      // After voting, fetch the updated comment to get new like count
      const updatedComment = await youtube.comments.list({
        part: ['snippet'],
        id: [commentId]
      });

      const newLikeCount = updatedComment.data.items?.[0]?.snippet?.likeCount || 0;

      return NextResponse.json({
        success: true,
        data: {
          commentId,
          action,
          newLikeCount,
          message: `Comment ${action}d successfully`
        }
      });

    } catch (youtubeError: any) {
      console.error('YouTube API error:', youtubeError);
      return NextResponse.json({
        success: false,
        error: youtubeError.message || 'Failed to update comment rating'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating comment rating:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update comment rating'
    }, { status: 500 });
  }
}