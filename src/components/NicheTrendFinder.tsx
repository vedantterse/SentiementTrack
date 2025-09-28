import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HashtagStatus {
  hashtag: string;
  status: 'present' | 'missing' | 'opportunity';
  frequency: number;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
}

interface KeywordAnalysis {
  keyword: string;
  status: 'present' | 'missing';
  inTitle: boolean;
  inDescription: boolean;
  inTags: boolean;
  trendingScore: number;
}

interface NicheAnalysis {
  videoId: string;
  detectedNiche: string;
  categoryId: string;
  categoryName: string;
  
  // Current video analysis
  currentHashtags: string[];
  currentKeywords: string[];
  
  // Trending analysis
  trendingHashtags: HashtagStatus[];
  keywordGaps: KeywordAnalysis[];
  
  // Recommendations
  recommendations: {
    addHashtags: string[];
    addKeywords: string[];
    titleImprovements: string[];
    descriptionImprovements: string[];
  };
  
  // Stats
  stats: {
    hashtagsPresent: number;
    hashtagsMissing: number;
    keywordsOptimized: number;
    totalOpportunities: number;
  };
}

interface NicheTrendFinderProps {
  nicheTrends: NicheAnalysis | null;
  loading?: boolean;
  error?: string | null;
}

const NicheTrendFinder: React.FC<NicheTrendFinderProps> = ({ 
  nicheTrends, 
  loading = false, 
  error = null 
}) => {
  console.log('NicheTrendFinder Props:', { nicheTrends, loading, error });
  if (loading) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white h-[400px]">
        <div className="bg-[#FFF8E8] border-b-4 border-black p-4">
          <h3 className="text-xl font-bold text-black font-mono">
            🔥 Niche Trend Finder
          </h3>
        </div>
        <div className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📈</div>
            <p className="font-bold text-gray-600 font-mono">Analyzing trending topics...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(220,38,38,1)] bg-red-50 h-[400px]">
        <div className="bg-red-100 border-b-4 border-red-600 p-4">
          <h3 className="text-xl font-bold text-red-800 font-mono">
            🔥 Niche Trend Finder
          </h3>
        </div>
        <div className="p-6 h-full flex items-center justify-center">
          <p className="text-red-700 font-mono text-sm text-center">
            ⚠️ Failed to analyze trends: {error}
          </p>
        </div>
      </Card>
    );
  }

  if (!nicheTrends) {
    console.log('NicheTrendFinder: No niche trends data received');
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white h-[400px]">
        <div className="bg-[#FFF8E8] border-b-4 border-black p-4">
          <h3 className="text-xl font-bold text-black font-mono">
            🔥 Niche Trend Finder
          </h3>
        </div>
        <div className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="font-bold text-gray-600 font-mono">Analyzing trending topics...</p>
            <p className="text-xs text-gray-500 font-mono mt-2">API call in progress</p>
          </div>
        </div>
      </Card>
    );
  }

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'bg-green-400 border-green-600 text-green-900';
      case 'medium': return 'bg-yellow-400 border-yellow-600 text-yellow-900';
      case 'high': return 'bg-red-400 border-red-600 text-red-900';
      default: return 'bg-gray-400 border-gray-600 text-gray-900';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  console.log('NicheTrendFinder: Rendering with data for niche:', nicheTrends.detectedNiche);
  console.log('NicheTrendFinder: Hashtags count:', nicheTrends.trendingHashtags?.length);

  return (
    <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
      {/* Header */}
      <div className="bg-[#FFF8E8] border-b-4 border-black p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-black font-mono">
            🔥 Smart Hashtag Analyzer
          </h3>
          <Badge className="bg-purple-400 border-2 border-purple-600 text-purple-900 font-bold">
            {nicheTrends.detectedNiche.toUpperCase()} | {nicheTrends.categoryName}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Trending Hashtags Analysis */}
        <div>
          <h4 className="font-bold text-black mb-2 font-mono text-sm">
            #️⃣ TRENDING HASHTAGS IN YOUR NICHE
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {nicheTrends.trendingHashtags.slice(0, 10).map((hashtag, index) => (
              <div
                key={index}
                className={`p-2 border-2 border-black hover:scale-[1.02] transition-all ${
                  hashtag.status === 'present' 
                    ? 'bg-green-100 border-green-600' 
                    : 'bg-red-100 border-red-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-xs truncate">
                    {hashtag.hashtag}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className={`w-4 h-4 border border-black flex items-center justify-center text-xs font-bold ${
                      hashtag.status === 'present' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                    }`}>
                      {hashtag.status === 'present' ? '✓' : '✗'}
                    </span>
                    <Badge className={`text-xs px-1 ${getCompetitionColor(hashtag.competition)}`}>
                      {hashtag.competition.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs font-mono mt-1 opacity-75">
                  Used by {hashtag.frequency} trending videos
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2 font-mono">
            ✅ Already using • ❌ Missing opportunity • Competition: HIGH/MED/LOW
          </p>
        </div>



        {/* Stats Summary */}
        <div className="border-t-2 border-black pt-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-green-100 border-2 border-green-600">
              <div className="font-bold text-green-900 font-mono text-lg">
                {nicheTrends.stats.hashtagsPresent}
              </div>
              <div className="text-xs font-mono text-green-700">HASHTAGS ✓</div>
            </div>
            <div className="p-2 bg-red-100 border-2 border-red-600">
              <div className="font-bold text-red-900 font-mono text-lg">
                {nicheTrends.stats.hashtagsMissing}
              </div>
              <div className="text-xs font-mono text-red-700">MISSING</div>
            </div>
            <div className="p-2 bg-blue-100 border-2 border-blue-600">
              <div className="font-bold text-blue-900 font-mono text-lg">
                {nicheTrends.stats.keywordsOptimized}
              </div>
              <div className="text-xs font-mono text-blue-700">KEYWORDS ✓</div>
            </div>
            <div className="p-2 bg-orange-100 border-2 border-orange-600">
              <div className="font-bold text-orange-900 font-mono text-lg">
                {nicheTrends.stats.totalOpportunities}
              </div>
              <div className="text-xs font-mono text-orange-700">OPPORTUNITIES</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NicheTrendFinder;