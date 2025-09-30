import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/metrics';
import { Users, Video, Eye, Calendar } from 'lucide-react';

interface ChannelData {
  id: string;
  title: string;
  description: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  publishedAt: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  bannerImageUrl?: string;
}

interface ChannelOverviewProps {
  onChannelLoad?: (channel: ChannelData) => void;
}

export default function ChannelOverview({ onChannelLoad }: ChannelOverviewProps) {
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/youtube/channel-info');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch channel data');
        }

        const data = await response.json();
        setChannelData(data.data.channel);
        onChannelLoad?.(data.data.channel);
        setError(null);
      } catch (error) {
        console.error('Error fetching channel data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load channel data');
      } finally {
        setLoading(false);
      }
    };

    fetchChannelData();
  }, [onChannelLoad]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Channel Header */}
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-[#C8FF3D] to-[#B8EF2D]">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black/20 border-2 border-black animate-pulse"></div>
              <div className="flex-1">
                <div className="h-8 bg-black/20 border-2 border-black mb-2 animate-pulse"></div>
                <div className="h-4 bg-black/20 border-2 border-black w-2/3 animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-200 border-2 border-black mx-auto mb-4 animate-pulse"></div>
                <div className="h-8 bg-gray-200 border-2 border-black mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 border-2 border-black animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#FF6A4D]">
        <CardContent className="p-8 text-center text-white">
          <h3 className="font-bold text-xl mb-4">⚠️ Channel Loading Error</h3>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-white text-[#FF6A4D] px-4 py-2 border-2 border-black font-bold"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!channelData) return null;

  const channelAge = Math.floor((Date.now() - new Date(channelData.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 365));

  return (
    <div className="space-y-6">
      {/* Channel Header */}
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-[#C8FF3D] to-[#B8EF2D]">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            {/* Channel Avatar - Use actual thumbnail */}
            {channelData.thumbnails?.high || channelData.thumbnails?.medium || channelData.thumbnails?.default ? (
              <img 
                src={channelData.thumbnails.high || channelData.thumbnails.medium || channelData.thumbnails.default} 
                alt={channelData.title}
                className="w-20 h-20 squared-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-[#7A3BFF] border-4 border-black flex items-center justify-center font-black text-white text-2xl rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {channelData.title[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-bold text-3xl text-black mb-2">{channelData.title}</h1>
              {/* Channel Description */}
              {channelData.description && (
                <p className="text-base text-black/70 font-medium mb-3 line-clamp-2 leading-relaxed">
                  {channelData.description}
                </p>
              )}
              <p className="text-lg text-black/80 font-medium">
                🎯 YouTube Creator since {new Date(channelData.publishedAt).getFullYear()}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge className="bg-black text-[#C8FF3D] border-2 border-black font-bold">
                  VERIFIED CHANNEL
                </Badge>
                
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#7A3BFF]">
          <CardContent className="p-6 text-center text-white">
            <Users className="w-12 h-12 mx-auto mb-4" />
            <div className="font-black text-4xl mb-2">{formatNumber(parseInt(channelData.subscriberCount))}</div>
            <div className="font-bold text-sm uppercase tracking-wider">Subscribers</div>
          </CardContent>
        </Card>

        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#FF6A4D]">
          <CardContent className="p-6 text-center text-white">
            <Video className="w-12 h-12 mx-auto mb-4" />
            <div className="font-black text-4xl mb-2">{formatNumber(parseInt(channelData.videoCount))}</div>
            <div className="font-bold text-sm uppercase tracking-wider">Videos</div>
          </CardContent>
        </Card>

        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#4DA6FF]">
          <CardContent className="p-6 text-center text-white">
            <Eye className="w-12 h-12 mx-auto mb-4" />
            <div className="font-black text-4xl mb-2">{formatNumber(parseInt(channelData.viewCount))}</div>
            <div className="font-bold text-sm uppercase tracking-wider">Total Views</div>
          </CardContent>
        </Card>

        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#FF8A4D]">
          <CardContent className="p-6 text-center text-white">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <div className="font-black text-4xl mb-2">{channelAge}+</div>
            <div className="font-bold text-sm uppercase tracking-wider">Years Active</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}