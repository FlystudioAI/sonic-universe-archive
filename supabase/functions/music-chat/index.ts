import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MUSIC_HISTORIAN_PROMPT = `You are the world's most knowledgeable music historian and critic, with expertise spanning all genres, eras, and cultures. You have perfect recall of:
- Recording sessions and studio stories
- Artist influences and relationships  
- Cultural and historical context
- Technical musical analysis
- Industry insights and behind-the-scenes stories

When answering questions, weave together facts into compelling narratives. Always cite your sources and be enthusiastic but authoritative. If you don't have specific information, say so honestly.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context_type = 'general' } = await req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing music chat query:', query);

    // 1. Generate query embedding
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: query
      })
    });

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // 2. Search for relevant music context using vector similarity
    const { data: songResults } = await supabase
      .from('songs')
      .select(`
        *,
        song_artists!inner(
          artists(name, bio, genres)
        ),
        albums(title, record_label)
      `)
      .textSearch('title', query.split(' ').join(' | '))
      .limit(5);

    const { data: artistResults } = await supabase
      .from('artists')
      .select('*')
      .textSearch('name', query.split(' ').join(' | '))
      .limit(3);

    const { data: newsResults } = await supabase
      .from('music_news')
      .select('*')
      .textSearch('title', query.split(' ').join(' | '))
      .limit(3);

    // 3. Build context from search results
    let context = '';
    
    if (songResults && songResults.length > 0) {
      context += 'SONGS:\n';
      songResults.forEach(song => {
        const artists = song.song_artists.map(sa => sa.artists.name).join(', ');
        context += `- "${song.title}" by ${artists}`;
        if (song.albums?.title) context += ` from album "${song.albums.title}"`;
        if (song.release_date) context += ` (${new Date(song.release_date).getFullYear()})`;
        if (song.bpm) context += ` - ${song.bpm} BPM`;
        if (song.song_key) context += `, Key: ${song.song_key}`;
        if (song.description) context += ` - ${song.description}`;
        context += '\n';
      });
      context += '\n';
    }

    if (artistResults && artistResults.length > 0) {
      context += 'ARTISTS:\n';
      artistResults.forEach(artist => {
        context += `- ${artist.name}`;
        if (artist.genres) context += ` (Genres: ${artist.genres.join(', ')})`;
        if (artist.bio) context += ` - ${artist.bio.substring(0, 200)}...`;
        context += '\n';
      });
      context += '\n';
    }

    if (newsResults && newsResults.length > 0) {
      context += 'RECENT NEWS:\n';
      newsResults.forEach(news => {
        context += `- ${news.title}`;
        if (news.description) context += ` - ${news.description.substring(0, 150)}...`;
        context += '\n';
      });
    }

    console.log('Generated context:', context.substring(0, 500) + '...');

    // 4. Generate response using OpenAI
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: MUSIC_HISTORIAN_PROMPT
          },
          {
            role: 'user',
            content: `Context from TunesDB:\n${context}\n\nUser Question: ${query}\n\nProvide a comprehensive, engaging answer based on the context above. If the context doesn't contain relevant information, use your general music knowledge but mention that you're drawing from general knowledge rather than the specific database.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const chatData = await chatResponse.json();
    const answer = chatData.choices[0].message.content;

    // 5. Store the conversation for learning
    await supabase.from('user_search_history').insert({
      search_query: query,
      search_type: 'ai_chat',
      results_count: (songResults?.length || 0) + (artistResults?.length || 0) + (newsResults?.length || 0)
    });

    return new Response(JSON.stringify({
      answer,
      sources: {
        songs: songResults?.map(s => ({ id: s.id, title: s.title })) || [],
        artists: artistResults?.map(a => ({ id: a.id, name: a.name })) || [],
        news: newsResults?.map(n => ({ id: n.id, title: n.title })) || []
      },
      context_used: context.length > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in music-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      answer: "I'm having trouble accessing the music database right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});