import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { getUserProfile, updateUserProfile, uploadAvatar } from '../lib/api';
import { User, Camera, Loader2, Save, MapPin, Link as LinkIcon, Twitter, Instagram, X } from 'lucide-react';

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

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

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
    <div className="max-w-3xl mx-auto pb-20">
      <div className="bg-white">
        {/* Sticky Top Header with Save Button */}
        <div className="sticky top-14 bg-white z-20 border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/profile/${user?.id}`)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-6">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-4 ring-gray-100">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer px-5 py-2.5 text-sm font-medium bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <p className="text-xs text-gray-600 mt-2">Recommended: Square image, max 2MB (JPG, PNG, GIF)</p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Your display name"
                required
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={200}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-600">Share your story, interests, or profession</p>
              <p className={`text-xs ${profile.bio.length > 180 ? 'text-red-500' : 'text-gray-500'}`}>
                {profile.bio.length}/200
              </p>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Website</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Twitter</label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={profile.twitter}
                  onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="@username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Instagram</label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={profile.instagram}
                  onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="@username"
                />
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-bold text-blue-900 mb-2">Profile Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use a clear profile picture for better recognition</li>
              <li>• Write a compelling bio to attract followers</li>
              <li>• Add your location to connect with local users</li>
              <li>• Link your social media to build credibility</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
