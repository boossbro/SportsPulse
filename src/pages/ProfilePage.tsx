import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import {
  getUserProfile,
  checkIsFollowing,
  followUser,
  unfollowUser,
  getUserBlogPosts,
  getUserCommunityPosts,
  getUserAnalytics,
} from '../lib/api';
import {
  User, MapPin, Link as LinkIcon, Calendar, Users, FileText,
  Heart, MessageCircle, Share2, Edit, Loader2, TrendingUp,
  Video, Hash, Repeat, Eye, Bookmark, Play
} from 'lucide-react';
import { ClickableText } from '../components/common/ClickableText';

type TabType = 'posts' | 'community' | 'videos' | 'likes' | 'reposts';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    loadProfile();
  }, [id, isOwnProfile]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreContent();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading, activeTab]);

  const loadProfile = async () => {
    if (!id) return;
    setLoading(true);

    const [profileData, postsResult, communityResult, analyticsData, followStatus] = await Promise.all([
      getUserProfile(id),
      getUserBlogPosts(id, { page: 1, limit: 20 }),
      getUserCommunityPosts(id, { page: 1, limit: 20 }),
      getUserAnalytics(id),
      !isOwnProfile ? checkIsFollowing(id) : Promise.resolve(false),
    ]);

    setProfile(profileData);
    setPosts(postsResult.data || []);
    setCommunityPosts(communityResult.data || []);
    setAnalytics(analyticsData);
    setIsFollowing(followStatus);
    setHasMore(postsResult.hasMore || communityResult.hasMore);
    setLoading(false);
  };

  const loadMoreContent = useCallback(async () => {
    if (!id || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    if (activeTab === 'posts') {
      const result = await getUserBlogPosts(id, { page: nextPage, limit: 20 });
      setPosts(prev => [...prev, ...(result.data || [])]);
      setHasMore(result.hasMore);
    } else if (activeTab === 'community') {
      const result = await getUserCommunityPosts(id, { page: nextPage, limit: 20 });
      setCommunityPosts(prev => [...prev, ...(result.data || [])]);
      setHasMore(result.hasMore);
    }
    
    setPage(nextPage);
    setLoadingMore(false);
  }, [id, page, hasMore, loadingMore, activeTab]);

  const handleFollow = async () => {
    if (!id) return;
    setFollowLoading(true);

    if (isFollowing) {
      const result = await unfollowUser(id);
      if (result.success) {
        setIsFollowing(false);
        setProfile((prev: any) => ({
          ...prev,
          followers_count: Math.max(0, (prev?.followers_count || 0) - 1),
        }));
      }
    } else {
      const result = await followUser(id);
      if (result.success) {
        setIsFollowing(true);
        setProfile((prev: any) => ({
          ...prev,
          followers_count: (prev?.followers_count || 0) + 1,
        }));
      }
    }

    setFollowLoading(false);
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
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="bg-white">
        {/* Profile Header */}
        <div className="px-4 py-6 border-b border-gray-200">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 ring-4 ring-gray-100">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 md:w-12 md:h-12 text-gray-500" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {profile.username}
                </h1>
                {isOwnProfile ? (
                  <Link
                    to="/profile/edit"
                    className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </Link>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-5 py-2 text-sm font-bold rounded-full transition-colors ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        : 'bg-primary text-white hover:bg-red-600'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      'Following'
                    ) : (
                      'Follow'
                    )}
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">{profile.email}</p>

              {profile.bio && (
                <p className="text-sm text-gray-900 mb-3 leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{profile.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(profile.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                <span className="font-bold text-gray-900">{profile.posts_count || 0}</span>
                <span className="text-gray-600 ml-1">Posts</span>
              </span>
            </div>
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                <span className="font-bold text-gray-900">{profile.followers_count || 0}</span>
                <span className="text-gray-600 ml-1">Followers</span>
              </span>
            </button>
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                <span className="font-bold text-gray-900">{profile.following_count || 0}</span>
                <span className="text-gray-600 ml-1">Following</span>
              </span>
            </button>
          </div>
        </div>

        {/* Analytics (Own Profile Only) */}
        {isOwnProfile && analytics && (
          <div className="px-4 py-5 border-b-8 border-gray-100 bg-blue-50">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">Your Analytics</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <Eye className="w-3.5 h-3.5" />
                  Profile Views
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics.profile_views || 0}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <Heart className="w-3.5 h-3.5" />
                  Total Likes
                </div>
                <div className="text-2xl font-bold text-red-500">{analytics.total_likes || 0}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Total Comments
                </div>
                <div className="text-2xl font-bold text-blue-500">{analytics.total_comments || 0}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <Share2 className="w-3.5 h-3.5" />
                  Engagement
                </div>
                <div className="text-2xl font-bold text-green-500">
                  {analytics.engagement_rate ? `${analytics.engagement_rate}%` : '0%'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="sticky top-14 bg-white border-b border-gray-200 z-30">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 min-w-fit px-4 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'posts' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Posts</span>
                {posts.length > 0 && (
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{posts.length}</span>
                )}
              </div>
              {activeTab === 'posts' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex-1 min-w-fit px-4 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'community' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>Community</span>
                {communityPosts.length > 0 && (
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{communityPosts.length}</span>
                )}
              </div>
              {activeTab === 'community' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 min-w-fit px-4 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'videos' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Video className="w-4 h-4" />
                <span>Videos</span>
              </div>
              {activeTab === 'videos' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 min-w-fit px-4 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'likes' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" />
                <span>Likes</span>
              </div>
              {activeTab === 'likes' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reposts')}
              className={`flex-1 min-w-fit px-4 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'reposts' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Repeat className="w-4 h-4" />
                <span>Reposts</span>
              </div>
              {activeTab === 'reposts' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-screen">
          {/* Blog Posts Tab */}
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">
                    {isOwnProfile ? "You haven't published any posts yet" : 'No posts yet'}
                  </p>
                  {isOwnProfile && (
                    <Link
                      to="/create"
                      className="inline-block mt-4 px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-red-600 transition-colors"
                    >
                      Create Your First Post
                    </Link>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/story/${post.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex gap-3">
                        {post.cover_image && (
                          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                            <img
                              src={post.cover_image}
                              alt=""
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold uppercase rounded">
                              {post.category}
                            </span>
                            <span className="text-xs text-gray-500">{getTimeAgo(post.published_at || post.created_at)}</span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-2">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.excerpt}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{post.views_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5" />
                              <span>{post.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{post.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {hasMore && (
                    <div ref={observerTarget} className="py-8 flex justify-center">
                      {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Community Posts Tab */}
          {activeTab === 'community' && (
            <div>
              {communityPosts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No community posts yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {communityPosts.map((post) => (
                    <div key={post.id} className="p-4">
                      <div className="text-sm text-gray-600 mb-2">{getTimeAgo(post.created_at)}</div>
                      <div className="text-gray-900 leading-relaxed mb-3">
                        <ClickableText text={post.content} />
                      </div>
                      {post.media_url && (
                        <div className="rounded-lg overflow-hidden mb-3">
                          {post.media_type === 'video' ? (
                            <video src={post.media_url} controls className="w-full max-h-96" />
                          ) : (
                            <img src={post.media_url} alt="" className="w-full max-h-96 object-cover" />
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-5 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Repeat className="w-4 h-4" />
                          <span>{post.reposts_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <div ref={observerTarget} className="py-8 flex justify-center">
                      {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Videos, Likes, Reposts Tabs - Placeholder */}
          {(activeTab === 'videos' || activeTab === 'likes' || activeTab === 'reposts') && (
            <div className="text-center py-12 px-4">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
