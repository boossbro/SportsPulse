import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, ExternalLink, MessageCircle, User, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NewsArticle } from '../types';
import { useHistory } from '../hooks/useHistory';
import { ArticleSEO } from '../components/seo/ArticleSEO';
import { useAuth } from '../stores/authStore';
import { getArticleComments, addComment, deleteComment } from '../lib/api';

const NewsDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { addToHistory } = useHistory();

  useEffect(() => {
    const loadArticle = async () => {
      if (!id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        const newsArticle: NewsArticle = {
          id: data.id,
          title: data.title,
          excerpt: data.excerpt || '',
          content: data.content || '',
          image: data.image,
          category: data.category,
          publishedAt: data.published_at,
        };
        setArticle(newsArticle);
        
        // Add to history
        addToHistory({
          id: newsArticle.id,
          type: 'news',
          title: newsArticle.title,
          subtitle: `${newsArticle.category} • ${new Date(newsArticle.publishedAt).toLocaleDateString()}`,
          link: `/news/${newsArticle.id}`,
        });
      }
      
      setLoading(false);
    };

    const loadComments = async () => {
      if (!id) return;
      const data = await getArticleComments(id);
      setComments(data);
    };

    loadArticle();
    loadComments();
  }, [id, addToHistory]);

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
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    setSubmitting(true);
    const result = await addComment(id, newComment);

    if (result.data) {
      setComments([result.data, ...comments]);
      setNewComment('');
    } else if (result.error) {
      alert('Failed to post comment: ' + result.error);
    }

    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    const result = await deleteComment(commentId);
    if (result.success) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Article not found</p>
      </div>
    );
  }

  return (
    <>
      <ArticleSEO article={article} />
      <div className="max-w-4xl mx-auto">
      <div className="bg-card">
        {/* Back Button */}
        <div className="px-4 py-3 border-b border-border">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to news</span>
          </Link>
        </div>

        {/* Article Header Image */}
        {article.image && (
          <div className="w-full h-64 bg-secondary overflow-hidden">
            <img
              src={article.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="px-6 py-6">
          {/* Category & Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded uppercase tracking-wide font-medium">
              {article.category}
            </span>
            <span>•</span>
            <span className="tabular-nums">{getTimeAgo(article.publishedAt)}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <div className="text-base text-muted-foreground mb-6 pb-6 border-b border-border leading-relaxed">
              {article.excerpt}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {article.content}
            </div>
          </div>

          {/* External Link Notice */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>This article is sourced from external news providers via RSS feeds</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-6 py-6 border-t border-border bg-secondary/20">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full px-4 py-3 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post Comment
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-background border border-border rounded text-center">
              <p className="text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{' '}
                to join the discussion
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-background border border-border rounded p-4">
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${comment.user_id}`} className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {comment.user_profiles?.avatar_url ? (
                          <img
                            src={comment.user_profiles.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <Link
                            to={`/profile/${comment.user_id}`}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {comment.user_profiles?.username || 'Unknown'}
                          </Link>
                          <span className="text-xs text-muted-foreground ml-2">
                            {getTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        {user?.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default NewsDetailPage;
