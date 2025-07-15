import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI music search...');
    
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

    // Use Gemini to analyze the search query and extract meaningful parameters
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GOOGLE_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this music search query and extract search parameters. Return a JSON object with these fields:
            - searchTerms: array of key search terms
            - genres: array of music genres mentioned
            - moods: array of moods (from: energetic, melancholic, uplifting, aggressive, peaceful, nostalgic, romantic, mysterious, playful, dramatic)
            - energy: energy level (low, medium, high, very_high)
            - bpmRange: object with min/max BPM if tempo mentioned
            - timeRange: object with startYear/endYear if time period mentioned
            - instruments: array of instruments mentioned
            - themes: array of song themes/topics
            - artistNames: array of artist names mentioned
            - songFeatures: array of musical features (fast, slow, danceable, etc.)
            - searchIntent: what the user is looking for (discover, find_specific, mood_based, etc.)
            
            Query: "${query}"
            
            Return only valid JSON, no explanation.`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      })
    });

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', geminiData);

    let analysisResult = {};
    try {
      const analysisText = geminiData.candidates[0].content.parts[0].text;
      analysisResult = JSON.parse(analysisText);
    } catch (e) {
      console.error('Error parsing Gemini response:', e);
      analysisResult = { searchTerms: [query], searchIntent: 'general' };
    }

    console.log('Analysis result:', analysisResult);

    // Build the database query based on AI analysis
    let dbQuery = supabase
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
        story_behind_song,
        albums(title, cover_art_url),
        song_artists(
          role,
          artists(name, image_url)
        ),
        song_genres(
          is_primary,
          genres(name)
        )
      `);

    // Apply filters based on AI analysis
    const analysis = analysisResult as any;
    
    // Text search across multiple fields
    if (analysis.searchTerms && analysis.searchTerms.length > 0) {
      const searchTerm = analysis.searchTerms.join(' ');
      dbQuery = dbQuery.or(`title.ilike.%${searchTerm}%,lyrics.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Filter by mood
    if (analysis.moods && analysis.moods.length > 0) {
      dbQuery = dbQuery.in('mood', analysis.moods);
    }

    // Filter by energy level
    if (analysis.energy) {
      dbQuery = dbQuery.eq('energy_level', analysis.energy);
    }

    // Filter by BPM range
    if (analysis.bpmRange) {
      if (analysis.bpmRange.min) {
        dbQuery = dbQuery.gte('bpm', analysis.bpmRange.min);
      }
      if (analysis.bpmRange.max) {
        dbQuery = dbQuery.lte('bpm', analysis.bpmRange.max);
      }
    }

    // Filter by time range
    if (analysis.timeRange) {
      if (analysis.timeRange.startYear) {
        dbQuery = dbQuery.gte('release_date', `${analysis.timeRange.startYear}-01-01`);
      }
      if (analysis.timeRange.endYear) {
        dbQuery = dbQuery.lte('release_date', `${analysis.timeRange.endYear}-12-31`);
      }
    }

    // Filter by instruments
    if (analysis.instruments && analysis.instruments.length > 0) {
      dbQuery = dbQuery.overlaps('instruments', analysis.instruments);
    }

    // Filter by themes
    if (analysis.themes && analysis.themes.length > 0) {
      dbQuery = dbQuery.overlaps('themes', analysis.themes);
    }

    // Apply additional filters from frontend
    if (filters.genres) {
      // This would need a join query for genres
    }

    // Limit results
    dbQuery = dbQuery.limit(50);

    const { data: songs, error } = await dbQuery;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Database query failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update search history with results count
    if (userId) {
      await supabase
        .from('user_search_history')
        .update({ results_count: songs?.length || 0 })
        .eq('user_id', userId)
        .eq('search_query', query)
        .order('searched_at', { ascending: false })
        .limit(1);
    }

    // Generate AI-powered recommendations based on search
    let recommendations = [];
    if (userId && songs && songs.length > 0) {
      // Get user's listening history for personalized recommendations
      const { data: userHistory } = await supabase
        .from('user_listening_history')
        .select('song_id, duration_listened_ms, completion_percentage')
        .eq('user_id', userId)
        .order('listened_at', { ascending: false })
        .limit(100);

      // Use Gemini to generate personalized recommendations
      const recommendationPrompt = `Based on the user's search for "${query}" and their listening history, suggest 5 additional songs they might like. Consider their preferences and the context of their search.
      
      Search results: ${songs.slice(0, 5).map(s => `${s.title} by ${s.song_artists?.[0]?.artists?.name}`).join(', ')}
      
      Return a JSON array of recommendation objects with: title, artist, reason (why recommended)`;

      try {
        const recResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GOOGLE_API_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: recommendationPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
          })
        });

        const recData = await recResponse.json();
        const recText = recData.candidates[0].content.parts[0].text;
        recommendations = JSON.parse(recText);
      } catch (e) {
        console.error('Error generating recommendations:', e);
      }
    }

    return new Response(JSON.stringify({
      songs,
      analysis: analysisResult,
      recommendations,
      searchMetadata: {
        query,
        resultsCount: songs?.length || 0,
        searchType,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-music-search function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});