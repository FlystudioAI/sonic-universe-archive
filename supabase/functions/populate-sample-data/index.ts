import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Populating database with sample music data...');

    // Sample artists
    const artists = [
      {
        name: 'The Beatles',
        bio: 'English rock band formed in Liverpool in 1960, comprised of John Lennon, Paul McCartney, George Harrison, and Ringo Starr.',
        genres: ['Rock', 'Pop', 'Psychedelic Rock'],
        verified: true
      },
      {
        name: 'Pink Floyd',
        bio: 'English progressive rock band formed in London in 1965, known for philosophical lyrics and elaborate live shows.',
        genres: ['Progressive Rock', 'Psychedelic Rock', 'Art Rock'],
        verified: true
      },
      {
        name: 'Bob Dylan',
        bio: 'American singer-songwriter regarded as one of the greatest songwriters of all time.',
        genres: ['Folk', 'Rock', 'Blues'],
        verified: true
      },
      {
        name: 'Led Zeppelin',
        bio: 'English rock band formed in London in 1968, considered one of the most influential rock bands.',
        genres: ['Hard Rock', 'Heavy Metal', 'Blues Rock'],
        verified: true
      },
      {
        name: 'David Bowie',
        bio: 'English singer-songwriter known for his visual presentation and genre-defying music.',
        genres: ['Glam Rock', 'Art Rock', 'Pop'],
        verified: true
      }
    ];

    const { data: insertedArtists, error: artistError } = await supabase
      .from('artists')
      .upsert(artists, { onConflict: 'name' })
      .select();

    if (artistError) {
      console.error('Error inserting artists:', artistError);
      throw artistError;
    }

    console.log(`Inserted ${insertedArtists.length} artists`);

    // Sample albums
    const albums = [
      {
        title: 'Abbey Road',
        release_date: '1969-09-26',
        album_type: 'studio',
        record_label: 'Apple Records',
        total_tracks: 17
      },
      {
        title: 'The Dark Side of the Moon',
        release_date: '1973-03-01',
        album_type: 'studio',
        record_label: 'Harvest Records',
        total_tracks: 10
      },
      {
        title: 'Highway 61 Revisited',
        release_date: '1965-08-30',
        album_type: 'studio',
        record_label: 'Columbia Records',
        total_tracks: 9
      },
      {
        title: 'Led Zeppelin IV',
        release_date: '1971-11-08',
        album_type: 'studio',
        record_label: 'Atlantic Records',
        total_tracks: 8
      },
      {
        title: 'The Rise and Fall of Ziggy Stardust',
        release_date: '1972-06-16',
        album_type: 'studio',
        record_label: 'RCA Records',
        total_tracks: 11
      }
    ];

    const { data: insertedAlbums, error: albumError } = await supabase
      .from('albums')
      .upsert(albums, { onConflict: 'title' })
      .select();

    if (albumError) {
      console.error('Error inserting albums:', albumError);
      throw albumError;
    }

    console.log(`Inserted ${insertedAlbums.length} albums`);

    // Sample songs with relationships
    const songs = [
      {
        title: 'Come Together',
        album_id: insertedAlbums.find(a => a.title === 'Abbey Road')?.id,
        track_number: 1,
        duration_ms: 260000,
        release_date: '1969-09-26',
        bpm: 82,
        song_key: 'D',
        description: 'Opening track of Abbey Road, known for its distinctive bass line and cryptic lyrics.',
        mood: 'mysterious'
      },
      {
        title: 'Time',
        album_id: insertedAlbums.find(a => a.title === 'The Dark Side of the Moon')?.id,
        track_number: 4,
        duration_ms: 413000,
        release_date: '1973-03-01',
        bpm: 120,
        song_key: 'F#',
        description: 'Features the famous ticking clocks intro and explores themes of aging and mortality.',
        mood: 'contemplative'
      },
      {
        title: 'Like a Rolling Stone',
        album_id: insertedAlbums.find(a => a.title === 'Highway 61 Revisited')?.id,
        track_number: 1,
        duration_ms: 370000,
        release_date: '1965-08-30',
        bpm: 124,
        song_key: 'C',
        description: 'Revolutionary folk-rock anthem that marked Dylan\'s transition to electric music.',
        mood: 'rebellious'
      },
      {
        title: 'Stairway to Heaven',
        album_id: insertedAlbums.find(a => a.title === 'Led Zeppelin IV')?.id,
        track_number: 4,
        duration_ms: 482000,
        release_date: '1971-11-08',
        bpm: 62,
        song_key: 'A',
        description: 'Epic rock ballad considered one of the greatest songs of all time.',
        mood: 'epic'
      },
      {
        title: 'Starman',
        album_id: insertedAlbums.find(a => a.title === 'The Rise and Fall of Ziggy Stardust')?.id,
        track_number: 5,
        duration_ms: 254000,
        release_date: '1972-06-16',
        bpm: 103,
        song_key: 'Bb',
        description: 'Glam rock classic that introduced Bowie\'s Ziggy Stardust persona.',
        mood: 'uplifting'
      }
    ];

    const { data: insertedSongs, error: songError } = await supabase
      .from('songs')
      .upsert(songs, { onConflict: 'title' })
      .select();

    if (songError) {
      console.error('Error inserting songs:', songError);
      throw songError;
    }

    console.log(`Inserted ${insertedSongs.length} songs`);

    // Create artist-song relationships
    const songArtists = [
      {
        song_id: insertedSongs.find(s => s.title === 'Come Together')?.id,
        artist_id: insertedArtists.find(a => a.name === 'The Beatles')?.id,
        role: 'performer'
      },
      {
        song_id: insertedSongs.find(s => s.title === 'Time')?.id,
        artist_id: insertedArtists.find(a => a.name === 'Pink Floyd')?.id,
        role: 'performer'
      },
      {
        song_id: insertedSongs.find(s => s.title === 'Like a Rolling Stone')?.id,
        artist_id: insertedArtists.find(a => a.name === 'Bob Dylan')?.id,
        role: 'performer'
      },
      {
        song_id: insertedSongs.find(s => s.title === 'Stairway to Heaven')?.id,
        artist_id: insertedArtists.find(a => a.name === 'Led Zeppelin')?.id,
        role: 'performer'
      },
      {
        song_id: insertedSongs.find(s => s.title === 'Starman')?.id,
        artist_id: insertedArtists.find(a => a.name === 'David Bowie')?.id,
        role: 'performer'
      }
    ];

    const { error: songArtistError } = await supabase
      .from('song_artists')
      .upsert(songArtists.filter(sa => sa.song_id && sa.artist_id), { 
        onConflict: 'song_id,artist_id' 
      });

    if (songArtistError) {
      console.error('Error inserting song-artist relationships:', songArtistError);
      throw songArtistError;
    }

    console.log(`Created ${songArtists.length} song-artist relationships`);

    // Add sample charts and news
    const charts = [
      {
        chart_type: 'billboard-hot-100',
        position: 1,
        song_title: 'Come Together',
        artist_name: 'The Beatles',
        album_name: 'Abbey Road',
        chart_date: new Date().toISOString().split('T')[0],
        weeks_on_chart: 15,
        peak_position: 1
      },
      {
        chart_type: 'billboard-hot-100',
        position: 2,
        song_title: 'Stairway to Heaven',
        artist_name: 'Led Zeppelin',
        album_name: 'Led Zeppelin IV',
        chart_date: new Date().toISOString().split('T')[0],
        weeks_on_chart: 25,
        peak_position: 1
      }
    ];

    const { error: chartError } = await supabase
      .from('music_charts')
      .upsert(charts, { onConflict: 'chart_type,position,chart_date' });

    if (chartError) {
      console.error('Error inserting charts:', chartError);
      throw chartError;
    }

    const news = [
      {
        title: 'The Beatles\' Abbey Road Studios Opens Virtual Tours',
        description: 'Experience the legendary recording studio where classics like Abbey Road were created.',
        url: 'https://example.com/abbey-road-tours',
        source: 'Music Heritage News',
        published_at: new Date().toISOString(),
        category: 'studio news'
      },
      {
        title: 'Pink Floyd\'s Dark Side of the Moon Hits 50th Anniversary',
        description: 'Celebrating five decades of one of progressive rock\'s greatest achievements.',
        url: 'https://example.com/dark-side-50',
        source: 'Classic Rock Today',
        published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        category: 'anniversary'
      }
    ];

    const { error: newsError } = await supabase
      .from('music_news')
      .upsert(news, { onConflict: 'url' });

    if (newsError) {
      console.error('Error inserting news:', newsError);
      throw newsError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Database populated successfully',
      data: {
        artists: insertedArtists.length,
        albums: insertedAlbums.length,
        songs: insertedSongs.length,
        charts: charts.length,
        news: news.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error populating database:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});