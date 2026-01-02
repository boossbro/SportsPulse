import { useState } from 'react';
import { Search, TrendingUp, Hash, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTrendingHashtags } from '../lib/api';
import { useEffect } from 'react';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    loadTrending();
    loadRecentSearches();
  }, []);

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

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white pb-20">
      {/* Search Header */}
      <div className="sticky top-14 bg-white z-10 p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories, hashtags, people..."
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Searches</h2>
            <div className="space-y-2">
              {recentSearches.map((search) => (
                <div
                  key={search}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{search}</span>
                  </div>
                  <button
                    onClick={() => clearSearch(search)}
                    className="p-1 text-gray-400 hover:text-gray-600"
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
      </div>
    </div>
  );
};

export default SearchPage;
