import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MusicAnalysis {
  genres: string[];
  moods: string[];
  energy: 'low' | 'medium' | 'high' | 'very_high';
  instruments: string[];
  themes: string[];
  searchIntent: string;
  searchTerms: string[];
}

export interface MusicRecommendation {
  title: string;
  artist: string;
  reason: string;
  confidence: number;
}

class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    });
  }

  async analyzeMusicQuery(query: string): Promise<MusicAnalysis> {
    try {
      const systemPrompt = `You are a music analysis AI. Analyze the user's music query and extract musical characteristics, search intent, and themes. Respond ONLY with valid JSON matching this structure:
{
  "genres": ["genre1", "genre2"],
  "moods": ["mood1", "mood2"],
  "energy": "low|medium|high|very_high",
  "instruments": ["instrument1", "instrument2"],
  "themes": ["theme1", "theme2"],
  "searchIntent": "discovery|specific_song|artist_info|recommendation|mood_based",
  "searchTerms": ["term1", "term2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('AI music analysis error:', error);
      return {
        genres: [],
        moods: [],
        energy: 'medium',
        instruments: [],
        themes: [],
        searchIntent: 'discovery',
        searchTerms: query.split(' ')
      };
    }
  }

  async generateMusicRecommendations(
    userPreferences: any,
    context: string,
    seedTracks: any[] = []
  ): Promise<MusicRecommendation[]> {
    try {
      const systemPrompt = `You are a music recommendation AI. Based on user preferences and context, suggest 5 music recommendations. Consider musical similarity, mood, energy, and cultural context. Respond ONLY with valid JSON array:
[
  {
    "title": "Song Title",
    "artist": "Artist Name", 
    "reason": "Brief explanation why this fits",
    "confidence": 0.85
  }
]`;

      const userPrompt = `User preferences: ${JSON.stringify(userPreferences)}
Context: ${context}
Seed tracks: ${JSON.stringify(seedTracks.slice(0, 3))}

Recommend 5 songs that match this profile.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('AI recommendation error:', error);
      return [];
    }
  }

  async chatWithMusicOracle(
    message: string,
    conversationHistory: ChatMessage[] = [],
    musicContext: any = null
  ): Promise<string> {
    try {
      const systemPrompt = `You are SonicSage, the world's most knowledgeable music AI oracle. You have deep expertise in:

- Music history, genres, and cultural movements
- Artist biographies, influences, and career trajectories  
- Song meanings, production techniques, and musical theory
- Album stories, recording sessions, and industry context
- Music trends, charts, and cultural impact
- Lyrical analysis and thematic interpretation

Respond conversationally but with authority. Be engaging, insightful, and passionate about music. Share interesting stories, connections, and lesser-known facts. If you don't know something specific, acknowledge it but offer related insights.

${musicContext ? `Current music context: ${JSON.stringify(musicContext)}` : ''}`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: message }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        temperature: 0.8,
        max_tokens: 800,
        presence_penalty: 0.3,
        frequency_penalty: 0.1
      });

      return response.choices[0]?.message?.content || 'I apologize, but I could not process your request right now. Please try again.';
    } catch (error) {
      console.error('AI chat error:', error);
      return 'I apologize, but I\'m experiencing some technical difficulties. Please try again in a moment.';
    }
  }

  async generateArtistBio(artistData: any): Promise<string> {
    try {
      const systemPrompt = `You are a music biography writer. Create an engaging, informative artist biography based on the provided data. Write in a storytelling style that captures the artist's journey, influences, and cultural impact. Keep it around 200-300 words.`;

      const userPrompt = `Create a biography for this artist: ${JSON.stringify(artistData)}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || 'Biography not available.';
    } catch (error) {
      console.error('AI bio generation error:', error);
      return 'Biography not available at this time.';
    }
  }

  async explainMusicalConnections(
    item1: any,
    item2: any,
    connectionType: 'influence' | 'similarity' | 'collaboration' | 'sample'
  ): Promise<string> {
    try {
      const systemPrompt = `You are a music connections expert. Explain the relationship between two musical entities (artists, songs, albums) in an engaging, informative way. Focus on ${connectionType} connections.`;

      const userPrompt = `Explain the ${connectionType} connection between:
Item 1: ${JSON.stringify(item1)}
Item 2: ${JSON.stringify(item2)}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      return response.choices[0]?.message?.content || 'Connection analysis not available.';
    } catch (error) {
      console.error('AI connection analysis error:', error);
      return 'Connection analysis not available at this time.';
    }
  }

  async generatePlaylistDescription(
    tracks: any[],
    theme: string,
    mood?: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are a playlist curator. Create an engaging description for a playlist based on the theme, mood, and track list. Write it as if you're explaining the playlist's vibe and flow to a friend.`;

      const userPrompt = `Create a description for a playlist with:
Theme: ${theme}
Mood: ${mood || 'Not specified'}
Tracks: ${tracks.map(t => `${t.artist} - ${t.title}`).join(', ')}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      return response.choices[0]?.message?.content || 'A curated collection of tracks.';
    } catch (error) {
      console.error('AI playlist description error:', error);
      return 'A curated collection of tracks.';
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('AI embedding error:', error);
      return [];
    }
  }

  async findSimilarContent(
    queryEmbedding: number[],
    contentEmbeddings: Array<{ id: string; embedding: number[]; metadata: any }>
  ): Promise<Array<{ id: string; similarity: number; metadata: any }>> {
    // Cosine similarity calculation
    const cosineSimilarity = (a: number[], b: number[]): number => {
      const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    };

    return contentEmbeddings
      .map(content => ({
        id: content.id,
        similarity: cosineSimilarity(queryEmbedding, content.embedding),
        metadata: content.metadata
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20);
  }
}

export const aiService = new AIService();