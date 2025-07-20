import axios from 'axios';
import { NewsArticle, NewsApiResponse } from '../types';

export class NewsService {
  private readonly newsdataApiKey = import.meta.env.VITE_NEWSDATA_API_KEY;
  private readonly gnewsApiKey = import.meta.env.VITE_GNEWS_API_KEY;
  private readonly contextualWebApiKey = import.meta.env.VITE_CONTEXTUALWEB_API_KEY;

  // Primary news source - Newsdata.io
  async fetchFromNewsdata(): Promise<NewsArticle[]> {
    try {
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: this.newsdataApiKey,
          q: 'artificial intelligence OR generative AI OR ChatGPT OR GPT OR machine learning OR AI OR OpenAI OR Google AI OR Microsoft AI',
          language: 'en',
          category: 'technology,business',
          size: 25,
          timeframe: '24',
          prioritydomain: 'top'
        }
      });

      return this.transformNewsdataResponse(response.data);
    } catch (error) {
      console.error('Newsdata.io API error:', error);
      return [];
    }
  }

  // Fallback source 1 - GNews
  async fetchFromGNews(): Promise<NewsArticle[]> {
    try {
      const response = await axios.get('https://gnews.io/api/v4/search', {
        params: {
          q: 'artificial intelligence OR AI OR ChatGPT OR OpenAI',
          token: this.gnewsApiKey,
          lang: 'en',
          country: 'us',
          max: 25,
          in: 'title,description'
        }
      });

      return this.transformGNewsResponse(response.data);
    } catch (error) {
      console.error('GNews API error:', error);
      return [];
    }
  }

  // Fallback source 2 - ContextualWeb
  async fetchFromContextualWeb(): Promise<NewsArticle[]> {
    try {
      const response = await axios.get('https://api.contextualweb.io/api/Search/NewsSearchAPI', {
        params: {
          apikey: this.contextualWebApiKey,
          q: 'generative AI OR artificial intelligence OR ChatGPT',
          pageSize: 25,
          autoCorrect: true,
          fromPublishedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          toPublishedDate: new Date().toISOString()
        }
      });

      return this.transformContextualWebResponse(response.data);
    } catch (error) {
      console.error('ContextualWeb API error:', error);
      return [];
    }
  }

  // Main aggregation function
  async aggregateNews(): Promise<NewsArticle[]> {
    const [newsdataArticles, gnewsArticles, contextualWebArticles] = await Promise.allSettled([
      this.fetchFromNewsdata(),
      this.fetchFromGNews(),
      this.fetchFromContextualWeb()
    ]);

    const allArticles: NewsArticle[] = [];

    // Collect successful results
    if (newsdataArticles.status === 'fulfilled') {
      allArticles.push(...newsdataArticles.value);
    }
    if (gnewsArticles.status === 'fulfilled') {
      allArticles.push(...gnewsArticles.value);
    }
    if (contextualWebArticles.status === 'fulfilled') {
      allArticles.push(...contextualWebArticles.value);
    }

    // Remove duplicates and sort by relevance
    const uniqueArticles = this.removeDuplicates(allArticles);
    const scoredArticles = this.scoreArticles(uniqueArticles);
    
    // Return top 50 articles as specified
    return scoredArticles.slice(0, 50);
  }

  private transformNewsdataResponse(data: any): NewsArticle[] {
    if (!data.results) return [];

    return data.results.map((article: any) => ({
      id: this.generateId(article.link),
      title: article.title,
      summary: article.description || article.content?.substring(0, 200) + '...',
      fullContent: article.content,
      url: article.link,
      source: article.source_id,
      author: article.creator?.[0],
      publishedAt: new Date(article.pubDate),
      imageUrl: article.image_url,
      category: article.category?.[0] || 'technology',
      tags: article.keywords || [],
      tone: this.analyzeTone(article.title + ' ' + article.description),
      credibilityScore: this.calculateCredibilityScore(article.source_id),
      engagementScore: 0, // Will be updated based on user interactions
      aiGenerated: false,
      ctaText: this.generateCTA(article.title)
    }));
  }

  private transformGNewsResponse(data: any): NewsArticle[] {
    if (!data.articles) return [];

    return data.articles.map((article: any) => ({
      id: this.generateId(article.url),
      title: article.title,
      summary: article.description,
      url: article.url,
      source: article.source.name,
      author: article.author,
      publishedAt: new Date(article.publishedAt),
      imageUrl: article.image,
      category: 'technology',
      tags: [],
      tone: this.analyzeTone(article.title + ' ' + article.description),
      credibilityScore: this.calculateCredibilityScore(article.source.name),
      engagementScore: 0,
      aiGenerated: false,
      ctaText: this.generateCTA(article.title)
    }));
  }

  private transformContextualWebResponse(data: any): NewsArticle[] {
    if (!data.value) return [];

    return data.value.map((article: any) => ({
      id: this.generateId(article.url),
      title: article.name,
      summary: article.description,
      url: article.url,
      source: article.provider?.[0]?.name || 'Unknown',
      publishedAt: new Date(article.datePublished),
      imageUrl: article.image?.thumbnail?.contentUrl,
      category: 'technology',
      tags: [],
      tone: this.analyzeTone(article.name + ' ' + article.description),
      credibilityScore: this.calculateCredibilityScore(article.provider?.[0]?.name),
      engagementScore: 0,
      aiGenerated: false,
      ctaText: this.generateCTA(article.name)
    }));
  }

  private generateId(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private analyzeTone(text: string): 'positive' | 'neutral' | 'negative' | 'breaking' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('breaking') || lowerText.includes('urgent') || lowerText.includes('alert')) {
      return 'breaking';
    }
    
    const positiveWords = ['breakthrough', 'innovation', 'success', 'advancement', 'growth', 'improve'];
    const negativeWords = ['concern', 'risk', 'danger', 'threat', 'problem', 'issue', 'controversy'];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateCredibilityScore(source: string): number {
    const highCredibilitySources = [
      'reuters', 'associated press', 'bbc', 'new york times', 'wall street journal',
      'techcrunch', 'the verge', 'ars technica', 'wired', 'mit technology review'
    ];
    
    const mediumCredibilitySources = [
      'cnn', 'bloomberg', 'forbes', 'venturebeat', 'engadget', 'mashable'
    ];
    
    const sourceLower = source.toLowerCase();
    
    if (highCredibilitySources.some(s => sourceLower.includes(s))) return 0.9;
    if (mediumCredibilitySources.some(s => sourceLower.includes(s))) return 0.7;
    return 0.5;
  }

  private generateCTA(title: string): string {
    const ctas = [
      'Read the full story',
      'Learn more',
      'Dive deeper',
      'Get the details',
      'See what this means for AI'
    ];
    
    if (title.toLowerCase().includes('breakthrough') || title.toLowerCase().includes('innovation')) {
      return 'Explore this breakthrough';
    }
    
    return ctas[Math.floor(Math.random() * ctas.length)];
  }

  private removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private scoreArticles(articles: NewsArticle[]): NewsArticle[] {
    return articles
      .map(article => ({
        ...article,
        engagementScore: this.calculateEngagementScore(article)
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore);
  }

  private calculateEngagementScore(article: NewsArticle): number {
    let score = 0;
    
    // Recency factor (more recent = higher score)
    const ageHours = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 24 - ageHours) / 24 * 30;
    
    // Credibility factor
    score += article.credibilityScore * 40;
    
    // Tone factor (breaking news gets highest priority)
    switch (article.tone) {
      case 'breaking': score += 30; break;
      case 'positive': score += 20; break;
      case 'negative': score += 15; break;
      case 'neutral': score += 10; break;
    }
    
    return Math.round(score);
  }
}