import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// API Configurations
const APIS = {
  lastfm: {
    baseURL: 'https://ws.audioscrobbler.com/2.0/',
    key: process.env.LASTFM_API_KEY
  },
  musicbrainz: {
    baseURL: 'https://musicbrainz.org/ws/2',
    userAgent: process.env.MUSICBRAINZ_USER_AGENT || 'TunesDB/1.0.0'
  },
  audiodb: {
    baseURL: 'https://www.theaudiodb.com/api/v1/json/2'
  },
  genius: {
    baseURL: 'https://api.genius.com',
    token: process.env.GENIUS_ACCESS_TOKEN
  }
};

// Delay function for rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Genre mappings and mood classifications
const GENRE_MAPPINGS = {
  'rock': ['alternative rock', 'classic rock', 'hard rock', 'progressive rock'],
  'pop': ['pop rock', 'indie pop', 'synth-pop', 'electropop'],
  'hip-hop': ['rap', 'trap', 'boom bap', 'conscious hip hop'],
  'electronic': ['house', 'techno', 'ambient', 'drum and bass', 'dubstep'],
  'jazz': ['bebop', 'smooth jazz', 'fusion', 'swing'],
  'blues': ['chicago blues', 'delta blues', 'electric blues'],
  'country': ['country rock', 'bluegrass', 'alt-country'],
  'r&b': ['soul', 'funk', 'neo-soul', 'contemporary r&b'],
  'folk': ['folk rock', 'indie folk', 'americana'],
  'classical': ['baroque', 'romantic', 'contemporary classical']
};

const MOOD_MAPPINGS = {
  'energetic': ['upbeat', 'driving', 'powerful', 'intense'],
  'melancholic': ['sad', 'moody', 'introspective', 'blue'],
  'uplifting': ['happy', 'optimistic', 'joyful', 'positive'],
  'peaceful': ['calm', 'relaxing', 'meditative', 'serene'],
  'romantic': ['love', 'passionate', 'tender', 'intimate'],
  'nostalgic': ['wistful', 'reminiscent', 'longing'],
  'aggressive': ['angry', 'fierce', 'brutal', 'violent'],
  'mysterious': ['dark', 'eerie', 'enigmatic', 'haunting'],
  'playful': ['fun', 'whimsical', 'lighthearted', 'quirky'],
  'dramatic': ['epic', 'cinematic', 'theatrical', 'grand']
};

class MusicDataImporter {
  constructor() {
    this.importedArtists = new Set();
    this.importedSongs = new Set();
    this.genreMap = new Map();
  }

  async initializeGenres() {
    console.log('Initializing genres...');
    
    for (const [parentGenre, subGenres] of Object.entries(GENRE_MAPPINGS)) {
      // Insert parent genre
      const { data: parentGenreData, error } = await supabase
        .from('genres')
        .upsert({ name: parentGenre }, { onConflict: 'name' })
        .select()
        .single();

      if (error) {
        console.error(`Error inserting parent genre ${parentGenre}:`, error);
        continue;
      }

      this.genreMap.set(parentGenre, parentGenreData.id);

      // Insert sub-genres
      for (const subGenre of subGenres) {
        const { data: subGenreData, error: subError } = await supabase
          .from('genres')
          .upsert({ 
            name: subGenre, 
            parent_genre_id: parentGenreData.id 
          }, { onConflict: 'name' })
          .select()
          .single();

        if (!subError) {
          this.genreMap.set(subGenre, subGenreData.id);
        }
      }
    }

    console.log(`Initialized ${this.genreMap.size} genres`);
  }

  async getPopularArtists(limit = 100) {
    console.log('Fetching popular artists from Last.fm...');
    
    const artists = [];
    let page = 1;
    
    while (artists.length < limit) {
      try {
        const response = await axios.get(APIS.lastfm.baseURL, {
          params: {
            method: 'chart.gettopartists',
            api_key: APIS.lastfm.key,
            format: 'json',
            limit: 50,
            page
          }
        });

        const pageArtists = response.data.artists?.artist || [];
        if (pageArtists.length === 0) break;

        artists.push(...pageArtists.slice(0, limit - artists.length));
        page++;
        
        await delay(200); // Rate limiting
      } catch (error) {
        console.error('Error fetching popular artists:', error.message);
        break;
      }
    }

    return artists;
  }

  async getArtistDetails(artistName) {
    const details = {};

    // Get Last.fm info
    try {
      const lastfmResponse = await axios.get(APIS.lastfm.baseURL, {
        params: {
          method: 'artist.getinfo',
          artist: artistName,
          api_key: APIS.lastfm.key,
          format: 'json'
        }
      });

      const artist = lastfmResponse.data.artist;
      if (artist) {
        details.lastfm = {
          bio: artist.bio?.summary?.replace(/<a[^>]*>.*?<\/a>/g, '').trim(),
          genres: artist.tags?.tag?.map(t => t.name.toLowerCase()) || [],
          imageUrl: artist.image?.find(img => img.size === 'large')?.['#text']
        };
      }
      await delay(200);
    } catch (error) {
      console.error(`Error fetching Last.fm data for ${artistName}:`, error.message);
    }

    // Get MusicBrainz info
    try {
      await delay(1000); // MusicBrainz requires 1 second between requests
      
      const mbResponse = await axios.get(`${APIS.musicbrainz.baseURL}/artist`, {
        params: {
          query: artistName,
          fmt: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': APIS.musicbrainz.userAgent
        }
      });

      const mbArtist = mbResponse.data.artists?.[0];
      if (mbArtist) {
        details.musicbrainz = {
          id: mbArtist.id,
          country: mbArtist.country,
          beginDate: mbArtist['life-span']?.begin,
          endDate: mbArtist['life-span']?.end,
          type: mbArtist.type
        };
      }
    } catch (error) {
      console.error(`Error fetching MusicBrainz data for ${artistName}:`, error.message);
    }

    // Get AudioDB info
    try {
      const audiodbResponse = await axios.get(`${APIS.audiodb.baseURL}/search.php`, {
        params: { s: artistName }
      });

      const audiodbArtist = audiodbResponse.data.artists?.[0];
      if (audiodbArtist) {
        details.audiodb = {
          bio: audiodbArtist.strBiographyEN,
          country: audiodbArtist.strCountry,
          style: audiodbArtist.strStyle,
          mood: audiodbArtist.strMood,
          imageUrl: audiodbArtist.strArtistThumb
        };
      }
      await delay(100);
    } catch (error) {
      console.error(`Error fetching AudioDB data for ${artistName}:`, error.message);
    }

    return details;
  }

  async importArtist(artistName, details) {
    if (this.importedArtists.has(artistName.toLowerCase())) {
      return null;
    }

    console.log(`Importing artist: ${artistName}`);

    const artistData = {
      name: artistName,
      bio: details.lastfm?.bio || details.audiodb?.bio || null,
      country: details.musicbrainz?.country || details.audiodb?.country || null,
      birth_date: details.musicbrainz?.beginDate || null,
      death_date: details.musicbrainz?.endDate || null,
      genres: details.lastfm?.genres || [],
      external_ids: {
        musicbrainz_id: details.musicbrainz?.id,
        lastfm_url: `https://www.last.fm/music/${encodeURIComponent(artistName)}`
      },
      image_url: details.lastfm?.imageUrl || details.audiodb?.imageUrl || null,
      verified: true
    };

    const { data, error } = await supabase
      .from('artists')
      .upsert(artistData, { onConflict: 'name' })
      .select()
      .single();

    if (error) {
      console.error(`Error importing artist ${artistName}:`, error);
      return null;
    }

    this.importedArtists.add(artistName.toLowerCase());
    return data;
  }

  async getArtistTopTracks(artistName, limit = 20) {
    try {
      const response = await axios.get(APIS.lastfm.baseURL, {
        params: {
          method: 'artist.gettoptracks',
          artist: artistName,
          api_key: APIS.lastfm.key,
          format: 'json',
          limit
        }
      });

      await delay(200);
      return response.data.toptracks?.track || [];
    } catch (error) {
      console.error(`Error fetching top tracks for ${artistName}:`, error.message);
      return [];
    }
  }

  async getTrackDetails(artistName, trackName) {
    const details = {};

    // Get Last.fm track info
    try {
      const response = await axios.get(APIS.lastfm.baseURL, {
        params: {
          method: 'track.getinfo',
          artist: artistName,
          track: trackName,
          api_key: APIS.lastfm.key,
          format: 'json'
        }
      });

      const track = response.data.track;
      if (track) {
        details.lastfm = {
          duration: parseInt(track.duration) || null,
          tags: track.toptags?.tag?.map(t => t.name.toLowerCase()) || [],
          wiki: track.wiki?.summary?.replace(/<a[^>]*>.*?<\/a>/g, '').trim()
        };
      }
      await delay(200);
    } catch (error) {
      console.error(`Error fetching Last.fm track data:`, error.message);
    }

    // Get Genius lyrics
    try {
      if (APIS.genius.token) {
        const searchResponse = await axios.get(`${APIS.genius.baseURL}/search`, {
          params: { q: `${artistName} ${trackName}` },
          headers: { 'Authorization': `Bearer ${APIS.genius.token}` }
        });

        const hit = searchResponse.data.response.hits?.[0];
        if (hit?.result) {
          details.genius = {
            id: hit.result.id,
            title: hit.result.title,
            artist: hit.result.primary_artist.name,
            url: hit.result.url,
            imageUrl: hit.result.song_art_image_url
          };
        }
        await delay(100);
      }
    } catch (error) {
      console.error(`Error fetching Genius data:`, error.message);
    }

    return details;
  }

  classifyMood(tags, description) {
    const text = [...tags, description || ''].join(' ').toLowerCase();
    
    for (const [mood, keywords] of Object.entries(MOOD_MAPPINGS)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return mood;
      }
    }
    
    return 'peaceful'; // default
  }

  classifyEnergy(tags, bpm) {
    const text = tags.join(' ').toLowerCase();
    
    if (bpm) {
      if (bpm < 70) return 'low';
      if (bpm < 120) return 'medium';
      if (bpm < 140) return 'high';
      return 'very_high';
    }
    
    if (text.includes('slow') || text.includes('ballad')) return 'low';
    if (text.includes('fast') || text.includes('upbeat')) return 'high';
    
    return 'medium'; // default
  }

  async importTrack(artistId, trackName, details, artistName) {
    const trackKey = `${artistName}-${trackName}`.toLowerCase();
    if (this.importedSongs.has(trackKey)) {
      return null;
    }

    console.log(`  Importing track: ${trackName}`);

    const tags = details.lastfm?.tags || [];
    const mood = this.classifyMood(tags, details.lastfm?.wiki);
    const energy = this.classifyEnergy(tags);

    // Extract themes and instruments from tags
    const instruments = tags.filter(tag => 
      ['guitar', 'piano', 'drums', 'bass', 'violin', 'saxophone', 'trumpet', 'synthesizer']
        .some(inst => tag.includes(inst))
    );

    const themes = tags.filter(tag =>
      ['love', 'heartbreak', 'party', 'friendship', 'rebellion', 'freedom', 'hope', 'loss']
        .some(theme => tag.includes(theme))
    );

    const trackData = {
      title: trackName,
      duration_ms: details.lastfm?.duration || null,
      lyrics: null, // Would need additional API or scraping
      mood,
      energy_level: energy,
      themes,
      instruments,
      description: details.lastfm?.wiki || null,
      external_ids: {
        genius_id: details.genius?.id,
        genius_url: details.genius?.url
      },
      verified: true
    };

    const { data: song, error } = await supabase
      .from('songs')
      .insert(trackData)
      .select()
      .single();

    if (error) {
      console.error(`Error importing track ${trackName}:`, error);
      return null;
    }

    // Link song to artist
    await supabase
      .from('song_artists')
      .insert({
        song_id: song.id,
        artist_id: artistId,
        role: 'performer'
      });

    // Link song to genres based on tags
    for (const tag of tags) {
      const genreId = this.genreMap.get(tag);
      if (genreId) {
        await supabase
          .from('song_genres')
          .insert({
            song_id: song.id,
            genre_id: genreId,
            is_primary: tags.indexOf(tag) === 0
          });
      }
    }

    this.importedSongs.add(trackKey);
    return song;
  }

  async importArtistData(artistName, trackLimit = 20) {
    console.log(`\n=== Processing ${artistName} ===`);

    // Get comprehensive artist details
    const artistDetails = await this.getArtistDetails(artistName);
    
    // Import artist
    const artist = await this.importArtist(artistName, artistDetails);
    if (!artist) {
      console.log(`Skipped artist: ${artistName}`);
      return;
    }

    // Get and import top tracks
    const topTracks = await this.getArtistTopTracks(artistName, trackLimit);
    console.log(`Found ${topTracks.length} tracks for ${artistName}`);

    for (const track of topTracks.slice(0, trackLimit)) {
      try {
        const trackDetails = await this.getTrackDetails(artistName, track.name);
        await this.importTrack(artist.id, track.name, trackDetails, artistName);
      } catch (error) {
        console.error(`Error importing track ${track.name}:`, error.message);
      }
    }

    console.log(`Completed ${artistName}: imported ${topTracks.length} tracks`);
  }

  async run(artistLimit = 50, tracksPerArtist = 20) {
    console.log('🎵 Starting TunesDB Music Data Import...\n');

    try {
      // Initialize genres
      await this.initializeGenres();

      // Get popular artists
      const popularArtists = await this.getPopularArtists(artistLimit);
      console.log(`Found ${popularArtists.length} popular artists to import\n`);

      // Import each artist and their tracks
      for (let i = 0; i < popularArtists.length; i++) {
        const artist = popularArtists[i];
        console.log(`[${i + 1}/${popularArtists.length}] Processing ${artist.name}`);
        
        try {
          await this.importArtistData(artist.name, tracksPerArtist);
        } catch (error) {
          console.error(`Failed to import ${artist.name}:`, error.message);
        }

        // Progress update
        if ((i + 1) % 10 === 0) {
          console.log(`\n✅ Progress: ${i + 1}/${popularArtists.length} artists processed\n`);
        }
      }

      console.log('\n🎉 Music data import completed successfully!');
      console.log(`📊 Final Statistics:`);
      console.log(`   - Artists imported: ${this.importedArtists.size}`);
      console.log(`   - Songs imported: ${this.importedSongs.size}`);
      console.log(`   - Genres initialized: ${this.genreMap.size}`);

    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    }
  }
}

// Run the import
const importer = new MusicDataImporter();

// Get command line arguments
const artistLimit = parseInt(process.argv[2]) || 50;
const tracksPerArtist = parseInt(process.argv[3]) || 20;

console.log(`Configuration:`);
console.log(`  - Artists to import: ${artistLimit}`);
console.log(`  - Tracks per artist: ${tracksPerArtist}`);
console.log(`  - APIs: Last.fm, MusicBrainz, AudioDB${APIS.genius.token ? ', Genius' : ''}\n`);

importer.run(artistLimit, tracksPerArtist);