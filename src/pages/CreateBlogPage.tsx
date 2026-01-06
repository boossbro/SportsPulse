import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { createBlogPost, uploadBlogMedia } from '../lib/api';
import { Loader2, Image as ImageIcon, X, Save, Eye, Hash } from 'lucide-react';

const categories = [
  'News',
  'Sports',
  'Entertainment',
  'Technology',
  'Business',
  'Health',
  'Lifestyle',
  'Politics',
];

const CreateBlogPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('News');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = () => {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverImage(null);
    setCoverPreview('');
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    setPublishing(true);

    let coverUrl = '';
    if (coverImage) {
      const tempPost = await createBlogPost({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200),
        category,
        published: false,
      });

      if (tempPost.data) {
        const uploadResult = await uploadBlogMedia(tempPost.data.id, coverImage);
        if (uploadResult.data) {
          coverUrl = uploadResult.data;
        }
      }
    }

    const result = await createBlogPost({
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      cover_image: coverUrl,
      category,
      published: true,
    });

    if (result.data) {
      navigate(`/story/${result.data.id}`);
    } else {
      alert('Failed to publish: ' + result.error);
    }

    setPublishing(false);
  };

  const handleSaveDraft = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    setSaving(true);

    let coverUrl = '';
    if (coverImage) {
      const tempPost = await createBlogPost({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200),
        category,
        published: false,
      });

      if (tempPost.data) {
        const uploadResult = await uploadBlogMedia(tempPost.data.id, coverImage);
        if (uploadResult.data) {
          coverUrl = uploadResult.data;
        }
      }
    }

    const result = await createBlogPost({
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      cover_image: coverUrl,
      category,
      published: false,
    });

    if (result.data) {
      alert('✅ Draft saved successfully!');
      navigate('/');
    } else {
      alert('Failed to save draft: ' + result.error);
    }

    setSaving(false);
  };

  const insertHashtag = () => {
    setContent(prev => prev + '#');
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Top Action Bar - Sticky */}
        <div className="sticky top-14 bg-white z-10 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={saving || publishing || !title.trim() || !content.trim()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Draft
              </button>
              
              <button
                onClick={handlePublish}
                disabled={publishing || saving || !title.trim() || !content.trim()}
                className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Publish
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="p-6">
          {/* Cover Image */}
          {coverPreview ? (
            <div className="mb-6 relative rounded-xl overflow-hidden">
              <img
                src={coverPreview}
                alt="Cover"
                className="w-full h-80 object-cover"
              />
              <button
                onClick={removeCover}
                className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          ) : (
            <label className="block mb-6 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-all">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">Add a cover image</p>
              <p className="text-sm text-gray-500">Recommended: 1200x630px, max 10MB</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />
            </label>
          )}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article Title"
            className="w-full text-4xl font-bold text-gray-900 placeholder-gray-400 border-0 focus:outline-none mb-6"
            maxLength={200}
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Write a brief excerpt (optional) - this will appear in previews"
            className="w-full px-0 py-3 text-lg text-gray-700 placeholder-gray-400 border-0 border-b border-gray-200 focus:outline-none resize-none mb-6"
            rows={2}
            maxLength={300}
          />

          {/* Content Editor */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your story... (Use # for hashtags, @ for mentions)"
              className="w-full px-0 py-4 text-lg text-gray-900 placeholder-gray-400 border-0 focus:outline-none resize-none"
              rows={20}
              style={{ minHeight: '400px' }}
            />

            {/* Quick Actions */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                onClick={insertHashtag}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                title="Insert hashtag"
              >
                <Hash className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Character Count */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div>
              {content.length > 0 && (
                <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {title.length > 0 && (
                <span className={title.length > 180 ? 'text-red-500' : ''}>
                  Title: {title.length}/200
                </span>
              )}
              {excerpt.length > 0 && (
                <span className={excerpt.length > 280 ? 'text-red-500' : ''}>
                  Excerpt: {excerpt.length}/300
                </span>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-bold text-blue-900 mb-2">Writing Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use <span className="font-semibold">#hashtags</span> to make your content discoverable</li>
              <li>• Mention users with <span className="font-semibold">@username</span></li>
              <li>• Add a compelling cover image to attract readers</li>
              <li>• Write a clear excerpt to give readers a preview</li>
              <li>• Use proper formatting and break content into paragraphs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlogPage;
