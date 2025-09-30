import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/metrics';
import { Video, Eye, MessageCircle, Clock, RefreshCw, PlayCircle, TrendingUp } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration: string;
  tags: string[];
  channelTitle?: string;
  channelThumbnail?: string;
}

interface VideosListProps {
  onVideoSelect?: (videoId: string) => void;
  selectedVideoId?: string | null;
}

export default function VideosList({ onVideoSelect, selectedVideoId }: VideosListProps) {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseVideoDuration = (duration: string): string => {
    if (!duration || duration === 'P0D' || duration === 'PT0S') return '0:00';
    
    // Handle ISO 8601 duration format (PT1H2M3S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeElapsed = (publishedAt: string): string => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now.getTime() - published.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    return 'Recently';
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/youtube/videos?maxResults=20');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch videos');
      }

      const data = await response.json();
      
      // Enhance videos with channel thumbnail data
      const enhancedVideos = data.data.videos.map((video: VideoData) => ({
        ...video,
        channelThumbnail: data.data.channelInfo?.profileImageUrl || null,
        channelTitle: video.channelTitle || data.data.channelInfo?.title || 'Your Channel'
      }));
      
      setVideos(enhancedVideos);
      setError(null);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7A3BFF] to-[#9D5BFF] border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C8FF3D] border-2 border-black flex items-center justify-center font-bold text-black text-lg">
              📺
            </div>
            <h2 className="text-xl font-bold text-white">YOUR VIDEOS</h2>
          </div>
          {!loading && videos.length > 0 && (
            <div className="bg-[#C8FF3D] text-black px-3 py-1 border-2 border-black font-bold text-sm">
              {videos.length} VIDEOS
            </div>
          )}
        </div>
      </div>

      <div className="px-3">
        {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 bg-white border-4 border-gray-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-12 bg-gray-300 border-2 border-gray-400"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 border border-gray-400 w-4/5"></div>
                  <div className="h-3 bg-gray-300 border border-gray-400 w-3/5"></div>
                  <div className="flex gap-2">
                    <div className="h-2 bg-gray-300 border border-gray-400 w-12"></div>
                    <div className="h-2 bg-gray-300 border border-gray-400 w-12"></div>
                    <div className="h-2 bg-gray-300 border border-gray-400 w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 border-4 border-red-500 bg-red-50 text-center shadow-[6px_6px_0px_0px_rgba(239,68,68,1)]">
          <div className="text-4xl mb-4">😱</div>
          <p className="text-red-700 font-bold mb-4">{error}</p>
          <button 
            onClick={fetchVideos}
            className="bg-red-500 text-white px-4 py-2 border-4 border-black font-bold hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            🔄 Try Again
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="p-8 border-4 border-yellow-500 bg-yellow-50 text-center shadow-[6px_6px_0px_0px_rgba(234,179,8,1)]">
          <div className="text-6xl mb-4">🎥</div>
          <h3 className="text-yellow-800 font-bold text-lg mb-2">No Videos Found</h3>
          <p className="text-yellow-700 font-medium">Upload some amazing content to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video, index) => (
            <div
              key={video.id}
              onClick={() => onVideoSelect?.(video.id)}
              className={`group cursor-pointer border-4 border-black transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${
                selectedVideoId === video.id
                  ? 'bg-gradient-to-r from-[#7A3BFF] to-[#9D5BFF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white hover:bg-gradient-to-r hover:from-[#F8F4FF] hover:to-[#F0F8FE] text-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Enhanced Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-12 border-2 border-black overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {video.thumbnails?.medium ? (
                        <img 
                          src={video.thumbnails.medium} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PlayCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Duration Badge */}
                    <div className={`absolute -bottom-1 -right-1 text-xs font-bold px-2 py-1 border-2 border-black ${
                      selectedVideoId === video.id 
                        ? 'bg-[#C8FF3D] text-black' 
                        : 'bg-black text-white'
                    }`}>
                      {parseVideoDuration(video.duration)}
                    </div>
                  </div>
                  
                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm leading-tight mb-2 line-clamp-2 ${
                      selectedVideoId === video.id ? 'text-white' : 'text-gray-900 group-hover:text-[#7A3BFF]'
                    }`}>
                      {video.title}
                    </h3>
                    
                    {/* Enhanced Stats */}
                    <div className={`flex items-center gap-3 text-xs font-medium mb-2 ${
                      selectedVideoId === video.id ? 'text-purple-100' : 'text-gray-600'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(parseInt(video.viewCount || '0'))}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {formatNumber(parseInt(video.commentCount || '0'))}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatNumber(parseInt(video.likeCount || '0'))}
                      </span>
                    </div>
                    
                    {/* Time & Status */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${
                        selectedVideoId === video.id ? 'text-purple-200' : 'text-gray-500'
                      }`}>
                        {getTimeElapsed(video.publishedAt)}
                      </span>
                      
                      {selectedVideoId === video.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#C8FF3D] rounded-full animate-pulse"></div>
                          <span className="text-xs font-bold text-[#C8FF3D]">SELECTED</span>
                        </div>
                      ) : (
                        <div className={`text-xs font-bold border-2 border-black px-2 py-1 ${
                          'bg-[#C8FF3D] text-black group-hover:bg-[#B8EF2D]'
                        }`}>
                          ANALYZE
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}