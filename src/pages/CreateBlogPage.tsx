import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { createBlogPost, uploadBlogMedia } from '../lib/api';
import { Loader2, Save, Upload, X, Image as ImageIcon, Video } from 'lucide-react';

const categories = ['Football', 'Basketball', 'Tennis', 'Baseball', 'General'];

const CreateBlogPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [post, setPost] = useState({
    title: '',
    content: '',
    excerpt: '',
    cover_image: '',
    category: 'General',
    tags: [] as string[],
    published: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    setUploadingMedia(true);
    
    // Create temporary post to get ID (we'll save it first as draft)
    const tempPost = await createBlogPost({ ...post, published: false });
    
    if (tempPost.data) {
      const result = await uploadBlogMedia(tempPost.data.id, file);
      if (result.data) {
        setPost((prev) => ({ ...prev, cover_image: result.data }));
      } else {
        alert('Failed to upload cover image');
      }
    }
    
    setUploadingMedia(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!post.tags.includes(tagInput.trim())) {
        setPost({ ...post, tags: [...post.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setPost({ ...post, tags: post.tags.filter((t) => t !== tag) });
  };

  const handleSave = async (published: boolean) => {
    if (!post.title || !post.content || !post.category) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);

    const result = await createBlogPost({
      ...post,
      excerpt: post.excerpt || post.content.substring(0, 200) + '...',
      published,
    });

    if (result.error) {
      alert('Failed to create post: ' + result.error);
      setSaving(false);
    } else if (result.data) {
      navigate(`/blog/${result.data.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Create Blog Post</h1>
        </div>

        <div className="p-4 space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
            {post.cover_image ? (
              <div className="relative w-full h-48 rounded overflow-hidden bg-secondary">
                <img src={post.cover_image} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => setPost({ ...post, cover_image: '' })}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded cursor-pointer bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {uploadingMedia ? 'Uploading...' : 'Click to upload cover image'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                  disabled={uploadingMedia}
                />
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter an engaging title..."
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              value={post.category}
              onChange={(e) => setPost({ ...post, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type and press Enter to add tags..."
            />
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-foreground text-xs rounded"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Excerpt (Optional)</label>
            <textarea
              value={post.excerpt}
              onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Short description of your post..."
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground mt-1">{post.excerpt.length}/300 characters</p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Content <span className="text-destructive">*</span>
            </label>
            <textarea
              value={post.content}
              onChange={(e) => setPost({ ...post, content: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Write your story..."
              rows={16}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/blog')}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Publish
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlogPage;
