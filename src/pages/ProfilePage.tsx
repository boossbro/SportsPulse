import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import {
  getUserProfile,
  checkIsFollowing,
  followUser,
  unfollowUser,
  getUserBlogPosts,
  getUserAnalytics,
} from '../lib/api';
import {
  User, MapPin, Link as LinkIcon, Calendar, Users, FileText,
  Heart, MessageCircle, Share2, Edit, Loader2, TrendingUp,
} from 'lucide-react';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);

      const [profileData, postsData, analyticsData, followStatus] = await Promise.all([
        getUserProfile(id),
        getUserBlogPosts(id),
        getUserAnalytics(id),
        !isOwnProfile ? checkIsFollowing(id) : Promise.resolve(false),
      ]);

      setProfile(profileData);
      setPosts(postsData);
      setAnalytics(analyticsData);
      setIsFollowing(followStatus);
      setLoading(false);
    };

    loadProfile();
  }, [id, isOwnProfile]);

  const handleFollow = async () => {
    if (!id) return;
    setFollowLoading(true);

    if (isFollowing) {
      const result = await unfollowUser(id);
      if (result.success) {
        setIsFollowing(false);
        setProfile((prev: any) => ({
          ...prev,
          followers_count: Math.max(0, (prev?.followers_count || 0) - 1),
        }));
      }
    } else {
      const result = await followUser(id);
      if (result.success) {
        setIsFollowing(true);
        setProfile((prev: any) => ({
          ...prev,
          followers_count: (prev?.followers_count || 0) + 1,
        }));
      }
    }

    setFollowLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-card">
        {/* Profile Header */}
        <div className="px-4 py-6 border-b border-border">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground truncate">
                  {profile.username}
                </h1>
                {isOwnProfile ? (
                  <Link
                    to="/profile/edit"
                    className="px-4 py-1.5 text-sm font-medium bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Link>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                      isFollowing
                        ? 'bg-secondary text-foreground hover:bg-secondary/80'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      'Following'
                    ) : (
                      'Follow'
                    )}
                  </button>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3">{profile.email}</p>

              {profile.bio && (
                <p className="text-sm text-foreground mb-3">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{profile.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-bold text-foreground">{profile.posts_count || 0}</span>
                <span className="text-muted-foreground ml-1">Posts</span>
              </span>
            </div>
            <Link
              to={`/profile/${id}/followers`}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-bold text-foreground">{profile.followers_count || 0}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </span>
            </Link>
            <Link
              to={`/profile/${id}/following`}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-bold text-foreground">{profile.following_count || 0}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Analytics (Own Profile Only) */}
        {isOwnProfile && analytics && (
          <div className="px-4 py-4 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wide">Your Analytics</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded p-3 border border-border">
                <div className="text-xs text-muted-foreground mb-1">Profile Views</div>
                <div className="text-2xl font-bold text-foreground">{analytics.profile_views || 0}</div>
              </div>
              <div className="bg-card rounded p-3 border border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Heart className="w-3 h-3" />
                  Total Likes
                </div>
                <div className="text-2xl font-bold text-foreground">{analytics.total_likes || 0}</div>
              </div>
              <div className="bg-card rounded p-3 border border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <MessageCircle className="w-3 h-3" />
                  Total Comments
                </div>
                <div className="text-2xl font-bold text-foreground">{analytics.total_comments || 0}</div>
              </div>
              <div className="bg-card rounded p-3 border border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Share2 className="w-3 h-3" />
                  Engagement
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {analytics.engagement_rate ? `${analytics.engagement_rate}%` : '0%'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User's Blog Posts */}
        <div className="px-4 py-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4">
            Blog Posts ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {isOwnProfile ? "You haven't published any posts yet" : 'No posts yet'}
              </p>
              {isOwnProfile && (
                <Link
                  to="/blog/new"
                  className="inline-block mt-3 px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  Create Your First Post
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.id}`}
                  className="block p-3 border border-border rounded hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex gap-3">
                    {post.cover_image && (
                      <div className="w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-secondary">
                        <img
                          src={post.cover_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="uppercase font-medium">{post.category}</span>
                        <span>•</span>
                        <span>{new Date(post.published_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{post.views_count} views</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
