import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTrendingHashtags, getPostsByHashtag, getVideosByHashtag } from '../lib/api';
import { Loader2, Hash, TrendingUp, User, Play, Eye, MessageCircle } from 'lucide-react';

const TrendingPage = () => {
  const { tag } = useParams();
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState(tag || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tag]);

  const loadData = async () => {
    setLoading(true);
    const hashtags = await getTrendingHashtags(20);
    setTrendingHashtags(hashtags);

    if (tag) {
      const [tagPosts, tagVideos] = await Promise.all([
        getPostsByHashtag(tag),
        getVideosByHashtag(tag),
      ]);
      
      const allContent = [
        ...tagPosts.map((p: any) => ({ ...p, type: 'blog' })),
        ...tagVideos.map((v: any) => ({ ...v, type: 'video' })),
      ].sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        return dateB - dateA;
      });
      
      setContent(allContent);
      setSelectedTag(tag);
    }

    setLoading(false);
  };

  const handleTagClick = async (tagName: string) => {
    setSelectedTag(tagName);
    const [tagPosts, tagVideos] = await Promise.all([
      getPostsByHashtag(tagName),
      getVideosByHashtag(tagName),
    ]);
    
    const allContent = [
      ...tagPosts.map((p: any) => ({ ...p, type: 'blog' })),
      ...tagVideos.map((v: any) => ({ ...v, type: 'video' })),
    ].sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });
    
    setContent(allContent);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-4">
        {/* Trending List */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white border-b border-gray-200 sticky top-14">
            <div className="px-4 py-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-gray-900">Trending</h1>
            </div>

            <div>
              {trendingHashtags.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Hash className="w-12 h-12 text-gray-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-gray-600">No trending hashtags yet</p>
                </div>
              ) : (
                trendingHashtags.map((tag, index) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.tag)}
                    className={`w-full text-left border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors ${
                      selectedTag === tag.tag ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-gray-500 font-medium mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Hash className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm font-bold text-gray-900 truncate">
                            {tag.tag}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {tag.usage_count} {tag.usage_count === 1 ? 'post' : 'posts'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Content for Selected Tag */}
        <div className="flex-1 min-w-0">
          <div className="bg-white">
            {selectedTag ? (
              <>
                <div className="px-4 py-4 border-b border-gray-200 sticky top-14 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-gray-900">#{selectedTag}</h2>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {content.length} {content.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                {content.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <Hash className="w-16 h-16 text-gray-400 mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-gray-600">No content with this hashtag yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {content.map((item) => {
                      const isVideo = item.type === 'video';
                      const linkTo = isVideo ? `/videos` : `/story/${item.id}`;
                      
                      return (
                        <Link
                          key={item.id}
                          to={linkTo}
                          className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                        >
                          {/* Thumbnail */}
                          {(item.cover_image || item.thumbnail_url) && (
                            <div className="relative h-40 bg-gray-200">
                              <img
                                src={item.cover_image || item.thumbnail_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="w-12 h-12 text-white" fill="currentColor" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Info */}
                          <div className="p-4">
                            {/* Author */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {item.user_profiles?.avatar_url ? (
                                  <img
                                    src={item.user_profiles.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-3 h-3 text-gray-500" />
                                )}
                              </div>
                              <div className="text-xs text-gray-600">
                                {item.user_profiles?.username || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-400">·</div>
                              <div className="text-xs text-gray-500">
                                {getTimeAgo(item.published_at || item.created_at)}
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                              {item.title}
                            </h3>

                            {/* Stats */}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                <span>{item.views_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{item.comments_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 px-4">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-gray-600">Select a hashtag to see content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingPage;
