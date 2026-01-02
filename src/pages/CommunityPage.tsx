import { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { 
  getCommunityPosts, 
  createCommunityPost,
  likeCommunityPost,
  unlikeCommunityPost,
  checkIsCommunityPostLiked,
  repostCommunityPost,
  unrepostCommunityPost,
  checkIsCommunityPostReposted,
  getCommunityComments,
  addCommunityComment
} from '../lib/api';
import { Loader2, Image as ImageIcon, Video, Heart, MessageCircle, Share2, User, Twitter, Copy, X, Repeat, BarChart2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdPlacement from '../components/ads/AdPlacement';

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [posting, setPosting] = useState(false);
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [postStates, setPostStates] = useState<Map<string, { liked: boolean; reposted: boolean }>>(new Map());
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [postComments, setPostComments] = useState<Map<string, any[]>>(new Map());
  const [viewingComments, setViewingComments] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getCommunityPosts(50);
    setPosts(data);
    
    // Load interaction states
    const states = new Map();
    for (const post of data) {
      const [liked, reposted] = await Promise.all([
        checkIsCommunityPostLiked(post.id),
        checkIsCommunityPostReposted(post.id),
      ]);
      states.set(post.id, { liked, reposted });
    }
    setPostStates(states);
    
    setLoading(false);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !mediaFile) return;

    setPosting(true);
    const result = await createCommunityPost(newPost, mediaFile || undefined);

    if (result.data) {
      setPosts([result.data, ...posts]);
      setNewPost('');
      setMediaFile(null);
      setMediaPreview('');
      setPostStates(prev => new Map(prev).set(result.data.id, { liked: false, reposted: false }));
    } else {
      alert('Failed to post: ' + result.error);
    }

    setPosting(false);
  };

  const handleLike = async (postId: string) => {
    const state = postStates.get(postId);
    const isLiked = state?.liked || false;

    if (isLiked) {
      await unlikeCommunityPost(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p
      ));
    } else {
      await likeCommunityPost(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
      ));
    }

    setPostStates(prev => new Map(prev).set(postId, { ...state!, liked: !isLiked }));
  };

  const handleRepost = async (postId: string) => {
    const state = postStates.get(postId);
    const isReposted = state?.reposted || false;

    if (isReposted) {
      await unrepostCommunityPost(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, reposts_count: Math.max(0, (p.reposts_count || 0) - 1) } : p
      ));
    } else {
      await repostCommunityPost(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, reposts_count: (p.reposts_count || 0) + 1 } : p
      ));
    }

    setPostStates(prev => new Map(prev).set(postId, { ...state!, reposted: !isReposted }));
  };

  const handleViewComments = async (postId: string) => {
    if (viewingComments === postId) {
      setViewingComments(null);
      return;
    }

    const comments = await getCommunityComments(postId);
    setPostComments(prev => new Map(prev).set(postId, comments));
    setViewingComments(postId);
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;

    const result = await addCommunityComment(postId, commentText);
    if (result.data) {
      setPostComments(prev => new Map(prev).set(postId, [...(prev.get(postId) || []), result.data]));
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
      setCommentText('');
      setCommentingOnPost(null);
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
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleShare = async (postId: string, content: string, platform?: string) => {
    const shareUrl = `${window.location.origin}/community/${postId}`;
    
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Link copied!');
      } catch (err) {
        alert('Failed to copy');
      }
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(content.substring(0, 200))}`, '_blank');
    }
    
    setShareMenuId(null);
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white pb-20">
      {/* Header with Tabs */}
      <div className="sticky top-14 bg-white z-10 border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('foryou')}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative ${
              activeTab === 'foryou' ? 'text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            For you
            {activeTab === 'foryou' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative ${
              activeTab === 'following' ? 'text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Following
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Create Post */}
      <div className="border-b-8 border-gray-100 p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Link to={`/profile/${user?.id}`} className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </Link>
            
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's happening?"
                className="w-full px-0 py-2 text-base text-gray-900 placeholder-gray-500 border-0 focus:outline-none resize-none"
                rows={3}
              />

              {mediaPreview && (
                <div className="mt-3 relative rounded-2xl overflow-hidden border border-gray-200">
                  {mediaFile?.type.startsWith('video/') ? (
                    <video src={mediaPreview} controls className="w-full max-h-96" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full max-h-96 object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 p-1.5 bg-gray-900/80 hover:bg-gray-900 text-white rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <label className="cursor-pointer p-2 hover:bg-primary/10 rounded-full transition-colors">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <input type="file" accept="image/*" onChange={handleMediaSelect} className="hidden" />
                  </label>
                  <label className="cursor-pointer p-2 hover:bg-primary/10 rounded-full transition-colors">
                    <Video className="w-5 h-5 text-primary" />
                    <input type="file" accept="video/*" onChange={handleMediaSelect} className="hidden" />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={(!newPost.trim() && !mediaFile) || posting}
                  className="px-5 py-2 bg-primary text-white rounded-full font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Ad Placement */}
      <div className="p-4">
        <AdPlacement provider="adsense" format="horizontal" />
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div>
          {posts.map((post, index) => {
            const state = postStates.get(post.id) || { liked: false, reposted: false };
            const comments = postComments.get(post.id) || [];
            
            return (
              <div key={post.id}>
                <div className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3">
                    <Link to={`/profile/${post.user_id}`} className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {post.user_profiles?.avatar_url ? (
                          <img src={post.user_profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/profile/${post.user_id}`} className="font-bold text-gray-900 hover:underline">
                          {post.user_profiles?.username || 'Unknown'}
                        </Link>
                        <span className="text-gray-500">·</span>
                        <span className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</span>
                      </div>

                      <p className="text-gray-900 mb-3 whitespace-pre-line leading-relaxed">{post.content}</p>

                      {post.media_url && (
                        <div className="mb-3 rounded-2xl overflow-hidden border border-gray-200">
                          {post.media_type === 'video' ? (
                            <video src={post.media_url} controls className="w-full max-h-96" />
                          ) : (
                            <img src={post.media_url} alt="" className="w-full max-h-96 object-cover" />
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between max-w-md mt-2">
                        <button 
                          onClick={() => handleViewComments(post.id)}
                          className="group flex items-center gap-2 p-2 -ml-2 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <MessageCircle className="w-5 h-5 text-gray-500 group-hover:text-blue-500" />
                          <span className="text-sm text-gray-500 group-hover:text-blue-500">{post.comments_count || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleRepost(post.id)}
                          className="group flex items-center gap-2 p-2 hover:bg-green-50 rounded-full transition-colors"
                        >
                          <Repeat className={`w-5 h-5 ${state.reposted ? 'text-green-500' : 'text-gray-500 group-hover:text-green-500'}`} />
                          <span className={`text-sm ${state.reposted ? 'text-green-500' : 'text-gray-500 group-hover:text-green-500'}`}>{post.reposts_count || 0}</span>
                        </button>

                        <button 
                          onClick={() => handleLike(post.id)}
                          className="group flex items-center gap-2 p-2 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Heart className={`w-5 h-5 ${state.liked ? 'fill-red-500 text-red-500' : 'text-gray-500 group-hover:text-red-500'}`} />
                          <span className={`text-sm ${state.liked ? 'text-red-500' : 'text-gray-500 group-hover:text-red-500'}`}>{post.likes_count || 0}</span>
                        </button>

                        <div className="relative">
                          <button 
                            onClick={() => setShareMenuId(post.id)}
                            className="group flex items-center gap-2 p-2 hover:bg-primary/10 rounded-full transition-colors"
                          >
                            <Share2 className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                          </button>
                          
                          {shareMenuId === post.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setShareMenuId(null)} />
                              <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-40 min-w-[200px]">
                                <button onClick={() => handleShare(post.id, post.content, 'copy')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full">
                                  <Copy className="w-4 h-4" />
                                  Copy link
                                </button>
                                <button onClick={() => handleShare(post.id, post.content, 'twitter')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full">
                                  <Twitter className="w-4 h-4" />
                                  Share via Twitter
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <button className="group flex items-center gap-2 p-2 hover:bg-primary/10 rounded-full transition-colors">
                          <BarChart2 className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                        </button>
                      </div>

                      {/* Comments Section */}
                      {viewingComments === post.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {/* Comment Input */}
                          <div className="flex gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {user?.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={commentingOnPost === post.id ? commentText : ''}
                                onChange={(e) => {
                                  setCommentingOnPost(post.id);
                                  setCommentText(e.target.value);
                                }}
                                placeholder="Write a reply..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-primary"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentText.trim()}
                                className="p-2 bg-primary text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Comments List */}
                          <div className="space-y-3">
                            {comments.map((comment) => (
                              <div key={comment.id} className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {comment.user_profiles?.avatar_url ? (
                                    <img src={comment.user_profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-4 h-4 text-gray-500" />
                                  )}
                                </div>
                                <div className="flex-1 bg-gray-100 rounded-2xl px-3 py-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {comment.user_profiles?.username || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-gray-500">{getTimeAgo(comment.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-gray-900">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {index > 0 && (index + 1) % 5 === 0 && (
                  <div className="p-4 border-b-8 border-gray-100">
                    <AdPlacement provider="propeller" format="rectangle" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
