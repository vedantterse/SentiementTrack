import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json({ error: 'videoId parameter is required' }, { status: 400 });
    }

    // Set up authenticated Google API client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const youtube = google.youtube({ version: 'v3', auth });

    // Fetch ALL comments (no limit for full version)
    const allComments: any[] = [];
    let nextPageToken: string | undefined = undefined;
    let requestCount = 0;
    const maxRequests = 50; // Increased for full data access
    
    do {
      const response: any = await youtube.commentThreads.list({
        videoId,
        part: ['snippet'],
        order: 'relevance',
        maxResults: 100,
        pageToken: nextPageToken,
      });

      if (response.data.items) {
        const comments = response.data.items.map((item: any) => {
          const topComment = item.snippet.topLevelComment.snippet;
          
          return {
            id: item.id,
            authorDisplayName: topComment.authorDisplayName,
            authorProfileImageUrl: topComment.authorProfileImageUrl,
            textDisplay: topComment.textDisplay,
            textOriginal: topComment.textOriginal,
            publishedAt: topComment.publishedAt,
            updatedAt: topComment.updatedAt,
            likeCount: topComment.likeCount || 0,
            authorChannelId: topComment.authorChannelId?.value,
            authorChannelUrl: topComment.authorChannelUrl,
            canRate: topComment.canRate,
            totalReplyCount: item.snippet.totalReplyCount || 0,
            isPublic: item.snippet.isPublic
          };
        });
        
        allComments.push(...comments);
      }

      nextPageToken = response.data.nextPageToken || undefined;
      requestCount++;
      
    } while (nextPageToken && requestCount < maxRequests);

    // Also get latest comments for real-time display
    const latestResponse: any = await youtube.commentThreads.list({
      videoId,
      part: ['snippet'],
      order: 'time',
      maxResults: 50,
    });

    const latestComments = latestResponse.data.items?.map((item: any) => {
      const topComment = item.snippet.topLevelComment.snippet;
      
      return {
        id: item.id,
        authorDisplayName: topComment.authorDisplayName,
        authorProfileImageUrl: topComment.authorProfileImageUrl,
        textDisplay: topComment.textDisplay,
        textOriginal: topComment.textOriginal,
        publishedAt: topComment.publishedAt,
        likeCount: topComment.likeCount || 0,
        authorChannelId: topComment.authorChannelId?.value,
        totalReplyCount: item.snippet.totalReplyCount || 0
      };
    }) || [];

    return NextResponse.json({
      allComments,
      latestComments,
      totalCount: allComments.length,
      videoId
    });

  } catch (error) {
    console.error('Error fetching YouTube comments:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch comments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}