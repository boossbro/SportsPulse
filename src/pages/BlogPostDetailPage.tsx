import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import {
  getBlogPostById,
  getBlogComments,
  addBlogComment,
  deleteBlogComment,
  likeBlogPost,
  unlikeBlogPost,
  repostBlogPost,
  unrepostBlogPost,
  checkIsLiked,
  checkIsReposted,
  incrementShares,
} from '../lib/api';
import {
  Loader2,
  ArrowLeft,
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  User,
  Send,
  Eye,
  Calendar,
  Edit,
  Trash,
} from 'lucide-react';
import { useHistory } from '../hooks/useHistory';

const BlogPostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const { addToHistory } = useHistory();

  useEffect(() => {
    if (!id) return;
    
    const loadPost = async () => {
      setLoading(true);
      
      const result = await getBlogPostById(id);
      
      if (result.data) {
        setPost(result.data);
        
        // Check like/repost status
        const [liked, reposted] = await Promise.all([
          checkIsLiked(id),
          checkIsReposted(id),
        ]);
        
        setIsLiked(liked);
        setIsReposted(reposted);
        
        // Add to history
        addToHistory({
          id: result.data.id,
          type: 'blog',
          title: result.data.title,
          subtitle: `${result.data.category} • By ${result.data.user_profiles?.username || 'Unknown'}`,
          link: `/blog/${result.data.id}`,
        });
      }
      
      setLoading(false);
    };

    const loadComments = async () => {
      const data = await getBlogComments(id);
      setComments(data);
    };

    loadPost();
    loadComments();
  }, [id, addToHistory]);

  const handleLike = async () => {
    if (!id) return;
    
    if (isLiked) {
      await unlikeBlogPost(id);
      setPost((prev: any) => ({ ...prev, likes_count: prev.likes_count - 1 }));
    } else {
      await likeBlogPost(id);
      setPost((prev: any) => ({ ...prev, likes_count: prev.likes_count + 1 }));
    }
    
    setIsLiked(!isLiked);
  };

  const handleRepost = async () => {
    if (!id) return;
    
    if (isReposted) {
      await unrepostBlogPost(id);
      setPost((prev: any) => ({ ...prev, reposts_count: prev.reposts_count - 1 }));
    } else {
      await repostBlogPost(id);
      setPost((prev: any) => ({ ...prev, reposts_count: prev.reposts_count + 1 }));
    }
    
    setIsReposted(!isReposted);
  };

  const handleShare = async () => {
    if (!id) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: `${window.location.origin}/blog/${id}`,
        });
        await incrementShares(id);
        setPost((prev: any) => ({ ...prev, shares_count: prev.shares_count + 1 }));
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/blog/${id}`);
      alert('Link copied to clipboard!');
      await incrementShares(id);
      setPost((prev: any) => ({ ...prev, shares_count: prev.shares_count + 1 }));
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    setSubmitting(true);
    const result = await addBlogComment(id, newComment);

    if (result.data) {
      setComments([result.data, ...comments]);
      setNewComment('');
      setPost((prev: any) => ({ ...prev, comments_count: prev.comments_count + 1 }));
    } else if (result.error) {
      alert('Failed to post comment: ' + result.error);
    }

    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    const result = await deleteBlogComment(commentId);
    if (result.success) {
      setComments(comments.filter((c) => c.id !== commentId));
      setPost((prev: any) => ({ ...prev, comments_count: Math.max(0, prev.comments_count - 1) }));
    }
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
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+|#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        );
      } else if (part.startsWith('#')) {
        return (
          <Link
            key={index}
            to={`/hashtag/${part.substring(1)}`}
            className="text-primary font-medium hover:underline"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
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

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Post not found</p>
      </div>
    );
  }

  const isOwner = user?.id === post.user_id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card">
        {/* Back Button */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to blog</span>
          </Link>
          
          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-xs font-medium text-foreground bg-secondary rounded hover:bg-secondary/80 transition-colors flex items-center gap-2"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                className="px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 rounded hover:bg-destructive/20 transition-colors flex items-center gap-2"
              >
                <Trash className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Cover Image */}
        {post.cover_image && (
          <div className="w-full h-64 md:h-96 bg-secondary overflow-hidden">
            <img
              src={post.cover_image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Post Header */}
        <div className="px-6 py-6">
          {/* Category & Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded uppercase tracking-wide font-medium">
              {post.category}
            </span>
            <span>•</span>
            <Calendar className="w-3.5 h-3.5" />
            <span>{getTimeAgo(post.published_at)}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-border">
            <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {post.user_profiles?.avatar_url ? (
                  <img
                    src={post.user_profiles.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {post.user_profiles?.username || 'Unknown'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {post.user_profiles?.bio || 'Sports enthusiast'}
                </div>
              </div>
            </Link>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <div className="text-lg text-muted-foreground mb-6 pb-6 border-b border-border leading-relaxed italic">
              {post.excerpt}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-8">
            <div className="text-base text-foreground leading-relaxed whitespace-pre-line">
              {renderContentWithMentions(post.content)}
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-secondary text-foreground text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats & Interactions */}
          <div className="flex items-center justify-between gap-4 py-4 border-y border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{post.views_count || 0} views</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  isLiked
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{post.likes_count || 0}</span>
              </button>

              <button
                onClick={() => {}}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{post.comments_count || 0}</span>
              </button>

              <button
                onClick={handleRepost}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  isReposted
                    ? 'text-green-500 hover:text-green-600'
                    : 'text-muted-foreground hover:text-green-500'
                }`}
              >
                <Repeat2 className="w-5 h-5" />
                <span className="font-medium">{post.reposts_count || 0}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-500 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="font-medium">{post.shares_count || 0}</span>
              </button>
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
  );
};

export default BlogPostDetailPage;
