import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { getAllBlogPosts } from '../lib/api';
import { FileText, Loader2, PlusCircle, User, Eye, Heart, MessageCircle } from 'lucide-react';

const BlogPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      const data = await getAllBlogPosts(50);
      setPosts(data);
      setLoading(false);
    };

    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-card">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Community Blog</h1>
          {user && (
            <Link
              to="/blog/new"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Write Post
            </Link>
          )}
        </div>

        {/* Posts List */}
        <div>
          {posts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">No blog posts yet</p>
              {user && (
                <Link
                  to="/blog/new"
                  className="inline-block px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  Be the first to write!
                </Link>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="block border-b border-border hover:bg-secondary/30 transition-colors"
              >
                <div className="p-4">
                  <div className="flex gap-4">
                    {/* Cover Image */}
                    {post.cover_image && (
                      <div className="w-32 h-24 flex-shrink-0 rounded overflow-hidden bg-secondary">
                        <img
                          src={post.cover_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Author Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                          {post.user_profiles?.avatar_url ? (
                            <img
                              src={post.user_profiles.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <Link
                          to={`/profile/${post.user_id}`}
                          className="text-xs font-medium text-foreground hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.user_profiles?.username || 'Unknown'}
                        </Link>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Title & Excerpt */}
                      <h2 className="text-lg font-bold text-foreground line-clamp-2 mb-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="uppercase font-medium px-2 py-1 bg-secondary rounded">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {post.views_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {post.likes_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {post.comments_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
