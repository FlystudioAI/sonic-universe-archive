import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// API Keys for external services
const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
const lastFmApiKey = Deno.env.get('LASTFM_API_KEY');
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

interface SearchRequest {
  query: string;
  limit?: number;
  sources?: string[]; // ['local', 'spotify', 'lastfm', 'musicbrainz']
  cacheResults?: boolean;
  semanticSearch?: boolean; // New flag for semantic search
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration_ms?: number;
  source: 'local' | 'spotify' | 'lastfm' | 'musicbrainz';
  external_id?: string;
  cached: boolean;
  metadata?: {
    mood?: string;
    energy_level?: string;
    bpm?: number;
    genres?: string[];
    cover_art_url?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 20, sources = ['local', 'spotify', 'lastfm'], cacheResults = true, semanticSearch = true }: SearchRequest = await req.json();

    console.log(`Federated search for: "${query}" across sources: ${sources.join(', ')}`);

    const results: SearchResult[] = [];
    const searchPromises: Promise<SearchResult[]>[] = [];

    // 1. Always search local database first (fastest)
    if (sources.includes('local')) {
      searchPromises.push(searchLocalDatabase(query, Math.ceil(limit * 0.6), semanticSearch)); // 60% from local
    }

    // 2. Search external APIs in parallel
    if (sources.includes('spotify') && spotifyClientId && spotifyClientSecret) {
      searchPromises.push(searchSpotify(query, Math.ceil(limit * 0.3))); // 30% from Spotify
    }

    if (sources.includes('lastfm') && lastFmApiKey) {
      searchPromises.push(searchLastFm(query, Math.ceil(limit * 0.2))); // 20% from Last.fm
    }

    if (sources.includes('musicbrainz')) {
      searchPromises.push(searchMusicBrainz(query, Math.ceil(limit * 0.2))); // 20% from MusicBrainz
    }

    // Execute all searches in parallel
    const searchResults = await Promise.allSettled(searchPromises);
    
    // Combine results
    for (const result of searchResults) {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      } else {
        console.error('Search failed:', result.reason);
      }
    }

    // Remove duplicates and sort by relevance (local first, then by popularity)
    const uniqueResults = deduplicateResults(results);
    const sortedResults = uniqueResults
      .sort((a, b) => {
        // Prioritize local results
        if (a.source === 'local' && b.source !== 'local') return -1;
        if (b.source === 'local' && a.source !== 'local') return 1;
        // Then sort by title similarity to query
        return calculateRelevance(b.title, query) - calculateRelevance(a.title, query);
      })
      .slice(0, limit);

    // Cache external results for future use
    if (cacheResults) {
      await cacheExternalResults(sortedResults.filter(r => r.source !== 'local'));
    }

    return new Response(
      JSON.stringify({
        results: sortedResults,
        metadata: {
          total_found: sortedResults.length,
          sources_used: sources,
          local_results: sortedResults.filter(r => r.source === 'local').length,
          external_results: sortedResults.filter(r => r.source !== 'local').length,
          cached_results: sortedResults.filter(r => r.cached).length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in federated-music-search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function searchLocalDatabase(query: string, limit: number, semanticSearch: boolean = true): Promise<SearchResult[]> {
  console.log(`Searching local database for: "${query}" (semantic: ${semanticSearch})`);
  
  try {
    let searchResults: SearchResult[] = [];

    if (semanticSearch && googleApiKey) {
      // Use AI to understand the query context
      const analysisResult = await analyzeSearchQuery(query);
      console.log('Search analysis:', analysisResult);
      
      // Build contextual search queries
      const searches: Promise<SearchResult[]>[] = [];
      
      // 1. Geographic/Cultural search - search by artist country, themes, genres
      if (analysisResult.geographic || analysisResult.cultural) {
        searches.push(searchByGeographicContext(query, analysisResult, limit));
      }
      
      // 2. Artist-based search - search by artist name and origin
      if (analysisResult.searchTerms) {
        searches.push(searchByArtistContext(analysisResult.searchTerms, limit));
      }
      
      // 3. Genre and mood-based search
      if (analysisResult.genres || analysisResult.moods) {
        searches.push(searchByGenreAndMood(analysisResult, limit));
      }
      
      // 4. Fallback traditional search
      searches.push(searchByKeywords(query, limit));
      
      // Execute all searches in parallel
      const results = await Promise.allSettled(searches);
      
      // Combine and deduplicate results
      const allResults: SearchResult[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          console.log(`Search returned ${result.value.length} results`);
          allResults.push(...result.value);
        }
      }
      
      console.log(`Total results before deduplication: ${allResults.length}`);
      searchResults = deduplicateResults(allResults);
      console.log(`Total results after deduplication: ${searchResults.length}`);
    } else {
      // Fall back to simple keyword search
      searchResults = await searchByKeywords(query, limit);
    }

    return searchResults.slice(0, limit);
  } catch (error) {
    console.error('Local search error:', error);
    return [];
  }
}

async function analyzeSearchQuery(query: string): Promise<any> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this music search query and determine the search intent. Return a JSON object with these fields:
            - searchTerms: array of key search terms
            - geographic: string if geographic location mentioned (e.g., "south africa", "brazil", "jamaica")
            - cultural: string if cultural context mentioned (e.g., "african", "latin", "caribbean")
            - genres: array of music genres that might be relevant
            - moods: array of moods that might be relevant
            - timeframe: string if time period mentioned (e.g., "90s", "modern", "classic")
            - instruments: array of instruments mentioned
            - artistNames: array of potential artist names
            - searchIntent: primary intent (geographic, artist, genre, mood, cultural)
            
            Query: "${query}"
            
            Return only valid JSON, no explanation.`
          }]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
      })
    });

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('Error analyzing search query:', error);
    return { searchTerms: [query], searchIntent: 'keyword' };
  }
}

async function searchByGeographicContext(query: string, analysis: any, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    // Search by artist country - need to do this with a proper join
    if (analysis.geographic) {
      const { data: artistsFromCountry } = await supabase
        .from('artists')
        .select('id')
        .ilike('country', `%${analysis.geographic}%`);

      if (artistsFromCountry && artistsFromCountry.length > 0) {
        const artistIds = artistsFromCountry.map(a => a.id);
        
        const { data: songs } = await supabase
          .from('songs')
          .select(`
            id, title, duration_ms, mood, energy_level, bpm,
            albums(title, cover_art_url, record_label),
            song_artists!inner(role, artists(name, image_url, country)),
            song_genres(is_primary, genres(name))
          `)
          .in('song_artists.artist_id', artistIds)
          .limit(limit);

        if (songs) {
          results.push(...formatSongResults(songs));
        }
      }
    }

    // Search by cultural themes and genres
    if (analysis.cultural) {
      const culturalGenres = getCulturalGenres(analysis.cultural);
      if (culturalGenres.length > 0) {
        const { data: genres } = await supabase
          .from('genres')
          .select('id')
          .in('name', culturalGenres);

        if (genres && genres.length > 0) {
          const genreIds = genres.map(g => g.id);
          
          const { data: songs } = await supabase
            .from('songs')
            .select(`
              id, title, duration_ms, mood, energy_level, bpm,
              albums(title, cover_art_url),
              song_artists(role, artists(name, image_url)),
              song_genres!inner(is_primary, genres(name))
            `)
            .in('song_genres.genre_id', genreIds)
            .limit(limit);

          if (songs) {
            results.push(...formatSongResults(songs));
          }
        }
      }
    }

    // Search by themes array
    const culturalThemes = getCulturalThemes(analysis.geographic || analysis.cultural);
    if (culturalThemes.length > 0) {
      const { data: songs } = await supabase
        .from('songs')
        .select(`
          id, title, duration_ms, mood, energy_level, bpm,
          albums(title, cover_art_url),
          song_artists(role, artists(name, image_url)),
          song_genres(is_primary, genres(name))
        `)
        .overlaps('themes', culturalThemes)
        .limit(limit);

      if (songs) {
        results.push(...formatSongResults(songs));
      }
    }

    // Search by record label for geographic context
    if (analysis.geographic) {
      const { data: songs } = await supabase
        .from('songs')
        .select(`
          id, title, duration_ms, mood, energy_level, bpm,
          albums!inner(title, cover_art_url, record_label),
          song_artists(role, artists(name, image_url)),
          song_genres(is_primary, genres(name))
        `)
        .ilike('albums.record_label', `%${analysis.geographic}%`)
        .limit(limit);

      if (songs) {
        results.push(...formatSongResults(songs));
      }
    }
  } catch (error) {
    console.error('Geographic search error:', error);
  }

  return results;
}

async function searchByArtistContext(searchTerms: string[], limit: number): Promise<SearchResult[]> {
  try {
    const { data: songs } = await supabase
      .from('songs')
      .select(`
        id, title, duration_ms, mood, energy_level, bpm,
        albums(title, cover_art_url),
        song_artists(role, artists(name, image_url, country)),
        song_genres(is_primary, genres(name))
      `)
      .ilike('song_artists.artists.name', `%${searchTerms.join('%')}%`)
      .limit(limit);

    return songs ? formatSongResults(songs) : [];
  } catch (error) {
    console.error('Artist search error:', error);
    return [];
  }
}

async function searchByGenreAndMood(analysis: any, limit: number): Promise<SearchResult[]> {
  try {
    let songs: any[] = [];

    // Search by mood
    if (analysis.moods && analysis.moods.length > 0) {
      const { data: moodSongs } = await supabase
        .from('songs')
        .select(`
          id, title, duration_ms, mood, energy_level, bpm,
          albums(title, cover_art_url),
          song_artists(role, artists(name, image_url)),
          song_genres(is_primary, genres(name))
        `)
        .in('mood', analysis.moods)
        .limit(limit);

      if (moodSongs) songs.push(...moodSongs);
    }

    // Search by genres
    if (analysis.genres && analysis.genres.length > 0) {
      const { data: genreData } = await supabase
        .from('genres')
        .select('id')
        .in('name', analysis.genres);

      if (genreData && genreData.length > 0) {
        const genreIds = genreData.map(g => g.id);
        
        const { data: genreSongs } = await supabase
          .from('songs')
          .select(`
            id, title, duration_ms, mood, energy_level, bpm,
            albums(title, cover_art_url),
            song_artists(role, artists(name, image_url)),
            song_genres!inner(is_primary, genres(name))
          `)
          .in('song_genres.genre_id', genreIds)
          .limit(limit);

        if (genreSongs) songs.push(...genreSongs);
      }
    }

    return songs.length > 0 ? formatSongResults(songs) : [];
  } catch (error) {
    console.error('Genre/mood search error:', error);
    return [];
  }
}

async function searchByKeywords(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const { data: songs } = await supabase
      .from('songs')
      .select(`
        id, title, duration_ms, mood, energy_level, bpm,
        albums(title, cover_art_url),
        song_artists(role, artists(name, image_url)),
        song_genres(is_primary, genres(name))
      `)
      .or(`title.ilike.%${query}%,albums.title.ilike.%${query}%,song_artists.artists.name.ilike.%${query}%`)
      .limit(limit);

    return songs ? formatSongResults(songs) : [];
  } catch (error) {
    console.error('Keyword search error:', error);
    return [];
  }
}

function formatSongResults(songs: any[]): SearchResult[] {
  return songs.map(song => ({
    id: song.id,
    title: song.title,
    artist: song.song_artists?.[0]?.artists?.name || 'Unknown Artist',
    album: song.albums?.title,
    duration_ms: song.duration_ms,
    source: 'local' as const,
    cached: false,
    metadata: {
      mood: song.mood,
      energy_level: song.energy_level,
      bpm: song.bpm,
      genres: song.song_genres?.map((sg: any) => sg.genres.name) || [],
      cover_art_url: song.albums?.cover_art_url
    }
  }));
}

function getCulturalGenres(cultural: string): string[] {
  const genreMap: { [key: string]: string[] } = {
    'african': ['afrobeat', 'highlife', 'soukous', 'kwaito', 'amapiano', 'traditional african'],
    'south african': ['kwaito', 'amapiano', 'maskandi', 'township jazz', 'afrikaans'],
    'brazilian': ['samba', 'bossa nova', 'forró', 'mpb', 'tropicália'],
    'jamaican': ['reggae', 'dancehall', 'ska', 'rocksteady', 'dub'],
    'caribbean': ['calypso', 'soca', 'dancehall', 'reggae', 'zouk'],
    'latin': ['salsa', 'bachata', 'merengue', 'cumbia', 'reggaeton'],
    'indian': ['bollywood', 'classical indian', 'bhangra', 'qawwali'],
    'arabic': ['traditional arabic', 'oud', 'maqam', 'middle eastern']
  };

  return genreMap[cultural.toLowerCase()] || [];
}

function getCulturalThemes(geographic: string): string[] {
  const themeMap: { [key: string]: string[] } = {
    'south africa': ['apartheid', 'freedom', 'ubuntu', 'township', 'mandela', 'rainbow nation'],
    'brazil': ['carnival', 'rio', 'samba', 'favela', 'capoeira'],
    'jamaica': ['rastafari', 'babylon', 'zion', 'roots', 'consciousness'],
    'ireland': ['celtic', 'traditional', 'folk', 'irish ballad'],
    'scotland': ['highland', 'bagpipes', 'celtic', 'traditional scottish']
  };

  return themeMap[geographic?.toLowerCase()] || [];
}

async function searchSpotify(query: string, limit: number): Promise<SearchResult[]> {
  console.log(`Searching Spotify for: "${query}"`);
  
  try {
    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Search Spotify
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Spotify search failed');
    }

    const searchData = await searchResponse.json();
    const tracks = searchData.tracks?.items || [];

    return tracks.map((track: any) => ({
      id: `spotify_${track.id}`,
      title: track.name,
      artist: track.artists?.[0]?.name || 'Unknown Artist',
      album: track.album?.name,
      duration_ms: track.duration_ms,
      source: 'spotify' as const,
      external_id: track.id,
      cached: false,
      metadata: {
        cover_art_url: track.album?.images?.[0]?.url,
        genres: []
      }
    }));
  } catch (error) {
    console.error('Spotify search error:', error);
    return [];
  }
}

async function searchLastFm(query: string, limit: number): Promise<SearchResult[]> {
  console.log(`Searching Last.fm for: "${query}"`);
  
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${lastFmApiKey}&format=json&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Last.fm search failed');
    }

    const data = await response.json();
    const tracks = data.results?.trackmatches?.track || [];

    return (Array.isArray(tracks) ? tracks : [tracks]).map((track: any) => ({
      id: `lastfm_${track.mbid || track.name.replace(/\s+/g, '_')}`,
      title: track.name,
      artist: track.artist,
      album: undefined,
      duration_ms: undefined,
      source: 'lastfm' as const,
      external_id: track.mbid,
      cached: false,
      metadata: {
        cover_art_url: track.image?.find((img: any) => img.size === 'large')?.['#text'],
        genres: []
      }
    }));
  } catch (error) {
    console.error('Last.fm search error:', error);
    return [];
  }
}

async function searchMusicBrainz(query: string, limit: number): Promise<SearchResult[]> {
  console.log(`Searching MusicBrainz for: "${query}"`);
  
  try {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&limit=${limit}&fmt=json&inc=artist-credits+releases`,
      {
        headers: {
          'User-Agent': 'TunesDB/1.0 (music-discovery-app)',
        },
      }
    );

    if (!response.ok) {
      throw new Error('MusicBrainz search failed');
    }

    const data = await response.json();
    const recordings = data.recordings || [];

    return recordings.map((recording: any) => ({
      id: `musicbrainz_${recording.id}`,
      title: recording.title,
      artist: recording['artist-credit']?.[0]?.artist?.name || 'Unknown Artist',
      album: recording.releases?.[0]?.title,
      duration_ms: recording.length,
      source: 'musicbrainz' as const,
      external_id: recording.id,
      cached: false,
      metadata: {
        genres: []
      }
    }));
  } catch (error) {
    console.error('MusicBrainz search error:', error);
    return [];
  }
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  
  for (const result of results) {
    // Use song ID as primary key for local results, title+artist for external
    const key = result.source === 'local' 
      ? result.id 
      : `${result.title.toLowerCase().trim()}_${result.artist.toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.set(key, result);
    } else {
      // Prefer local results over external ones
      const existing = seen.get(key)!;
      if (existing.source !== 'local' && result.source === 'local') {
        seen.set(key, result);
      }
    }
  }
  
  console.log(`Deduplicated from ${results.length} to ${seen.size} results`);
  return Array.from(seen.values());
}

function calculateRelevance(title: string, query: string): number {
  const titleLower = title.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (titleLower === queryLower) return 100;
  if (titleLower.includes(queryLower)) return 80;
  
  // Simple word matching
  const titleWords = titleLower.split(/\s+/);
  const queryWords = queryLower.split(/\s+/);
  const matchingWords = queryWords.filter(word => titleWords.some(titleWord => titleWord.includes(word)));
  
  return (matchingWords.length / queryWords.length) * 60;
}

async function cacheExternalResults(results: SearchResult[]): Promise<void> {
  console.log(`Caching ${results.length} external results`);
  
  try {
    for (const result of results) {
      if (result.source === 'local') continue;
      
      // Check if already cached
      const { data: existing } = await supabase
        .from('cached_external_songs')
        .select('id')
        .eq('external_id', result.external_id)
        .eq('source', result.source)
        .single();

      if (existing) continue;

      // Cache the result
      await supabase
        .from('cached_external_songs')
        .insert({
          external_id: result.external_id,
          source: result.source,
          title: result.title,
          artist: result.artist,
          album: result.album,
          duration_ms: result.duration_ms,
          metadata: result.metadata
        });
    }
  } catch (error) {
    console.error('Error caching results:', error);
  }
}