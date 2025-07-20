// User related types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  interests: string[];
  subscriptionTier: 'free' | 'premium';
  createdAt: Date;
  lastActive: Date;
}

// News article types
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  fullContent?: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: Date;
  imageUrl?: string;
  category: string;
  tags: string[];
  tone: 'positive' | 'neutral' | 'negative' | 'breaking';
  credibilityScore: number;
  engagementScore: number;
  aiGenerated: boolean;
  ctaText?: string;
}

// Podcast types
export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number; // in seconds
  transcript: string;
  publishedAt: Date;
  stories: NewsArticle[];
  hosts: PodcastHost[];
  downloadCount: number;
  listenCount: number;
}

export interface PodcastHost {
  name: string;
  voice: 'alex' | 'sam' | 'jae';
  personality: string;
  elevenLabsVoiceId: string;
}

// Social media types
export interface Tweet {
  id: string;
  text: string;
  author: {
    username: string;
    displayName: string;
    profileImageUrl: string;
    verified: boolean;
  };
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
  createdAt: Date;
  url: string;
  aiSummary?: string;
}

// User interaction types
export interface UserInteraction {
  userId: string;
  itemId: string;
  itemType: 'article' | 'podcast' | 'tweet';
  actionType: 'view' | 'like' | 'save' | 'share' | 'listen_complete';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Personalization types
export interface UserPreferences {
  topics: string[];
  sources: string[];
  contentTypes: ('breaking' | 'analysis' | 'opinion' | 'research')[];
  podcastFrequency: 'daily' | 'weekly';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

// API response types
export interface NewsApiResponse {
  articles: NewsArticle[];
  totalResults: number;
  status: string;
}

export interface PodcastScript {
  segments: PodcastSegment[];
  estimatedDuration: number;
  hosts: PodcastHost[];
}

export interface PodcastSegment {
  type: 'intro' | 'story' | 'transition' | 'outro';
  host: string;
  text: string;
  audioUrl?: string;
  duration?: number;
}

// Subscription and payment types
export interface Subscription {
  userId: string;
  tier: 'free' | 'premium';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId?: string;
}

// Analytics types
export interface ContentAnalytics {
  itemId: string;
  itemType: 'article' | 'podcast' | 'tweet';
  views: number;
  engagement: number;
  shares: number;
  averageReadTime?: number;
  averageListenTime?: number;
  completionRate?: number;
  date: Date;
}