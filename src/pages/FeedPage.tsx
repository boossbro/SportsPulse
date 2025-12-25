import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { getFeedPosts, likeBlogPost, unlikeBlogPost, repostBlogPost, unrepostBlogPost, checkIsLiked, checkIsReposted, incrementShares, getBlogComments, addBlogComment, deleteBlogComment, getTrendingHashtags } from '../lib/api';
import { Loader2, Heart, Repeat2, Share2, MessageCircle, User, Send, TrendingUp, Hash } from 'lucide-react';

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFeed();
    loadTrending();
  }, []);

  const loadFeed = async () => {
    const data = await getFeedPosts(30);
    
    // Check like/repost status for each post
    const enrichedPosts = await Promise.all(
      data.map(async (post: any) => ({
        ...post,
        isLiked: await checkIsLiked(post.id),
        isReposted: await checkIsReposted(post.id),
      }))
    );
    
    setPosts(enrichedPosts);
    setLoading(false);
  };

  const loadTrending = async () => {
    const hashtags = await getTrendingHashtags(10);
    setTrendingHashtags(hashtags);
  };

  const loadComments = async (postId: string) => {
    const data = await getBlogComments(postId);
    setComments((prev) => ({ ...prev, [postId]: data }));
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      await unlikeBlogPost(postId);
    } else {
      await likeBlogPost(postId);
    }
    
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
              isLiked: !isLiked,
            }
          : p
      )
    );
  };

  const handleRepost = async (postId: string, isReposted: boolean) => {
    if (isReposted) {
      await unrepostBlogPost(postId);
    } else {
      await repostBlogPost(postId);
    }
    
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              reposts_count: isReposted ? p.reposts_count - 1 : p.reposts_count + 1,
              isReposted: !isReposted,
            }
          : p
      )
    );
  };

  const handleShare = async (postId: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share this post',
          url: `${window.location.origin}/blog/${postId}`,
        });
        await incrementShares(postId);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, shares_count: p.shares_count + 1 } : p
          )
        );
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/blog/${postId}`);
      alert('Link copied to clipboard!');
      await incrementShares(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, shares_count: p.shares_count + 1 } : p
        )
      );
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        await loadComments(postId);
      }
    }
  };

  const handleSubmitComment = async (postId: string) => {
    if (!newComment[postId]?.trim()) return;

    setSubmitting(true);
    const result = await addBlogComment(postId, newComment[postId]);

    if (result.data) {
      setComments((prev) => ({
        ...prev,
        [postId]: [result.data, ...(prev[postId] || [])],
      }));
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );
    }

    setSubmitting(false);
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const result = await deleteBlogComment(commentId);
    if (result.success) {
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].filter((c) => c.id !== commentId),
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
        )
      );
    }
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex gap-4">
      {/* Main Feed */}
      <div className="flex-1 min-w-0">
        <div className="bg-card">
          {/* Header */}
          <div className="px-4 py-4 border-b border-border sticky top-14 bg-card z-10">
            <h1 className="text-xl font-bold text-foreground">Feed</h1>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">No posts yet</p>
              <Link
                to="/blog/new"
                className="inline-block px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Create First Post
              </Link>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="border-b border-border">
                <div className="p-4">
                  {/* Author Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <Link to={`/profile/${post.user_id}`} className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {post.user_profiles?.avatar_url ? (
                          <img
                            src={post.user_profiles.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${post.user_id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {post.user_profiles?.username || 'Unknown'}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {getTimeAgo(post.published_at)} • {post.category}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <Link to={`/blog/${post.id}`} className="block">
                    <h2 className="text-lg font-bold text-foreground mb-2 hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {renderContentWithMentions(post.excerpt)}
                      </p>
                    )}
                    {post.cover_image && (
                      <div className="w-full h-64 rounded overflow-hidden bg-secondary mb-3">
                        <img
                          src={post.cover_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </Link>

                  {/* Interaction Buttons */}
                  <div className="flex items-center gap-6 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => handleLike(post.id, post.isLiked)}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        post.isLiked
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-muted-foreground hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes_count || 0}</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count || 0}</span>
                    </button>

                    <button
                      onClick={() => handleRepost(post.id, post.isReposted)}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        post.isReposted
                          ? 'text-green-500 hover:text-green-600'
                          : 'text-muted-foreground hover:text-green-500'
                      }`}
                    >
                      <Repeat2 className="w-4 h-4" />
                      <span>{post.reposts_count || 0}</span>
                    </button>

                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{post.shares_count || 0}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedPost === post.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      {/* Comment Input */}
                      <div className="mb-4">
                        <textarea
                          value={newComment[post.id] || ''}
                          onChange={(e) =>
                            setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="Write a comment..."
                          className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          rows={2}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={!newComment[post.id]?.trim() || submitting}
                            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                Post
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3">
                        {(comments[post.id] || []).map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <Link to={`/profile/${comment.user_id}`} className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                {comment.user_profiles?.avatar_url ? (
                                  <img
                                    src={comment.user_profiles.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0 bg-secondary rounded p-2">
                              <div className="flex items-center justify-between mb-1">
                                <Link
                                  to={`/profile/${comment.user_id}`}
                                  className="text-xs font-semibold text-foreground hover:text-primary transition-colors"
                                >
                                  {comment.user_profiles?.username || 'Unknown'}
                                </Link>
                                {user?.id === comment.user_id && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                    className="text-xs text-destructive hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-foreground">{comment.content}</p>
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {getTimeAgo(comment.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trending Sidebar */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-14 bg-card rounded border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
              Trending Hashtags
            </h2>
          </div>
          <div className="space-y-2">
            {trendingHashtags.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trending hashtags yet</p>
            ) : (
              trendingHashtags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/hashtag/${tag.tag}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">#{tag.tag}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{tag.usage_count} posts</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default FeedPage;
