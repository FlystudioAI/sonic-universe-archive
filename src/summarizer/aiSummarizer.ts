import OpenAI from 'openai';
import { NewsArticle } from '../types';

export class AISummarizer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
    });
  }

  async generateSummary(article: NewsArticle): Promise<{
    summary: string;
    tone: 'positive' | 'neutral' | 'negative' | 'breaking';
    ctaText: string;
  }> {
    try {
      const prompt = this.createSummaryPrompt(article);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert AI news curator for CTRL/news, specializing in Generative AI and media technology. Create concise, engaging summaries that capture the essence of AI news stories."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || '';
      return this.parseSummaryResponse(response);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return {
        summary: article.summary || 'AI summary unavailable.',
        tone: 'neutral',
        ctaText: 'Read more'
      };
    }
  }

  async generateBatchSummaries(articles: NewsArticle[]): Promise<NewsArticle[]> {
    const summaryPromises = articles.map(async (article) => {
      const aiSummary = await this.generateSummary(article);
      return {
        ...article,
        summary: aiSummary.summary,
        tone: aiSummary.tone,
        ctaText: aiSummary.ctaText,
        aiGenerated: true
      };
    });

    return Promise.all(summaryPromises);
  }

  async generatePodcastScript(topStories: NewsArticle[]): Promise<string> {
    try {
      const prompt = this.createPodcastPrompt(topStories);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are creating a multi-host AI podcast called CTRLcast. You have 3 distinct synthetic hosts:
            
            - CTRL/Alex: Calm, objective, analytical. Provides context and factual analysis.
            - CTRL/Sam: Curious, inquisitive, asks great questions. Drives conversation forward.
            - CTRL/Jae: Witty, entertaining, finds interesting angles. Adds personality and humor.
            
            Create a natural, flowing 8-10 minute conversation between these hosts discussing the top GenAI stories. Include speaker tags, natural transitions, and end with a CTA to visit CTRL/news.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.8
      });

      return completion.choices[0]?.message?.content || 'Podcast script generation failed.';
    } catch (error) {
      console.error('Error generating podcast script:', error);
      return 'Welcome to CTRLcast. Today we have exciting AI news to share with you. Visit CTRL/news for more stories.';
    }
  }

  async generateTweetSummary(tweetText: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Summarize this AI/tech tweet in 1-2 sentences, highlighting the key insight or news. Keep it conversational and accessible."
          },
          {
            role: "user",
            content: `Tweet: ${tweetText}`
          }
        ],
        max_tokens: 100,
        temperature: 0.6
      });

      return completion.choices[0]?.message?.content || 'AI summary unavailable.';
    } catch (error) {
      console.error('Error summarizing tweet:', error);
      return 'AI summary unavailable.';
    }
  }

  private createSummaryPrompt(article: NewsArticle): string {
    return `
Article Title: ${article.title}
Article Content: ${article.summary || article.fullContent?.substring(0, 500)}
Source: ${article.source}

Please provide:
1. A 30-50 word engaging summary that captures the key AI/tech insight
2. The tone (positive/neutral/negative/breaking)
3. A compelling call-to-action phrase (5-8 words)

Format your response as:
SUMMARY: [your summary]
TONE: [tone]
CTA: [call to action]
    `;
  }

  private createPodcastPrompt(topStories: NewsArticle[]): string {
    const storiesSummary = topStories.slice(0, 10).map((story, index) => 
      `${index + 1}. ${story.title} - ${story.summary} (Source: ${story.source})`
    ).join('\n');

    return `
Today's Top 10 GenAI Stories:
${storiesSummary}

Create a conversational 8-10 minute podcast script with CTRL/Alex, CTRL/Sam, and CTRL/Jae discussing these stories. Include:
- Natural intro with today's date
- Discussion of 3-4 most important stories
- Each host contributing their unique perspective
- Smooth transitions between topics
- Brief mentions of other stories
- Engaging outro with CTA to visit CTRL/news

Keep it informative but conversational, like friends discussing tech news.
    `;
  }

  private parseSummaryResponse(response: string): {
    summary: string;
    tone: 'positive' | 'neutral' | 'negative' | 'breaking';
    ctaText: string;
  } {
    const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=\nTONE:|$)/s);
    const toneMatch = response.match(/TONE:\s*(\w+)/);
    const ctaMatch = response.match(/CTA:\s*(.+?)(?=\n|$)/);

    const summary = summaryMatch?.[1]?.trim() || 'AI-powered news summary.';
    const toneStr = toneMatch?.[1]?.toLowerCase();
    const tone: 'positive' | 'neutral' | 'negative' | 'breaking' = 
      ['positive', 'neutral', 'negative', 'breaking'].includes(toneStr || '') 
        ? toneStr as any 
        : 'neutral';
    const ctaText = ctaMatch?.[1]?.trim() || 'Learn more';

    return { summary, tone, ctaText };
  }

  async enhanceArticleWithAI(article: NewsArticle): Promise<NewsArticle> {
    const aiSummary = await this.generateSummary(article);
    
    return {
      ...article,
      summary: aiSummary.summary,
      tone: aiSummary.tone,
      ctaText: aiSummary.ctaText,
      aiGenerated: true
    };
  }

  // For CTRL/Ask feature - conversational AI for user queries
  async answerUserQuery(query: string, context: NewsArticle[]): Promise<string> {
    try {
      const contextStr = context.slice(0, 5).map(article => 
        `${article.title}: ${article.summary}`
      ).join('\n');

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are CTRL/AI, the intelligent assistant for CTRL/news. Answer questions about AI and tech news in a conversational, informative way. Use the provided context when relevant."
          },
          {
            role: "user",
            content: `User question: ${query}\n\nRecent news context:\n${contextStr}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || "I'm unable to answer that question right now. Please try again.";
    } catch (error) {
      console.error('Error answering user query:', error);
      return "I'm experiencing technical difficulties. Please try your question again.";
    }
  }
}