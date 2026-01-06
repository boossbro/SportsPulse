import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getAllContentByHashtag, 
  getAllHashtagsWithContent, 
  getHashtagByTag,
  followHashtag,
  unfollowHashtag,
  checkIsFollowingHashtag,
  getFollowedHashtags
} from '../lib/api';
import { Hash, TrendingUp, Loader2, Video, FileText, User, Heart, MessageCircle, Eye, Plus, Check, Bell } from 'lucide-react';
import { ClickableText } from '../components/common/ClickableText';

const HashtagPage = () => {
  const { tag } = useParams();
  const [content, setContent] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [followedTags, setFollowedTags] = useState<any[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'blog' | 'video'>('all');
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialContent();
    loadTrendingTags();
    loadFollowedHashtags();
  }, [tag]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
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
  }, [hasMore, loadingMore, loading]);

  const loadInitialContent = async () => {
    setLoading(true);
    setPage(1);
    
    if (tag) {
      const hashtagData = await getHashtagByTag(tag);
      if (hashtagData) {
        const [result, followStatus] = await Promise.all([
          getAllContentByHashtag(tag, { page: 1, limit: 20 }),
          checkIsFollowingHashtag(hashtagData.id)
        ]);
        
        setContent(result.data);
        setHasMore(result.hasMore);
        setCurrentHashtag(hashtagData);
        setIsFollowing(followStatus);
      }
    }
    
    setLoading(false);
  };

  const loadMore = useCallback(async () => {
    if (!tag || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    const result = await getAllContentByHashtag(tag, { page: nextPage, limit: 20 });
    
    setContent(prev => [...prev, ...result.data]);
    setHasMore(result.hasMore);
    setPage(nextPage);
    setLoadingMore(false);
  }, [tag, page, hasMore, loadingMore]);

  const loadTrendingTags = async () => {
    const tags = await getAllHashtagsWithContent(15);
    setTrendingTags(tags);
  };

  const loadFollowedHashtags = async () => {
    const tags = await getFollowedHashtags();
    setFollowedTags(tags);
  };

  const handleFollowToggle = async () => {
    if (!currentHashtag) return;
    
    if (isFollowing) {
      const result = await unfollowHashtag(currentHashtag.id);
      if (result.success) {
        setIsFollowing(false);
        setCurrentHashtag((prev: any) => ({
          ...prev,
          followers_count: Math.max(0, (prev?.followers_count || 0) - 1)
        }));
        loadFollowedHashtags();
      }
    } else {
      const result = await followHashtag(currentHashtag.id);
      if (result.success) {
        setIsFollowing(true);
        setCurrentHashtag((prev: any) => ({
          ...prev,
          followers_count: (prev?.followers_count || 0) + 1
        }));
        loadFollowedHashtags();
      }
    }
  };

  const filteredContent = filterType === 'all' 
    ? content 
    : content.filter(item => item.type === filterType);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8 bg-white">
            {/* Header */}
            <div className="sticky top-14 bg-white z-10 border-b border-gray-200">
              {tag ? (
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <Hash className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">{tag}</h1>
                        {currentHashtag && (
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            <span>{currentHashtag.usage_count?.toLocaleString()} posts</span>
                            <span>•</span>
                            <span>{currentHashtag.followers_count?.toLocaleString() || 0} followers</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleFollowToggle}
                      className={`px-5 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${
                        isFollowing
                          ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                          : 'bg-primary text-white hover:bg-red-600'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="w-4 h-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        filterType === 'all'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All ({content.length})
                    </button>
                    <button
                      onClick={() => setFilterType('blog')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        filterType === 'blog'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Articles ({content.filter(c => c.type === 'blog').length})
                    </button>
                    <button
                      onClick={() => setFilterType('video')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        filterType === 'video'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      Videos ({content.filter(c => c.type === 'video').length})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <h1 className="text-2xl font-bold text-gray-900">Trending Hashtags</h1>
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tag && filteredContent.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No {filterType === 'all' ? '' : filterType === 'blog' ? 'articles' : 'videos'} yet</h3>
                <p className="text-sm text-gray-600">
                  Be the first to post with #{tag}
                </p>
              </div>
            ) : tag ? (
              <div>
                {filteredContent.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.type === 'blog' ? `/story/${item.id}` : `/videos#${item.id}`}
                    className="block border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <Link
                        to={`/profile/${item.user_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {item.user_profiles?.avatar_url ? (
                            <img
                              src={item.user_profiles.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {item.user_profiles?.username || 'Unknown'}
                          </span>
                          <span className="text-gray-500">·</span>
                          <span className="text-sm text-gray-500">
                            {getTimeAgo(item.published_at || item.created_at)}
                          </span>
                          {item.type === 'blog' && (
                            <>
                              <span className="text-gray-500">·</span>
                              <span className="text-xs uppercase font-medium text-primary">
                                {item.category}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                          {item.title}
                        </h3>

                        {item.type === 'blog' && item.excerpt && (
                          <ClickableText
                            text={item.excerpt}
                            className="text-sm text-gray-600 line-clamp-2 mb-2"
                          />
                        )}

                        {item.type === 'video' && item.description && (
                          <ClickableText
                            text={item.description}
                            className="text-sm text-gray-600 line-clamp-2 mb-2"
                          />
                        )}

                        {(item.cover_image || item.thumbnail_url) && (
                          <div className="relative mt-2 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={item.cover_image || item.thumbnail_url}
                              alt=""
                              className="w-full h-48 object-cover"
                            />
                            {item.type === 'video' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                                  <Video className="w-6 h-6 text-gray-900" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{item.views_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{item.likes_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{item.comments_count || 0}</span>
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

                {!hasMore && filteredContent.length > 0 && (
                  <div className="py-8 text-center text-sm text-gray-500">
                    You've reached the end
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <p className="text-gray-600 mb-4">
                  Explore content by selecting a trending hashtag
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-14 pt-4 space-y-4">
              {followedTags.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-bold text-gray-900">Following</h2>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {followedTags.map((hashtag) => (
                      <Link
                        key={hashtag.id}
                        to={`/hashtag/${hashtag.tag}`}
                        className={`block p-4 hover:bg-gray-50 transition-colors ${
                          tag === hashtag.tag ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Hash className="w-4 h-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 truncate">
                              {hashtag.tag}
                            </div>
                            <p className="text-sm text-gray-600">
                              {hashtag.usage_count?.toLocaleString()} posts
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-gray-900">Trending</h2>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {trendingTags.map((hashtag, index) => (
                    <Link
                      key={hashtag.id}
                      to={`/hashtag/${hashtag.tag}`}
                      className={`block p-4 hover:bg-gray-50 transition-colors ${
                        tag === hashtag.tag ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-bold text-gray-400 mt-1">
                            {index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Hash className="w-4 h-4 text-primary" />
                              <span className="font-bold text-gray-900">
                                {hashtag.tag}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {hashtag.usage_count?.toLocaleString()} posts
                            </p>
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashtagPage;
