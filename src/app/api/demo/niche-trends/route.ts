import { NextRequest, NextResponse } from 'next/server';

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

// Category mapping
const CATEGORY_NAMES: Record<string, string> = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles', 
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology'
};

// Common trending patterns by category
const CATEGORY_TRENDS: Record<string, string[]> = {
  '20': ['gameplay', 'walkthrough', 'review', 'guide', 'tips', 'tricks', 'speedrun', 'reaction'],
  '27': ['tutorial', 'explained', 'course', 'learn', 'beginner', 'advanced', 'step by step'],
  '28': ['review', 'unboxing', 'comparison', 'vs', 'best', 'worst', '2024', '2025'],
  '26': ['diy', 'makeup', 'fashion', 'style', 'outfit', 'haul', 'transformation'],
  '24': ['reaction', 'review', 'funny', 'fails', 'moments', 'compilation', 'behind scenes'],
  '10': ['cover', 'remix', 'official', 'music video', 'live', 'acoustic', 'instrumental']
};

export async function POST(request: NextRequest) {
  try {
    const { videoData } = await request.json();
    
    if (!videoData?.category) {
      return NextResponse.json(
        { error: 'Video data with category is required' },
        { status: 400 }
      );
    }

    const categoryId = videoData.category;
    const categoryName = CATEGORY_NAMES[categoryId] || 'Unknown Category';
    
    // Analyze trending hashtags and keywords for the niche
    const analysis = await analyzeHashtagsAndKeywords(videoData, categoryId, categoryName);

    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'public, max-age=1800', // 30 minutes cache for trends
      },
    });

  } catch (error) {
    console.error('Niche Trends API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze niche trends',
        details: error instanceof Error ? error.message : 'Unknown error',
        categoryId: request.url
      },
      { status: 500 }
    );
  }
}

async function analyzeHashtagsAndKeywords(videoData: any, categoryId: string, categoryName: string): Promise<NicheAnalysis> {
  try {
    // Step 1: Extract current video's content
    const title = videoData.title || '';
    const description = videoData.description || '';
    const tags = videoData.tags || [];
    
    // Extract hashtags from description
    const hashtagRegex = /#[\w]+/g;
    const currentHashtags = (description.match(hashtagRegex) || []).map((h: string) => h.toLowerCase());
    
    // Extract keywords from title and description
    const currentKeywords = extractKeywords(`${title} ${description}`);
    
    // Step 2: Detect video niche using AI-like analysis
    const detectedNiche = detectVideoNiche(title, description, tags);
    console.log('Detected niche:', detectedNiche);
    
    // Step 3: Get trending hashtags and keywords in this niche
    const trendingData = await getTrendingHashtagsInNiche(categoryId, detectedNiche);
    
    // Step 4: Analyze gaps between current and trending
    const trendingHashtags: HashtagStatus[] = trendingData.hashtags.map((hashtag: string, index: number) => ({
      hashtag,
      status: currentHashtags.includes(hashtag.toLowerCase()) ? 'present' : 'missing',
      frequency: trendingData.frequencies[hashtag] || 0,
      searchVolume: 100 - index * 5, // Simulated search volume
      competition: index < 3 ? 'high' : index < 8 ? 'medium' : 'low'
    }));
    
    const keywordGaps: KeywordAnalysis[] = trendingData.keywords.map((keyword: string, index: number) => {
      const inTitle = title.toLowerCase().includes(keyword.toLowerCase());
      const inDescription = description.toLowerCase().includes(keyword.toLowerCase());
      const inTags = tags.some((tag: string) => tag.toLowerCase().includes(keyword.toLowerCase()));
      
      return {
        keyword,
        status: inTitle || inDescription || inTags ? 'present' : 'missing',
        inTitle,
        inDescription,
        inTags,
        trendingScore: 100 - index * 5
      };
    });
    
    // Step 5: Generate meaningful recommendations (filter out generic/useless ones)
    const meaningfulHashtags = trendingHashtags.filter(h => 
      h.status === 'missing' && 
      h.hashtag.length > 4 && 
      !h.hashtag.includes('what') && 
      !h.hashtag.includes('the') &&
      h.frequency > 2 // Only suggest hashtags that appear multiple times
    );
    
    const meaningfulKeywords = keywordGaps.filter(k => 
      k.status === 'missing' && 
      k.keyword.length > 4 && 
      !isGenericWord(k.keyword) && 
      !isProperNoun(k.keyword) &&
      k.trendingScore > 50 // Only high-value keywords
    );
    
    const recommendations = {
      addHashtags: meaningfulHashtags.slice(0, 5).map(h => h.hashtag),
      addKeywords: meaningfulKeywords.slice(0, 5).map(k => k.keyword),
      titleImprovements: generateTitleSuggestions(title, meaningfulKeywords.slice(0, 2).map(k => k.keyword)),
      descriptionImprovements: generateDescriptionSuggestions(description, meaningfulHashtags.slice(0, 3).map(h => h.hashtag))
    };
    
    // Step 6: Calculate stats
    const stats = {
      hashtagsPresent: trendingHashtags.filter(h => h.status === 'present').length,
      hashtagsMissing: meaningfulHashtags.length,
      keywordsOptimized: keywordGaps.filter(k => k.status === 'present').length,
      totalOpportunities: meaningfulHashtags.length + meaningfulKeywords.length
    };
    
    return {
      videoId: videoData.id,
      detectedNiche,
      categoryId,
      categoryName,
      currentHashtags,
      currentKeywords,
      trendingHashtags,
      keywordGaps,
      recommendations,
      stats
    };
    
  } catch (error) {
    console.error('Error analyzing hashtags and keywords:', error);
    return createFallbackAnalysis(videoData, categoryId, categoryName);
  }
}

// Helper function to extract meaningful keywords from text
function extractKeywords(text: string): string[] {
  return text.toLowerCase()
    .split(/\s+/)
    .filter((word: string) => word.length > 4 && !isCommonWord(word) && !isProperNoun(word) && !isGenericWord(word))
    .map((word: string) => word.replace(/[^\w]/g, ''))
    .filter((word: string) => word.length > 0);
}

// Filter out proper nouns (names) and generic words
function isProperNoun(word: string): boolean {
  const properNouns = new Set([
    'abdul', 'kalam', 'einstein', 'steve', 'jobs', 'gates', 'musk', 'bezos', 'youtube', 'google', 'facebook', 'twitter', 'instagram',
    'tesla', 'apple', 'microsoft', 'amazon', 'netflix', 'disney', 'samsung', 'sony', 'nike', 'adidas', 'coca', 'pepsi'
  ]);
  return properNouns.has(word.toLowerCase()) || /^[A-Z][a-z]+$/.test(word);
}

// Filter out generic/useless words
function isGenericWord(word: string): boolean {
  const genericWords = new Set([
    'what', 'where', 'when', 'which', 'while', 'there', 'here', 'then', 'than', 'them', 'this', 'that', 'these', 'those',
    'some', 'many', 'much', 'more', 'most', 'such', 'same', 'other', 'each', 'every', 'both', 'either', 'neither',
    'first', 'last', 'next', 'previous', 'new', 'old', 'good', 'bad', 'big', 'small', 'long', 'short', 'high', 'low',
    'part', 'place', 'time', 'year', 'day', 'week', 'month', 'thing', 'way', 'life', 'world', 'people', 'person'
  ]);
  return genericWords.has(word.toLowerCase());
}

// AI-like niche detection based on content analysis
function detectVideoNiche(title: string, description: string, tags: string[]): string {
  const content = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
  
  // Define niche patterns
  const niches = {
    'finance': ['money', 'finance', 'investment', 'wealth', 'income', 'profit', 'business', 'entrepreneur', 'trading', 'crypto', 'bitcoin', 'financial', 'passive', 'revenue'],
    'technology': ['technology', 'software', 'programming', 'coding', 'artificial', 'intelligence', 'development', 'computer', 'application', 'innovation', 'digital'],
    'education': ['tutorial', 'learning', 'course', 'lesson', 'explained', 'guide', 'education', 'study', 'knowledge', 'skills', 'training', 'teaching'],
    'gaming': ['gaming', 'gameplay', 'walkthrough', 'speedrun', 'esports', 'streaming', 'competitive', 'strategy', 'multiplayer'],
    'lifestyle': ['lifestyle', 'vlog', 'daily', 'routine', 'fashion', 'style', 'travel', 'food', 'wellness', 'motivation', 'inspiration'],
    'fitness': ['workout', 'fitness', 'exercise', 'health', 'nutrition', 'muscle', 'training', 'bodybuilding', 'strength', 'cardio'],
    'entertainment': ['funny', 'comedy', 'reaction', 'review', 'movie', 'music', 'celebrity', 'entertainment', 'viral', 'trending'],
    'motivation': ['motivation', 'inspiration', 'success', 'goals', 'achievement', 'mindset', 'productivity', 'personal', 'growth', 'leadership']
  };
  
  let maxScore = 0;
  let detectedNiche = 'general';
  
  for (const [niche, keywords] of Object.entries(niches)) {
    const score = keywords.filter(keyword => content.includes(keyword)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedNiche = niche;
    }
  }
  
  return detectedNiche;
}

// Get trending hashtags and keywords for a specific niche
async function getTrendingHashtagsInNiche(categoryId: string, niche: string) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return createFallbackTrendingData(niche);
    }

    // Search for trending videos in this niche
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` + new URLSearchParams({
      part: 'snippet',
      type: 'video',
      q: niche,
      videoCategoryId: categoryId,
      order: 'relevance',
      maxResults: '30',
      key: apiKey
    });

    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error('YouTube API error for trending data:', response.status);
      return createFallbackTrendingData(niche);
    }

    const data = await response.json();
    const videos = data.items || [];

    // Extract hashtags and keywords
    const hashtags = new Set<string>();
    const keywords = new Set<string>();
    const frequencies: Record<string, number> = {};

    for (const video of videos) {
      const title = video.snippet.title || '';
      const description = video.snippet.description || '';
      
      // Extract hashtags from description
      const videoHashtags = description.match(/#[\w]+/g) || [];
      videoHashtags.forEach((tag: string) => {
        const cleanTag = tag.toLowerCase();
        hashtags.add(cleanTag);
        frequencies[cleanTag] = (frequencies[cleanTag] || 0) + 1;
      });
      
      // Extract keywords from title
      const titleKeywords = extractKeywords(title);
      titleKeywords.forEach((keyword: string) => {
        if (keyword.length > 3) {
          keywords.add(keyword);
          frequencies[keyword] = (frequencies[keyword] || 0) + 1;
        }
      });
    }

    return {
      hashtags: Array.from(hashtags).slice(0, 15),
      keywords: Array.from(keywords).slice(0, 15),
      frequencies
    };

  } catch (error) {
    console.error('Error getting trending hashtags:', error);
    return createFallbackTrendingData(niche);
  }
}

// Create fallback trending data when API fails
function createFallbackTrendingData(niche: string) {
  const nicheHashtags: Record<string, string[]> = {
    'finance': ['#money', '#finance', '#investment', '#wealth', '#business', '#entrepreneur', '#trading', '#crypto', '#bitcoin', '#financialfreedom'],
    'technology': ['#tech', '#programming', '#coding', '#ai', '#machinelearning', '#software', '#development', '#innovation', '#startup', '#digital'],
    'education': ['#education', '#learning', '#tutorial', '#howto', '#study', '#knowledge', '#skills', '#course', '#lesson', '#explained'],
    'gaming': ['#gaming', '#gameplay', '#gamer', '#esports', '#stream', '#twitch', '#youtube', '#game', '#walkthrough', '#speedrun'],
    'lifestyle': ['#lifestyle', '#vlog', '#daily', '#routine', '#motivation', '#inspiration', '#life', '#personal', '#selfcare', '#mindfulness'],
    'fitness': ['#fitness', '#workout', '#gym', '#health', '#exercise', '#nutrition', '#muscle', '#training', '#bodybuilding', '#wellness'],
    'entertainment': ['#entertainment', '#funny', '#comedy', '#reaction', '#review', '#movie', '#music', '#celebrity', '#viral', '#trending'],
    'motivation': ['#motivation', '#inspiration', '#success', '#goals', '#mindset', '#productivity', '#leadership', '#growth', '#achievement', '#hustle']
  };
  
  const nicheKeywords: Record<string, string[]> = {
    'finance': ['investment', 'profitable', 'income', 'wealth', 'business', 'entrepreneur', 'trading', 'passive', 'financial', 'revenue'],
    'technology': ['programming', 'software', 'coding', 'development', 'innovation', 'digital', 'algorithm', 'automation', 'artificial', 'intelligence'],
    'education': ['tutorial', 'learning', 'comprehensive', 'beginner', 'advanced', 'complete', 'masterclass', 'training', 'certification', 'skills'],
    'gaming': ['gameplay', 'walkthrough', 'strategy', 'competitive', 'multiplayer', 'streaming', 'esports', 'professional', 'tournament', 'championship'],
    'lifestyle': ['productive', 'healthy', 'wellness', 'routine', 'habits', 'mindfulness', 'balanced', 'organized', 'efficient', 'sustainable'],
    'fitness': ['workout', 'exercise', 'training', 'strength', 'cardio', 'nutrition', 'healthy', 'muscle', 'endurance', 'performance'],
    'entertainment': ['hilarious', 'amazing', 'incredible', 'epic', 'trending', 'viral', 'must-watch', 'entertaining', 'captivating', 'engaging'],
    'motivation': ['inspiring', 'motivational', 'successful', 'achievement', 'goals', 'mindset', 'productivity', 'leadership', 'growth', 'transformation']
  };
  
  const hashtags = nicheHashtags[niche] || nicheHashtags['general'] || ['#trending', '#viral', '#youtube', '#content', '#creator'];
  const keywords = nicheKeywords[niche] || nicheKeywords['general'] || ['trending', 'viral', 'popular', 'best', 'amazing'];
  
  const frequencies: Record<string, number> = {};
  hashtags.forEach((tag, index) => { frequencies[tag] = 15 - index; });
  keywords.forEach((keyword, index) => { frequencies[keyword] = 15 - index; });
  
  return { hashtags, keywords, frequencies };
}

// Generate title improvement suggestions
function generateTitleSuggestions(currentTitle: string, missingKeywords: string[]): string[] {
  const suggestions: string[] = [];
  
  // Only suggest meaningful keywords (filter out generic ones)
  const meaningfulKeywords = missingKeywords.filter(keyword => 
    keyword.length > 4 && 
    !isGenericWord(keyword) && 
    !isProperNoun(keyword)
  );
  
  if (meaningfulKeywords.length > 0) {
    suggestions.push(`Add trending keyword "${meaningfulKeywords[0]}" to title for better discovery`);
  }
  
  if (currentTitle.length < 40) {
    suggestions.push('Title is too short - aim for 50-60 characters for optimal SEO');
  }
  
  if (currentTitle.length > 70) {
    suggestions.push('Title is too long - keep under 70 characters to avoid truncation');
  }
  
  if (!currentTitle.includes('|') && !currentTitle.includes('-')) {
    suggestions.push('Consider adding descriptive subtitle with "|" or "-" separator');
  }
  
  return suggestions;
}

// Generate description improvement suggestions  
function generateDescriptionSuggestions(currentDescription: string, missingHashtags: string[]): string[] {
  const suggestions: string[] = [];
  
  if (missingHashtags.length > 0) {
    suggestions.push(`Add trending hashtags: ${missingHashtags.slice(0, 3).join(' ')} to boost discoverability`);
  }
  
  if (currentDescription.length < 200) {
    suggestions.push('Description is too short - aim for 200+ words with detailed information');
  }
  
  const hashtagCount = (currentDescription.match(/#[\w]+/g) || []).length;
  if (hashtagCount < 5) {
    suggestions.push(`Add more hashtags (currently ${hashtagCount}, aim for 8-12 relevant hashtags)`);
  }
  
  if (!currentDescription.includes('http')) {
    suggestions.push('Consider adding links to your website or social media');
  }
  
  return suggestions;
}

// Create fallback analysis when main analysis fails
function createFallbackAnalysis(videoData: any, categoryId: string, categoryName: string): NicheAnalysis {
  const fallbackPatterns = CATEGORY_TRENDS[categoryId] || ['tutorial', 'guide', 'tips', 'review'];
  
  return {
    videoId: videoData.id,
    detectedNiche: 'general',
    categoryId,
    categoryName,
    currentHashtags: [],
    currentKeywords: [],
    trendingHashtags: fallbackPatterns.slice(0, 8).map((hashtag, index) => ({
      hashtag: `#${hashtag}`,
      status: 'missing',
      frequency: 10 - index,
      searchVolume: 100 - index * 10,
      competition: index < 3 ? 'high' : index < 6 ? 'medium' : 'low'
    })),
    keywordGaps: fallbackPatterns.slice(0, 8).map((keyword, index) => ({
      keyword,
      status: 'missing',
      inTitle: false,
      inDescription: false,
      inTags: false,
      trendingScore: 100 - index * 10
    })),
    recommendations: {
      addHashtags: fallbackPatterns.slice(0, 5).map(p => `#${p}`),
      addKeywords: fallbackPatterns.slice(0, 5),
      titleImprovements: ['Add descriptive keywords to title'],
      descriptionImprovements: ['Add relevant hashtags to description']
    },
    stats: {
      hashtagsPresent: 0,
      hashtagsMissing: 8,
      keywordsOptimized: 0,
      totalOpportunities: 16
    }
  };
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'a', 'an', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);
  return commonWords.has(word.toLowerCase());
}