import axios from 'axios';
import { NewsArticle, PodcastEpisode, PodcastHost, PodcastSegment } from '../types';
import { AISummarizer } from '../summarizer/aiSummarizer';

export class PodcastService {
  private readonly elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  private readonly aiSummarizer = new AISummarizer();

  // Define the three podcast hosts with their ElevenLabs voice IDs
  private readonly hosts: PodcastHost[] = [
    {
      name: 'CTRL/Alex',
      voice: 'alex',
      personality: 'Calm, objective, analytical. Provides context and factual analysis.',
      elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB' // Adam voice (calm, professional)
    },
    {
      name: 'CTRL/Sam',
      voice: 'sam',
      personality: 'Curious, inquisitive, asks great questions. Drives conversation forward.',
      elevenLabsVoiceId: 'XB0fDUnXU5powFXDhCwa' // Charlotte voice (curious, engaging)
    },
    {
      name: 'CTRL/Jae',
      voice: 'jae',
      personality: 'Witty, entertaining, finds interesting angles. Adds personality and humor.',
      elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV' // Antoni voice (warm, entertaining)
    }
  ];

  async generateDailyPodcast(topStories: NewsArticle[]): Promise<PodcastEpisode> {
    try {
      // Step 1: Generate the podcast script using GPT-4o
      const script = await this.aiSummarizer.generatePodcastScript(topStories);
      
      // Step 2: Parse the script into segments
      const segments = this.parseScriptIntoSegments(script);
      
      // Step 3: Generate audio for each segment
      const audioSegments = await this.generateAudioSegments(segments);
      
      // Step 4: Stitch audio segments together (simplified - would use FFmpeg in production)
      const finalAudioUrl = await this.stitchAudioSegments(audioSegments);
      
      // Step 5: Calculate total duration
      const totalDuration = audioSegments.reduce((sum, segment) => sum + (segment.duration || 0), 0);
      
      // Step 6: Generate transcript
      const transcript = this.generateTranscript(audioSegments);

      const episode: PodcastEpisode = {
        id: `ctrl-${new Date().toISOString().split('T')[0]}`,
        title: `CTRLcast ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        description: `Today's top GenAI stories discussed by CTRL/Alex, CTRL/Sam, and CTRL/Jae. ${topStories.slice(0, 3).map(s => s.title).join(', ')}.`,
        audioUrl: finalAudioUrl,
        duration: totalDuration,
        transcript,
        publishedAt: new Date(),
        stories: topStories.slice(0, 10),
        hosts: this.hosts,
        downloadCount: 0,
        listenCount: 0
      };

      return episode;
    } catch (error) {
      console.error('Error generating daily podcast:', error);
      throw new Error('Failed to generate podcast episode');
    }
  }

  private parseScriptIntoSegments(script: string): PodcastSegment[] {
    const segments: PodcastSegment[] = [];
    const lines = script.split('\n').filter(line => line.trim());

    let currentHost = '';
    let currentText = '';

    for (const line of lines) {
      // Check if line starts with a host name
      const hostMatch = line.match(/^(CTRL\/Alex|CTRL\/Sam|CTRL\/Jae):/i);
      
      if (hostMatch) {
        // Save previous segment if exists
        if (currentHost && currentText) {
          segments.push({
            type: this.determineSegmentType(currentText, segments.length),
            host: currentHost,
            text: currentText.trim()
          });
        }
        
        // Start new segment
        currentHost = hostMatch[1];
        currentText = line.substring(hostMatch[0].length).trim();
      } else if (currentHost) {
        // Continue current segment
        currentText += ' ' + line.trim();
      }
    }

    // Add final segment
    if (currentHost && currentText) {
      segments.push({
        type: this.determineSegmentType(currentText, segments.length),
        host: currentHost,
        text: currentText.trim()
      });
    }

    return segments;
  }

  private determineSegmentType(text: string, segmentIndex: number): 'intro' | 'story' | 'transition' | 'outro' {
    const lowerText = text.toLowerCase();
    
    if (segmentIndex === 0 || lowerText.includes('welcome') || lowerText.includes('good morning')) {
      return 'intro';
    }
    
    if (lowerText.includes('that\'s all for today') || lowerText.includes('visit ctrl/news') || lowerText.includes('goodbye')) {
      return 'outro';
    }
    
    if (lowerText.includes('speaking of') || lowerText.includes('meanwhile') || lowerText.includes('in other news')) {
      return 'transition';
    }
    
    return 'story';
  }

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
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
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

      // Convert blob to URL (in a real app, you'd upload to cloud storage)
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw new Error('Failed to generate TTS audio');
    }
  }

  private estimateAudioDuration(text: string): number {
    // Estimate ~150 words per minute reading speed
    const wordCount = text.split(' ').length;
    return Math.round((wordCount / 150) * 60); // Duration in seconds
  }

  private async stitchAudioSegments(segments: PodcastSegment[]): Promise<string> {
    // In a production environment, this would use FFmpeg or similar
    // For now, we'll create a simple concatenated audio URL
    
    // This is a simplified implementation - in production you'd:
    // 1. Download all audio segments
    // 2. Use FFmpeg to concatenate them
    // 3. Upload the final file to cloud storage
    // 4. Return the public URL
    
    console.log('Audio stitching would happen here with FFmpeg');
    
    // For demo purposes, return the first segment's URL
    return segments[0]?.audioUrl || '';
  }

  private generateTranscript(segments: PodcastSegment[]): string {
    return segments
      .map(segment => `${segment.host}: ${segment.text}`)
      .join('\n\n');
  }

  async getRecentEpisodes(limit: number = 7): Promise<PodcastEpisode[]> {
    // This would typically fetch from Firebase/Firestore
    // For now, return empty array - implement when database is connected
    return [];
  }

  async incrementListenCount(episodeId: string): Promise<void> {
    // Update listen count in database
    console.log(`Incrementing listen count for episode: ${episodeId}`);
  }

  async incrementDownloadCount(episodeId: string): Promise<void> {
    // Update download count in database
    console.log(`Incrementing download count for episode: ${episodeId}`);
  }

  // Advanced features for future implementation
  async generateCustomPodcast(userInterests: string[], recentArticles: NewsArticle[]): Promise<PodcastEpisode> {
    // Filter articles based on user interests
    const relevantArticles = recentArticles.filter(article => 
      userInterests.some(interest => 
        article.title.toLowerCase().includes(interest.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
      )
    );

    return this.generateDailyPodcast(relevantArticles);
  }

  async generateShortClips(episode: PodcastEpisode): Promise<string[]> {
    // Generate 30-60 second clips for social media
    // This would analyze the transcript and extract key moments
    console.log('Generating short clips for social media');
    return [];
  }

  // Voice cloning capabilities for future CTRL/Create feature
  async trainCustomVoice(audioSamples: File[]): Promise<string> {
    console.log('Custom voice training would happen here');
    return 'custom-voice-id';
  }
}