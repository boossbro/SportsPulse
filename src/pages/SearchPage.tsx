import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, Hash, X, User, FileText, Video, MessageCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTrendingHashtags, globalSearch } from '../lib/api';
import { ClickableText } from '../components/common/ClickableText';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'videos' | 'users' | 'hashtags'>('all');

  useEffect(() => {
    loadTrending();
    loadRecentSearches();
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length >= 2) {
      const timer = setTimeout(() => {
        performSearch(query);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults(null);
    }
  }, [query]);

  const loadTrending = async () => {
    const tags = await getTrendingHashtags(10);
    setTrendingTags(tags);
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearSearch = (searchQuery: string) => {
    const updated = recentSearches.filter(s => s !== searchQuery);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    saveSearch(searchQuery);
    
    const searchResults = await globalSearch(searchQuery);
    setResults(searchResults);
    setSearching(false);
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

  const getTotalResults = () => {
    if (!results) return 0;
    return (
      (results.users?.length || 0) +
      (results.hashtags?.length || 0) +
      (results.blogPosts?.length || 0) +
      (results.communityPosts?.length || 0) +
      (results.videos?.length || 0)
    );
  };

  const filteredResults = () => {
    if (!results) return null;

    switch (activeTab) {
      case 'posts':
        return { blogPosts: results.blogPosts, communityPosts: results.communityPosts };
      case 'videos':
        return { videos: results.videos };
      case 'users':
        return { users: results.users };
      case 'hashtags':
        return { hashtags: results.hashtags };
      default:
        return results;
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-white pb-20">
      {/* Search Header */}
      <div className="sticky top-14 bg-white z-10 border-b border-gray-200">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for stories, people, hashtags..."
              className="w-full pl-12 pr-10 py-3 bg-gray-100 rounded-full text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs - Only show when there are results */}
        {results && getTotalResults() > 0 && (
          <div className="flex overflow-x-auto scrollbar-hide border-t border-gray-100">
            {[
              { key: 'all', label: 'All', count: getTotalResults() },
              { key: 'posts', label: 'Posts', count: (results.blogPosts?.length || 0) + (results.communityPosts?.length || 0) },
              { key: 'videos', label: 'Videos', count: results.videos?.length || 0 },
              { key: 'users', label: 'People', count: results.users?.length || 0 },
              { key: 'hashtags', label: 'Hashtags', count: results.hashtags?.length || 0 },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {label} {count > 0 && <span className="text-xs ml-1">({count})</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {searching && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!query && !results && (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Searches</h2>
                <div className="space-y-2">
                  {recentSearches.map((search) => (
                    <div
                      key={search}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <button
                        onClick={() => setQuery(search)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <Search className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{search}</span>
                      </button>
                      <button
                        onClick={() => clearSearch(search)}
                        className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Trending Now</h2>
              </div>
              
              <div className="space-y-3">
                {trendingTags.map((tag, index) => (
                  <Link
                    key={tag.id}
                    to={`/hashtag/${tag.tag}`}
                    className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-bold text-gray-400 mt-1">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Hash className="w-4 h-4 text-primary" />
                            <span className="font-bold text-gray-900">
                              {tag.tag}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {tag.usage_count.toLocaleString()} {tag.usage_count === 1 ? 'post' : 'posts'}
                          </p>
                        </div>
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Search Results */}
        {!searching && query && results && getTotalResults() === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No results found</h3>
            <p className="text-sm text-gray-600">
              Try different keywords or check your spelling
            </p>
          </div>
        )}

        {!searching && results && getTotalResults() > 0 && (
          <div className="space-y-4">
            {/* Users */}
            {filteredResults()?.users && filteredResults().users.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">People</h3>
                <div className="space-y-2">
                  {filteredResults().users.map((user: any) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.id}`}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{user.username}</div>
                        {user.bio && <p className="text-sm text-gray-600 line-clamp-1">{user.bio}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {filteredResults()?.hashtags && filteredResults().hashtags.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Hashtags</h3>
                <div className="space-y-2">
                  {filteredResults().hashtags.map((tag: any) => (
                    <Link
                      key={tag.id}
                      to={`/hashtag/${tag.tag}`}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-bold text-gray-900">#{tag.tag}</div>
                          <p className="text-sm text-gray-600">{tag.usage_count.toLocaleString()} posts</p>
                        </div>
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Blog Posts */}
            {filteredResults()?.blogPosts && filteredResults().blogPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Articles</h3>
                <div className="space-y-3">
                  {filteredResults().blogPosts.map((post: any) => (
                    <Link
                      key={post.id}
                      to={`/story/${post.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs uppercase font-medium text-primary">{post.category}</span>
                            <span className="text-gray-500">·</span>
                            <span className="text-sm text-gray-500">{getTimeAgo(post.published_at)}</span>
                          </div>
                          <h4 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{post.title}</h4>
                          {post.excerpt && (
                            <ClickableText text={post.excerpt} className="text-sm text-gray-600 line-clamp-2" />
                          )}
                        </div>
                        {post.cover_image && (
                          <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                            <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Community Posts */}
            {filteredResults()?.communityPosts && filteredResults().communityPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Community Posts</h3>
                <div className="space-y-3">
                  {filteredResults().communityPosts.map((post: any) => (
                    <Link
                      key={post.id}
                      to={`/community#${post.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {post.user_profiles?.avatar_url ? (
                            <img src={post.user_profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{post.user_profiles?.username}</span>
                            <span className="text-sm text-gray-500">·</span>
                            <span className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</span>
                          </div>
                          <ClickableText text={post.content} className="text-sm text-gray-900 line-clamp-3" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {filteredResults()?.videos && filteredResults().videos.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Videos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {filteredResults().videos.map((video: any) => (
                    <Link
                      key={video.id}
                      to={`/videos#${video.id}`}
                      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-video bg-gray-100">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-gray-900" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{video.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{video.views_count || 0} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
