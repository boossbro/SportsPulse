import { supabase } from './supabase';
import { Match } from '../types';
import { FunctionsHttpError } from '@supabase/supabase-js';

export const syncSportsData = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-sports-data');
    
    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
        } catch {
          errorMessage = `${error.message || 'Failed to sync sports data'}`;
        }
      }
      return { success: false, error: errorMessage };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const fetchMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((match: any) => ({
      id: match.id,
      sport: match.sport,
      league: match.league_name,
      homeTeam: {
        id: match.home_team_id || '',
        name: match.home_team_name,
        logo: match.home_team_logo || '',
        score: match.home_team_score,
      },
      awayTeam: {
        id: match.away_team_id || '',
        name: match.away_team_name,
        logo: match.away_team_logo || '',
        score: match.away_team_score,
      },
      status: match.status,
      time: match.match_time,
      minute: match.match_minute,
    }));
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    return [];
  }
};

export const fetchMatchById = async (id: string): Promise<Match | null> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      sport: data.sport,
      league: data.league_name,
      homeTeam: {
        id: data.home_team_id || '',
        name: data.home_team_name,
        logo: data.home_team_logo || '',
        score: data.home_team_score,
      },
      awayTeam: {
        id: data.away_team_id || '',
        name: data.away_team_name,
        logo: data.away_team_logo || '',
        score: data.away_team_score,
      },
      status: data.status,
      time: data.match_time,
      minute: data.match_minute,
    };
  } catch (error: any) {
    console.error('Error fetching match:', error);
    return null;
  }
};

export const syncSportsNews = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-sports-news');
    
    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
        } catch {
          errorMessage = `${error.message || 'Failed to sync sports news'}`;
        }
      }
      return { success: false, error: errorMessage };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const fetchNews = async (category?: string) => {
  try {
    let query = supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((article: any) => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt || '',
      content: article.content || '',
      image: article.image || '',
      category: article.category,
      publishedAt: article.published_at,
      readTime: '3 min read',
    }));
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return [];
  }
};

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
// FOLLOW SYSTEM FUNCTIONS
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
    console.error('Error checking follow status:', error);
    return false;
  }
};

// ============================================
// ARTICLE COMMENTS FUNCTIONS
// ============================================

export const getArticleComments = async (articleId: string) => {
  try {
    const { data, error } = await supabase
      .from('article_comments')
      .select('*, user_profiles(id, username, avatar_url)')
      .eq('article_id', articleId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const addComment = async (articleId: string, content: string, parentId?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('article_comments').insert({
      article_id: articleId,
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

export const deleteComment = async (commentId: string) => {
  try {
    const { error } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// BLOG POSTS FUNCTIONS
// ============================================

export const getUserBlogPosts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, user_profiles(id, username, avatar_url)')
      .eq('user_id', userId)
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
};

export const getAllBlogPosts = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, user_profiles(id, username, avatar_url)')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
};

export const getFeedPosts = async (limit = 30) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get posts from users you follow + your own posts
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, user_profiles(id, username, avatar_url)')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching feed posts:', error);
    return [];
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
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Extract hashtags from content
const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }
  return [...new Set(hashtags)];
};

// Extract mentions from content
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

    // Extract hashtags and mentions from content
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
    const { error } = await supabase
      .from('blog_posts')
      .update({ shares_count: supabase.raw('shares_count + 1') })
      .eq('id', postId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// BLOG POST COMMENTS
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
// HASHTAGS
// ============================================

export const getTrendingHashtags = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching trending hashtags:', error);
    return [];
  }
};

export const getPostsByHashtag = async (hashtag: string, limit = 20) => {
  try {
    const { data: hashtagData } = await supabase
      .from('hashtags')
      .select('id')
      .eq('tag', hashtag.toLowerCase())
      .maybeSingle();

    if (!hashtagData) return [];

    const { data, error } = await supabase
      .from('blog_post_hashtags')
      .select('post_id, blog_posts(*, user_profiles(id, username, avatar_url))')
      .eq('hashtag_id', hashtagData.id)
      .limit(limit);

    if (error) throw error;
    return data?.map((item: any) => item.blog_posts) || [];
  } catch (error: any) {
    console.error('Error fetching posts by hashtag:', error);
    return [];
  }
};

// ============================================
// MESSAGES FUNCTIONS
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
// ANALYTICS FUNCTIONS
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
