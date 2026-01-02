import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { getAllContentByCategory } from '../lib/api';
import { Loader2, User, Clock, Eye, MessageCircle, Bookmark, Share2, Play } from 'lucide-react';

type CategoryFilter = 'For You' | 'News' | 'Sports' | 'Entertainment' | 'Technology' | 'Business' | 'Health' | 'Lifestyle' | 'Politics';

const HomePage = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState<CategoryFilter>('For You');
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories: CategoryFilter[] = ['For You', 'News', 'Sports', 'Entertainment', 'Technology', 'Business', 'Health', 'Lifestyle', 'Politics'];

  useEffect(() => {
    loadContent();
  }, [category]);

  const loadContent = async () => {
    setLoading(true);
    
    try {
      if (category === 'For You') {
        const result = await getAllContentByCategory('', { page: 1, limit: 50 });
        setContent(result.data || []);
      } else {
        const result = await getAllContentByCategory(category, { page: 1, limit: 50 });
        setContent(result.data || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setContent([]);
    }
    
    setLoading(false);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-40">
        <div className="overflow-x-auto">
          <div className="flex">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="bg-gray-50 min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No stories yet</h3>
              <p className="text-gray-600 mb-6">Be the first to share your story with the community!</p>
              <Link
                to="/create"
                className="inline-block px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-red-600 transition-colors"
              >
                Create Story
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {content.map((item) => {
              const isVideo = item.type === 'video';
              const linkTo = isVideo ? `/videos` : `/story/${item.id}`;
              
              return (
                <Link
                  key={item.id}
                  to={linkTo}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
                >
                  {/* Cover Image/Thumbnail */}
                  {(item.cover_image || item.thumbnail_url) && (
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={item.cover_image || item.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {/* Video Play Icon */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                          </div>
                        </div>
                      )}
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-primary text-white text-xs font-bold uppercase rounded">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h2 className="text-base font-bold text-gray-900 line-clamp-2 mb-2 hover:text-primary transition-colors">
                      {item.title}
                    </h2>

                    {/* Excerpt/Description */}
                    {(item.excerpt || item.description) && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {item.excerpt || item.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[100px]">
                            {item.user_profiles?.username || 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getTimeAgo(item.published_at || item.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{item.views_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MessageCircle className="w-4 h-4" />
                        <span>{item.comments_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Share2 className="w-4 h-4" />
                        <span>{item.shares_count || 0}</span>
                      </div>
                      {isVideo && item.reposts_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <span className="font-medium">{item.reposts_count} reposts</span>
                        </div>
                      )}
                      <div className="ml-auto">
                        <Bookmark className="w-4 h-4 text-gray-400 hover:text-primary cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
