import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  ThumbsUp, 
  Reply, 
  Edit3, 
  Send, 
  Copy,
  MoreHorizontal,
  Heart,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { CommentData } from '@/types';
import { CommentSkeleton } from './SkeletonLoaders';

interface CommentAnalysisProps {
  videoId?: string;
  videoTitle?: string;
  videoContext?: string;
  comments?: CommentData[];
  sentimentDistribution?: {
    positive: { count: number; percentage: string };
    neutral: { count: number; percentage: string };
    negative: { count: number; percentage: string };
  };
  loading?: boolean;
  onLoadComments?: (videoId: string) => void;
}

interface CommentItemProps {
  comment: CommentData;
  videoId: string;
  videoTitle: string;
  videoContext: string;
  onReplyPosted?: () => void;
}

function CommentItem({ comment, videoId, videoTitle, videoContext, onReplyPosted }: CommentItemProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [generatedReply, setGeneratedReply] = useState('');
  const [customReply, setCustomReply] = useState('');
  const [replyTone, setReplyTone] = useState<'friendly' | 'professional' | 'casual'>('friendly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [replyStatus, setReplyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  const [hasAuthorReply, setHasAuthorReply] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Check for existing replies when component mounts
  useEffect(() => {
    if (comment.id) {
      fetchReplies();
    }
  }, [comment.id]);

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const response = await fetch(`/api/youtube/comment-replies?commentId=${comment.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.replies) {
          setReplies(data.data.replies);
          
          // Check if there's an author reply
          const hasReply = data.data.replies.length > 0;
          setHasAuthorReply(hasReply);
          
          if (hasReply) {
            setReplyStatus('success');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const getSentimentColor = (sentiment: string | undefined) => {
    switch (sentiment) {
      case 'positive': return 'bg-[#C8FF3D] text-black';
      case 'negative': return 'bg-[#FF6A4D] text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getSentimentIcon = (sentiment: string | undefined) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  const generateReply = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          commentId: comment.id,
          commentText: comment.textDisplay,
          videoTitle,
          videoDescription: videoContext,
          transcript: videoContext, // Use video context as transcript fallback
          channelTitle: videoTitle, // Fallback channel title
          replyTone
        })
      });

      const data = await response.json();
      if (data.success) {
        const reply = data.data.reply || '';
        setGeneratedReply(reply);
        setCustomReply(reply);
        setShowPreview(true);
      } else {
        console.error('Failed to generate reply:', data.error);
      }
    } catch (error) {
      console.error('Error generating reply:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const postReply = async () => {
    if (!customReply || !customReply.trim()) return;

    setIsPosting(true);
    setReplyStatus('idle');
    
    try {
      const response = await fetch('/api/youtube/comment-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          commentId: comment.id,
          commentText: comment.textDisplay,
          videoTitle,
          videoDescription: videoContext,
          transcript: videoContext,
          channelTitle: videoTitle,
          customReply: customReply.trim(),
          replyTone
        })
      });

      const data = await response.json();
      if (data.success) {
        setReplyStatus('success');
        setHasAuthorReply(true);
        setShowReplyBox(false);
        setCustomReply('');
        setGeneratedReply('');
        setShowPreview(false);
        
        // Refresh replies to show the new reply
        await fetchReplies();
        onReplyPosted?.();
      } else {
        setReplyStatus('error');
        console.error('Failed to post reply:', data.error);
      }
    } catch (error) {
      setReplyStatus('error');
      console.error('Error posting reply:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const copyReply = () => {
    navigator.clipboard.writeText(customReply);
  };

  const getTimeElapsed = (publishedAt: string): string => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now.getTime() - published.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Recently';
  };

  return (
    <div className="border-2 border-black p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all group">
      <div className="flex items-start gap-4">
        {/* Profile Avatar */}
        <div className="w-12 h-12 border-4 border-black overflow-hidden bg-gradient-to-br from-[#7A3BFF] to-[#9D5BFF] flex items-center justify-center">
          {comment.authorProfileImageUrl ? (
            <img 
              src={comment.authorProfileImageUrl} 
              alt={comment.authorDisplayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-bold text-white text-lg">
              {comment.authorDisplayName[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1">
          {/* Comment Header */}
          <div className="flex items-center gap-3 mb-3">
            <h5 className="font-bold text-black">{comment.authorDisplayName}</h5>
            <Badge className={`border-2 border-black font-bold text-xs ${getSentimentColor(comment.sentiment)}`}>
              {getSentimentIcon(comment.sentiment)} {comment.sentiment?.toUpperCase() || 'NEUTRAL'}
            </Badge>
            <span className="text-sm text-gray-500 font-medium">{getTimeElapsed(comment.publishedAt)}</span>
            
            {/* Reply Status Badge */}
            {(hasAuthorReply || replies.length > 0) && (
              <Badge className="bg-green-100 text-green-800 border-2 border-green-600 font-bold text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {replies.length} REPLIES
              </Badge>
            )}
          </div>

          {/* Comment Text */}
          <p className="text-gray-800 font-medium leading-relaxed mb-4">
            {comment.textDisplay}
          </p>

          {/* Comment Stats */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ThumbsUp className="w-4 h-4" />
              {comment.likeCount || 0} likes
            </div>
            <span className="text-sm text-gray-500">
              Confidence: {((comment.confidence || 0.5) * 100).toFixed(0)}%
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold"
            >
              <Reply className="w-4 h-4 mr-2" />
              {showReplyBox ? 'Cancel' : 'Reply'}
            </Button>

            {replyStatus === 'error' && (
              <span className="text-red-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Failed to post
              </span>
            )}
          </div>

          {/* Reply Box */}
          {showReplyBox && (
            <div className="mt-6 p-4 bg-gradient-to-r from-[#F8F4FF] to-[#F0F8FE] border-4 border-black">
              <div className="space-y-4">
                {/* Tone Selection */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-black">Tone:</span>
                  {(['friendly', 'professional', 'casual'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setReplyTone(tone)}
                      className={`px-3 py-1 text-xs font-bold border-2 border-black transition-all ${
                        replyTone === tone 
                          ? 'bg-[#7A3BFF] text-white' 
                          : 'bg-white text-black hover:bg-gray-50'
                      }`}
                    >
                      {tone.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* AI Generate Button */}
                <Button
                  size="sm"
                  onClick={generateReply}
                  disabled={isGenerating}
                  className="bg-[#7A3BFF] text-white border-2 border-black font-bold hover:bg-[#6A2BEF]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Generate AI Reply
                    </>
                  )}
                </Button>

                {/* Reply Text Area */}
                <div className="relative">
                  <textarea
                    value={customReply || ''}
                    onChange={(e) => setCustomReply(e.target.value)}
                    placeholder="Write your reply or generate one with AI..."
                    className={`w-full p-3 border-4 border-black font-medium resize-none h-24 focus:outline-none focus:bg-yellow-50 ${
                      showPreview ? 'bg-[#C8FF3D]/10 border-[#C8FF3D]' : ''
                    }`}
                  />
                  
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    size="sm"
                    onClick={postReply}
                    disabled={!customReply || !customReply.trim() || isPosting}
                    className="bg-[#C8FF3D] text-black border-2 border-black font-bold hover:bg-[#B8EF2D]"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post Reply
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyReply}
                    disabled={!customReply || !customReply.trim()}
                    className="border-2 border-black font-bold"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>

                  {showPreview && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCustomReply('');
                        setShowPreview(false);
                        setGeneratedReply('');
                      }}
                      className="border-2 border-red-500 text-red-600 hover:bg-red-50 font-bold"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Status Messages */}
                {replyStatus === 'success' && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-500 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Reply posted successfully!</span>
                  </div>
                )}
                
                {replyStatus === 'error' && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-500 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Failed to post reply. Please try again.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Replies Section */}
          {replies.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h6 className="font-bold text-sm text-gray-700">
                  💬 Replies ({replies.length})
                </h6>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReplies(!showReplies)}
                  className="border-2 border-gray-300 text-xs font-bold"
                >
                  {showReplies ? 'Hide' : 'Show'} Replies
                </Button>
              </div>
              
              {showReplies && (
                <div className="ml-6 border-l-4 border-gray-200 pl-6 space-y-4">
                  {replies.map((reply, index) => (
                    <div key={reply.id || index} className="p-4 bg-gray-50 border-2 border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 border-2 border-black overflow-hidden bg-gradient-to-br from-[#7A3BFF] to-[#9D5BFF] flex items-center justify-center">
                          {reply.authorProfileImageUrl ? (
                            <img 
                              src={reply.authorProfileImageUrl} 
                              alt={reply.authorDisplayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-white text-xs">
                              {reply.authorDisplayName?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h6 className="font-bold text-sm text-black">{reply.authorDisplayName}</h6>
                            {reply.authorChannelId && (
                              <Badge className="bg-blue-100 text-blue-800 border-2 border-blue-300 font-bold text-xs">
                                👑 AUTHOR
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{getTimeElapsed(reply.publishedAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {reply.textDisplay}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <ThumbsUp className="w-3 h-3" />
                              {reply.likeCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentAnalysis({ 
  videoId, 
  videoTitle = '', 
  videoContext = '', 
  comments = [], 
  sentimentDistribution,
  loading,
  onLoadComments 
}: CommentAnalysisProps) {
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const filteredComments = selectedSentiment === 'all' 
    ? comments 
    : comments.filter(comment => comment.sentiment === selectedSentiment);

  useEffect(() => {
    if (videoId && onLoadComments) {
      onLoadComments(videoId);
    }
  }, [videoId, onLoadComments, refreshKey]);

  const handleCommentRefresh = () => {
    setRefreshKey(prev => prev + 1);
    if (videoId && onLoadComments) {
      onLoadComments(videoId);
    }
  };

  if (loading) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
          <CardTitle className="text-xl font-bold text-black">💬 Loading Comments...</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comments.length) {
    return (
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
          <CardTitle className="text-xl font-bold text-black">💬 Comment Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No comments available for analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardHeader className="bg-gradient-to-r from-[#F3E8FF] to-[#E8F4FD] border-b-4 border-black">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-black">💬 Comment Analysis</CardTitle>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCommentRefresh}
              className="border-2 border-black font-bold hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Badge className="bg-[#C8FF3D] text-black border-2 border-black font-bold">
              {comments.length} COMMENTS
            </Badge>
          </div>
        </div>

        {/* Sentiment Distribution */}
        {sentimentDistribution && (
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-bold text-black">Filter by sentiment:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSentiment('all')}
                className={`px-3 py-1 text-xs font-bold border-2 border-black transition-all ${
                  selectedSentiment === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                ALL ({comments.length})
              </button>
              <button
                onClick={() => setSelectedSentiment('positive')}
                className={`px-3 py-1 text-xs font-bold border-2 border-black transition-all ${
                  selectedSentiment === 'positive' ? 'bg-[#C8FF3D] text-black' : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                😊 POSITIVE ({sentimentDistribution.positive.count})
              </button>
              <button
                onClick={() => setSelectedSentiment('neutral')}
                className={`px-3 py-1 text-xs font-bold border-2 border-black transition-all ${
                  selectedSentiment === 'neutral' ? 'bg-gray-200 text-black' : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                😐 NEUTRAL ({sentimentDistribution.neutral.count})
              </button>
              <button
                onClick={() => setSelectedSentiment('negative')}
                className={`px-3 py-1 text-xs font-bold border-2 border-black transition-all ${
                  selectedSentiment === 'negative' ? 'bg-[#FF6A4D] text-white' : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                😔 NEGATIVE ({sentimentDistribution.negative.count})
              </button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {filteredComments.map((comment, index) => (
            <div key={comment.id} className={index < filteredComments.length - 1 ? 'border-b-2 border-gray-100' : ''}>
              <CommentItem
                comment={comment}
                videoId={videoId!}
                videoTitle={videoTitle}
                videoContext={videoContext}
                onReplyPosted={handleCommentRefresh}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}