import { FilePicker } from '@capawesome/capacitor-file-picker';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { uploadVideoStory } from '../lib/api';
import { Loader2, Upload, Video, Image as ImageIcon, X } from 'lucide-react';

const categories = ['News', 'Sports', 'Entertainment', 'Technology', 'Business', 'Health', 'Lifestyle', 'Politics'];

const CreateVideoPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Entertainment',
  });

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('Video size must be less than 100MB');
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Thumbnail size must be less than 10MB');
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile || !formData.title || !formData.category) {
      alert('Please fill in all required fields and select a video');
      return;
    }

    setUploading(true);

    const result = await uploadVideoStory(
      formData.title,
      formData.description,
      formData.category,
      videoFile,
      thumbnailFile || undefined
    );

    if (result.error) {
      alert('Failed to upload video: ' + result.error);
      setUploading(false);
    } else {
      navigate('/videos');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Upload Video</h1>
          <p className="text-sm text-gray-600 mt-1">Share your video story with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Video <span className="text-red-500">*</span>
            </label>
            {videoPreview ? (
              <div className="relative">
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-96 rounded-lg bg-black"
                />
                <button
                  type="button"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview('');
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">Click to upload video</p>
                <p className="text-xs text-gray-500">MP4, WebM, or AVI (max 100MB)</p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
            )}
            {videoFile && (
              <p className="text-xs text-gray-600 mt-2">
                Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Thumbnail (Optional)
            </label>
            {thumbnailPreview ? (
              <div className="relative w-full h-48">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailFile(null);
                    setThumbnailPreview('');
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">Click to upload thumbnail</p>
                <p className="text-xs text-gray-500">JPG, PNG (max 10MB)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Give your video a catchy title..."
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Tell viewers what your video is about..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/videos')}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !videoFile || !formData.title}
              className="px-6 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Upload Video
                </>
              )}
            </button>
          </div>

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium">
                Uploading your video... This may take a few minutes depending on file size.
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Please don't close this page until upload is complete.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateVideoPage;

import { FilePicker } from '@capawesome/capacitor-file-picker';

const pickAndUploadVideo = async () => {
  try {
    const result = await FilePicker.pickVideos({
      multiple: false,
    });

    if (result.files.length === 0) return;

    const file = result.files[0];

    if (!file.blob) {
      alert("Failed to read video file");
      return;
    }

    const uploadFile = new File([file.blob], file.name, { type: file.mimeType });

    // Change 'videos' to your actual Supabase bucket name if it's different
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(`public/${Date.now()}_${file.name}`, uploadFile, {
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + error.message);
    } else {
      console.log("Video uploaded:", data);
      alert("Video uploaded successfully!");
      // Refresh the page to show the new video
      window.location.reload();
    }
  } catch (err) {
    console.error("Video picker error:", err);
    alert("Could not select video. Please try again.");
  }
};
