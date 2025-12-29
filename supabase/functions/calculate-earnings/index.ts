import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Revenue calculation constants (Opera News-style)
const CPM_RATE = 0.5; // $0.50 per 1000 views
const ENGAGEMENT_BONUS = 0.05; // $0.05 per like/comment
const QUALITY_MULTIPLIER = 1.5; // 1.5x for high quality content

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all published posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, user_id, views_count, likes_count, comments_count, shares_count')
      .eq('published', true);

    if (postsError) throw postsError;

    console.log(`Calculating earnings for ${posts?.length || 0} posts`);

    for (const post of posts || []) {
      // Get quality score
      const { data: moderation } = await supabase
        .from('content_moderation')
        .select('quality_score')
        .eq('post_id', post.id)
        .single();

      const qualityScore = moderation?.quality_score || 50;
      const qualityBonus = qualityScore > 70 ? QUALITY_MULTIPLIER : 1;

      // Calculate base earnings from views
      const viewsEarnings = (post.views_count / 1000) * CPM_RATE;

      // Calculate engagement earnings
      const totalEngagement = post.likes_count + post.comments_count + (post.shares_count * 2);
      const engagementEarnings = totalEngagement * ENGAGEMENT_BONUS;

      // Total earnings with quality bonus
      const totalEarnings = (viewsEarnings + engagementEarnings) * qualityBonus;

      // Engagement score (0-100)
      const engagementScore = Math.min(
        100,
        ((post.likes_count + post.comments_count * 2 + post.shares_count * 3) / Math.max(1, post.views_count)) * 100
      );

      // Upsert earnings
      await supabase.from('content_earnings').upsert({
        post_id: post.id,
        user_id: post.user_id,
        views_count: post.views_count,
        engagement_score: engagementScore,
        earnings_amount: totalEarnings,
        last_calculated: new Date().toISOString(),
      });

      // Update user rewards
      const { data: existingRewards } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', post.user_id)
        .single();

      const points = Math.floor(totalEarnings * 100); // Convert earnings to points

      if (existingRewards) {
        await supabase
          .from('user_rewards')
          .update({
            total_points: existingRewards.total_points + points,
            total_earnings: existingRewards.total_earnings + totalEarnings,
            views_earned: existingRewards.views_earned + post.views_count,
            engagement_earned: existingRewards.engagement_earned + totalEngagement,
            quality_bonus: existingRewards.quality_bonus + (qualityScore > 80 ? 10 : 0),
            level: Math.floor((existingRewards.total_points + points) / 1000) + 1,
            last_updated: new Date().toISOString(),
          })
          .eq('user_id', post.user_id);
      } else {
        await supabase.from('user_rewards').insert({
          user_id: post.user_id,
          total_points: points,
          total_earnings: totalEarnings,
          views_earned: post.views_count,
          engagement_earned: totalEngagement,
          quality_bonus: qualityScore > 80 ? 10 : 0,
          level: Math.floor(points / 1000) + 1,
        });
      }
    }

    // Calculate writer rankings
    const { data: writers } = await supabase
      .from('blog_posts')
      .select('user_id, views_count, likes_count, comments_count')
      .eq('published', true);

    const writerStats = new Map();

    for (const post of writers || []) {
      if (!writerStats.has(post.user_id)) {
        writerStats.set(post.user_id, {
          posts_count: 0,
          total_views: 0,
          total_engagement: 0,
        });
      }

      const stats = writerStats.get(post.user_id);
      stats.posts_count += 1;
      stats.total_views += post.views_count;
      stats.total_engagement += post.likes_count + post.comments_count;
    }

    // Update rankings
    const rankings = Array.from(writerStats.entries())
      .map(([userId, stats]) => ({
        user_id: userId,
        score: stats.total_views * 0.5 + stats.total_engagement * 2 + stats.posts_count * 10,
        ...stats,
        quality_average: 75, // Placeholder
        consistency_score: Math.min(100, stats.posts_count * 10),
      }))
      .sort((a, b) => b.score - a.score);

    for (let i = 0; i < rankings.length; i++) {
      await supabase.from('writer_rankings').upsert({
        ...rankings[i],
        rank: i + 1,
        last_updated: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: posts?.length || 0,
        message: 'Earnings and rankings calculated successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Earnings calculation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Earnings calculation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
