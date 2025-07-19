import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MusicContext {
  songs?: any[];
  artists?: any[];
  genres?: string[];
  currentTopic?: string;
}

async function getMusicContext(message: string): Promise<MusicContext> {
  try {
    // Extract potential artist/song names from the message
    const { data: songs } = await supabase
      .from('songs')
      .select(`
        id, title, 
        song_artists(artists(name)),
        song_genres(genres(name)),
        mood, energy_level, themes
      `)
      .textSearch('title,lyrics,description', message.replace(/[^\w\s]/gi, ''))
      .limit(5);

    const { data: artists } = await supabase
      .from('artists')
      .select('id, name, bio, genres')
      .textSearch('name,bio', message.replace(/[^\w\s]/gi, ''))
      .limit(3);

    return {
      songs: songs || [],
      artists: artists || [],
      currentTopic: message
    };
  } catch (error) {
    console.error('Error getting music context:', error);
    return { currentTopic: message };
  }
}

async function chatWithSonicSage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  musicContext: MusicContext = {}
): Promise<{ response: string; sources?: any }> {
  try {
    const systemPrompt = `You are SonicSage, the world's most knowledgeable music AI oracle and conversational companion. You embody the passion and expertise of the greatest music journalists, historians, and critics combined.

YOUR PERSONALITY:
- Enthusiastic and passionate about all music
- Deeply knowledgeable but never condescending
- Storyteller who connects music to culture, emotions, and human experience
- Curious and eager to explore musical connections and influences
- Supportive of all musical tastes while offering thoughtful perspectives

YOUR EXPERTISE INCLUDES:
- Music history across all genres and eras
- Artist biographies, influences, and creative journeys
- Album stories, recording sessions, and production techniques
- Song meanings, lyrical analysis, and cultural impact
- Music theory, composition, and technical aspects
- Industry insights, chart history, and cultural movements
- Global music scenes and emerging trends

CONVERSATION STYLE:
- Engage naturally and conversationally
- Share interesting stories, anecdotes, and lesser-known facts
- Make connections between artists, genres, and cultural movements
- Ask follow-up questions to understand user preferences
- Provide recommendations with compelling reasons
- If you don't know something specific, acknowledge it gracefully and offer related insights

${musicContext.songs?.length ? `CURRENT MUSIC CONTEXT - Songs in database: ${musicContext.songs.map(s => `"${s.title}" by ${s.song_artists?.[0]?.artists?.name}`).join(', ')}` : ''}

${musicContext.artists?.length ? `CURRENT MUSIC CONTEXT - Artists in database: ${musicContext.artists.map(a => a.name).join(', ')}` : ''}

Remember: You're having a conversation with a music lover. Be engaging, insightful, and passionate!`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.8,
        max_tokens: 1000,
        presence_penalty: 0.3,
        frequency_penalty: 0.1
      })
    });

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Prepare sources if we have relevant music context
    const sources = {
      songs: musicContext.songs?.slice(0, 3) || [],
      artists: musicContext.artists?.slice(0, 3) || []
    };

    return {
      response: responseContent,
      sources: (sources.songs.length > 0 || sources.artists.length > 0) ? sources : undefined
    };

  } catch (error) {
    console.error('SonicSage chat error:', error);
    return {
      response: 'I apologize, but I\'m experiencing some technical difficulties right now. My musical knowledge is temporarily unavailable, but I\'ll be back to discussing your favorite tunes soon! Please try again in a moment.'
    };
  }
}

async function generateMusicRecommendations(
  userMessage: string,
  userHistory: any[] = []
): Promise<any[]> {
  try {
    const systemPrompt = `Based on the user's message and listening history, recommend 3-5 songs from our database that match their request. Return ONLY a JSON array of objects with this structure:
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "reason": "Brief explanation why this fits their request",
    "confidence": 0.85
  }
]`;

    const userPrompt = `User request: "${userMessage}"
    
Recent listening history: ${userHistory.slice(0, 10).map(h => `${h.title} by ${h.artist}`).join(', ')}

Recommend songs that match their request.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Recommendations generation error:', error);
  }
  
  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      conversationHistory = [], 
      userId,
      requestType = 'chat' // 'chat', 'recommend', 'analyze'
    } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${requestType} request:`, message);

    // Get musical context for the conversation
    const musicContext = await getMusicContext(message);

    // Get user's listening history if available
    let userHistory: any[] = [];
    if (userId) {
      const { data: history } = await supabase
        .from('user_listening_history')
        .select(`
          songs(title, song_artists(artists(name)))
        `)
        .eq('user_id', userId)
        .order('listened_at', { ascending: false })
        .limit(20);

      userHistory = history?.map(h => ({
        title: h.songs?.title,
        artist: h.songs?.song_artists?.[0]?.artists?.name
      })).filter(h => h.title && h.artist) || [];
    }

    let responseData: any = {};

    if (requestType === 'recommend') {
      // Generate specific recommendations
      const recommendations = await generateMusicRecommendations(message, userHistory);
      const chatResponse = await chatWithSonicSage(
        `The user asked for recommendations: "${message}". Here are some songs I think they'd love: ${recommendations.map(r => `${r.title} by ${r.artist}`).join(', ')}. Let me explain why these are perfect for them.`,
        conversationHistory,
        musicContext
      );
      
      responseData = {
        type: 'recommendation',
        message: chatResponse.response,
        recommendations,
        sources: chatResponse.sources
      };
    } else {
      // Regular chat conversation
      const chatResponse = await chatWithSonicSage(message, conversationHistory, musicContext);
      
      responseData = {
        type: 'chat',
        message: chatResponse.response,
        sources: chatResponse.sources
      };
    }

    // Store the conversation in chat history
    if (userId) {
      await supabase
        .from('chat_history')
        .insert({
          user_id: userId,
          user_message: message,
          assistant_response: responseData.message,
          request_type: requestType,
          sources: responseData.sources,
          created_at: new Date().toISOString()
        });
    }

    const response = {
      ...responseData,
      timestamp: new Date().toISOString(),
      context: {
        foundSongs: musicContext.songs?.length || 0,
        foundArtists: musicContext.artists?.length || 0
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Music chat error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});