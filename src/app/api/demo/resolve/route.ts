import { NextRequest, NextResponse } from 'next/server';
import { parseYouTubeUrl } from '@/lib/youtube';
import { APIResponse, ParsedUrl } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'URL parameter is required'
      }, { status: 400 });
    }

    const parsedUrl: ParsedUrl = parseYouTubeUrl(url);

    if (parsedUrl.type === null) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Invalid YouTube URL format'
      }, { status: 400 });
    }

    return NextResponse.json<APIResponse<ParsedUrl>>({
      success: true,
      data: parsedUrl
    });

  } catch (error) {
    console.error('Error in /api/demo/resolve:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}