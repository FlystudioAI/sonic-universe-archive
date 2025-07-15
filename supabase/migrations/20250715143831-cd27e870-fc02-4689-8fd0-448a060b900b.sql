-- Create comprehensive music database schema

-- Create enum types for better data integrity
CREATE TYPE public.song_mood AS ENUM ('energetic', 'melancholic', 'uplifting', 'aggressive', 'peaceful', 'nostalgic', 'romantic', 'mysterious', 'playful', 'dramatic');
CREATE TYPE public.song_energy AS ENUM ('low', 'medium', 'high', 'very_high');
CREATE TYPE public.explicit_content AS ENUM ('clean', 'explicit', 'edited');
CREATE TYPE public.song_key AS ENUM ('C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B');
CREATE TYPE public.key_mode AS ENUM ('major', 'minor');

-- Artists table
CREATE TABLE public.artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    country TEXT,
    birth_date DATE,
    death_date DATE,
    genres TEXT[],
    external_ids JSONB, -- Spotify, Apple Music, etc.
    image_url TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Albums table
CREATE TABLE public.albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    release_date DATE,
    record_label TEXT,
    total_tracks INTEGER,
    album_type TEXT, -- 'album', 'single', 'ep', 'compilation'
    cover_art_url TEXT,
    external_ids JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Main songs table with comprehensive metadata
CREATE TABLE public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    album_id UUID REFERENCES public.albums(id),
    track_number INTEGER,
    disc_number INTEGER DEFAULT 1,
    duration_ms INTEGER,
    release_date DATE,
    
    -- Identifiers
    isrc TEXT,
    upc TEXT,
    musicbrainz_id TEXT,
    external_ids JSONB,
    
    -- Audio characteristics
    bpm DECIMAL(5,2),
    song_key public.song_key,
    key_mode public.key_mode,
    time_signature INTEGER,
    loudness DECIMAL(5,2),
    dynamic_range DECIMAL(5,2),
    
    -- Mood and energy
    valence DECIMAL(3,2) CHECK (valence >= 0 AND valence <= 1),
    danceability DECIMAL(3,2) CHECK (danceability >= 0 AND danceability <= 1),
    energy_level public.song_energy,
    mood public.song_mood,
    
    -- Content
    lyrics TEXT,
    language TEXT,
    explicit_content public.explicit_content DEFAULT 'clean',
    
    -- Production details
    recording_studio TEXT,
    recording_date DATE,
    producer TEXT,
    engineer TEXT,
    mixing_engineer TEXT,
    mastering_engineer TEXT,
    
    -- Additional metadata
    themes TEXT[],
    instruments TEXT[],
    vocals TEXT[], -- lead, backing, etc.
    credits JSONB, -- detailed credits
    samples JSONB, -- sampled tracks info
    
    -- Searchable fields
    description TEXT,
    story_behind_song TEXT,
    
    -- Technical
    audio_fingerprint TEXT,
    similarity_vector VECTOR(1536), -- For AI embeddings
    
    -- Status
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Genres table
CREATE TABLE public.genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_genre_id UUID REFERENCES public.genres(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Junction tables for many-to-many relationships
CREATE TABLE public.song_artists (
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'performer', -- 'performer', 'composer', 'songwriter', 'producer'
    PRIMARY KEY (song_id, artist_id, role)
);

CREATE TABLE public.song_genres (
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    genre_id UUID REFERENCES public.genres(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (song_id, genre_id)
);

-- User profiles for personalized experience
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    preferred_genres TEXT[],
    listening_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User listening history
CREATE TABLE public.user_listening_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    listened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    duration_listened_ms INTEGER,
    completion_percentage DECIMAL(3,2),
    skip_reason TEXT,
    listening_context TEXT, -- 'playlist', 'radio', 'search', 'recommendation'
    mood_when_listened TEXT,
    device_type TEXT
);

-- User reviews and ratings
CREATE TABLE public.user_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    tags TEXT[],
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, song_id)
);

-- User search history for AI recommendations
CREATE TABLE public.user_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    search_type TEXT DEFAULT 'natural_language', -- 'natural_language', 'filtered', 'similar'
    results_count INTEGER,
    clicked_results UUID[],
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

-- Public read policies for music data
CREATE POLICY "Anyone can view artists" ON public.artists FOR SELECT USING (true);
CREATE POLICY "Anyone can view albums" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Anyone can view songs" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Anyone can view genres" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Anyone can view song_artists" ON public.song_artists FOR SELECT USING (true);
CREATE POLICY "Anyone can view song_genres" ON public.song_genres FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own listening history" ON public.user_listening_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own listening history" ON public.user_listening_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all reviews" ON public.user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON public.user_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.user_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.user_reviews FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own search history" ON public.user_search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own search history" ON public.user_search_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_songs_title ON public.songs USING GIN (to_tsvector('english', title));
CREATE INDEX idx_songs_lyrics ON public.songs USING GIN (to_tsvector('english', lyrics));
CREATE INDEX idx_songs_description ON public.songs USING GIN (to_tsvector('english', description));
CREATE INDEX idx_songs_themes ON public.songs USING GIN (themes);
CREATE INDEX idx_songs_instruments ON public.songs USING GIN (instruments);
CREATE INDEX idx_songs_bpm ON public.songs (bpm);
CREATE INDEX idx_songs_key ON public.songs (song_key, key_mode);
CREATE INDEX idx_songs_energy ON public.songs (energy_level);
CREATE INDEX idx_songs_mood ON public.songs (mood);
CREATE INDEX idx_songs_release_date ON public.songs (release_date);

CREATE INDEX idx_artists_name ON public.artists USING GIN (to_tsvector('english', name));
CREATE INDEX idx_albums_title ON public.albums USING GIN (to_tsvector('english', title));
CREATE INDEX idx_user_listening_history_user_id ON public.user_listening_history (user_id);
CREATE INDEX idx_user_listening_history_song_id ON public.user_listening_history (song_id);
CREATE INDEX idx_user_listening_history_listened_at ON public.user_listening_history (listened_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON public.songs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_reviews_updated_at BEFORE UPDATE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();