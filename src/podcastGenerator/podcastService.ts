import axios from 'axios';
import { NewsArticle, PodcastEpisode, PodcastHost, PodcastSegment, User } from '../types';
import { AISummarizer } from '../summarizer/aiSummarizer';

export class PodcastService {
  private readonly elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  private readonly aiSummarizer = new AISummarizer();

  // Define the three podcast hosts with their ElevenLabs voice IDs and personalities
  private readonly hosts: PodcastHost[] = [
    {
      name: 'CTRL/Alex',
      voice: 'alex',
      personality: 'Thoughtful, analytical, provides deep context and asks probing questions. Often connects stories to broader trends.',
      elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB' // Adam voice (calm, professional)
    },
    {
      name: 'CTRL/Sam',
      voice: 'sam',
      personality: 'Curious, enthusiastic, asks "what if" questions. Gets excited about implications and possibilities.',
      elevenLabsVoiceId: 'XB0fDUnXU5powFXDhCwa' // Charlotte voice (curious, engaging)
    },
    {
      name: 'CTRL/Jae',
      voice: 'jae',
      personality: 'Witty, brings levity, finds interesting angles and real-world analogies. Keeps conversation engaging.',
      elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV' // Antoni voice (warm, entertaining)
    }
  ];

  // Generate personalized daily podcast based on user interests
  async generatePersonalizedPodcast(user: User, topStories: NewsArticle[]): Promise<PodcastEpisode> {
    try {
      // Filter and rank stories based on user interests
      const personalizedStories = this.personalizeStories(topStories, user);
      
      // Generate conversational script targeting the user
      const script = await this.generateConversationalScript(personalizedStories, user);
      
      // Parse script into segments
      const segments = this.parseConversationalScript(script);
      
      // Generate audio for each segment
      const audioSegments = await this.generateAudioSegments(segments);
      
      // Stitch audio segments together
      const finalAudioUrl = await this.stitchAudioSegments(audioSegments);
      
      // Calculate total duration
      const totalDuration = audioSegments.reduce((sum, segment) => sum + (segment.duration || 0), 0);
      
      // Generate transcript
      const transcript = this.generateTranscript(audioSegments);

      const episode: PodcastEpisode = {
        id: `ctrl-${user.uid}-${new Date().toISOString().split('T')[0]}`,
        title: `Your AI News Briefing - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
        description: `Personalized discussion of today's top AI stories based on your interests: ${user.interests.slice(0, 3).join(', ')}`,
        audioUrl: finalAudioUrl,
        duration: totalDuration,
        transcript,
        publishedAt: new Date(),
        stories: personalizedStories.slice(0, 10),
        hosts: this.hosts,
        downloadCount: 0,
        listenCount: 0
      };

      return episode;
    } catch (error) {
      console.error('Error generating personalized podcast:', error);
      throw new Error('Failed to generate personalized podcast episode');
    }
  }

  // Generate custom podcast from user-selected stories (Premium feature)
  async generateCustomPodcast(user: User, selectedStories: NewsArticle[], customTitle?: string): Promise<PodcastEpisode> {
    if (user.subscriptionTier !== 'premium') {
      throw new Error('Custom podcast generation is a Premium feature');
    }

    try {
      // Generate focused conversational script for selected stories
      const script = await this.generateCustomConversationalScript(selectedStories, user, customTitle);
      
      // Parse script into segments
      const segments = this.parseConversationalScript(script);
      
      // Generate audio for each segment
      const audioSegments = await this.generateAudioSegments(segments);
      
      // Stitch audio segments together
      const finalAudioUrl = await this.stitchAudioSegments(audioSegments);
      
      // Calculate total duration
      const totalDuration = audioSegments.reduce((sum, segment) => sum + (segment.duration || 0), 0);
      
      // Generate transcript
      const transcript = this.generateTranscript(audioSegments);

      const episode: PodcastEpisode = {
        id: `ctrl-custom-${user.uid}-${Date.now()}`,
        title: customTitle || `Custom AI Discussion - ${selectedStories.length} Stories`,
        description: `Custom podcast discussing: ${selectedStories.map(s => s.title).slice(0, 2).join(', ')}${selectedStories.length > 2 ? ` and ${selectedStories.length - 2} more` : ''}`,
        audioUrl: finalAudioUrl,
        duration: totalDuration,
        transcript,
        publishedAt: new Date(),
        stories: selectedStories,
        hosts: this.hosts,
        downloadCount: 0,
        listenCount: 0
      };

      return episode;
    } catch (error) {
      console.error('Error generating custom podcast:', error);
      throw new Error('Failed to generate custom podcast episode');
    }
  }

  // Legacy method updated to use personalization
  async generateDailyPodcast(topStories: NewsArticle[], user?: User): Promise<PodcastEpisode> {
    if (user) {
      return this.generatePersonalizedPodcast(user, topStories);
    }

    // Fallback to generic podcast for non-authenticated users
    const script = await this.generateGenericConversationalScript(topStories);
    const segments = this.parseConversationalScript(script);
    const audioSegments = await this.generateAudioSegments(segments);
    const finalAudioUrl = await this.stitchAudioSegments(audioSegments);
    const totalDuration = audioSegments.reduce((sum, segment) => sum + (segment.duration || 0), 0);
    const transcript = this.generateTranscript(audioSegments);

    return {
      id: `ctrl-daily-${new Date().toISOString().split('T')[0]}`,
      title: `CTRLcast ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      description: `Today's top GenAI stories discussed by CTRL/Alex, CTRL/Sam, and CTRL/Jae`,
      audioUrl: finalAudioUrl,
      duration: totalDuration,
      transcript,
      publishedAt: new Date(),
      stories: topStories.slice(0, 10),
      hosts: this.hosts,
      downloadCount: 0,
      listenCount: 0
    };
  }

  private personalizeStories(stories: NewsArticle[], user: User): NewsArticle[] {
    // Score stories based on user interests and behavior
    const scoredStories = stories.map(story => {
      let personalizedScore = story.engagementScore || 0;
      
      // Boost score for user interests
      const titleLower = story.title.toLowerCase();
      const summaryLower = story.summary.toLowerCase();
      const tagsLower = story.tags.map(tag => tag.toLowerCase());
      
      user.interests.forEach(interest => {
        const interestLower = interest.toLowerCase();
        if (titleLower.includes(interestLower) || 
            summaryLower.includes(interestLower) ||
            tagsLower.some(tag => tag.includes(interestLower))) {
          personalizedScore += 25; // Significant boost for user interests
        }
      });

      // Boost for breaking news
      if (story.tone === 'breaking') {
        personalizedScore += 15;
      }

      // Boost for high credibility sources
      personalizedScore += story.credibilityScore * 10;

      return { ...story, personalizedScore };
    });

    // Sort by personalized score and return top stories
    return scoredStories
      .sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0))
      .slice(0, 10);
  }

  private async generateConversationalScript(stories: NewsArticle[], user: User): Promise<string> {
    const userInterests = user.interests.join(', ');
    const topStories = stories.slice(0, 10);
    
    const prompt = `Create a natural, conversational 10-12 minute podcast script between three AI hosts discussing today's AI news. Make it feel like an engaging conversation between knowledgeable friends, similar to NotebookLM's style.

USER CONTEXT: This listener is particularly interested in: ${userInterests}

HOSTS:
- CTRL/Alex: Thoughtful, analytical, provides deep context and asks probing questions. Often connects stories to broader trends.
- CTRL/Sam: Curious, enthusiastic, asks "what if" questions. Gets excited about implications and possibilities.  
- CTRL/Jae: Witty, brings levity, finds interesting angles and real-world analogies. Keeps conversation engaging.

TODAY'S STORIES:
${topStories.map((story, index) => `${index + 1}. ${story.title} - ${story.summary} (${story.source})`).join('\n')}

CONVERSATION STYLE:
- Natural interruptions and cross-talk
- Build on each other's points
- Ask follow-up questions
- Share genuine reactions and insights
- Reference the user's interests naturally
- Use phrases like "Wait, that reminds me of..." or "Building on what you said..."
- Include thoughtful pauses and "hmm" moments
- Make connections between different stories

STRUCTURE:
1. Warm opening acknowledging the user's interests
2. Dive into 3-4 main stories with deep discussion
3. Quick mentions of other interesting developments
4. Forward-looking discussion about implications
5. Engaging close with a thought-provoking question

Make it feel like you're having a real conversation about these fascinating developments in AI!`;

    const completion = await this.aiSummarizer.constructor.prototype.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a master podcast script writer who creates engaging, natural conversations between AI hosts. Focus on making the dialogue feel authentic and conversational."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.8
    });

    return completion.choices[0]?.message?.content || 'Podcast script generation failed.';
  }

  private async generateCustomConversationalScript(stories: NewsArticle[], user: User, customTitle?: string): Promise<string> {
    const prompt = `Create a focused, conversational 8-10 minute podcast script between three AI hosts diving deep into the user's selected AI stories. Make it feel like a personalized discussion tailored to their specific interests.

CUSTOM FOCUS: ${customTitle || 'User-selected AI stories for deep discussion'}

HOSTS:
- CTRL/Alex: Thoughtful, analytical, provides deep context and asks probing questions
- CTRL/Sam: Curious, enthusiastic, explores implications and possibilities  
- CTRL/Jae: Witty, finds interesting angles and keeps the conversation engaging

SELECTED STORIES:
${stories.map((story, index) => `${index + 1}. ${story.title} - ${story.summary} (${story.source})`).join('\n')}

CONVERSATION STYLE:
- Since the user specifically chose these stories, dive deeper than usual
- Explore connections between the selected stories
- Discuss why these stories might be particularly significant
- Ask thought-provoking questions about implications
- Natural, flowing conversation with interruptions and building on points
- Show genuine curiosity and excitement about the topics

STRUCTURE:
1. Acknowledge this is a custom selection and why it's interesting
2. Deep dive into each story with multiple perspectives
3. Connect the stories to bigger themes and trends
4. Explore potential future implications
5. Close with insights about what this collection of stories reveals about AI's direction

Make this feel like a premium, personalized discussion that goes beyond surface-level coverage!`;

    const completion = await this.aiSummarizer.constructor.prototype.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are creating a premium, personalized podcast experience. Make the conversation feel tailored and insightful."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.8
    });

    return completion.choices[0]?.message?.content || 'Custom podcast script generation failed.';
  }

  private async generateGenericConversationalScript(stories: NewsArticle[]): Promise<string> {
    const topStories = stories.slice(0, 10);
    
    const prompt = `Create a natural, conversational 10-minute podcast script between three AI hosts discussing today's top AI news. Make it engaging and accessible to a general audience interested in AI developments.

HOSTS:
- CTRL/Alex: Thoughtful, analytical, provides context
- CTRL/Sam: Curious, asks good questions, explores implications  
- CTRL/Jae: Witty, keeps things engaging, finds interesting angles

TODAY'S TOP STORIES:
${topStories.map((story, index) => `${index + 1}. ${story.title} - ${story.summary}`).join('\n')}

Make this feel like a natural conversation between knowledgeable friends discussing fascinating AI developments. Include interruptions, follow-up questions, and genuine reactions.`;

    const completion = await this.aiSummarizer.constructor.prototype.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Create an engaging, conversational podcast script about AI news."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.8
    });

    return completion.choices[0]?.message?.content || 'Generic podcast script generation failed.';
  }

  private parseConversationalScript(script: string): PodcastSegment[] {
    const segments: PodcastSegment[] = [];
    const lines = script.split('\n').filter(line => line.trim());

    let currentHost = '';
    let currentText = '';
    let segmentIndex = 0;

    for (const line of lines) {
      // Enhanced parsing for more natural conversation markers
      const hostMatch = line.match(/^(CTRL\/Alex|CTRL\/Sam|CTRL\/Jae|Alex|Sam|Jae)[\:\-\s]/i);
      
      if (hostMatch) {
        // Save previous segment if exists
        if (currentHost && currentText.trim()) {
          segments.push({
            type: this.determineConversationalSegmentType(currentText, segmentIndex),
            host: currentHost.startsWith('CTRL/') ? currentHost : `CTRL/${currentHost}`,
            text: currentText.trim()
          });
          segmentIndex++;
        }
        
        // Start new segment
        currentHost = hostMatch[1];
        if (!currentHost.startsWith('CTRL/')) {
          currentHost = `CTRL/${currentHost}`;
        }
        currentText = line.substring(hostMatch[0].length).trim();
      } else if (currentHost && line.trim()) {
        // Continue current segment, handling natural conversation flow
        currentText += ' ' + line.trim();
      }
    }

    // Add final segment
    if (currentHost && currentText.trim()) {
      segments.push({
        type: this.determineConversationalSegmentType(currentText, segmentIndex),
        host: currentHost,
        text: currentText.trim()
      });
    }

    return segments;
  }

  private determineConversationalSegmentType(text: string, segmentIndex: number): 'intro' | 'story' | 'transition' | 'outro' {
    const lowerText = text.toLowerCase();
    
    // Check for intro patterns
    if (segmentIndex === 0 || 
        lowerText.includes('welcome') || 
        lowerText.includes('good morning') ||
        lowerText.includes('today we') ||
        lowerText.includes('starting off')) {
      return 'intro';
    }
    
    // Check for outro patterns
    if (lowerText.includes('that\'s all for today') || 
        lowerText.includes('visit ctrl/news') || 
        lowerText.includes('goodbye') ||
        lowerText.includes('until next time') ||
        lowerText.includes('wrapping up') ||
        lowerText.includes('thanks for listening')) {
      return 'outro';
    }
    
    // Check for transition patterns
    if (lowerText.includes('speaking of') || 
        lowerText.includes('meanwhile') || 
        lowerText.includes('in other news') ||
        lowerText.includes('shifting gears') ||
        lowerText.includes('another interesting') ||
        lowerText.includes('wait, that reminds me') ||
        lowerText.includes('building on that')) {
      return 'transition';
    }
    
    return 'story';
  }

  // Rest of the existing methods remain the same...
  private async generateAudioSegments(segments: PodcastSegment[]): Promise<PodcastSegment[]> {
    const audioPromises = segments.map(async (segment) => {
      const host = this.hosts.find(h => h.name === segment.host);
      if (!host) {
        console.warn(`Host not found: ${segment.host}`);
        return segment;
      }

      try {
        const audioUrl = await this.generateTTS(segment.text, host.elevenLabsVoiceId);
        const duration = this.estimateAudioDuration(segment.text);
        
        return {
          ...segment,
          audioUrl,
          duration
        };
      } catch (error) {
        console.error(`Error generating audio for ${segment.host}:`, error);
        return segment;
      }
    });

    return Promise.all(audioPromises);
  }

  private async generateTTS(text: string, voiceId: string): Promise<string> {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.4, // Slightly less stable for more natural variation
            similarity_boost: 0.6,
            style: 0.2, // Add some style for conversational feel
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey
          },
          responseType: 'blob'
        }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw new Error('Failed to generate TTS audio');
    }
  }

  private estimateAudioDuration(text: string): number {
    // More conversational pace: ~130 words per minute (slower for natural conversation)
    const wordCount = text.split(' ').length;
    return Math.round((wordCount / 130) * 60); // Duration in seconds
  }

  private async stitchAudioSegments(segments: PodcastSegment[]): Promise<string> {
    // In production, this would use FFmpeg to stitch segments with crossfades
    // and natural pauses between speakers for a more conversational feel
    console.log('Audio stitching with conversational timing would happen here with FFmpeg');
    return segments[0]?.audioUrl || '';
  }

  private generateTranscript(segments: PodcastSegment[]): string {
    return segments
      .map(segment => `${segment.host}: ${segment.text}`)
      .join('\n\n');
  }

  // Enhanced episode management methods
  async getRecentEpisodes(limit: number = 7): Promise<PodcastEpisode[]> {
    // This would fetch from Firebase/Firestore in a real implementation
    return [];
  }

  async getUserEpisodes(userId: string, limit: number = 10): Promise<PodcastEpisode[]> {
    // Fetch user's personalized and custom episodes
    return [];
  }

  async incrementListenCount(episodeId: string): Promise<void> {
    console.log(`Incrementing listen count for episode: ${episodeId}`);
  }

  async incrementDownloadCount(episodeId: string): Promise<void> {
    console.log(`Incrementing download count for episode: ${episodeId}`);
  }

  // Advanced podcast generation for premium users
  async generateThematicPodcast(user: User, theme: string, relatedStories: NewsArticle[]): Promise<PodcastEpisode> {
    if (user.subscriptionTier !== 'premium') {
      throw new Error('Thematic podcast generation is a Premium feature');
    }

    return this.generateCustomPodcast(user, relatedStories, `Deep Dive: ${theme}`);
  }

  async generateComparisonPodcast(user: User, storyA: NewsArticle, storyB: NewsArticle): Promise<PodcastEpisode> {
    if (user.subscriptionTier !== 'premium') {
      throw new Error('Comparison podcast generation is a Premium feature');
    }

    return this.generateCustomPodcast(user, [storyA, storyB], `Comparing: ${storyA.title} vs ${storyB.title}`);
  }
}