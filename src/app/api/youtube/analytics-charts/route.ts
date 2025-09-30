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
    const days = parseInt(searchParams.get('days') || '10'); // Changed from 30 to 10

    // Set up YouTube Analytics API client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

    // Calculate date range with buffer
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1)); // 10 days back from today
    
    // Add 2 buffer days for future visualization
    const futureEndDate = new Date();
    futureEndDate.setDate(futureEndDate.getDate() + 2);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    try {
      // Get daily views data
      const viewsResponse = await youtubeAnalytics.reports.query({
        dimensions: 'day',
        endDate: formatDate(endDate),
        ids: 'channel==MINE',
        metrics: 'views',
        startDate: formatDate(startDate),
        sort: 'day',
      });

      // Get daily subscriber changes
      const subscribersResponse = await youtubeAnalytics.reports.query({
        dimensions: 'day', 
        endDate: formatDate(endDate),
        ids: 'channel==MINE',
        metrics: 'subscribersGained,subscribersLost',
        startDate: formatDate(startDate),
        sort: 'day',
      });

      // Process views data
      const viewsData = viewsResponse.data.rows?.map((row: any) => ({
        date: row[0],
        views: row[1]
      })) || [];

      // Process subscriber data
      const subscriberData = subscribersResponse.data.rows?.map((row: any) => ({
        date: row[0],
        gained: row[1],
        lost: row[2],
        net: row[1] - row[2]
      })) || [];

      return NextResponse.json({
        success: true,
        data: {
          views: viewsData,
          subscribers: subscriberData,
          dateRange: {
            start: formatDate(startDate),
            end: formatDate(endDate),
            days
          }
        }
      });

    } catch (analyticsError: any) {
      console.error('YouTube Analytics API error:', analyticsError);
      
      // Generate mock data if Analytics API fails (for demonstration)
      const mockViewsData = [];
      const mockSubscriberData = [];
      
      // Generate past data (days - 1 to 0 days ago)
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Add some realistic data for recent days
        const hasData = i <= 2; // Only last 3 days have data
        
        mockViewsData.push({
          date: formatDate(date),
          views: hasData ? Math.floor(Math.random() * 150) + 50 : Math.floor(Math.random() * 20) + 5
        });

        const gained = hasData ? Math.floor(Math.random() * 8) + 2 : Math.floor(Math.random() * 3) + 1;
        const lost = hasData ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 1);
        
        mockSubscriberData.push({
          date: formatDate(date),
          gained,
          lost,
          net: gained - lost
        });
      }
      
      // Add 2 future buffer days with zero data
      for (let i = 1; i <= 2; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        
        mockViewsData.push({
          date: formatDate(futureDate),
          views: 0
        });
        
        mockSubscriberData.push({
          date: formatDate(futureDate),
          gained: 0,
          lost: 0,
          net: 0
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          views: mockViewsData,
          subscribers: mockSubscriberData,
          dateRange: {
            start: formatDate(startDate),
            end: formatDate(futureEndDate), // Include buffer in range
            days: days + 2 // Total days including buffer
          },
          isMockData: true
        }
      });
    }

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data'
    }, { status: 500 });
  }
}