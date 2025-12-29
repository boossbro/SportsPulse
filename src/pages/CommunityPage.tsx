import { useState, useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import { getCommunityPosts, createCommunityPost } from '../lib/api';
import { Loader2, Image as ImageIcon, Video, Send, Heart, MessageCircle, Share2, User, Facebook, Twitter, Copy, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getCommunityPosts(50);
    setPosts(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setPosting(true);
    const result = await createCommunityPost(newPost, mediaFile || undefined);

    if (result.data) {
      setPosts([result.data, ...posts]);
      setNewPost('');
      setMediaFile(null);
    } else {
      alert('Failed to post: ' + result.error);
    }

    setPosting(false);
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
    
    return date.toLocaleDateString();
  };

  const handleShare = async (postId: string, content: string, platform?: string) => {
    const shareUrl = `${window.location.origin}/community/${postId}`;
    const shareText = content.substring(0, 200) + (content.length > 200 ? '...' : '');
    
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent('Check out this post')}&body=${encodeURIComponent(shareText + '\n\nView post: ' + shareUrl)}`;
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Link copied to clipboard!');
      } catch (err) {
        alert('Failed to copy link');
      }
    } else {
      if (navigator.share) {
        try {
          await navigator.share({
            text: shareText,
            url: shareUrl,
          });
        } catch (err) {
          console.log('Share cancelled');
        }
      } else {
        setShareMenuId(postId);
        return;
      }
    }
    
    setShareMenuId(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Create Post */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleSubmit}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's happening?"
            className="w-full px-0 py-2 text-base text-gray-900 placeholder-gray-500 border-0 focus:outline-none resize-none"
            rows={3}
          />

          {mediaFile && (
            <div className="mt-2 relative">
              <img
                src={URL.createObjectURL(mediaFile)}
                alt="Preview"
                className="w-full rounded-lg max-h-64 object-cover"
              />
              <button
                type="button"
                onClick={() => setMediaFile(null)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ImageIcon className="w-5 h-5 text-primary" />
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={!newPost.trim() || posting}
              className="px-5 py-2 bg-primary text-white rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {posting ? (
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
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm p-4">
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <Link to={`/profile/${post.user_id}`}>
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {post.user_profiles?.avatar_url ? (
                      <img
                        src={post.user_profiles.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </Link>
                <div className="flex-1">
                  <Link
                    to={`/profile/${post.user_id}`}
                    className="font-semibold text-gray-900 hover:text-primary transition-colors"
                  >
                    {post.user_profiles?.username || 'Unknown'}
                  </Link>
                  <div className="text-xs text-gray-500">{getTimeAgo(post.created_at)}</div>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-900 mb-3 whitespace-pre-line">{post.content}</p>

              {/* Media */}
              {post.media_url && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  {post.media_type === 'video' ? (
                    <video src={post.media_url} controls className="w-full" />
                  ) : (
                    <img src={post.media_url} alt="" className="w-full" />
                  )}
                </div>
              )}

              {/* Engagement */}
              <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">{post.likes_count || 0}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.comments_count || 0}</span>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => handleShare(post.id, post.content)}
                    className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">{post.shares_count || 0}</span>
                  </button>
                  
                  {shareMenuId === post.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setShareMenuId(null)}
                      />
                      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40 min-w-[180px]">
                        <button
                          onClick={() => handleShare(post.id, post.content, 'facebook')}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 w-full"
                        >
                          <Facebook className="w-4 h-4 text-blue-600" />
                          Facebook
                        </button>
                        <button
                          onClick={() => handleShare(post.id, post.content, 'twitter')}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-sky-50 w-full"
                        >
                          <Twitter className="w-4 h-4 text-sky-500" />
                          Twitter
                        </button>
                        <button
                          onClick={() => handleShare(post.id, post.content, 'whatsapp')}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 w-full"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => handleShare(post.id, post.content, 'copy')}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full border-t border-gray-100"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                          Copy Link
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
