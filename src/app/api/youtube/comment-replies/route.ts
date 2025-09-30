import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({
        success: false,
        error: 'Comment ID is required'
      }, { status: 400 });
    }

    // Set up YouTube API client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const youtube = google.youtube({ version: 'v3', auth });

    try {
      // Get replies to the comment
      const repliesResponse = await youtube.comments.list({
        part: ['snippet'],
        parentId: commentId,
        maxResults: 100
      });

      const replies = repliesResponse.data.items?.map((reply: any) => ({
        id: reply.id,
        textDisplay: reply.snippet?.textDisplay || '',
        authorDisplayName: reply.snippet?.authorDisplayName || '',
        authorProfileImageUrl: reply.snippet?.authorProfileImageUrl || '',
        authorChannelId: reply.snippet?.authorChannelId,
        likeCount: reply.snippet?.likeCount || '0',
        publishedAt: reply.snippet?.publishedAt || '',
        updatedAt: reply.snippet?.updatedAt || '',
      })) || [];

      return NextResponse.json({
        success: true,
        data: {
          replies,
          totalCount: replies.length
        }
      });

    } catch (youtubeError: any) {
      console.error('YouTube API error:', youtubeError);
      return NextResponse.json({
        success: false,
        error: youtubeError.message || 'Failed to fetch comment replies'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fetching comment replies:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch comment replies'
    }, { status: 500 });
  }
}