import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getVideoStories, 
  likeVideo, 
  unlikeVideo, 
  repostVideo, 
  unrepostVideo, 
  checkIsVideoLiked, 
  checkIsVideoReposted, 
  incrementVideoShares, 
  incrementVideoViews,
  getVideoComments,
  addVideoComment
} from '../lib/api';
import { Loader2, Heart, MessageCircle, Share2, User, Volume2, VolumeX, Play, Repeat, Facebook, Twitter, Copy, Linkedin, Mail, Send, X, TrendingUp, Bookmark, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClickableText } from '../components/common/ClickableText';

const VideosPage = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoStates, setVideoStates] = useState<Map<string, { liked: boolean; reposted: boolean; viewed: boolean; bookmarked: boolean }>>(new Map());
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);
  const [commentsVisible, setCommentsVisible] = useState<string | null>(null);
  const [comments, setComments] = useState<Map<string, any[]>>(new Map());
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    loadInitialVideos();
  }, []);

  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play().catch(() => {});
      
      const video = videos[currentIndex];
      if (video && !videoStates.get(video.id)?.viewed) {
        handleViewIncrement(video.id);
      }
    }

    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, videos]);

  const loadInitialVideos = async () => {
    setLoading(true);
    setPage(1);
    
    const result = await getVideoStories(undefined, { page: 1, limit: 5 });
    setVideos(result.data);
    setHasMore(result.hasMore);
    
    loadInteractionStates(result.data);
    
    setLoading(false);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    const result = await getVideoStories(undefined, { page: nextPage, limit: 5 });
    setVideos(prev => [...prev, ...result.data]);
    setHasMore(result.hasMore);
    setPage(nextPage);
    
    await loadInteractionStates(result.data);
    
    setLoadingMore(false);
  }, [page, hasMore, loadingMore]);

  const loadInteractionStates = async (videosToLoad: any[]) => {
    const states = new Map(videoStates);
    for (const video of videosToLoad) {
      if (!states.has(video.id)) {
        const [liked, reposted] = await Promise.all([
          checkIsVideoLiked(video.id),
          checkIsVideoReposted(video.id),
        ]);
        states.set(video.id, { liked, reposted, viewed: false, bookmarked: false });
      }
    }
    setVideoStates(states);
  };

  const handleViewIncrement = async (videoId: string) => {
    await incrementVideoViews(videoId);
    setVideoStates(prev => new Map(prev).set(videoId, { ...prev.get(videoId)!, viewed: true }));
    
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, views_count: (v.views_count || 0) + 1 } : v
    ));
  };

  const handleLike = async (videoId: string) => {
    const state = videoStates.get(videoId);
    const isLiked = state?.liked || false;

    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, likes_count: isLiked ? Math.max(0, v.likes_count - 1) : v.likes_count + 1 } : v
    ));
    setVideoStates(prev => new Map(prev).set(videoId, { ...state!, liked: !isLiked }));

    if (isLiked) {
      await unlikeVideo(videoId);
    } else {
      await likeVideo(videoId);
    }
  };

  const handleRepost = async (videoId: string) => {
    const state = videoStates.get(videoId);
    const isReposted = state?.reposted || false;

    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, reposts_count: isReposted ? Math.max(0, (v.reposts_count || 0) - 1) : (v.reposts_count || 0) + 1 } : v
    ));
    setVideoStates(prev => new Map(prev).set(videoId, { ...state!, reposted: !isReposted }));

    if (isReposted) {
      await unrepostVideo(videoId);
    } else {
      await repostVideo(videoId);
    }
  };

  const handleBookmark = (videoId: string) => {
    const state = videoStates.get(videoId);
    const isBookmarked = state?.bookmarked || false;
    
    setVideoStates(prev => new Map(prev).set(videoId, { ...state!, bookmarked: !isBookmarked }));
    
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedVideos') || '[]');
    if (isBookmarked) {
      localStorage.setItem('bookmarkedVideos', JSON.stringify(bookmarks.filter((id: string) => id !== videoId)));
    } else {
      localStorage.setItem('bookmarkedVideos', JSON.stringify([...bookmarks, videoId]));
    }
  };

  const handleToggleComments = async (videoId: string) => {
    if (commentsVisible === videoId) {
      setCommentsVisible(null);
      return;
    }

    setLoadingComments(true);
    setCommentsVisible(videoId);
    
    const videoComments = await getVideoComments(videoId);
    setComments(prev => new Map(prev).set(videoId, videoComments));
    setLoadingComments(false);
  };

  const handleAddComment = async (videoId: string) => {
    if (!commentText.trim()) return;

    const tempComment = {
      id: `temp-${Date.now()}`,
      content: commentText,
      created_at: new Date().toISOString(),
      user_id: user?.id,
      user_profiles: {
        username: user?.username,
        avatar_url: user?.avatar,
      }
    };

    // Optimistic update
    setComments(prev => new Map(prev).set(videoId, [...(prev.get(videoId) || []), tempComment]));
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, comments_count: v.comments_count + 1 } : v
    ));
    setCommentText('');

    const result = await addVideoComment(videoId, tempComment.content);
    
    if (result.data) {
      setComments(prev => {
        const videoComments = prev.get(videoId) || [];
        const filtered = videoComments.filter(c => c.id !== tempComment.id);
        return new Map(prev).set(videoId, [...filtered, result.data]);
      });
    }
  };

  const handleShare = async (video: any, platform?: string) => {
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    const shareText = `${video.title}\n\n${video.description || ''}`;
    
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Link copied!');
        await incrementVideoShares(video.id);
        setVideos(prev => prev.map(v => 
          v.id === video.id ? { ...v, shares_count: (v.shares_count || 0) + 1 } : v
        ));
        setShareMenuId(null);
      } catch (err) {
        alert('Failed to copy link');
      }
    } else if (platform) {
      const urls: { [key: string]: string } = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(video.title)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      };
      
      if (urls[platform]) {
        window.open(urls[platform], '_blank');
        await incrementVideoShares(video.id);
        setVideos(prev => prev.map(v => 
          v.id === video.id ? { ...v, shares_count: (v.shares_count || 0) + 1 } : v
        ));
        setShareMenuId(null);
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    const videoHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / videoHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex);
    }

    if (scrollPosition + videoHeight * 2 >= container.scrollHeight && hasMore && !loadingMore) {
      loadMore();
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
        <p className="text-white text-sm">Loading videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <Play className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No videos available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black"
      style={{ scrollBehavior: 'smooth' }}
    >
      {videos.map((video, index) => {
        const state = videoStates.get(video.id) || { liked: false, reposted: false, viewed: false, bookmarked: false };
        const videoComments = comments.get(video.id) || [];
        const isCommentsOpen = commentsVisible === video.id;
        
        return (
          <div
            key={video.id}
            className="h-screen snap-start relative bg-black flex items-center justify-center"
          >
            {/* Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={video.video_url}
              loop
              muted={muted}
              playsInline
              className="h-full w-auto max-w-full object-contain"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 pointer-events-none" />

            {/* Top Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
              <button
                onClick={() => setMuted(!muted)}
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-5">
              <button
                onClick={() => handleLike(video.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  state.liked ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'
                } hover:scale-110 transition-all shadow-lg`}>
                  <Heart className={`w-7 h-7 ${state.liked ? 'fill-white text-white' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-bold drop-shadow-lg">{video.likes_count || 0}</span>
              </button>

              <button 
                onClick={() => handleToggleComments(video.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isCommentsOpen ? 'bg-blue-500' : 'bg-white/20 backdrop-blur-sm'
                } hover:scale-110 transition-all shadow-lg`}>
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-xs font-bold drop-shadow-lg">{video.comments_count || 0}</span>
              </button>

              <button
                onClick={() => handleRepost(video.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  state.reposted ? 'bg-green-500' : 'bg-white/20 backdrop-blur-sm'
                } hover:scale-110 transition-all shadow-lg`}>
                  <Repeat className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-xs font-bold drop-shadow-lg">{video.reposts_count || 0}</span>
              </button>

              <button
                onClick={() => handleBookmark(video.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  state.bookmarked ? 'bg-yellow-500' : 'bg-white/20 backdrop-blur-sm'
                } hover:scale-110 transition-all shadow-lg`}>
                  <Bookmark className={`w-7 h-7 ${state.bookmarked ? 'fill-white text-white' : 'text-white'}`} />
                </div>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShareMenuId(shareMenuId === video.id ? null : video.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg">
                    <Share2 className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white text-xs font-bold drop-shadow-lg">{video.shares_count || 0}</span>
                </button>

                {shareMenuId === video.id && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShareMenuId(null)} />
                    <div className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-2xl py-2 z-40 min-w-[200px]">
                      <button onClick={() => handleShare(video, 'copy')} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full">
                        <Copy className="w-5 h-5" />
                        <span className="font-medium">Copy Link</span>
                      </button>
                      <button onClick={() => handleShare(video, 'twitter')} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-sky-50 w-full">
                        <Twitter className="w-5 h-5 text-sky-500" />
                        <span className="font-medium">Twitter</span>
                      </button>
                      <button onClick={() => handleShare(video, 'facebook')} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 w-full">
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Facebook</span>
                      </button>
                      <button onClick={() => handleShare(video, 'whatsapp')} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 w-full">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">WhatsApp</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-20 p-6 text-white z-10">
              <Link
                to={`/profile/${video.user_id}`}
                className="flex items-center gap-3 mb-3"
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-lg">
                  {video.user_profiles?.avatar_url ? (
                    <img src={video.user_profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-base drop-shadow-lg">{video.user_profiles?.username || 'Unknown'}</div>
                  <div className="text-sm text-white/90 drop-shadow-lg">{video.category}</div>
                </div>
              </Link>

              <h2 className="text-lg font-bold mb-2 line-clamp-2 drop-shadow-lg">{video.title}</h2>
              {video.description && (
                <div className="text-sm text-white/95 mb-2 line-clamp-3 drop-shadow-lg">
                  <ClickableText text={video.description} className="text-white" />
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-white/90 drop-shadow-lg">
                <span>{video.views_count || 0} views</span>
                <span>•</span>
                <span>{getTimeAgo(video.created_at)}</span>
              </div>
            </div>

            {/* TikTok-Style Comments Panel (Slide Up) */}
            {isCommentsOpen && (
              <>
                <div 
                  className="absolute inset-0 bg-black/50 z-30"
                  onClick={() => setCommentsVisible(null)}
                />
                
                <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-white rounded-t-3xl z-40 overflow-hidden flex flex-col animate-slide-up">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-gray-900">
                      {videoComments.length} {videoComments.length === 1 ? 'Comment' : 'Comments'}
                    </h3>
                    <button
                      onClick={() => setCommentsVisible(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {loadingComments ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : videoComments.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 font-medium">No comments yet</p>
                        <p className="text-xs text-gray-400 mt-1">Be the first to comment!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {videoComments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Link to={`/profile/${comment.user_id}`} className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {comment.user_profiles?.avatar_url ? (
                                  <img src={comment.user_profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                            </Link>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Link to={`/profile/${comment.user_id}`} className="font-semibold text-gray-900 text-sm hover:underline">
                                  {comment.user_profiles?.username || 'Unknown'}
                                </Link>
                                <span className="text-xs text-gray-500">{getTimeAgo(comment.created_at)}</span>
                              </div>
                              <div className="text-sm text-gray-900 leading-relaxed">
                                <ClickableText text={comment.content} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comment Input (Fixed at bottom) */}
                  <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(video.id);
                          }
                        }}
                        placeholder="Add a comment..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={() => handleAddComment(video.id)}
                        disabled={!commentText.trim()}
                        className="p-3 bg-primary text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {loadingMore && (
        <div className="h-screen snap-start bg-black flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
          <p className="text-white text-sm">Loading more videos...</p>
        </div>
      )}

      {!hasMore && videos.length > 0 && (
        <div className="h-screen snap-start bg-black flex flex-col items-center justify-center">
          <TrendingUp className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg font-semibold">You're all caught up!</p>
          <p className="text-gray-500 text-sm mt-2">Check back later for new videos</p>
        </div>
      )}
    </div>
  );
};

// Import useAuth hook
import { useAuth } from '../stores/authStore';

export default VideosPage;
