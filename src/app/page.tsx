"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Brain, MessageCircle, TrendingUp, Target, Zap, Gauge, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConnectAccountButton } from "@/components/ConnectAccountButton";

export default function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100 scroll-smooth overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-2xl tracking-tight">
              <span className="text-black">Sentiment</span>
              <span className="text-[#7A3BFF]">Track</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-black font-medium transition-colors hover:scale-105 transform">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-black font-medium transition-colors hover:scale-105 transform">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-black font-medium transition-colors hover:scale-105 transform">Reviews</a>
            </nav>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                onClick={() => router.push('/try')}
              >
                Try It
              </Button>
              <ConnectAccountButton
                className="bg-[#7A3BFF] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold px-6"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="font-bold text-5xl lg:text-6xl leading-tight tracking-tight">
                <span className="block text-black">AI-Powered</span>
                <span className="block text-[#7A3BFF]">Insights for</span>
                <span className="block text-black">YouTube Creators</span>
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed font-medium max-w-lg">
                Understand your audience. Reply smarter. Spot trends before they explode.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-[#C8FF3D] hover:bg-[#B8EF2D] text-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-lg px-8 py-6"
                onClick={() => router.push('/try')}
              >
                Try It Free
              </Button>
              <ConnectAccountButton
                size="lg" 
                variant="outline" 
                className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-lg px-8 py-6"
              />
            </div>
          </div>
          <div className="relative">
            {/* Floating decorative elements */}
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#FF6A4D] border-4 border-black transform rotate-45 animate-pulse"></div>
            <div className="absolute -bottom-6 -right-6 w-10 h-10 bg-[#4DA6FF] border-4 border-black transform rotate-12"></div>
            
            <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-5 transform rotate-2 hover:rotate-0 transition-transform duration-300 relative overflow-hidden max-w-full">
              {/* Dashboard Background Pattern */}
              <div className="absolute inset-0 opacity-3">
                <div className="grid grid-cols-14 grid-rows-10 h-full w-full">
                  {[...Array(140)].map((_, i) => (
                    <div key={i} className="border border-gray-300"></div>
                  ))}
                </div>
              </div>
              
              {/* Professional Dashboard Layout */}
              <div className="relative z-10 space-y-2.5">
                {/* Browser-like header with professional styling */}
                <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#FF6A4D] border border-black rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-[#C8FF3D] border border-black rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                    <div className="w-3 h-3 bg-[#4DA6FF] border border-black rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                  </div>
                  <div className="flex items-center gap-2">
                    
                    <div className="text-xs font-bold text-gray-600">SentimentTrack Pro</div>
                  </div>
                </div>
                
                {/* Top Row: Sentiment Analysis & AI Reply Suggestions */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Sentiment Analysis - Proper Layout */}
                  <div className="bg-gradient-to-br from-[#E8F5E8] to-[#F0F8F0] border-2 border-black p-2.5 hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-gray-800">SENTIMENT ANALYSIS</div>
                      <div className="text-xs bg-[#4ade80] text-black px-1 py-0.5 border border-black font-bold">92%</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Large Graph - Takes most space */}
                      <div className="flex items-end gap-2 h-14 flex-2">
                        <div className="bg-[#4ade80] border-2 border-black w-4 h-12 group-hover:h-12 transition-all"></div>
                        <div className="bg-[#4ade80] border-2 border-black w-4 h-10 group-hover:h-15 transition-all" style={{transitionDelay: '0.1s'}}></div>
                        <div className="bg-[#4ade80] border-2 border-black w-4 h-9 group-hover:h-10 transition-all" style={{transitionDelay: '0.2s'}}></div>
                        <div className="bg-[#94a3b8] border-2 border-black w-4 h-4 group-hover:h-4 transition-all" style={{transitionDelay: '0.3s'}}></div>
                        <div className="bg-[#f87171] border-2 border-black w-4 h-2 group-hover:h-6 transition-all" style={{transitionDelay: '0.4s'}}></div>
                        <div className="bg-[#4ade80] border-2 border-black w-4 h-8 group-hover:h-9 transition-all" style={{transitionDelay: '0.5s'}}></div>
                      </div>
                      
                      {/* Neo-Brutalist Pie Chart - Mathematically Correct */}
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                          {/* Positive slice - 78% (280.8°) - Starting at 12 o'clock */}
                          <path
                            d="M 50,50 L 50,5 A 45,45 0 1,1 15.21,88.04 Z"
                            fill="#C8FF3D"
                            stroke="#000000"
                            strokeWidth="3"
                            className="hover:fill-[#B8EF2D] hover:brightness-110 transition-all cursor-pointer"
                          />
                          
                          {/* Neutral slice - 14% (50.4°) - Starting where positive ends */}
                          <path
                            d="M 50,50 L 15.21,88.04 A 45,45 0 0,1 11.04,69.79 Z"
                            fill="#94a3b8"
                            stroke="#000000"
                            strokeWidth="3"
                            className="hover:fill-[#64748b] hover:brightness-110 transition-all cursor-pointer"
                          />
                          
                          {/* Negative slice - 8% (28.8°) - Starting where neutral ends */}
                          <path
                            d="M 50,50 L 11.04,69.79 A 45,45 0 0,1 50,5 Z"
                            fill="#FF6A4D"
                            stroke="#000000"
                            strokeWidth="3"
                            className="hover:fill-[#FF5A3D] hover:brightness-110 transition-all cursor-pointer"
                          />
                        </svg>
                      </div>
                      
                      {/* Vertical Emoji Legend - Right Side, Compact */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🙂</span>
                          <span className="text-xs font-bold text-[#4ade80]">78%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🫤</span>
                          <span className="text-xs font-bold text-[#f87171]">14%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">😐</span>
                          <span className="text-xs font-bold text-[#94a3b8]">8%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Reply Assist - Clean Structure */}
                  <div className="bg-gradient-to-br from-[#F3E8FF] to-[#F8F4FF] border-2 border-black p-2.5 hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-gray-800">AI REPLY ASSIST</div>
                      <div className="text-xs bg-[#7A3BFF] text-white px-1 py-0.5 border border-black font-bold">AI</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-white border border-black p-1.5 text-xs group-hover:bg-[#F8F4FF] transition-colors">
                        <div className="font-bold mb-1">💡 Suggested:</div>
                        <div className="text-gray-700 mb-1.5">"Thanks! What should I cover next?"</div>
                        <button className="bg-[#7A3BFF] hover:bg-[#6A2BEF] text-white px-2 py-1 border border-black text-xs font-bold transition-colors">
                          💬 Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Middle Row: Analytics Overview */}
                <div className="bg-gradient-to-r from-[#FFF8E8] to-[#FFFBF0] border-2 border-black p-2.5 hover:scale-[1.01] transition-all">
                  <div className="text-xs font-bold text-gray-800 mb-1.5">PERFORMANCE METRICS</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="text-base font-bold text-[#FF6A4D] animate-pulse">2.3M</div>
                      <div className="text-xs text-gray-600">Views</div>
                      <div className="text-xs text-[#4ade80] font-bold">↗ +18%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-[#4DA6FF] animate-pulse" style={{animationDelay: '0.2s'}}>45.2K</div>
                      <div className="text-xs text-gray-600">Engagement</div>
                      <div className="text-xs text-[#4ade80] font-bold">↗ +24%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-[#7A3BFF] animate-pulse" style={{animationDelay: '0.4s'}}>1.8K</div>
                      <div className="text-xs text-gray-600">Comments</div>
                      <div className="text-xs text-[#4ade80] font-bold">↗ +12%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-[#990033] animate-pulse" style={{animationDelay: '0.6s'}}>89%</div>
                      <div className="text-xs text-gray-600">Retention</div>
                      <div className="text-xs text-[#4ade80] font-bold">↗ +6%</div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Row: Trend Analysis & SEO Insights */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Trend Analysis */}
                  <div className="bg-gradient-to-br from-[#E8F4FD] to-[#F0F8FE] border-2 border-black p-2.5 hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs font-bold text-gray-800">TREND ANALYSIS</div>
                      <div className="text-xs bg-[#4DA6FF] text-white px-1 py-0.5 border border-black font-bold">📈</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#FF6A4D] border border-black animate-ping"></div>
                        <div className="text-xs font-bold text-[#FF6A4D]">AI Tutorials</div>
                        <div className="text-xs text-gray-600">+340%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#C8FF3D] border border-black animate-ping" style={{animationDelay: '0.3s'}}></div>
                        <div className="text-xs font-bold text-[#7A3BFF]">React Hooks</div>
                        <div className="text-xs text-gray-600">+180%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#4DA6FF] border border-black animate-ping" style={{animationDelay: '0.6s'}}></div>
                        <div className="text-xs font-bold text-[#4DA6FF]">Web3</div>
                        <div className="text-xs text-gray-600">+120%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* SEO & Report Generation */}
                  <div className="bg-gradient-to-br from-[#FFF0E8] to-[#FFF8F0] border-2 border-black p-2.5 hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs font-bold text-gray-800">SEO INSIGHTS</div>
                      <div className="text-xs bg-[#FF6A4D] text-white px-1 py-0.5 border border-black font-bold animate-pulse">AUTO</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-700">Title Score</div>
                        <div className="text-xs font-bold text-[#4ade80]">A+ (95)</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-700">Tags Optimized</div>
                        <div className="text-xs font-bold text-[#4DA6FF]">12/15</div>
                      </div>
                      <div className="bg-white border border-black px-1.5 py-1 text-xs group-hover:bg-[#FFF8F0] transition-colors">
                        📊 Report Ready
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status Bar */}
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-black">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#4ade80] border border-black animate-pulse"></div>
                    <span className="font-bold text-gray-700">REAL-TIME ANALYTICS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-gray-600">Updated: 2s ago</div>
                    <div className="font-mono text-[#7A3BFF] animate-pulse">◆ LIVE ◆</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="bg-white py-20 border-t-4 border-b-4 border-black relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#C8FF3D] opacity-20 transform rotate-45"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-[#FF6A4D] opacity-20 transform rotate-12"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-[#4DA6FF] opacity-30 transform rotate-45"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block bg-black text-[#C8FF3D] px-6 py-2 border-4 border-black transform -rotate-2 mb-4">
              <span className="font-bold text-sm">THE PROBLEM</span>
            </div>
            <h2 className="font-bold text-4xl mb-4 text-black">Why Creators Need This</h2>
            <div className="w-24 h-1 bg-black mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#FF6A4D]">
              <CardHeader>
                <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Drowning in Comments?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white font-medium text-base">
                  We analyze sentiment so you don't waste hours scrolling through endless feedback.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#4DA6FF]">
              <CardHeader>
                <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Missing Trends?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white font-medium text-base">
                  AI spots emerging keywords and formats before they blow up everywhere.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#7A3BFF]">
              <CardHeader>
                <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center mb-4">
                  <Gauge className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Low Engagement?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white font-medium text-base">
                  Smart replies crafted in your voice boost interaction and build community.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#7A3BFF] text-white px-6 py-2 border-4 border-black transform rotate-2 mb-4">
              <span className="font-bold text-sm">THE SOLUTION</span>
            </div>
            <h2 className="font-bold text-4xl mb-4 text-black">What You Get</h2>
            <p className="text-xl text-gray-700 font-medium">Three powerful tools in your creator arsenal</p>
            <div className="flex justify-center gap-2 mt-4">
              <div className="w-4 h-4 bg-[#C8FF3D] border-2 border-black transform rotate-45"></div>
              <div className="w-4 h-4 bg-[#FF6A4D] border-2 border-black transform rotate-45"></div>
              <div className="w-4 h-4 bg-[#4DA6FF] border-2 border-black transform rotate-45"></div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-white">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-[#C8FF3D] border-4 border-black flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-bold">Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center font-medium">
                  AI-powered comment sentiment analysis with visual charts and confidence scores
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-white">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-[#FF6A4D] border-4 border-black flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-bold">AI Reply Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center font-medium">
                  Generate authentic replies to comments that match your voice and tone
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-white">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-[#4DA6FF] border-4 border-black flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-bold">Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center font-medium">
                  Detailed engagement metrics, SEO scores, and channel analytics
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white py-20 border-t-4 border-b-4 border-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl mb-4 text-black">Choose Your Creator Journey</h2>
            <p className="text-xl text-gray-700 font-medium">From hobbyist to pro creator - we've got you covered</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-white relative">
              <CardHeader className="text-center pb-8">
                <Badge className="bg-[#4DA6FF] text-white border-2 border-black font-bold text-sm mb-4 w-fit mx-auto">STARTER</Badge>
                <CardTitle className="text-3xl font-bold mb-2">Free</CardTitle>
                <div className="text-6xl font-bold text-black mb-4">₹0</div>
                <CardDescription className="text-lg font-medium text-gray-600">Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium">5 video analyses per month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium">Basic sentiment analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium">Comment overview</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-300 border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">✗</span>
                    </div>
                    <span className="font-medium text-gray-400">AI reply suggestions</span>
                  </div>
                </div>
                <Button className="w-full bg-[#4DA6FF] hover:bg-[#3D96FF] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold">
                  Try It Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#C8FF3D] relative transform scale-105">
              <div className="absolute -top-4 -right-4 bg-[#FF6A4D] border-4 border-black px-4 py-2 rotate-12">
                <span className="font-bold text-white text-sm">MOST POPULAR</span>
              </div>
              <CardHeader className="text-center pb-8">
                <Badge className="bg-black text-[#C8FF3D] border-2 border-black font-bold text-sm mb-4 w-fit mx-auto">PRO</Badge>
                <CardTitle className="text-3xl font-bold mb-2">Pro</CardTitle>
                <div className="text-6xl font-bold text-black mb-4">₹799</div>
                <CardDescription className="text-lg font-medium text-black/80">For serious creators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-black border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold text-[#C8FF3D]">✓</span>
                    </div>
                    <span className="font-medium text-black">Unlimited video analyses</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-black border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold text-[#C8FF3D]">✓</span>
                    </div>
                    <span className="font-medium text-black">Advanced sentiment analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-black border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold text-[#C8FF3D]">✓</span>
                    </div>
                    <span className="font-medium text-black">AI reply generation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-black border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold text-[#C8FF3D]">✓</span>
                    </div>
                    <span className="font-medium text-black">Performance metrics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-black border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold text-[#C8FF3D]">✓</span>
                    </div>
                    <span className="font-medium text-black">YouTube Analytics integration</span>
                  </div>
                </div>
                <Button className="w-full bg-black hover:bg-gray-800 text-[#C8FF3D] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold">
                  Start Pro Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#7A3BFF] relative">
              <CardHeader className="text-center pb-8">
                <Badge className="bg-white text-[#7A3BFF] border-2 border-black font-bold text-sm mb-4 w-fit mx-auto">ENTERPRISE</Badge>
                <CardTitle className="text-3xl font-bold mb-2 text-white">Enterprise</CardTitle>
                <div className="text-6xl font-bold text-white mb-4">₹7,999</div>
                <CardDescription className="text-lg font-medium text-white/80">For creator teams & agencies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium text-white">Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium text-white">Multi-channel management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium text-white">Team collaboration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium text-white">Advanced reporting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span className="font-medium text-white">Priority support</span>
                  </div>
                </div>
                <Button className="w-full bg-white hover:bg-gray-100 text-[#7A3BFF] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="bg-[#FF6A4D] border-4 border-black p-6 inline-block transform rotate-1 hover:rotate-0 transition-transform">
              <p className="font-bold text-white text-lg">🔥 Limited Time: Get 2 months FREE with yearly plans!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Teaser Output */}
      <section className="bg-black py-20 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
            {[...Array(144)].map((_, i) => (
              <div key={i} className="border border-white"></div>
            ))}
          </div>
        </div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-6 w-10 h-10 bg-[#C8FF3D] transform rotate-45 animate-pulse"></div>
        <div className="absolute bottom-20 right-6 w-8 h-8 bg-[#FF6A4D] transform rotate-12 animate-pulse"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border-4 border-white p-8 mb-8 transform -rotate-1 hover:rotate-0 transition-transform relative">
              {/* Monitor-style design */}
              <div className="absolute top-2 left-2 flex gap-2">
                <div className="w-3 h-3 bg-[#FF6A4D] border border-black rounded-full"></div>
                <div className="w-3 h-3 bg-[#C8FF3D] border border-black rounded-full"></div>
                <div className="w-3 h-3 bg-[#4DA6FF] border border-black rounded-full"></div>
              </div>
              
              <div className="mt-6 grid md:grid-cols-3 gap-6 text-black">
                <div className="space-y-2 group">
                  <div className="text-3xl font-bold text-[#C8FF3D] bg-black p-2 border-4 border-black transform group-hover:scale-110 transition-transform">92%</div>
                  <div className="font-bold">Positive Sentiment</div>
                  <div className="text-xs text-gray-600">↗ +12% this week</div>
                </div>
                <div className="space-y-2 group">
                  <div className="text-3xl font-bold text-[#FF6A4D] bg-black p-2 border-4 border-black transform group-hover:scale-110 transition-transform">+156%</div>
                  <div className="font-bold">Engagement Boost</div>
                  <div className="text-xs text-gray-600">↗ +28% this month</div>
                </div>
                <div className="space-y-2 group">
                  <div className="text-3xl font-bold text-[#4DA6FF] bg-black p-2 border-4 border-black transform group-hover:scale-110 transition-transform">2.3M</div>
                  <div className="font-bold">Views Analyzed</div>
                  <div className="text-xs text-gray-600">↗ Real-time data</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="inline-block bg-[#7A3BFF] px-6 py-2 border-4 border-white transform rotate-1">
                <span className="font-bold text-sm">LIVE DASHBOARD</span>
              </div>
              <h3 className="text-4xl font-bold mb-4">Your Creator Control Room</h3>
              <p className="text-xl font-medium opacity-90">Real insights. Real results. Really fast.</p>
              
              {/* ASCII Art accent */}
              <div className="font-mono text-[#C8FF3D] text-sm">
                ◆ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ◆
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section id="testimonials" className="py-20 bg-gradient-to-r from-purple-200 via-pink-200 to-orange-200 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl mb-4 text-black">Creators Love SentimentTrack</h2>
            <p className="text-xl text-gray-700 font-medium">Don't just take our word for it</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <Card className="border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-white transform rotate-1 hover:rotate-0">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-[#C8FF3D] border-4 border-black flex items-center justify-center font-bold text-2xl">
                    R
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Rahul Sharma</CardTitle>
                    <CardDescription className="font-medium">Tech Reviewer • 45K subs</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-[#FF6A4D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold text-white">★</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-lg font-medium text-gray-800 italic">
                  "SentimentTrack helps me understand my audience better. The sentiment analysis saves me hours of reading comments!"
                </blockquote>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#4DA6FF] transform -rotate-1 hover:rotate-0">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center font-bold text-2xl">
                    P
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">Priya Patel</CardTitle>
                    <CardDescription className="font-medium text-white/90">Lifestyle Vlogger • 32K subs</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">★</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-lg font-medium text-white italic">
                  "The AI reply feature is amazing! It helps me respond to comments faster while maintaining my personal touch."
                </blockquote>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-[#FF6A4D] transform rotate-1 hover:rotate-0">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center font-bold text-2xl">
                    A
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">Arjun Kumar</CardTitle>
                    <CardDescription className="font-medium text-white/90">Gaming Creator • 78K subs</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-[#C8FF3D] border-2 border-black flex items-center justify-center">
                      <span className="text-xs font-bold">★</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-lg font-medium text-white italic">
                  "The analytics dashboard gives me insights I never had before. Perfect for understanding my gaming audience!"
                </blockquote>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-16 grid md:grid-cols-4 gap-6 text-center">
            <div className="bg-white border-4 border-black p-6 transform hover:scale-105 transition-transform">
              <div className="text-4xl font-bold text-[#7A3BFF] mb-2">500+</div>
              <div className="font-bold text-gray-800">Active Creators</div>
            </div>
            <div className="bg-white border-4 border-black p-6 transform hover:scale-105 transition-transform">
              <div className="text-4xl font-bold text-[#FF6A4D] mb-2">10K+</div>
              <div className="font-bold text-gray-800">Videos Analyzed</div>
            </div>
            <div className="bg-white border-4 border-black p-6 transform hover:scale-105 transition-transform">
              <div className="text-4xl font-bold text-[#C8FF3D] mb-2">50K+</div>
              <div className="font-bold text-gray-800">Comments Processed</div>
            </div>
            <div className="bg-white border-4 border-black p-6 transform hover:scale-105 transition-transform">
              <div className="text-4xl font-bold text-[#4DA6FF] mb-2">24/7</div>
              <div className="font-bold text-gray-800">AI Assistance</div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 text-center">
            <div className="inline-flex gap-6 items-center flex-wrap justify-center">
              <div className="bg-black text-[#C8FF3D] px-6 py-3 border-4 border-black font-bold transform rotate-1">
                ✓ Data Secure
              </div>
              <div className="bg-black text-[#FF6A4D] px-6 py-3 border-4 border-black font-bold transform -rotate-1">
                ✓ Official YouTube API
              </div>
              <div className="bg-black text-[#4DA6FF] px-6 py-3 border-4 border-black font-bold transform rotate-1">
                ✓ 99.9% Uptime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#C8FF3D] py-20 border-t-4 border-b-4 border-black">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="font-bold text-5xl text-black leading-tight">
              Stop guessing.<br />Start creating with data.
            </h2>
            <p className="text-xl text-black/80 font-medium">
              Join thousands of creators who've already leveled up their content game.
            </p>
            <ConnectAccountButton
              size="lg" 
              className="bg-black hover:bg-gray-800 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-xl px-12 py-8"
              unauthenticatedText="Connect Your Account"
            />
            <div className="flex justify-center gap-4">
              <Badge className="bg-white text-black border-2 border-black font-bold">Early Access</Badge>
              <Badge className="bg-white text-black border-2 border-black font-bold">No Credit Card</Badge>
              <Badge className="bg-white text-black border-2 border-black font-bold">Simple Setup</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t-4 border-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="font-bold text-2xl">
              <span className="text-white">Sentiment</span>
              <span className="text-[#C8FF3D]">Track</span>
            </div>
            <nav className="flex gap-8">
              <a href="#docs" className="hover:text-[#C8FF3D] transition-colors font-medium">Docs</a>
              <a href="#pricing" className="hover:text-[#C8FF3D] transition-colors font-medium">Pricing</a>
              <a href="#status" className="hover:text-[#C8FF3D] transition-colors font-medium">Status</a>
              <a href="#contact" className="hover:text-[#C8FF3D] transition-colors font-medium">Contact</a>
            </nav>
            <div className="text-center md:text-right">
              <div className="text-[#C8FF3D] font-mono text-sm">◆ ◇ ◆</div>
              <div className="text-sm opacity-70 mt-1">Built for creators, by creators</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
