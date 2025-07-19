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

interface SearchAnalysis {
  searchTerms: string[];
  genres: string[];
  moods: string[];
  energy: string;
  searchIntent: string;
  instruments: string[];
  themes: string[];
  timeframe?: string;
  location?: string;
}

async function analyzeSearchQuery(query: string): Promise<SearchAnalysis> {
  try {
    const systemPrompt = `You are a music search analysis AI. Analyze the user's query and extract musical characteristics, search intent, and relevant parameters. Respond ONLY with valid JSON matching this structure:
{
  "searchTerms": ["term1", "term2"],
  "genres": ["genre1", "genre2"],
  "moods": ["mood1", "mood2"],
  "energy": "low|medium|high|very_high",
  "searchIntent": "discovery|specific_song|artist_info|recommendation|mood_based",
  "instruments": ["instrument1", "instrument2"],
  "themes": ["theme1", "theme2"],
  "timeframe": "1960s|1980s|2000s|recent|etc",
  "location": "country/city if mentioned"
}`;

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
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Query analysis error:', error);
    return {
      searchTerms: query.split(' '),
      genres: [],
      moods: [],
      energy: 'medium',
      searchIntent: 'discovery',
      instruments: [],
      themes: [],
    };
  }
}

async function searchDatabase(analysis: SearchAnalysis, filters: any = {}) {
  let baseQuery = supabase
    .from('songs')
    .select(`
      id,
      title,
      duration_ms,
      release_date,
      bpm,
      song_key,
      key_mode,
      energy_level,
      mood,
      lyrics,
      themes,
      instruments,
      description,
      valence,
      danceability,
      albums (
        title,
        cover_art_url
      ),
      song_artists (
        role,
        artists (
          name,
          image_url
        )
      ),
      song_genres (
        is_primary,
        genres (
          name
        )
      )
    `);

  // Apply filters based on analysis
  if (analysis.genres.length > 0) {
    const { data: genreIds } = await supabase
      .from('genres')
      .select('id')
      .in('name', analysis.genres);
    
    if (genreIds && genreIds.length > 0) {
      baseQuery = baseQuery.in('song_genres.genre_id', genreIds.map(g => g.id));
    }
  }

  if (analysis.moods.length > 0) {
    baseQuery = baseQuery.in('mood', analysis.moods);
  }

  if (analysis.energy && analysis.energy !== 'medium') {
    baseQuery = baseQuery.eq('energy_level', analysis.energy);
  }

  if (analysis.instruments.length > 0) {
    baseQuery = baseQuery.overlaps('instruments', analysis.instruments);
  }

  if (analysis.themes.length > 0) {
    baseQuery = baseQuery.overlaps('themes', analysis.themes);
  }

  // Text search across multiple fields
  if (analysis.searchTerms.length > 0) {
    const searchText = analysis.searchTerms.join(' | ');
    baseQuery = baseQuery.textSearch('title,description,lyrics', searchText);
  }

  // Apply additional filters
  if (filters.releaseYear) {
    baseQuery = baseQuery.gte('release_date', `${filters.releaseYear}-01-01`);
    baseQuery = baseQuery.lt('release_date', `${filters.releaseYear + 1}-01-01`);
  }

  if (filters.bpmRange) {
    baseQuery = baseQuery.gte('bpm', filters.bpmRange.min);
    baseQuery = baseQuery.lte('bpm', filters.bpmRange.max);
  }

  return baseQuery.limit(50);
}

async function generateSearchRecommendations(query: string, results: any[]): Promise<string[]> {
  try {
    const systemPrompt = `Based on the user's search query and results, suggest 3-5 alternative search terms or related queries that might help them discover more music. Return only a JSON array of strings.`;

    const userPrompt = `Query: "${query}"
Found ${results.length} results. Suggest related searches.`;

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
        max_tokens: 200
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
    console.log('Starting enhanced AI music search...');
    
    const { query, userId, searchType = 'natural_language', filters = {} } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log the search query for user history
    if (userId) {
      await supabase
        .from('user_search_history')
        .insert({
          user_id: userId,
          search_query: query,
          search_type: searchType,
          searched_at: new Date().toISOString()
        });
    }

    // Analyze the search query with AI
    const analysis = await analyzeSearchQuery(query);
    console.log('Search analysis:', analysis);

    // Search the database based on analysis
    const { data: songs, error } = await searchDatabase(analysis, filters);
    
    if (error) {
      console.error('Database search error:', error);
      return new Response(JSON.stringify({ error: 'Search failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate search recommendations
    const recommendations = await generateSearchRecommendations(query, songs || []);

    // Format results
    const formattedSongs = (songs || []).map(song => ({
      id: song.id,
      title: song.title,
      artist: song.song_artists?.[0]?.artists?.name || 'Unknown Artist',
      album: song.albums?.title || 'Unknown Album',
      albumArt: song.albums?.cover_art_url,
      duration: song.duration_ms,
      releaseDate: song.release_date,
      genres: song.song_genres?.map(sg => sg.genres.name) || [],
      mood: song.mood,
      energy: song.energy_level,
      bpm: song.bpm,
      key: song.song_key,
      keyMode: song.key_mode,
      themes: song.themes || [],
      instruments: song.instruments || [],
      description: song.description,
      valence: song.valence,
      danceability: song.danceability
    }));

    const response = {
      query,
      analysis,
      results: formattedSongs,
      count: formattedSongs.length,
      recommendations,
      searchType,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI music search error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});