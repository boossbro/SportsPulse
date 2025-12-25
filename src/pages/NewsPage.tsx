
import { useState, useEffect } from 'react';
import NewsCard from '../components/features/NewsCard';
import { fetchNews, syncSportsNews } from '../lib/api';
import { RefreshCw, Loader2 } from 'lucide-react';
import { NewsArticle } from '../types';

type CategoryFilter = 'all' | 'Football' | 'Basketball' | 'Tennis' | 'General';

const NewsPage = () => {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const categories: CategoryFilter[] = ['all', 'Football', 'Basketball', 'Tennis', 'General'];

  const loadNews = async () => {
    setLoading(true);
    const data = await fetchNews(category);
    setNews(data);
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncSportsNews();
    if (result.success) {
      setLastSync(new Date());
      await loadNews();
    } else {
      console.error('Sync failed:', result.error);
      alert('Failed to sync sports news: ' + result.error);
    }
    setSyncing(false);
  };

  useEffect(() => {
    loadNews();
  }, [category]);

  useEffect(() => {
    // Auto-sync on mount
    const initializeNews = async () => {
      await handleSync();
    };
    initializeNews();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Category Tabs */}
      <div className="bg-card border-b border-border sticky top-14 z-40">
        <div className="flex items-center justify-between">
          <div className="flex overflow-x-auto flex-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors border-b-2 ${
                  category === cat
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 px-3 border-l border-border">
            {lastSync && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              title="Sync latest news"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-sm text-muted-foreground mb-3">No news articles available</p>
            <button
              onClick={handleSync}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Sync Latest News
            </button>
          </div>
        ) : (
          <div>
            {news.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
