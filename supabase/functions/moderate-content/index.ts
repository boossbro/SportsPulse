import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { postId, title, content, category } = await req.json();

    console.log('Moderating content for post:', postId);

    // 1. Auto-categorize using AI
    const categoryPrompt = `Analyze this article and determine the most appropriate category from: News, Sports, Entertainment, Technology, Business, Health, Lifestyle, Politics.

Title: ${title}
Content: ${content.substring(0, 500)}...

Respond with ONLY the category name, nothing else.`;

    const categoryResponse = await fetch('https://api.onspace.dev/v1/text/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: categoryPrompt }],
        temperature: 0.3,
      }),
    });

    const categoryData = await categoryResponse.json();
    const autoCategory = categoryData.choices?.[0]?.message?.content?.trim() || category;

    // 2. Check content quality using AI
    const qualityPrompt = `Analyze this article for quality. Rate from 0-100 based on:
- Grammar and spelling
- Content structure
- Readability
- Originality
- Value to readers

Title: ${title}
Content: ${content.substring(0, 1000)}...

Respond with ONLY a number between 0-100, nothing else.`;

    const qualityResponse = await fetch('https://api.onspace.dev/v1/text/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: qualityPrompt }],
        temperature: 0.3,
      }),
    });

    const qualityData = await qualityResponse.json();
    const qualityScore = parseInt(qualityData.choices?.[0]?.message?.content?.trim() || '50');

    // 3. Check for plagiarism (basic content similarity)
    const plagiarismPrompt = `Check if this content appears to be original or potentially plagiarized. Look for signs like:
- Unnatural writing style changes
- Generic stock phrases
- Overly formal or marketing language

Content: ${content.substring(0, 800)}...

Respond with a plagiarism risk score from 0-100 (0 = completely original, 100 = likely plagiarized). Respond with ONLY the number.`;

    const plagiarismResponse = await fetch('https://api.onspace.dev/v1/text/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: plagiarismPrompt }],
        temperature: 0.3,
      }),
    });

    const plagiarismData = await plagiarismResponse.json();
    const plagiarismScore = parseInt(plagiarismData.choices?.[0]?.message?.content?.trim() || '0');

    // 4. Get AI suggestions for improvement
    const suggestionsPrompt = `Review this article and provide 2-3 brief suggestions for improvement:

Title: ${title}
Content: ${content.substring(0, 600)}...

Format as a JSON array of strings, like: ["suggestion 1", "suggestion 2"]`;

    const suggestionsResponse = await fetch('https://api.onspace.dev/v1/text/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: suggestionsPrompt }],
        temperature: 0.7,
      }),
    });

    const suggestionsData = await suggestionsResponse.json();
    let aiSuggestions = [];
    try {
      const suggestionsText = suggestionsData.choices?.[0]?.message?.content?.trim() || '[]';
      aiSuggestions = JSON.parse(suggestionsText);
    } catch {
      aiSuggestions = ['Review content for clarity and engagement'];
    }

    // 5. Detect issues
    const detectedIssues = [];
    if (plagiarismScore > 50) {
      detectedIssues.push({ type: 'plagiarism', severity: 'high', message: 'Potential plagiarism detected' });
    }
    if (qualityScore < 40) {
      detectedIssues.push({ type: 'quality', severity: 'medium', message: 'Content quality needs improvement' });
    }
    if (content.length < 200) {
      detectedIssues.push({ type: 'length', severity: 'low', message: 'Content is too short' });
    }

    // 6. Determine status
    let status = 'approved';
    if (plagiarismScore > 70 || qualityScore < 30) {
      status = 'flagged';
    } else if (plagiarismScore > 50 || qualityScore < 50) {
      status = 'pending';
    }

    // 7. Store moderation result
    const { error: moderationError } = await supabase
      .from('content_moderation')
      .upsert({
        post_id: postId,
        status,
        auto_category: autoCategory,
        plagiarism_score: plagiarismScore,
        quality_score: qualityScore,
        ai_suggestions: aiSuggestions,
        detected_issues: detectedIssues,
      });

    if (moderationError) {
      console.error('Moderation storage error:', moderationError);
      throw moderationError;
    }

    // 8. Update post category if different
    if (autoCategory !== category) {
      await supabase
        .from('blog_posts')
        .update({ category: autoCategory })
        .eq('id', postId);
    }

    // 9. Calculate trending score
    const trendingScore = qualityScore * 0.4 + (100 - plagiarismScore) * 0.3 + (content.length / 100) * 0.3;
    
    await supabase.from('trending_content').upsert({
      content_type: 'blog',
      content_id: postId,
      trending_score: trendingScore,
      velocity_score: trendingScore,
    });

    return new Response(
      JSON.stringify({
        success: true,
        status,
        autoCategory,
        qualityScore,
        plagiarismScore,
        aiSuggestions,
        detectedIssues,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Content moderation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Content moderation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
