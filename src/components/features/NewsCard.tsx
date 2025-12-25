import { NewsArticle } from '../../types';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewsCardProps {
  article: NewsArticle;
}

const NewsCard = ({ article }: NewsCardProps) => {
  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <Link to={`/news/${article.id}`} className="block">
      <div className="match-row px-3 py-2.5 cursor-pointer group">
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-secondary">
          <img
            src={article.image}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="uppercase tracking-wide font-medium">{article.category}</span>
                <span>•</span>
                <span className="tabular-nums">{getTimeAgo(article.publishedAt)}</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
    </Link>
  );
};

export default NewsCard;
