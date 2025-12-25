import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTrendingHashtags, getPostsByHashtag } from '../lib/api';
import { Loader2, Hash, TrendingUp, User } from 'lucide-react';

const TrendingPage = () => {
  const { tag } = useParams();
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState(tag || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tag]);

  const loadData = async () => {
    setLoading(true);
    const hashtags = await getTrendingHashtags(20);
    setTrendingHashtags(hashtags);

    if (tag) {
      const tagPosts = await getPostsByHashtag(tag);
      setPosts(tagPosts);
      setSelectedTag(tag);
    }

    setLoading(false);
  };

  const handleTagClick = async (tagName: string) => {
    setSelectedTag(tagName);
    const tagPosts = await getPostsByHashtag(tagName);
    setPosts(tagPosts);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-4">
        {/* Trending List */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-card border-b border-border sticky top-14">
            <div className="px-4 py-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Trending</h1>
            </div>

            <div>
              {trendingHashtags.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No trending hashtags yet</p>
                </div>
              ) : (
                trendingHashtags.map((tag, index) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.tag)}
                    className={`w-full text-left border-b border-border p-4 hover:bg-secondary/30 transition-colors ${
                      selectedTag === tag.tag ? 'bg-secondary/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground font-medium mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Hash className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm font-bold text-foreground truncate">
                            {tag.tag}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tag.usage_count} {tag.usage_count === 1 ? 'post' : 'posts'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Posts for Selected Tag */}
        <div className="flex-1 min-w-0">
          <div className="bg-card">
            {selectedTag ? (
              <>
                <div className="px-4 py-4 border-b border-border sticky top-14 bg-card z-10">
                  <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">#{selectedTag}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                  </p>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <Hash className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">No posts with this hashtag yet</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.id}`}
                      className="block border-b border-border hover:bg-secondary/30 transition-colors"
                    >
                      <div className="p-4">
                        {/* Author Info */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                            {post.user_profiles?.avatar_url ? (
                              <img
                                src={post.user_profiles.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {post.user_profiles?.username || 'Unknown'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getTimeAgo(post.published_at)}
                            </div>
                          </div>
                        </div>

                        {/* Post Content */}
                        <h3 className="text-base font-bold text-foreground mb-2 hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>{post.likes_count || 0} likes</span>
                          <span>{post.comments_count || 0} comments</span>
                          <span>{post.views_count || 0} views</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </>
            ) : (
              <div className="text-center py-16 px-4">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Select a hashtag to see posts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingPage;
