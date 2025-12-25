import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { getUserProfile, updateUserProfile, uploadAvatar } from '../lib/api';
import { User, Camera, Loader2, Save, MapPin, Link as LinkIcon, Twitter, Instagram } from 'lucide-react';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    instagram: '',
    avatar_url: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const data = await getUserProfile(user.id);
      if (data) {
        setProfile({
          username: data.username || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          twitter: data.twitter || '',
          instagram: data.instagram || '',
          avatar_url: data.avatar_url || '',
        });
      }
      setLoading(false);
    };

    loadProfile();
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB for avatars)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    const result = await uploadAvatar(user.id, file);

    if (result.error) {
      alert('Failed to upload avatar: ' + result.error);
    } else if (result.data) {
      setProfile((prev) => ({ ...prev, avatar_url: result.data }));
    }

    setUploadingAvatar(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const result = await updateUserProfile(user.id, {
      username: profile.username,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      twitter: profile.twitter,
      instagram: profile.instagram,
    });

    if (result.error) {
      alert('Failed to update profile: ' + result.error);
    } else {
      navigate(`/profile/${user.id}`);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-6">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 text-sm font-medium bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Change Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Max 2MB. JPG, PNG, or GIF</p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your display name"
                required
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">{profile.bio.length}/200 characters</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Website</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Twitter</label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={profile.twitter}
                  onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="@username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Instagram</label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={profile.instagram}
                  onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="@username"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(`/profile/${user?.id}`)}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
