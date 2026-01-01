import { useState, useEffect, useRef } from 'react';
import { getTrendingVideos, likeVideo, unlikeVideo, repostVideo, unrepostVideo, checkIsVideoLiked, checkIsVideoReposted, incrementVideoShares, incrementVideoViews } from '../lib/api';
import { Loader2, Heart, MessageCircle, Share2, User, Volume2, VolumeX, Play, Repeat, Facebook, Twitter, Copy, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const VideosPage = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoStates, setVideoStates] = useState<Map<string, { liked: boolean; reposted: boolean; viewed: boolean }>>(new Map());
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play();
      
      // Track view when video starts playing
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

  const loadVideos = async () => {
    setLoading(true);
    const data = await getTrendingVideos(20);
    setVideos(data);
    
    // Load interaction states
    const states = new Map();
    for (const video of data) {
      const [liked, reposted] = await Promise.all([
        checkIsVideoLiked(video.id),
        checkIsVideoReposted(video.id),
      ]);
      states.set(video.id, { liked, reposted, viewed: false });
    }
    setVideoStates(states);
    
    setLoading(false);
  };

  const handleViewIncrement = async (videoId: string) => {
    await incrementVideoViews(videoId);
    setVideoStates(prev => new Map(prev).set(videoId, { ...prev.get(videoId)!, viewed: true }));
    
    // Update local count
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, views_count: (v.views_count || 0) + 1 } : v
    ));
  };

  const handleLike = async (videoId: string, currentLikesCount: number) => {
    const state = videoStates.get(videoId);
    const isLiked = state?.liked || false;

    if (isLiked) {
      await unlikeVideo(videoId);
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, likes_count: Math.max(0, v.likes_count - 1) } : v
      ));
    } else {
      await likeVideo(videoId);
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, likes_count: v.likes_count + 1 } : v
      ));
    }

    setVideoStates(prev => new Map(prev).set(videoId, { ...state!, liked: !isLiked }));
  };

  const handleRepost = async (videoId: string) => {
    const state = videoStates.get(videoId);
    const isReposted = state?.reposted || false;

    if (isReposted) {
      await unrepostVideo(videoId);
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, reposts_count: Math.max(0, (v.reposts_count || 0) - 1) } : v
      ));
    } else {
      await repostVideo(videoId);
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, reposts_count: (v.reposts_count || 0) + 1 } : v
      ));
    }

    setVideoStates(prev => new Map(prev).set(videoId, { ...state!, reposted: !isReposted }));
  };

  const handleShare = async (video: any, platform?: string) => {
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    const shareText = `${video.title}\n\n${video.description || ''}`;
    
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      await incrementVideoShares(video.id);
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, shares_count: (v.shares_count || 0) + 1 } : v
      ));
      setShareMenuId(null);
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(video.title)}`, '_blank');
      await incrementVideoShares(video.id);
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, shares_count: (v.shares_count || 0) + 1 } : v
      ));
      setShareMenuId(null);
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
      await incrementVideoShares(video.id);
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, shares_count: (v.shares_count || 0) + 1 } : v
      ));
      setShareMenuId(null);
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
      await incrementVideoShares(video.id);
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, shares_count: (v.shares_count || 0) + 1 } : v
      ));
      setShareMenuId(null);
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(video.title)}&body=${encodeURIComponent(shareText + '\n\nWatch video: ' + shareUrl)}`;
      await incrementVideoShares(video.id);
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, shares_count: (v.shares_count || 0) + 1 } : v
      ));
      setShareMenuId(null);
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Link copied to clipboard!');
        await incrementVideoShares(video.id);
        setVideos(prev => prev.map(v => 
          v.id === video.id ? { ...v, shares_count: (v.shares_count || 0) + 1 } : v
        ));
        setShareMenuId(null);
      } catch (err) {
        alert('Failed to copy link');
      }
    } else {
      if (navigator.share) {
        try {
          await navigator.share({
            title: video.title,
            text: video.description || video.title,
            url: shareUrl,
          });
          await incrementVideoShares(video.id);
          setVideos(prev => prev.map(v => 
            v.id === video.id ? { ...v, shares_count: (v.shares_count || 0) + 1 } : v
          ));
        } catch (err) {
          console.log('Share cancelled');
        }
      } else {
        setShareMenuId(video.id);
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No videos available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollBehavior: 'smooth' }}
    >
      {videos.map((video, index) => {
        const state = videoStates.get(video.id) || { liked: false, reposted: false, viewed: false };
        
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

            {/* Top Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-4">
              <button
                onClick={() => setMuted(!muted)}
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-6">
              {/* Like */}
              <button
                onClick={() => handleLike(video.id, video.likes_count)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  state.liked ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'
                } hover:scale-110 transition-all`}>
                  <Heart className={`w-7 h-7 ${state.liked ? 'fill-white text-white' : 'text-white'}`} />
                </div>
                <span className="text-white text-sm font-semibold">{video.likes_count || 0}</span>
              </button>

              {/* Comments */}
              <button className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-all">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-sm font-semibold">{video.comments_count || 0}</span>
              </button>

              {/* Repost */}
              <button
                onClick={() => handleRepost(video.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  state.reposted ? 'bg-green-500' : 'bg-white/20 backdrop-blur-sm'
                } hover:scale-110 transition-all`}>
                  <Repeat className={`w-7 h-7 ${state.reposted ? 'text-white' : 'text-white'}`} />
                </div>
                <span className="text-white text-sm font-semibold">{video.reposts_count || 0}</span>
              </button>

              {/* Share */}
              <div className="relative">
                <button
                  onClick={() => handleShare(video)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-all">
                    <Share2 className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white text-sm font-semibold">{video.shares_count || 0}</span>
                </button>

                {/* Share Menu */}
                {shareMenuId === video.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShareMenuId(null)}
                    />
                    <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl py-2 z-40 min-w-[200px]">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Share this video</p>
                      </div>
                      <button
                        onClick={() => handleShare(video, 'facebook')}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 w-full transition-colors"
                      >
                        <Facebook className="w-4 h-4 text-blue-600" />
                        <span>Facebook</span>
                      </button>
                      <button
                        onClick={() => handleShare(video, 'twitter')}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 w-full transition-colors"
                      >
                        <Twitter className="w-4 h-4 text-sky-500" />
                        <span>Twitter</span>
                      </button>
                      <button
                        onClick={() => handleShare(video, 'linkedin')}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 w-full transition-colors"
                      >
                        <Linkedin className="w-4 h-4 text-blue-700" />
                        <span>LinkedIn</span>
                      </button>
                      <button
                        onClick={() => handleShare(video, 'whatsapp')}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 w-full transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleShare(video, 'email')}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                      >
                        <Mail className="w-4 h-4 text-gray-600" />
                        <span>Email</span>
                      </button>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => handleShare(video, 'copy')}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                          <span>Copy Link</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-20 p-6 text-white z-10">
              {/* Author */}
              <Link
                to={`/profile/${video.user_id}`}
                className="flex items-center gap-3 mb-3"
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden ring-2 ring-white">
                  {video.user_profiles?.avatar_url ? (
                    <img
                      src={video.user_profiles.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-base">{video.user_profiles?.username || 'Unknown'}</div>
                  <div className="text-sm text-white/90">{video.category}</div>
                </div>
              </Link>

              {/* Title & Description */}
              <h2 className="text-lg font-bold mb-2 line-clamp-2">{video.title}</h2>
              {video.description && (
                <p className="text-sm text-white/90 mb-2 line-clamp-2">{video.description}</p>
              )}

              {/* Views */}
              <div className="text-sm text-white/80">
                {video.views_count || 0} views
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VideosPage;
