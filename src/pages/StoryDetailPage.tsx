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
  Share2,
  User,
  Send,
  Clock,
  Eye,
  Bookmark,
  Facebook,
  Twitter,
  Copy,
  Linkedin,
  Mail,
} from 'lucide-react';
import { useHistory } from '../hooks/useHistory';

const StoryDetailPage = () => {
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
  const [showShareMenu, setShowShareMenu] = useState(false);
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
          type: 'story',
          title: result.data.title,
          subtitle: result.data.category,
          link: `/story/${result.data.id}`,
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

  const handleShare = async (platform?: string) => {
    if (!id) return;
    const shareUrl = `${window.location.origin}/story/${id}`;
    const shareText = `${post.title}\n\n${post.excerpt || post.content.substring(0, 200)}...`;
    
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      await incrementShares(id);
      setPost((prev: any) => ({ ...prev, shares_count: prev.shares_count + 1 }));
      setShowShareMenu(false);
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`, '_blank');
      await incrementShares(id);
      setPost((prev: any) => ({ ...prev, shares_count: prev.shares_count + 1 }));
      setShowShareMenu(false);
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
      await incrementShares(id);
      setPost((prev: any) => ({ ...prev, shares_count: prev.shares_count + 1 }));
      setShowShareMenu(false);
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
      await incrementShares(id);
      setPost((prev: any) => ({ ...prev, shares_count: prev.shares_count + 1 }));
      setShowShareMenu(false);
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareText + '\n\nRead more: ' + shareUrl)}`;
      await incrementShares(id);
      setPost((prev: any) => ({ ...prev, shares_count: prev.shares_count + 1 }));
      setShowShareMenu(false);
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Link copied to clipboard!');
        await incrementShares(id);
        setPost((prev: any) => ({ ...prev, shares_count: prev.shares_count + 1 }));
        setShowShareMenu(false);
      } catch (err) {
        alert('Failed to copy link');
      }
    } else {
      // Try native share first
      if (navigator.share) {
        try {
          await navigator.share({
            title: post.title,
            text: post.excerpt || post.content.substring(0, 200),
            url: shareUrl,
          });
          await incrementShares(id);
          setPost((prev: any) => ({ ...prev, shares_count: prev.shares_count + 1 }));
        } catch (err) {
          // User cancelled share
          console.log('Share cancelled');
        }
      } else {
        // Show custom share menu
        setShowShareMenu(true);
      }
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
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
        <p className="text-center text-gray-600">Story not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen">
      {/* Back Button */}
      <div className="px-4 py-3 border-b border-gray-200 sticky top-14 bg-white z-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Article Content */}
      <article className="px-4 py-6">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold uppercase rounded">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Author & Meta */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {post.user_profiles?.avatar_url ? (
                <img
                  src={post.user_profiles.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {post.user_profiles?.username || 'Anonymous'}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{getTimeAgo(post.published_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{post.views_count || 0} views</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Cover Image */}
        {post.cover_image && (
          <div className="w-full rounded-lg overflow-hidden mb-6">
            <img
              src={post.cover_image}
              alt=""
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <div className="text-lg text-gray-700 mb-6 leading-relaxed font-medium italic">
            {post.excerpt}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-8">
          <div className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>

        {/* Hashtags & Tags */}
        {((post.hashtags && post.hashtags.length > 0) || (post.tags && post.tags.length > 0)) && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {/* Display extracted hashtags */}
              {post.hashtags && post.hashtags.map((hashtag: any) => (
                <Link
                  key={hashtag.tag}
                  to={`/hashtag/${hashtag.tag}`}
                  className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full hover:bg-primary/20 transition-colors"
                >
                  #{hashtag.tag}
                  {hashtag.usage_count > 1 && (
                    <span className="ml-1 text-xs opacity-75">({hashtag.usage_count})</span>
                  )}
                </Link>
              ))}
              {/* Display manual tags */}
              {post.tags && post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Bar */}
        <div className="flex items-center justify-between gap-4 py-4 border-y border-gray-200 mb-6">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isLiked
                  ? 'text-red-500'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes_count || 0}</span>
            </button>

            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments_count || 0}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => handleShare()}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>{post.shares_count || 0}</span>
              </button>

              {/* Share Menu */}
              {showShareMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowShareMenu(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40 min-w-[200px]">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Share this story</p>
                    </div>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 w-full transition-colors"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span>Facebook</span>
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 w-full transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-sky-500" />
                      <span>Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 w-full transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-blue-700" />
                      <span>LinkedIn</span>
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 w-full transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleShare('email')}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                    >
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span>Email</span>
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => handleShare('copy')}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                        <span>Copy Link</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <button className="text-gray-400 hover:text-primary transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Join the discussion..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${comment.user_id}`} className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {comment.user_profiles?.avatar_url ? (
                          <img
                            src={comment.user_profiles.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div>
                          <Link
                            to={`/profile/${comment.user_id}`}
                            className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors"
                          >
                            {comment.user_profiles?.username || 'Anonymous'}
                          </Link>
                          <span className="text-xs text-gray-500 ml-2">
                            {getTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        {user?.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </article>
    </div>
  );
};

export default StoryDetailPage;
