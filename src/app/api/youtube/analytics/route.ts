import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';
import { APIResponse } from '@/types';

interface ViewsData {
  date: string;
  views: number;
  dailyViews: number;
}

interface AnalyticsResponse {
  viewsPerDay: ViewsData[];
  totalViews: number;
  averageDailyViews: number;
  peakDay: {
    date: string;
    views: number;
  };
  dataSource: 'analytics' | 'fallback';
  errorReason?: string;
  summary: {
    totalWatchTime: number;
    averageViewDuration: number;
    likes: number;
    comments: number;
    subscribersGained: number;
  };
}

// Generate fallback data when analytics API is not available
async function generateFallbackViewsData(videoId: string): Promise<AnalyticsResponse> {
  try {
    console.log(`🔄 Generating fallback analytics for video ${videoId}`);
    
    // Fetch basic video stats
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics,snippet&key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const totalViews = parseInt(video.statistics.viewCount || '0');
    const publishedDate = new Date(video.snippet.publishedAt);
    const currentDate = new Date();
    
    // Calculate days since publication, accounting for YouTube Analytics API delay (24-48 hours)
    // Analytics data is typically available up to 2 days ago (Oct 3rd), not today (Oct 5th)
    const analyticsEndDate = new Date(currentDate);
    analyticsEndDate.setDate(currentDate.getDate() - 2); // 2 days ago to match API delay
    
    const daysSincePublished = Math.max(1, Math.ceil((analyticsEndDate.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Show data up to analytics end date (Oct 3rd), limited to 30 days max
    const daysToShow = Math.min(30, daysSincePublished + 1); // +1 to include the end date
    
    console.log(`📅 Video published: ${publishedDate.toDateString()}, analytics available up to: ${analyticsEndDate.toDateString()}, showing ${daysToShow} days`);
    
    // Generate realistic daily view distribution from published date up to analytics end date
    const viewsData: ViewsData[] = [];
    let cumulativeViews = 0;
    
    for (let i = 0; i < daysToShow; i++) {
      // Calculate date starting from published date + i days
      const date = new Date(publishedDate);
      date.setDate(publishedDate.getDate() + i);
      
      // Stop if we exceed the analytics end date (2 days ago)
      if (date > analyticsEndDate) {
        break;
      }
      
      // Simulate realistic view distribution (viral pattern)
      let dailyViews: number;
      const dayIndex = i / Math.max(daysToShow - 1, 1); // Avoid division by zero
      
      // Check if this is the most recent available day (analytics end date)
      const isLatestAvailable = date.toDateString() === analyticsEndDate.toDateString();
      
      if (i === 0) {
        // First day (publish day): 20-40% of total views
        dailyViews = Math.round(totalViews * (0.20 + Math.random() * 0.20));
      } else if (isLatestAvailable) {
        // Latest available day gets normal distribution (not partial like "today" would)
        const remainingViews = Math.max(0, totalViews - cumulativeViews);
        dailyViews = Math.round(remainingViews * (0.2 + Math.random() * 0.3)); // 20-50% of remaining views
      } else if (dayIndex < 0.2) {
        // Next few days: 15-25% of total views
        dailyViews = Math.round(totalViews * (0.10 + Math.random() * 0.15));
      } else if (dayIndex < 0.5) {
        // Middle period: 5-15% of total views
        dailyViews = Math.round(totalViews * (0.03 + Math.random() * 0.12));
      } else {
        // Tail: remaining views distributed with decay
        const remainingViews = Math.max(0, totalViews - cumulativeViews);
        const remainingDays = daysToShow - i;
        const decayFactor = Math.pow(0.9, i - daysToShow * 0.5); // Exponential decay
        dailyViews = Math.round((remainingViews / remainingDays) * decayFactor * (0.5 + Math.random() * 0.5));
      }
      
      // Ensure we don't exceed total views and have realistic minimums
      dailyViews = Math.max(0, Math.min(dailyViews, totalViews - cumulativeViews));
      
      // For very small videos, ensure some minimum activity
      if (totalViews > 0 && dailyViews === 0 && cumulativeViews < totalViews) {
        dailyViews = Math.min(1, totalViews - cumulativeViews);
      }
      
      cumulativeViews += dailyViews;
      
      viewsData.push({
        date: date.toISOString().split('T')[0],
        views: cumulativeViews,
        dailyViews
      });
    }

    // Ensure final cumulative views match actual total views
    if (cumulativeViews !== totalViews) {
      const adjustment = totalViews - cumulativeViews;
      viewsData[viewsData.length - 1].views = totalViews;
      viewsData[viewsData.length - 1].dailyViews = Math.max(0, viewsData[viewsData.length - 1].dailyViews + adjustment);
    }

    const averageDailyViews = daysToShow > 0 ? Math.round(totalViews / daysToShow) : 0;
    const peakDay = viewsData.reduce((peak, day) => 
      day.dailyViews > peak.dailyViews ? day : peak, viewsData[0] || { date: '', dailyViews: 0 }
    );

    return {
      viewsPerDay: viewsData,
      totalViews,
      averageDailyViews,
      peakDay: {
        date: peakDay.date,
        views: peakDay.dailyViews
      },
      dataSource: 'fallback',
      summary: {
        totalWatchTime: Math.round(totalViews * 120), // Estimated 2 min avg
        averageViewDuration: 120,
        likes: parseInt(video.statistics.likeCount || '0'),
        comments: parseInt(video.statistics.commentCount || '0'),
        subscribersGained: Math.round(totalViews * 0.01) // Estimated
      }
    };

  } catch (error) {
    console.error('❌ Error generating fallback analytics:', error);
    throw error;
  }
}
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json<APIResponse<null>>({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'videoId parameter is required'
      }, { status: 400 });
    }

    console.log(`📊 Fetching analytics for video ${videoId}`);

    let analyticsData: AnalyticsResponse;

    try {
      // Set up authenticated Google API client
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: session.accessToken });
      const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });
      const youtube = google.youtube({ version: 'v3', auth });

      // First, get the channel that owns this video
      const videoResponse = await youtube.videos.list({
        part: ['snippet'],
        id: [videoId]
      });

      if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
        throw new Error('Video not found or not accessible');
      }

      const channelId = videoResponse.data.items[0].snippet?.channelId;
      if (!channelId) {
        throw new Error('Channel ID not found for video');
      }

      console.log(`📺 Found channel ${channelId} for video ${videoId}`);

      // Check if the authenticated user owns this channel
      const channelsResponse = await youtube.channels.list({
        part: ['id'],
        mine: true
      });

      const userOwnedChannels = channelsResponse.data.items?.map(item => item.id) || [];
      
      if (!userOwnedChannels.includes(channelId)) {
        console.log(`⚠️ User doesn't own channel ${channelId}, using fallback data`);
        throw new Error('User does not own this channel - cannot access analytics');
      }

      console.log(`✅ User owns channel ${channelId}, fetching real analytics...`);

      // Get video publish date for proper date range
      const videoInfo = await youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: [videoId]
      });

      const publishedAt = videoInfo.data.items?.[0]?.snippet?.publishedAt;
      if (!publishedAt) {
        throw new Error('Could not get video publish date');
      }

      const publishedDate = new Date(publishedAt);
      const currentDate = new Date();
      
      // Account for YouTube Analytics API delay (data available up to 2 days ago)
      const analyticsEndDate = new Date(currentDate);
      analyticsEndDate.setDate(currentDate.getDate() - 2);
      
      const videoAge = Math.ceil((analyticsEndDate.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Set date range from published date to 2 days ago (max 30 days)
      const startDate = publishedDate.toISOString().split('T')[0];
      const endDate = analyticsEndDate.toISOString().split('T')[0];
      
      console.log(`📅 Real Analytics range: ${startDate} to ${endDate} (${videoAge} days, accounting for API delay)`);

      // Get daily views data for the specific video from publish date
      const viewsResponse = await youtubeAnalytics.reports.query({
        ids: `channel==${channelId}`,
        startDate,
        endDate,
        metrics: 'views,estimatedMinutesWatched,averageViewDuration,likes,comments,subscribersGained',
        dimensions: 'day',
        filters: `video==${videoId}`,
        sort: 'day'
      });

      if (!viewsResponse.data.rows || viewsResponse.data.rows.length === 0) {
        console.log('⚠️ No analytics data available for this video, using fallback');
        throw new Error('No analytics data available for this video');
      }

      // Process analytics data starting from publish date
      const viewsData: ViewsData[] = [];
      let cumulativeViews = 0;
      let totalWatchTime = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalSubscribersGained = 0;

      console.log(`📊 Processing ${viewsResponse.data.rows?.length || 0} days of analytics data`);

      viewsResponse.data.rows?.forEach((row: any[]) => {
        const [date, dailyViews, watchTime, avgDuration, likes, comments, subscribers] = row;
        cumulativeViews += dailyViews || 0;
        totalWatchTime += watchTime || 0;
        totalLikes += likes || 0;
        totalComments += comments || 0;
        totalSubscribersGained += subscribers || 0;

        viewsData.push({
          date: date,
          views: cumulativeViews,
          dailyViews: dailyViews || 0
        });
      });

      const actualDaysAnalyzed = viewsData.length;
      const averageDailyViews = actualDaysAnalyzed > 0 ? Math.round(cumulativeViews / actualDaysAnalyzed) : 0;
      const peakDay = viewsData.reduce((peak, day) => 
        day.dailyViews > peak.dailyViews ? day : peak, viewsData[0] || { date: '', dailyViews: 0 }
      );

      analyticsData = {
        viewsPerDay: viewsData,
        totalViews: cumulativeViews,
        averageDailyViews,
        peakDay: {
          date: peakDay.date,
          views: peakDay.dailyViews
        },
        dataSource: 'analytics',
        summary: {
          totalWatchTime,
          averageViewDuration: viewsData.length > 0 ? Math.round(totalWatchTime / cumulativeViews) : 0,
          likes: totalLikes,
          comments: totalComments,
          subscribersGained: totalSubscribersGained
        }
      };

      console.log(`✅ Real analytics fetched: ${cumulativeViews} total views over ${viewsData.length} days`);

    } catch (analyticsError) {
      console.log(`📊 Analytics API failed for video ${videoId}:`, analyticsError);
      
      // Provide detailed error information
      let errorReason = 'Unknown error';
      if (analyticsError instanceof Error) {
        if (analyticsError.message.includes('User does not own')) {
          errorReason = 'Video not owned by authenticated user';
        } else if (analyticsError.message.includes('not accessible')) {
          errorReason = 'Video not found or private';
        } else if (analyticsError.message.includes('No analytics data')) {
          errorReason = 'No analytics data available (may be too recent)';
        } else {
          errorReason = analyticsError.message;
        }
      }
      
      console.log(`🔄 Using intelligent fallback due to: ${errorReason}`);
      analyticsData = await generateFallbackViewsData(videoId);
      
      // Add error reason to the response
      analyticsData.errorReason = errorReason;
    }

    const response = NextResponse.json<APIResponse<AnalyticsResponse>>({
      success: true,
      data: analyticsData
    });

    // Use shorter cache for more frequent updates
    response.headers.set('Cache-Control', 'private, s-maxage=300, stale-while-revalidate=300'); // 5 minutes cache
    
    return response;

  } catch (error) {
    console.error('❌ Error in /api/youtube/analytics:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}