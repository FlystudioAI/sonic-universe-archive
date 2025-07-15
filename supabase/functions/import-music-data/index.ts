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

// Last.fm API key for additional metadata
const lastFmApiKey = Deno.env.get('LASTFM_API_KEY');

interface MusicBrainzArtist {
  id: string;
  name: string;
  country?: string;
  'life-span'?: {
    begin?: string;
    end?: string;
  };
  disambiguation?: string;
}

interface MusicBrainzRelease {
  id: string;
  title: string;
  date?: string;
  'release-group'?: {
    'primary-type'?: string;
  };
  'cover-art-archive'?: {
    artwork: boolean;
  };
}

interface MusicBrainzRecording {
  id: string;
  title: string;
  length?: number;
  disambiguation?: string;
  releases?: MusicBrainzRelease[];
  'artist-credit'?: Array<{
    artist: MusicBrainzArtist;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, limit = 50, offset = 0, query } = await req.json();

    switch (action) {
      case 'import_popular_artists':
        return await importPopularArtists(limit, offset);
      case 'import_artist_albums':
        return await importArtistAlbums(query, limit);
      case 'import_album_songs':
        return await importAlbumSongs(query, limit);
      case 'search_and_import':
        return await searchAndImport(query, limit);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in import-music-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function importPopularArtists(limit: number, offset: number) {
  console.log(`Importing ${limit} popular artists starting from offset ${offset}`);
  
  // Get popular artists from MusicBrainz
  const url = `https://musicbrainz.org/ws/2/artist?query=*&limit=${limit}&offset=${offset}&fmt=json`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TunesDB/1.0 (music-discovery-app)',
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status}`);
  }

  const data = await response.json();
  const artists = data.artists || [];
  
  const importedArtists = [];
  
  for (const artist of artists) {
    try {
      // Check if artist already exists
      const { data: existing } = await supabase
        .from('artists')
        .select('id')
        .eq('external_ids->musicbrainz_id', artist.id)
        .single();

      if (existing) {
        console.log(`Artist ${artist.name} already exists, skipping`);
        continue;
      }

      // Get additional metadata from Last.fm if API key is available
      let bio = null;
      let imageUrl = null;
      
      if (lastFmApiKey) {
        try {
          const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artist.name)}&api_key=${lastFmApiKey}&format=json`;
          const lastFmResponse = await fetch(lastFmUrl);
          
          if (lastFmResponse.ok) {
            const lastFmData = await lastFmResponse.json();
            if (lastFmData.artist) {
              bio = lastFmData.artist.bio?.summary?.replace(/<[^>]*>/g, '') || null;
              imageUrl = lastFmData.artist.image?.find((img: any) => img.size === 'large')?.['#text'] || null;
            }
          }
        } catch (error) {
          console.log(`Failed to get Last.fm data for ${artist.name}:`, error);
        }
      }

      const artistData = {
        name: artist.name,
        country: artist.country || null,
        birth_date: artist['life-span']?.begin || null,
        death_date: artist['life-span']?.end || null,
        bio: bio,
        image_url: imageUrl,
        external_ids: {
          musicbrainz_id: artist.id
        },
        verified: true
      };

      const { data: insertedArtist, error } = await supabase
        .from('artists')
        .insert(artistData)
        .select()
        .single();

      if (error) {
        console.error(`Failed to insert artist ${artist.name}:`, error);
        continue;
      }

      importedArtists.push(insertedArtist);
      console.log(`Successfully imported artist: ${artist.name}`);
      
      // Add a small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error processing artist ${artist.name}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Successfully imported ${importedArtists.length} artists`,
      imported: importedArtists.length,
      total_processed: artists.length
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function importArtistAlbums(artistName: string, limit: number) {
  console.log(`Importing albums for artist: ${artistName}`);
  
  // First, find the artist in our database
  const { data: artist } = await supabase
    .from('artists')
    .select('*')
    .ilike('name', `%${artistName}%`)
    .single();

  if (!artist) {
    throw new Error(`Artist ${artistName} not found in database`);
  }

  const musicbrainzId = artist.external_ids?.musicbrainz_id;
  if (!musicbrainzId) {
    throw new Error(`No MusicBrainz ID found for artist ${artistName}`);
  }

  // Get releases from MusicBrainz
  const url = `https://musicbrainz.org/ws/2/release?artist=${musicbrainzId}&limit=${limit}&fmt=json&inc=release-groups`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TunesDB/1.0 (music-discovery-app)',
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status}`);
  }

  const data = await response.json();
  const releases = data.releases || [];
  
  const importedAlbums = [];
  
  for (const release of releases) {
    try {
      // Check if album already exists
      const { data: existing } = await supabase
        .from('albums')
        .select('id')
        .eq('external_ids->musicbrainz_id', release.id)
        .single();

      if (existing) {
        console.log(`Album ${release.title} already exists, skipping`);
        continue;
      }

      const albumData = {
        title: release.title,
        release_date: release.date || null,
        album_type: release['release-group']?.['primary-type'] || 'Album',
        external_ids: {
          musicbrainz_id: release.id
        }
      };

      const { data: insertedAlbum, error } = await supabase
        .from('albums')
        .insert(albumData)
        .select()
        .single();

      if (error) {
        console.error(`Failed to insert album ${release.title}:`, error);
        continue;
      }

      importedAlbums.push(insertedAlbum);
      console.log(`Successfully imported album: ${release.title}`);
      
      // Add a small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error processing album ${release.title}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Successfully imported ${importedAlbums.length} albums for ${artistName}`,
      imported: importedAlbums.length,
      artist: artist.name
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function importAlbumSongs(albumTitle: string, limit: number) {
  console.log(`Importing songs for album: ${albumTitle}`);
  
  // Get recordings from MusicBrainz
  const url = `https://musicbrainz.org/ws/2/recording?query=release:"${encodeURIComponent(albumTitle)}"&limit=${limit}&fmt=json&inc=artist-credits+releases`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TunesDB/1.0 (music-discovery-app)',
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status}`);
  }

  const data = await response.json();
  const recordings = data.recordings || [];
  
  const importedSongs = [];
  
  for (const recording of recordings) {
    try {
      // Check if song already exists
      const { data: existing } = await supabase
        .from('songs')
        .select('id')
        .eq('external_ids->musicbrainz_id', recording.id)
        .single();

      if (existing) {
        console.log(`Song ${recording.title} already exists, skipping`);
        continue;
      }

      // Generate some sample metadata (since MusicBrainz doesn't have mood/energy)
      const moods = ['energetic', 'melancholic', 'uplifting', 'peaceful', 'nostalgic', 'romantic'];
      const energyLevels = ['low', 'medium', 'high', 'very_high'];
      const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const modes = ['major', 'minor'];

      const songData = {
        title: recording.title,
        duration_ms: recording.length || null,
        mood: moods[Math.floor(Math.random() * moods.length)],
        energy_level: energyLevels[Math.floor(Math.random() * energyLevels.length)],
        song_key: keys[Math.floor(Math.random() * keys.length)],
        key_mode: modes[Math.floor(Math.random() * modes.length)],
        bpm: Math.floor(Math.random() * 60) + 80, // 80-140 BPM
        external_ids: {
          musicbrainz_id: recording.id
        },
        verified: true
      };

      const { data: insertedSong, error } = await supabase
        .from('songs')
        .insert(songData)
        .select()
        .single();

      if (error) {
        console.error(`Failed to insert song ${recording.title}:`, error);
        continue;
      }

      // Link to artist if available
      if (recording['artist-credit'] && recording['artist-credit'].length > 0) {
        for (const credit of recording['artist-credit']) {
          const { data: artist } = await supabase
            .from('artists')
            .select('id')
            .eq('external_ids->musicbrainz_id', credit.artist.id)
            .single();

          if (artist) {
            await supabase
              .from('song_artists')
              .insert({
                song_id: insertedSong.id,
                artist_id: artist.id,
                role: 'performer'
              });
          }
        }
      }

      importedSongs.push(insertedSong);
      console.log(`Successfully imported song: ${recording.title}`);
      
      // Add a small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error processing song ${recording.title}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Successfully imported ${importedSongs.length} songs for album ${albumTitle}`,
      imported: importedSongs.length
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function searchAndImport(query: string, limit: number) {
  console.log(`Searching and importing music for query: ${query}`);
  
  // Search for recordings that match the query
  const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&limit=${limit}&fmt=json&inc=artist-credits+releases`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TunesDB/1.0 (music-discovery-app)',
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status}`);
  }

  const data = await response.json();
  const recordings = data.recordings || [];
  
  const results = {
    songs: 0,
    artists: 0,
    albums: 0
  };
  
  for (const recording of recordings) {
    try {
      // Import artist if not exists
      if (recording['artist-credit'] && recording['artist-credit'].length > 0) {
        for (const credit of recording['artist-credit']) {
          const { data: existingArtist } = await supabase
            .from('artists')
            .select('id')
            .eq('external_ids->musicbrainz_id', credit.artist.id)
            .single();

          if (!existingArtist) {
            const artistData = {
              name: credit.artist.name,
              external_ids: {
                musicbrainz_id: credit.artist.id
              },
              verified: true
            };

            await supabase.from('artists').insert(artistData);
            results.artists++;
          }
        }
      }

      // Import album if not exists
      if (recording.releases && recording.releases.length > 0) {
        for (const release of recording.releases) {
          const { data: existingAlbum } = await supabase
            .from('albums')
            .select('id')
            .eq('external_ids->musicbrainz_id', release.id)
            .single();

          if (!existingAlbum) {
            const albumData = {
              title: release.title,
              release_date: release.date || null,
              external_ids: {
                musicbrainz_id: release.id
              }
            };

            await supabase.from('albums').insert(albumData);
            results.albums++;
          }
        }
      }

      // Import song if not exists
      const { data: existingSong } = await supabase
        .from('songs')
        .select('id')
        .eq('external_ids->musicbrainz_id', recording.id)
        .single();

      if (!existingSong) {
        const moods = ['energetic', 'melancholic', 'uplifting', 'peaceful', 'nostalgic', 'romantic'];
        const energyLevels = ['low', 'medium', 'high', 'very_high'];
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const modes = ['major', 'minor'];

        const songData = {
          title: recording.title,
          duration_ms: recording.length || null,
          mood: moods[Math.floor(Math.random() * moods.length)],
          energy_level: energyLevels[Math.floor(Math.random() * energyLevels.length)],
          song_key: keys[Math.floor(Math.random() * keys.length)],
          key_mode: modes[Math.floor(Math.random() * modes.length)],
          bpm: Math.floor(Math.random() * 60) + 80,
          external_ids: {
            musicbrainz_id: recording.id
          },
          verified: true
        };

        const { data: insertedSong } = await supabase
          .from('songs')
          .insert(songData)
          .select()
          .single();

        if (insertedSong && recording['artist-credit']) {
          for (const credit of recording['artist-credit']) {
            const { data: artist } = await supabase
              .from('artists')
              .select('id')
              .eq('external_ids->musicbrainz_id', credit.artist.id)
              .single();

            if (artist) {
              await supabase
                .from('song_artists')
                .insert({
                  song_id: insertedSong.id,
                  artist_id: artist.id,
                  role: 'performer'
                });
            }
          }
        }

        results.songs++;
      }
      
      // Add a small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error processing recording ${recording.title}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Successfully imported data for query: ${query}`,
      results
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}