import axios from 'axios';
import { Tweet } from '../types';
import { AISummarizer } from '../summarizer/aiSummarizer';

export class TwitterService {
  private readonly bearerToken = import.meta.env.VITE_TWITTER_BEARER_TOKEN;
  private readonly aiSummarizer = new AISummarizer();

  async fetchTopGenAITweets(): Promise<Tweet[]> {
    try {
      // Twitter API v2 search endpoint
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          query: '(artificial intelligence OR "generative AI" OR ChatGPT OR OpenAI OR "machine learning" OR #AI OR #GenAI) -is:retweet lang:en',
          'tweet.fields': 'created_at,author_id,public_metrics,context_annotations,entities',
          'user.fields': 'name,username,profile_image_url,verified',
          'expansions': 'author_id',
          'max_results': 50,
          'sort_order': 'relevancy'
        }
      });

      return this.transformTwitterResponse(response.data);
    } catch (error) {
      console.error('Twitter API error:', error);
      // Return fallback sample data if API fails
      return this.getFallbackTweets();
    }
  }

  async fetchTweetsByHandle(username: string, count: number = 20): Promise<Tweet[]> {
    try {
      // First get user ID
      const userResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        }
      });

      const userId = userResponse.data.data.id;

      // Then get their tweets
      const tweetsResponse = await axios.get(`https://api.twitter.com/2/users/${userId}/tweets`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        },
        params: {
          'tweet.fields': 'created_at,public_metrics,context_annotations',
          'user.fields': 'name,username,profile_image_url,verified',
          'expansions': 'author_id',
          'max_results': count
        }
      });

      return this.transformTwitterResponse(tweetsResponse.data);
    } catch (error) {
      console.error(`Error fetching tweets for @${username}:`, error);
      return [];
    }
  }

  async getInfluencerTweets(): Promise<Tweet[]> {
    const influencers = [
      'sama', // Sam Altman
      'elonmusk', // Elon Musk
      'sundarpichai', // Sundar Pichai
      'satyanadella', // Satya Nadella
      'ylecun', // Yann LeCun
      'AndrewYNg', // Andrew Ng
      'demishassabis', // Demis Hassabis
      'karpathy', // Andrej Karpathy
      'hardmaru', // David Ha
      'fchollet' // François Chollet
    ];

    const tweetPromises = influencers.map(handle => 
      this.fetchTweetsByHandle(handle, 5)
    );

    const results = await Promise.allSettled(tweetPromises);
    const allTweets: Tweet[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allTweets.push(...result.value);
      }
    });

    // Filter for AI-related content and sort by engagement
    return this.filterAndSortTweets(allTweets);
  }

  private async transformTwitterResponse(data: any): Promise<Tweet[]> {
    if (!data.data) return [];

    const tweets = data.data;
    const users = data.includes?.users || [];
    const userMap = new Map(users.map((user: any) => [user.id, user]));

    const transformedTweets = await Promise.all(
      tweets.map(async (tweet: any) => {
        const author = userMap.get(tweet.author_id);
        
        // Generate AI summary for the tweet
        const aiSummary = await this.aiSummarizer.generateTweetSummary(tweet.text);

        return {
          id: tweet.id,
          text: tweet.text,
          author: {
            username: author?.username || 'unknown',
            displayName: author?.name || 'Unknown User',
            profileImageUrl: author?.profile_image_url || '',
            verified: author?.verified || false
          },
          metrics: {
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0
          },
          createdAt: new Date(tweet.created_at),
          url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
          aiSummary
        };
      })
    );

    return transformedTweets;
  }

  private filterAndSortTweets(tweets: Tweet[]): Tweet[] {
    // Filter for AI-related content
    const aiRelatedTweets = tweets.filter(tweet => {
      const text = tweet.text.toLowerCase();
      const aiKeywords = [
        'artificial intelligence', 'ai', 'machine learning', 'deep learning',
        'neural network', 'chatgpt', 'gpt', 'openai', 'claude', 'gemini',
        'generative ai', 'llm', 'large language model', 'transformer',
        'automation', 'algorithm', 'data science', 'computer vision'
      ];
      
      return aiKeywords.some(keyword => text.includes(keyword));
    });

    // Sort by engagement score
    return aiRelatedTweets
      .sort((a, b) => this.calculateEngagementScore(b) - this.calculateEngagementScore(a))
      .slice(0, 10); // Return top 10
  }

  private calculateEngagementScore(tweet: Tweet): number {
    const { likes, retweets, replies } = tweet.metrics;
    
    // Weight different engagement types
    const score = (likes * 1) + (retweets * 3) + (replies * 2);
    
    // Apply recency bonus (newer tweets get a boost)
    const ageHours = (Date.now() - tweet.createdAt.getTime()) / (1000 * 60 * 60);
    const recencyBonus = Math.max(0, 24 - ageHours) / 24 * 100;
    
    return score + recencyBonus;
  }

  private getFallbackTweets(): Tweet[] {
    // Fallback sample data in case API is unavailable
    return [
      {
        id: 'sample1',
        text: 'The latest breakthrough in generative AI is reshaping how we think about creativity and automation. The possibilities are endless! #AI #GenAI',
        author: {
          username: 'ai_researcher',
          displayName: 'AI Researcher',
          profileImageUrl: '',
          verified: true
        },
        metrics: {
          likes: 1250,
          retweets: 340,
          replies: 89
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        url: 'https://twitter.com/ai_researcher/status/sample1',
        aiSummary: 'Discussing recent breakthroughs in generative AI and their impact on creativity and automation.'
      },
      {
        id: 'sample2',
        text: 'Just had an amazing conversation with ChatGPT about the future of human-AI collaboration. The insights were surprisingly profound.',
        author: {
          username: 'tech_visionary',
          displayName: 'Tech Visionary',
          profileImageUrl: '',
          verified: false
        },
        metrics: {
          likes: 892,
          retweets: 156,
          replies: 67
        },
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        url: 'https://twitter.com/tech_visionary/status/sample2',
        aiSummary: 'Sharing insights from a conversation with ChatGPT about human-AI collaboration.'
      }
    ];
  }

  async getTrendingAIHashtags(): Promise<string[]> {
    try {
      // Get trending topics with AI focus
      const response = await axios.get('https://api.twitter.com/1.1/trends/place.json', {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        },
        params: {
          id: 1 // WOEID for worldwide
        }
      });

      const trends = response.data[0]?.trends || [];
      
      // Filter for AI-related hashtags
      return trends
        .filter((trend: any) => {
          const name = trend.name.toLowerCase();
          return name.includes('ai') || name.includes('ml') || name.includes('gpt') || 
                 name.includes('chatgpt') || name.includes('openai');
        })
        .map((trend: any) => trend.name)
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      return ['#AI', '#GenAI', '#ChatGPT', '#MachineLearning', '#OpenAI'];
    }
  }

  async searchTweetsByKeyword(keyword: string, count: number = 20): Promise<Tweet[]> {
    try {
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        },
        params: {
          query: `${keyword} -is:retweet lang:en`,
          'tweet.fields': 'created_at,author_id,public_metrics',
          'user.fields': 'name,username,profile_image_url,verified',
          'expansions': 'author_id',
          'max_results': count
        }
      });

      return this.transformTwitterResponse(response.data);
    } catch (error) {
      console.error(`Error searching tweets for "${keyword}":`, error);
      return [];
    }
  }

  // Enhanced tweet analysis for better curation
  async analyzeTweetSentiment(tweet: Tweet): Promise<'positive' | 'neutral' | 'negative'> {
    // Simple sentiment analysis - in production, use more sophisticated NLP
    const positiveWords = ['amazing', 'breakthrough', 'exciting', 'innovative', 'great', 'fantastic'];
    const negativeWords = ['terrible', 'awful', 'concerning', 'problematic', 'dangerous', 'bad'];
    
    const text = tweet.text.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  async getTwitterSpaces(): Promise<any[]> {
    // Future implementation for Twitter Spaces integration
    // This would fetch live AI-related Twitter Spaces
    console.log('Twitter Spaces integration coming soon');
    return [];
  }
}