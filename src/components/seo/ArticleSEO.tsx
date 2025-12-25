import { useEffect } from 'react';
import { NewsArticle } from '../../types';

interface ArticleSEOProps {
  article: NewsArticle;
}

export const ArticleSEO = ({ article }: ArticleSEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = `${article.title} | SportsPulse`;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${property}"]`);
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, property);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', article.excerpt || article.title, false);
    updateMetaTag('keywords', `${article.category}, sports news, ${article.title}`, false);

    // Open Graph tags
    updateMetaTag('og:title', article.title);
    updateMetaTag('og:description', article.excerpt || article.title);
    updateMetaTag('og:image', article.image);
    updateMetaTag('og:type', 'article');
    updateMetaTag('og:url', window.location.href);
    updateMetaTag('article:published_time', article.publishedAt);
    updateMetaTag('article:section', article.category);

    // Twitter Card tags
    updateMetaTag('twitter:title', article.title, false);
    updateMetaTag('twitter:description', article.excerpt || article.title, false);
    updateMetaTag('twitter:image', article.image, false);

    // Update JSON-LD structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'article-schema';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.excerpt,
      image: article.image,
      datePublished: article.publishedAt,
      articleSection: article.category,
      publisher: {
        '@type': 'Organization',
        name: 'SportsPulse',
      },
    });

    // Remove old schema if exists
    const oldSchema = document.getElementById('article-schema');
    if (oldSchema) oldSchema.remove();
    
    document.head.appendChild(script);

    // Cleanup function to reset to default
    return () => {
      document.title = 'SportsPulse - Live Scores, Sports News & Betting Tips';
      const defaultDesc = 'Get real-time sports scores, latest news, and expert betting predictions from major leagues worldwide.';
      updateMetaTag('description', defaultDesc, false);
      updateMetaTag('og:title', 'SportsPulse - Live Scores, Sports News & Betting Tips');
      updateMetaTag('og:description', defaultDesc);
      updateMetaTag('twitter:title', 'SportsPulse - Live Scores, Sports News & Betting Tips', false);
      updateMetaTag('twitter:description', defaultDesc, false);
      
      const schemaEl = document.getElementById('article-schema');
      if (schemaEl) schemaEl.remove();
    };
  }, [article]);

  return null;
};
