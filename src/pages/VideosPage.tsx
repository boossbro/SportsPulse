import { useState, useEffect, useRef } from 'react';
import { getVideoStories } from '../lib/api';
import { Loader2, Heart, MessageCircle, Share2, User, Volume2, VolumeX, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const VideosPage = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    // Auto-play current video
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play();
    }

    // Pause other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex]);

  const loadVideos = async () => {
    setLoading(true);
    const data = await getVideoStories(undefined, 20);
    setVideos(data);
    setLoading(false);
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
      {videos.map((video, index) => (
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

          {/* Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-4">
            <button
              onClick={() => setMuted(!muted)}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
            {/* Author */}
            <Link
              to={`/profile/${video.user_id}`}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
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
                <div className="font-semibold">{video.user_profiles?.username || 'Unknown'}</div>
                <div className="text-sm text-white/80">{video.category}</div>
              </div>
            </Link>

            {/* Title & Description */}
            <h2 className="text-lg font-bold mb-2">{video.title}</h2>
            {video.description && (
              <p className="text-sm text-white/90 mb-4 line-clamp-2">{video.description}</p>
            )}

            {/* Engagement */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span className="text-sm font-medium">{video.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{video.comments_count || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">{video.shares_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideosPage;
