'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Users, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  Heart,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Video,
  Share2,
  Hash,
  Zap,
  Star,
  Award,
  Rocket
} from 'lucide-react';

interface FeedbackInsightsProps {
  insights: {
    audienceInsights?: {
      whatTheyLoved?: string[];
      whatTheyDidntLike?: string[];
      commonQuestions?: string[];
      suggestedTopics?: string[];
      sentimentBreakdown?: {
        positive: number;
        neutral: number;
        negative: number;
      };
    };
    contentRecommendations?: {
      nextVideoIdeas?: string[];
      improvementAreas?: string[];
      strengthsToKeep?: string[];
      hashtags?: string[];
      thumbnail?: string[];
      title?: string[];
    };
    engagementStrategy?: {
      replyPriority?: string[];
      communityBuilding?: string[];
      contentStrategy?: string[];
    };
    performancePrediction?: {
      score?: number;
      reasoning?: string;
      optimizationTips?: string[];
      expectedGrowth?: string;
      viralPotential?: number;
    };
  } | {
    insights: {
      audienceInsights?: {
        whatTheyLoved?: string[];
        whatTheyDidntLike?: string[];
        commonQuestions?: string[];
        suggestedTopics?: string[];
        sentimentBreakdown?: {
          positive: number;
          neutral: number;
          negative: number;
        };
      };
      contentRecommendations?: {
        nextVideoIdeas?: string[];
        improvementAreas?: string[];
        strengthsToKeep?: string[];
        hashtags?: string[];
        thumbnail?: string[];
        title?: string[];
      };
      engagementStrategy?: {
        replyPriority?: string[];
        communityBuilding?: string[];
        contentStrategy?: string[];
      };
      performancePrediction?: {
        score?: number;
        reasoning?: string;
        optimizationTips?: string[];
        expectedGrowth?: string;
        viralPotential?: number;
      };
    };
  };
  loading?: boolean;
}

interface InsightSectionProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
  badge?: string;
  collapsible?: boolean;
  iconBg?: string;
}

function InsightSection({ title, icon, color, items, badge, collapsible = false, iconBg }: InsightSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible);

  return (
    <div className={`bg-gradient-to-br from-white to-${color}/5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200`}>
      <div 
        className={`p-4 border-b-2 border-black cursor-pointer flex items-center justify-between ${collapsible ? 'hover:bg-gray-50' : ''}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${iconBg || `bg-${color}`} border-4 border-black flex items-center justify-center`}>
            {icon}
          </div>
          <h4 className="font-bold text-lg text-black">{title}</h4>
          {badge && (
            <Badge className="bg-black text-white border-2 border-black font-bold text-xs">
              {badge}
            </Badge>
          )}
        </div>
        {collapsible && (
          <div className="text-gray-600">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {items && items.length > 0 ? (
            <ul className="space-y-3">
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className={`w-3 h-3 ${iconBg || `bg-${color}`} border-2 border-black mt-1.5 flex-shrink-0 rounded-full`}></div>
                  <span className="text-gray-800 font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No insights available for this section.</p>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className={`p-4 bg-gradient-to-br from-white to-${color}/10 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 bg-${color} border-2 border-black flex items-center justify-center`}>
          {icon}
        </div>
        <h4 className="font-bold text-black">{title}</h4>
      </div>
      <div className="text-2xl font-black text-black">{value}</div>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}

function getPerformanceColor(score: number): string {
  if (score >= 80) return 'green-500';
  if (score >= 60) return 'yellow-500';
  if (score >= 40) return 'orange-500';
  return 'red-500';
}

function getPerformanceLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
}

export default function FeedbackInsights({ insights: insightsData, loading }: FeedbackInsightsProps) {
  const [expandedSections, setExpandedSections] = useState({
    audience: true,
    content: true,
    engagement: false,
    hashtags: false,
    optimization: false
  });

  // Handle nested insights structure from API
  const insights = (insightsData as any)?.insights || insightsData;
  
  if (loading) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
          <CardTitle className="text-xl font-bold text-black">🧠 Creator Intelligence Hub</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 border-2 border-gray-300 animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || (!insights.audienceInsights && !insights.contentRecommendations && !insights.performancePrediction)) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
          <CardTitle className="text-xl font-bold text-black">🧠 Creator Intelligence Hub</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No insights available. Analyze a video first.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const performanceScore = insights?.performancePrediction?.score || 75;
  const viralPotential = insights?.performancePrediction?.viralPotential || 0;
  const sentimentData = insights?.audienceInsights?.sentimentBreakdown || { positive: 70, neutral: 20, negative: 10 };

  return (
    <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#7A3BFF] border-4 border-black flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-black">🧠 Creator Intelligence Hub</CardTitle>
              <p className="text-sm text-gray-600 font-medium">Advanced AI-powered insights for your content</p>
            </div>
          </div>
          <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold">
            LIVE ANALYSIS
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Performance Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title="Performance Score"
            value={`${performanceScore}/100`}
            icon={<Target className="w-4 h-4 text-white" />}
            color={getPerformanceColor(performanceScore)}
            subtitle={getPerformanceLabel(performanceScore)}
          />
          
          <MetricCard
            title="Viral Potential"
            value={`${viralPotential}%`}
            icon={<Rocket className="w-4 h-4 text-white" />}
            color={viralPotential > 70 ? "green-500" : viralPotential > 40 ? "yellow-500" : "orange-500"}
            subtitle={viralPotential > 70 ? "High chance" : viralPotential > 40 ? "Moderate chance" : "Build momentum"}
          />
          
          <MetricCard
            title="Sentiment Score"
            value={`${sentimentData.positive}%`}
            icon={<Heart className="w-4 h-4 text-white" />}
            color={sentimentData.positive > 70 ? "green-500" : sentimentData.positive > 50 ? "yellow-500" : "red-500"}
            subtitle={`${sentimentData.positive}% positive feedback`}
          />
        </div>

        {/* Performance Reasoning */}
        {insights?.performancePrediction?.reasoning && (
          <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-4 border-black">
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-6 h-6 text-[#7A3BFF]" />
              <h3 className="font-bold text-lg text-black">AI Performance Analysis</h3>
            </div>
            <p className="text-gray-700 font-medium leading-relaxed">
              {insights.performancePrediction.reasoning}
            </p>
            {insights?.performancePrediction?.expectedGrowth && (
              <div className="mt-3 p-3 bg-[#C8FF3D]/20 border-2 border-black">
                <strong>Growth Forecast:</strong> {insights.performancePrediction.expectedGrowth}
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Audience Insights - Enhanced */}
          <div>
            <button
              onClick={() => toggleSection('audience')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#7A3BFF]/10 to-[#4DA6FF]/10 border-4 border-black mb-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-[#7A3BFF]" />
                <h3 className="font-bold text-lg text-black">👥 Deep Audience Insights</h3>
                <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold">
                  {((insights?.audienceInsights?.whatTheyLoved?.length || 0) + 
                    (insights?.audienceInsights?.whatTheyDidntLike?.length || 0) + 
                    (insights?.audienceInsights?.commonQuestions?.length || 0))} insights
                </Badge>
              </div>
              {expandedSections.audience ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.audience && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InsightSection
                  title="What They Absolutely Loved ❤️"
                  icon={<Heart className="w-5 h-5 text-white" />}
                  iconBg="bg-green-500"
                  color="green-500"
                  items={insights?.audienceInsights?.whatTheyLoved || ['Great content quality', 'Engaging presentation', 'Valuable information']}
                  badge={`${insights?.audienceInsights?.whatTheyLoved?.length || 3} positive signals`}
                />
                
                <InsightSection
                  title="Areas for Improvement 🔧"
                  icon={<AlertTriangle className="w-5 h-5 text-white" />}
                  iconBg="bg-orange-500"
                  color="orange-500"
                  items={insights?.audienceInsights?.whatTheyDidntLike || ['Could improve audio quality', 'More examples needed']}
                  badge={`${insights?.audienceInsights?.whatTheyDidntLike?.length || 2} improvement areas`}
                />
                
                <InsightSection
                  title="Common Questions 🤔"
                  icon={<HelpCircle className="w-5 h-5 text-white" />}
                  iconBg="bg-blue-500"
                  color="blue-500"
                  items={insights?.audienceInsights?.commonQuestions || ['How do I get started?', 'What tools do you recommend?']}
                  badge={`${insights?.audienceInsights?.commonQuestions?.length || 2} questions`}
                />
                
                <InsightSection
                  title="Suggested Topics 💡"
                  icon={<Lightbulb className="w-5 h-5 text-white" />}
                  iconBg="bg-purple-500"
                  color="purple-500"
                  items={insights?.audienceInsights?.suggestedTopics || ['Tutorial series', 'Behind the scenes', 'Q&A sessions']}
                  badge={`${insights?.audienceInsights?.suggestedTopics?.length || 3} ideas`}
                />
              </div>
            )}
          </div>

          {/* Content Recommendations - Enhanced */}
          <div>
            <button
              onClick={() => toggleSection('content')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#C8FF3D]/20 to-[#7A3BFF]/10 border-4 border-black mb-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-[#7A3BFF]" />
                <h3 className="font-bold text-lg text-black">🎬 Content Strategy Recommendations</h3>
                <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold">
                  {((insights?.contentRecommendations?.nextVideoIdeas?.length || 0) + 
                    (insights?.contentRecommendations?.improvementAreas?.length || 0))} recommendations
                </Badge>
              </div>
              {expandedSections.content ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.content && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InsightSection
                  title="Next Video Ideas 🚀"
                  icon={<Rocket className="w-5 h-5 text-white" />}
                  iconBg="bg-[#7A3BFF]"
                  color="purple-500"
                  items={insights?.contentRecommendations?.nextVideoIdeas || ['Part 2 tutorial', 'Common mistakes to avoid', 'Advanced techniques']}
                  badge={`${insights?.contentRecommendations?.nextVideoIdeas?.length || 3} ideas`}
                />
                
                <InsightSection
                  title="Strengths to Keep 💪"
                  icon={<Star className="w-5 h-5 text-white" />}
                  iconBg="bg-green-500"
                  color="green-500"
                  items={insights?.contentRecommendations?.strengthsToKeep || ['Clear explanations', 'Good pacing', 'Practical examples']}
                  badge={`${insights?.contentRecommendations?.strengthsToKeep?.length || 3} strengths`}
                />
                
                <InsightSection
                  title="Improvement Areas 📈"
                  icon={<TrendingUp className="w-5 h-5 text-white" />}
                  iconBg="bg-orange-500"
                  color="orange-500"
                  items={insights?.contentRecommendations?.improvementAreas || ['Better thumbnails', 'Stronger intro', 'Call-to-action']}
                  badge={`${insights?.contentRecommendations?.improvementAreas?.length || 3} areas`}
                />
                
                <InsightSection
                  title="Title Optimization 📝"
                  icon={<Sparkles className="w-5 h-5 text-white" />}
                  iconBg="bg-yellow-500"
                  color="yellow-500"
                  items={insights?.contentRecommendations?.title || ['Add numbers', 'Include keywords', 'Create urgency']}
                  badge={`${insights?.contentRecommendations?.title?.length || 3} tips`}
                />
              </div>
            )}
          </div>

          {/* Hashtags & SEO */}
          {insights?.contentRecommendations?.hashtags && insights.contentRecommendations.hashtags.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('hashtags')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#4DA6FF]/10 to-[#C8FF3D]/20 border-4 border-black mb-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Hash className="w-6 h-6 text-[#4DA6FF]" />
                  <h3 className="font-bold text-lg text-black"># Recommended Hashtags & SEO</h3>
                  <Badge className="bg-[#4DA6FF] text-white border-2 border-black font-bold">
                    {insights.contentRecommendations.hashtags.length} tags
                  </Badge>
                </div>
                {expandedSections.hashtags ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.hashtags && (
                <div className="p-4 bg-gradient-to-br from-[#4DA6FF]/5 to-[#C8FF3D]/5 border-4 border-black">
                  <div className="flex flex-wrap gap-2">
                    {insights?.contentRecommendations?.hashtags?.map((tag: string, index: number) => (
                      <Badge key={index} className="bg-[#4DA6FF] text-white border-2 border-black font-bold text-sm px-3 py-1">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Engagement Strategy */}
          {insights?.engagementStrategy && (
            <div>
              <button
                onClick={() => toggleSection('engagement')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#FF6A4D]/10 to-[#7A3BFF]/10 border-4 border-black mb-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-[#FF6A4D]" />
                  <h3 className="font-bold text-lg text-black">💬 Engagement Strategy</h3>
                  <Badge className="bg-[#FF6A4D] text-white border-2 border-black font-bold">
                    Strategy Guide
                  </Badge>
                </div>
                {expandedSections.engagement ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.engagement && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <InsightSection
                    title="Reply Priority 🎯"
                    icon={<Target className="w-5 h-5 text-white" />}
                    iconBg="bg-[#FF6A4D]"
                    color="red-500"
                    items={insights.engagementStrategy.replyPriority || ['Answer questions first', 'Engage with positive feedback', 'Address concerns quickly']}
                  />
                  
                  <InsightSection
                    title="Community Building 🏘️"
                    icon={<Users className="w-5 h-5 text-white" />}
                    iconBg="bg-green-500"
                    color="green-500"
                    items={insights.engagementStrategy.communityBuilding || ['Pin engaging comments', 'Ask follow-up questions', 'Share user stories']}
                  />
                  
                  <InsightSection
                    title="Content Strategy 📊"
                    icon={<TrendingUp className="w-5 h-5 text-white" />}
                    iconBg="bg-blue-500"
                    color="blue-500"
                    items={insights.engagementStrategy.contentStrategy || ['Create series', 'Cross-promote videos', 'Use analytics data']}
                  />
                </div>
              )}
            </div>
          )}

          {/* Optimization Tips */}
          {insights?.performancePrediction?.optimizationTips && insights.performancePrediction.optimizationTips.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('optimization')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#C8FF3D]/20 to-[#FF6A4D]/10 border-4 border-black mb-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-[#7A3BFF]" />
                  <h3 className="font-bold text-lg text-black">⚡ Performance Optimization</h3>
                  <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold">
                    {insights.performancePrediction.optimizationTips.length} tips
                  </Badge>
                </div>
                {expandedSections.optimization ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.optimization && (
                <InsightSection
                  title="AI-Powered Optimization Tips"
                  icon={<Zap className="w-5 h-5 text-white" />}
                  iconBg="bg-[#7A3BFF]"
                  color="purple-500"
                  items={insights.performancePrediction.optimizationTips}
                  badge="Performance Boost"
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}