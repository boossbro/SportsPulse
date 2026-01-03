import { supabase } from './supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

// ============================================
// PAGINATION & LAZY LOADING
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const uploadAvatar = async (userId: string, file: File) => {
  try {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File size must be less than 2MB');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    await supabase.storage.from('avatars').remove([fileName]);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    await updateUserProfile(userId, { avatar_url: data.publicUrl });

    return { data: data.publicUrl, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// ============================================
// SEARCH FUNCTIONS
// ============================================

export const searchUsers = async (query: string, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, email, avatar_url, bio')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error searching users:', error);
    return [];
  }
};

export const searchHashtags = async (query: string, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .select('*')
      .ilike('tag', `%${query}%`)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error searching hashtags:', error);
    return [];
  }
};

export const searchBlogPosts = async (query: string, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, user_profiles(id, username, avatar_url)')
      .eq('published', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error searching blog posts:', error);
    return [];
  }
};

export const searchCommunityPosts = async (query: string, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*, user_profiles(id, username, avatar_url)')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error searching community posts:', error);
    return [];
  }
};

export const searchVideos = async (query: string, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('video_stories')
      .select('*, user_profiles(id, username, avatar_url)')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error searching videos:', error);
    return [];
  }
};

export const globalSearch = async (query: string) => {
  const [users, hashtags, blogPosts, communityPosts, videos] = await Promise.all([
    searchUsers(query, 5),
    searchHashtags(query, 5),
    searchBlogPosts(query, 10),
    searchCommunityPosts(query, 10),
    searchVideos(query, 5),
  ]);

  return {
    users,
    hashtags,
    blogPosts,
    communityPosts,
    videos,
  };
};

// ============================================
// FOLLOW SYSTEM
// ============================================

export const followUser = async (followingId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('followers').insert({
      follower_id: user.id,
      following_id: followingId,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const unfollowUser = async (followingId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('followers').delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const checkIsFollowing = async (userId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error: any) {
    return false;
  }
};

// ============================================
// BLOG POSTS FUNCTIONS WITH PAGINATION
// ============================================

export const getUserBlogPosts = async (userId: string, params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('blog_posts')
      .select('*, user_profiles(id, username, avatar_url)', { count: 'exact' })
      .eq('user_id', userId)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const getAllBlogPosts = async (params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('blog_posts')
      .select('*, user_profiles(id, username, avatar_url)', { count: 'exact' })
      .eq('published', true)
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const getFeedPosts = async (params?: PaginationParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], hasMore: false, total: 0 };

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('blog_posts')
      .select('*, user_profiles(id, username, avatar_url)', { count: 'exact' })
      .eq('published', true)
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching feed posts:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const getBlogPostById = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, user_profiles(id, username, avatar_url), blog_media(*)')
      .eq('id', postId)
      .single();

    if (error) throw error;

    // Get hashtags for this post
    const { data: postHashtags } = await supabase
      .from('blog_post_hashtags')
      .select('hashtags(tag, usage_count)')
      .eq('post_id', postId);

    // Increment view count
    await supabase.from('blog_posts').update({
      views_count: (data.views_count || 0) + 1
    }).eq('id', postId);

    return { 
      data: {
        ...data,
        hashtags: postHashtags?.map((h: any) => h.hashtags) || []
      }, 
      error: null 
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

const extractHashtags = (content: string): string[] => {
  // Extract hashtags from content (supports letters, numbers, underscores)
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags = [];
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    // Only include hashtags with at least 2 characters
    if (tag.length >= 2) {
      hashtags.push(tag);
    }
  }
  return [...new Set(hashtags)];
};

const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  return [...new Set(mentions)];
};

export const createBlogPost = async (post: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const hashtags = extractHashtags(post.content + ' ' + post.title);
    const mentions = extractMentions(post.content);

    const { data, error } = await supabase.from('blog_posts').insert({
      user_id: user.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      cover_image: post.cover_image,
      category: post.category,
      tags: post.tags || [],
      published: post.published || false,
      published_at: post.published ? new Date().toISOString() : null,
    }).select().single();

    if (error) throw error;

    // Process hashtags
    for (const tag of hashtags) {
      const { data: existingTag } = await supabase
        .from('hashtags')
        .select('id, usage_count')
        .eq('tag', tag)
        .maybeSingle();

      if (existingTag) {
        await supabase
          .from('hashtags')
          .update({ usage_count: existingTag.usage_count + 1, updated_at: new Date().toISOString() })
          .eq('id', existingTag.id);
        
        await supabase.from('blog_post_hashtags').insert({
          post_id: data.id,
          hashtag_id: existingTag.id,
        });
      } else {
        const { data: newTag } = await supabase
          .from('hashtags')
          .insert({ tag, usage_count: 1 })
          .select()
          .single();
        
        if (newTag) {
          await supabase.from('blog_post_hashtags').insert({
            post_id: data.id,
            hashtag_id: newTag.id,
          });
        }
      }
    }

    // Process mentions
    for (const mention of mentions) {
      const { data: mentionedUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', mention)
        .maybeSingle();

      if (mentionedUser) {
        await supabase.from('blog_post_mentions').insert({
          post_id: data.id,
          mentioned_user_id: mentionedUser.id,
        });
      }
    }

    // Call AI moderation if published
    if (post.published) {
      await moderateContent(data.id, post.title, post.content, post.category);
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const uploadBlogMedia = async (postId: string, file: File) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${postId}/${Date.now()}.${fileExt}`;
    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

    const { error: uploadError } = await supabase.storage
      .from('blog-media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('blog-media').getPublicUrl(fileName);

    await supabase.from('blog_media').insert({
      post_id: postId,
      user_id: user.id,
      media_type: mediaType,
      media_url: data.publicUrl,
      media_size: file.size,
    });

    return { data: data.publicUrl, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// ============================================
// AI-POWERED CONTENT MODERATION
// ============================================

export const moderateContent = async (
  postId: string,
  title: string,
  content: string,
  category: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('moderate-content', {
      body: { postId, title, content, category },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const textContent = await error.context?.text();
          errorMessage = textContent || error.message;
        } catch {
          errorMessage = error.message;
        }
      }
      throw new Error(errorMessage);
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Content moderation error:', error);
    return { data: null, error: error.message };
  }
};

// ============================================
// COMMUNITY POSTS WITH PAGINATION
// ============================================

export const getCommunityPosts = async (params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 10; // Reduced from 20 to 10 for faster initial load
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('community_posts')
      .select('*, user_profiles(id, username, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching community posts:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const getUserCommunityPosts = async (userId: string, params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('community_posts')
      .select('*, user_profiles(id, username, avatar_url)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching user community posts:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const createCommunityPost = async (content: string, media?: File) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let mediaUrl = null;
    let mediaType = null;

    if (media) {
      if (media.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      const fileExt = media.name.split('.').pop();
      const fileName = `${user.id}/community/${Date.now()}.${fileExt}`;
      const type = media.type.startsWith('image/') ? 'image' : media.type.startsWith('video/') ? 'video' : 'gif';

      const { error: uploadError } = await supabase.storage
        .from('blog-media')
        .upload(fileName, media);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('blog-media').getPublicUrl(fileName);
      mediaUrl = urlData.publicUrl;
      mediaType = type;
    }

    // Extract hashtags from content
    const hashtags = extractHashtags(content);

    const { data, error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
    }).select('*, user_profiles(id, username, avatar_url)').single();

    if (error) throw error;

    // Process hashtags for community posts
    for (const tag of hashtags) {
      const { data: existingTag } = await supabase
        .from('hashtags')
        .select('id, usage_count')
        .eq('tag', tag)
        .maybeSingle();

      if (existingTag) {
        await supabase
          .from('hashtags')
          .update({ usage_count: existingTag.usage_count + 1, updated_at: new Date().toISOString() })
          .eq('id', existingTag.id);
      } else {
        await supabase
          .from('hashtags')
          .insert({ tag, usage_count: 1 });
      }
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Community Post Likes
export const likeCommunityPost = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('community_post_likes').insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const unlikeCommunityPost = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('community_post_likes').delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const checkIsCommunityPostLiked = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('community_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error: any) {
    return false;
  }
};

// Community Post Reposts
export const repostCommunityPost = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('community_post_reposts').insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const unrepostCommunityPost = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('community_post_reposts').delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const checkIsCommunityPostReposted = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('community_post_reposts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error: any) {
    return false;
  }
};

// Community Post Comments
export const getCommunityComments = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('community_post_comments')
      .select('*, user_profiles(id, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching community comments:', error);
    return [];
  }
};

export const addCommunityComment = async (postId: string, content: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('community_post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content,
    }).select('*, user_profiles(id, username, avatar_url)').single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// ============================================
// VIDEO STORIES WITH PAGINATION
// ============================================

export const getVideoStories = async (category?: string, params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 5; // Reduced from 10/20 to 5 for faster initial load
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('video_stories')
      .select('*, user_profiles(id, username, avatar_url)', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching video stories:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const uploadVideoStory = async (
  title: string,
  description: string,
  category: string,
  videoFile: File,
  thumbnailFile?: File
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (videoFile.size > 100 * 1024 * 1024) { // 100MB limit for videos
      throw new Error('Video size exceeds 100MB limit');
    }

    // Upload video
    const videoExt = videoFile.name.split('.').pop();
    const videoFileName = `${user.id}/videos/${Date.now()}.${videoExt}`;

    const { error: videoUploadError } = await supabase.storage
      .from('blog-media')
      .upload(videoFileName, videoFile);

    if (videoUploadError) throw videoUploadError;

    const { data: videoUrlData } = supabase.storage.from('blog-media').getPublicUrl(videoFileName);

    // Upload thumbnail if provided
    let thumbnailUrl = null;
    if (thumbnailFile) {
      const thumbExt = thumbnailFile.name.split('.').pop();
      const thumbFileName = `${user.id}/thumbnails/${Date.now()}.${thumbExt}`;

      const { error: thumbUploadError } = await supabase.storage
        .from('blog-media')
        .upload(thumbFileName, thumbnailFile);

      if (!thumbUploadError) {
        const { data: thumbUrlData } = supabase.storage.from('blog-media').getPublicUrl(thumbFileName);
        thumbnailUrl = thumbUrlData.publicUrl;
      }
    }

    // Extract hashtags from title and description
    const hashtags = extractHashtags(title + ' ' + description);

    const { data, error } = await supabase.from('video_stories').insert({
      user_id: user.id,
      title,
      description,
      video_url: videoUrlData.publicUrl,
      thumbnail_url: thumbnailUrl,
      category,
      duration: 0,
    }).select('*, user_profiles(id, username, avatar_url)').single();

    if (error) throw error;

    // Process hashtags for videos
    for (const tag of hashtags) {
      const { data: existingTag } = await supabase
        .from('hashtags')
        .select('id, usage_count')
        .eq('tag', tag)
        .maybeSingle();

      if (existingTag) {
        await supabase
          .from('hashtags')
          .update({ usage_count: existingTag.usage_count + 1, updated_at: new Date().toISOString() })
          .eq('id', existingTag.id);
        
        await supabase.from('video_hashtags').insert({
          video_id: data.id,
          hashtag_id: existingTag.id,
        });
      } else {
        const { data: newTag } = await supabase
          .from('hashtags')
          .insert({ tag, usage_count: 1 })
          .select()
          .single();
        
        if (newTag) {
          await supabase.from('video_hashtags').insert({
            video_id: data.id,
            hashtag_id: newTag.id,
          });
        }
      }
    }

    // Update trending
    await supabase.from('trending_content').upsert({
      content_type: 'video',
      content_id: data.id,
      trending_score: 50,
      velocity_score: 100,
    });

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// ============================================
// VIDEO INTERACTIONS
// ============================================

export const likeVideo = async (videoId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('video_likes').insert({
      video_id: videoId,
      user_id: user.id,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const unlikeVideo = async (videoId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('video_likes').delete()
      .eq('video_id', videoId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const checkIsVideoLiked = async (videoId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error: any) {
    return false;
  }
};

export const repostVideo = async (videoId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('video_reposts').insert({
      video_id: videoId,
      user_id: user.id,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const unrepostVideo = async (videoId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('video_reposts').delete()
      .eq('video_id', videoId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const checkIsVideoReposted = async (videoId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('video_reposts')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error: any) {
    return false;
  }
};

// Video Comments
export const getVideoComments = async (videoId: string) => {
  try {
    const { data, error } = await supabase
      .from('video_comments')
      .select('*, user_profiles(id, username, avatar_url)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching video comments:', error);
    return [];
  }
};

export const addVideoComment = async (videoId: string, content: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('video_comments').insert({
      video_id: videoId,
      user_id: user.id,
      content,
    }).select('*, user_profiles(id, username, avatar_url)').single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const incrementVideoShares = async (videoId: string) => {
  try {
    const { data, error } = await supabase
      .from('video_stories')
      .select('shares_count')
      .eq('id', videoId)
      .single();

    if (error) throw error;

    const { error: updateError } = await supabase
      .from('video_stories')
      .update({ shares_count: (data.shares_count || 0) + 1 })
      .eq('id', videoId);

    if (updateError) throw updateError;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const incrementVideoViews = async (videoId: string) => {
  try {
    const { data, error } = await supabase
      .from('video_stories')
      .select('views_count')
      .eq('id', videoId)
      .single();

    if (error) throw error;

    const newViewCount = (data.views_count || 0) + 1;

    await supabase
      .from('video_stories')
      .update({ views_count: newViewCount })
      .eq('id', videoId);

    // Update trending score based on views
    const trendingScore = newViewCount * 0.5;
    await supabase.from('trending_content').upsert({
      content_type: 'video',
      content_id: videoId,
      trending_score: trendingScore,
      velocity_score: trendingScore,
    });

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getTrendingVideos = async (params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('video_stories')
      .select('*, user_profiles(id, username, avatar_url)', { count: 'exact' })
      .order('views_count', { ascending: false })
      .order('likes_count', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching trending videos:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const getVideosByHashtag = async (hashtag: string, params?: PaginationParams) => {
  try {
    const { data: hashtagData } = await supabase
      .from('hashtags')
      .select('id')
      .eq('tag', hashtag.toLowerCase())
      .maybeSingle();

    if (!hashtagData) return { data: [], hasMore: false, total: 0 };

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('video_hashtags')
      .select('video_id, video_stories(*, user_profiles(id, username, avatar_url))', { count: 'exact' })
      .eq('hashtag_id', hashtagData.id)
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data?.map((item: any) => item.video_stories) || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching videos by hashtag:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

// ============================================
// TRENDING & RANKINGS
// ============================================

export const getTrendingContent = async (contentType?: string, limit = 20) => {
  try {
    let query = supabase.from('trending_content').select('*');

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query
      .order('trending_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching trending content:', error);
    return [];
  }
};

export const getWriterRankings = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('writer_rankings')
      .select('*, user_profiles(id, username, avatar_url)')
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching writer rankings:', error);
    return [];
  }
};

export const getUserRewards = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data || {
      total_points: 0,
      total_earnings: 0,
      level: 1,
      badges: [],
    };
  } catch (error: any) {
    console.error('Error fetching user rewards:', error);
    return null;
  }
};

export const getContentEarnings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('content_earnings')
      .select('*')
      .eq('user_id', userId)
      .order('earnings_amount', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching content earnings:', error);
    return [];
  }
};

// ============================================
// BLOG POST INTERACTIONS
// ============================================

export const likeBlogPost = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('blog_post_likes').insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const unlikeBlogPost = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('blog_post_likes').delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const checkIsLiked = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('blog_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error: any) {
    return false;
  }
};

export const repostBlogPost = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('blog_post_reposts').insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const unrepostBlogPost = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('blog_post_reposts').delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const checkIsReposted = async (postId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('blog_post_reposts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error: any) {
    return false;
  }
};

export const incrementShares = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('shares_count')
      .eq('id', postId)
      .single();

    if (error) throw error;

    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ shares_count: (data.shares_count || 0) + 1 })
      .eq('id', postId);

    if (updateError) throw updateError;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// COMMENTS
// ============================================

export const getBlogComments = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('blog_post_comments')
      .select('*, user_profiles(id, username, avatar_url)')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching blog comments:', error);
    return [];
  }
};

export const addBlogComment = async (postId: string, content: string, parentId?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('blog_post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_id: parentId || null,
    }).select('*, user_profiles(id, username, avatar_url)').single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const deleteBlogComment = async (commentId: string) => {
  try {
    const { error } = await supabase
      .from('blog_post_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// HASHTAGS WITH PAGINATION
// ============================================

export const getTrendingHashtags = async (limit = 10) => {
  try {
    // Get hashtags from all sources with aggregated counts
    const { data, error } = await supabase
      .from('hashtags')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching trending hashtags:', error);
    return [];
  }
};

export const getAllHashtagsWithContent = async (limit = 20) => {
  try {
    // Get hashtags with content counts from all sources
    const { data: hashtags, error } = await supabase
      .from('hashtags')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // For each hashtag, get counts from different content types
    const enrichedHashtags = await Promise.all(
      (hashtags || []).map(async (tag) => {
        const [blogCount, videoCount] = await Promise.all([
          supabase
            .from('blog_post_hashtags')
            .select('id', { count: 'exact', head: true })
            .eq('hashtag_id', tag.id),
          supabase
            .from('video_hashtags')
            .select('id', { count: 'exact', head: true })
            .eq('hashtag_id', tag.id),
        ]);

        return {
          ...tag,
          blog_count: blogCount.count || 0,
          video_count: videoCount.count || 0,
        };
      })
    );

    return enrichedHashtags;
  } catch (error: any) {
    console.error('Error fetching all hashtags with content:', error);
    return [];
  }
};

export const getPostsByHashtag = async (hashtag: string, params?: PaginationParams) => {
  try {
    const { data: hashtagData } = await supabase
      .from('hashtags')
      .select('id')
      .eq('tag', hashtag.toLowerCase())
      .maybeSingle();

    if (!hashtagData) return { data: [], hasMore: false, total: 0 };

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('blog_post_hashtags')
      .select('post_id, blog_posts(*, user_profiles(id, username, avatar_url))', { count: 'exact' })
      .eq('hashtag_id', hashtagData.id)
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data?.map((item: any) => item.blog_posts) || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching posts by hashtag:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const getAllContentByCategory = async (category: string, params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 50;

    const [posts, videos] = await Promise.all([
      getAllBlogPosts({ page, limit: Math.floor(limit / 2) }),
      getVideoStories(category, { page, limit: Math.floor(limit / 2) }),
    ]);

    const allContent = [
      ...(posts.data || []).map((p: any) => ({ ...p, type: 'blog' })),
      ...(videos.data || []).map((v: any) => ({ ...v, type: 'video' })),
    ]
      .filter((item) => !category || item.category === category)
      .sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        return dateB - dateA;
      });

    return {
      data: allContent,
      hasMore: posts.hasMore || videos.hasMore,
      total: (posts.total || 0) + (videos.total || 0),
    };
  } catch (error: any) {
    console.error('Error fetching content by category:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const getAllContentByHashtag = async (hashtag: string, params?: PaginationParams) => {
  try {
    const [posts, videos] = await Promise.all([
      getPostsByHashtag(hashtag, params),
      getVideosByHashtag(hashtag, params),
    ]);

    const allContent = [
      ...(posts.data || []).map((p: any) => ({ ...p, type: 'blog' })),
      ...(videos.data || []).map((v: any) => ({ ...v, type: 'video' })),
    ].sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });

    return {
      data: allContent,
      hasMore: posts.hasMore || videos.hasMore,
      total: (posts.total || 0) + (videos.total || 0),
    };
  } catch (error: any) {
    console.error('Error fetching content by hashtag:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

// ============================================
// MESSAGES
// ============================================

export const getConversations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:user_profiles!conversations_user1_id_fkey(id, username, avatar_url),
        user2:user_profiles!conversations_user2_id_fkey(id, username, avatar_url)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const getMessages = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:user_profiles(id, username, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const sendMessage = async (recipientId: string, content: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [user1Id, user2Id] = [user.id, recipientId].sort();

    let { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({ user1_id: user1Id, user2_id: user2Id })
        .select('id')
        .single();

      if (createError) throw createError;
      conversation = newConv;
    }

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
    }).select('*, sender:user_profiles(id, username, avatar_url)').single();

    if (error) throw error;

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// ============================================
// ANALYTICS
// ============================================

export const getUserAnalytics = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data || {
      profile_views: 0,
      total_likes: 0,
      total_comments: 0,
      total_shares: 0,
      engagement_rate: 0,
    };
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return null;
  }
};

// ============================================
// USER CONTENT AGGREGATION (FOR PROFILE TABS)
// ============================================

export const getUserVideos = async (userId: string, params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('video_stories')
      .select('*, user_profiles(id, username, avatar_url)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data || [],
      hasMore: (data?.length || 0) === limit,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching user videos:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const getUserLikedContent = async (userId: string, params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    // Get liked blog posts
    const { data: likedPosts } = await supabase
      .from('blog_post_likes')
      .select('blog_posts(*, user_profiles(id, username, avatar_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get liked community posts
    const { data: likedCommunity } = await supabase
      .from('community_post_likes')
      .select('community_posts(*, user_profiles(id, username, avatar_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get liked videos
    const { data: likedVideos } = await supabase
      .from('video_likes')
      .select('video_stories(*, user_profiles(id, username, avatar_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const allLiked = [
      ...(likedPosts?.map((item: any) => ({ ...item.blog_posts, type: 'blog' })) || []),
      ...(likedCommunity?.map((item: any) => ({ ...item.community_posts, type: 'community' })) || []),
      ...(likedVideos?.map((item: any) => ({ ...item.video_stories, type: 'video' })) || []),
    ].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return {
      data: allLiked.slice(0, limit),
      hasMore: allLiked.length > limit,
      total: allLiked.length,
    };
  } catch (error: any) {
    console.error('Error fetching liked content:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};

export const getUserRepostedContent = async (userId: string, params?: PaginationParams) => {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    // Get reposted blog posts
    const { data: repostedPosts } = await supabase
      .from('blog_post_reposts')
      .select('blog_posts(*, user_profiles(id, username, avatar_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get reposted community posts
    const { data: repostedCommunity } = await supabase
      .from('community_post_reposts')
      .select('community_posts(*, user_profiles(id, username, avatar_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get reposted videos
    const { data: repostedVideos } = await supabase
      .from('video_reposts')
      .select('video_stories(*, user_profiles(id, username, avatar_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const allReposted = [
      ...(repostedPosts?.map((item: any) => ({ ...item.blog_posts, type: 'blog' })) || []),
      ...(repostedCommunity?.map((item: any) => ({ ...item.community_posts, type: 'community' })) || []),
      ...(repostedVideos?.map((item: any) => ({ ...item.video_stories, type: 'video' })) || []),
    ].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return {
      data: allReposted.slice(0, limit),
      hasMore: allReposted.length > limit,
      total: allReposted.length,
    };
  } catch (error: any) {
    console.error('Error fetching reposted content:', error);
    return { data: [], hasMore: false, total: 0 };
  }
};
