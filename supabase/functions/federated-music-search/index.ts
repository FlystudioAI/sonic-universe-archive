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

interface SearchRequest {
  query: string;
  limit?: number;
  sources?: string[]; // ['local', 'spotify', 'lastfm', 'musicbrainz']
  cacheResults?: boolean;
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
    const { query, limit = 20, sources = ['local', 'spotify', 'lastfm'], cacheResults = true }: SearchRequest = await req.json();

    console.log(`Federated search for: "${query}" across sources: ${sources.join(', ')}`);

    const results: SearchResult[] = [];
    const searchPromises: Promise<SearchResult[]>[] = [];

    // 1. Always search local database first (fastest)
    if (sources.includes('local')) {
      searchPromises.push(searchLocalDatabase(query, Math.ceil(limit * 0.6))); // 60% from local
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

async function searchLocalDatabase(query: string, limit: number): Promise<SearchResult[]> {
  console.log(`Searching local database for: "${query}"`);
  
  try {
    const { data: songs, error } = await supabase
      .from('songs')
      .select(`
        id,
        title,
        duration_ms,
        mood,
        energy_level,
        bpm,
        albums(title, cover_art_url),
        song_artists(
          role,
          artists(name, image_url)
        ),
        song_genres(
          is_primary,
          genres(name)
        )
      `)
      .or(`title.ilike.%${query}%,albums.title.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;

    return (songs || []).map(song => ({
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
  } catch (error) {
    console.error('Local search error:', error);
    return [];
  }
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
    const key = `${result.title.toLowerCase()}_${result.artist.toLowerCase()}`;
    
    if (!seen.has(key) || (seen.get(key)!.source !== 'local' && result.source === 'local')) {
      seen.set(key, result);
    }
  }
  
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