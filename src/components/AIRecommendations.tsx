import React from 'react';
import { Card } from '@/components/ui/card';

interface AIRecommendationsProps {
  nicheTrends?: {
    recommendations?: {
      addHashtags: string[];
      addKeywords: string[];
      titleImprovements: string[];
      descriptionImprovements: string[];
    };
  } | null;
  loading?: boolean;
  error?: string | null;
  videoData?: any;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ 
  nicheTrends, 
  loading = false, 
  error = null,
  videoData 
}) => {
  const recommendations = nicheTrends?.recommendations;

  if (loading) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300">
        <div className="bg-[#E8F4FD] border-b-4 border-black p-4">
          <h3 className="font-bold text-xl text-black">🤖 OPTIMIZATION RECOMMENDATIONS</h3>
        </div>
        <div className="p-6 h-32 flex items-center justify-center">
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-gray-200 rounded w-48"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !recommendations) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300">
        <div className="bg-[#E8F4FD] border-b-4 border-black p-4">
          <h3 className="font-bold text-xl text-black">🤖 OPTIMIZATION RECOMMENDATIONS</h3>
        </div>
        <div className="p-6 h-32 flex items-center justify-center">
          <p className="text-gray-600 font-medium">◆ Enter a video URL for optimization tips</p>
        </div>
      </Card>
    );
  }

  const titleSuggestions = recommendations.titleImprovements?.filter(t => t && !t.includes('"what"') && t.length > 15) || [];
  const descriptionSuggestions = recommendations.descriptionImprovements || [];
  const hashtagSuggestions = recommendations.addHashtags || [];

  const hasRecommendations = titleSuggestions.length > 0 || descriptionSuggestions.length > 0 || hashtagSuggestions.length > 0;

  if (!hasRecommendations) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300">
        <div className="bg-[#E8F4FD] border-b-4 border-black p-4">
          <h3 className="font-bold text-xl text-black">🤖 OPTIMIZATION RECOMMENDATIONS</h3>
        </div>
        <div className="p-6 h-32 flex items-center justify-center">
          <p className="text-green-700 font-bold">✨ Content looks well optimized!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300">
      <div className="bg-[#E8F4FD] border-b-4 border-black p-4">
        <h3 className="font-bold text-xl text-black">🤖 OPTIMIZATION RECOMMENDATIONS</h3>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Hashtag & Title Row - Side by Side */}
        {(hashtagSuggestions.length > 0 || titleSuggestions.length > 0) && (
          <div className="grid grid-cols-12 gap-4">
            {/* Hashtag Recommendations - Smaller Space */}
            {hashtagSuggestions.length > 0 && (
              <div className="col-span-4 border-4 border-[#FF6A4D] bg-gradient-to-r from-[#FF6A4D]/10 to-[#FF6A4D]/5 p-4 hover:shadow-[6px_6px_0px_0px_rgba(255,106,77,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏷️</span>
                  <h4 className="font-bold text-base text-[#FF6A4D]">ADD HASHTAGS</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hashtagSuggestions.map((tag, index) => (
                    <span key={index} className="bg-[#FF6A4D] text-white px-2 py-1 font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Title Recommendations - More Space */}
            {titleSuggestions.length > 0 && (
              <div className={`${hashtagSuggestions.length > 0 ? 'col-span-8' : 'col-span-12'} border-4 border-[#4DA6FF] bg-gradient-to-r from-[#4DA6FF]/10 to-[#4DA6FF]/5 p-4 hover:shadow-[6px_6px_0px_0px_rgba(77,166,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📝</span>
                  <h4 className="font-bold text-lg text-[#4DA6FF]">TITLE OPTIMIZATION</h4>
                </div>
                <div className="space-y-2">
                  {titleSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-white border-2 border-[#4DA6FF] p-3 hover:bg-[#4DA6FF]/5 transition-colors">
                      <p className="font-medium text-gray-800 text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description Recommendations */}
        {descriptionSuggestions.length > 0 && (
          <div className="border-4 border-[#7A3BFF] bg-gradient-to-r from-[#7A3BFF]/10 to-[#7A3BFF]/5 p-4 hover:shadow-[6px_6px_0px_0px_rgba(122,59,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📄</span>
              <h4 className="font-bold text-lg text-[#7A3BFF]">DESCRIPTION OPTIMIZATION</h4>
            </div>
            <div className="space-y-2">
              {descriptionSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-white border-2 border-[#7A3BFF] p-3 hover:bg-[#7A3BFF]/5 transition-colors">
                  <p className="font-medium text-gray-800">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pro Tip */}
        <div className="border-4 border-black bg-gradient-to-r from-[#C8FF3D] to-[#B8EF2D] p-4 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💡</span>
            <h4 className="font-bold text-lg text-black">PRO TIP</h4>
          </div>
          <p className="font-medium text-black">
            Copy-paste recommended hashtags into your description for instant SEO boost!
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AIRecommendations;