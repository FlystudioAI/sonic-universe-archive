-- Create cached external songs table for performance optimization
CREATE TABLE public.cached_external_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL, -- 'spotify', 'lastfm', 'musicbrainz', etc.
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration_ms INTEGER,
  metadata JSONB,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  access_count INTEGER DEFAULT 1,
  UNIQUE(external_id, source)
);

-- Create index for fast lookups
CREATE INDEX idx_cached_external_songs_search ON public.cached_external_songs 
USING GIN (to_tsvector('english', title || ' ' || artist || ' ' || COALESCE(album, '')));

CREATE INDEX idx_cached_external_songs_source ON public.cached_external_songs (source);
CREATE INDEX idx_cached_external_songs_accessed ON public.cached_external_songs (last_accessed DESC);

-- Create user submissions table for bands/labels to upload their music
CREATE TABLE public.user_music_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Song Information
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_title TEXT,
  duration_ms INTEGER,
  release_date DATE,
  
  -- Audio Analysis (user provided or generated)
  bpm NUMERIC,
  song_key TEXT,
  key_mode TEXT CHECK (key_mode IN ('major', 'minor')),
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high', 'very_high')),
  mood TEXT CHECK (mood IN ('energetic', 'melancholic', 'uplifting', 'aggressive', 'peaceful', 'nostalgic', 'romantic', 'mysterious', 'playful', 'dramatic')),
  
  -- Additional Metadata
  genres TEXT[],
  instruments TEXT[],
  themes TEXT[],
  lyrics TEXT,
  description TEXT,
  
  -- Media URLs
  audio_url TEXT, -- Link to audio file (SoundCloud, YouTube, etc.)
  cover_art_url TEXT,
  music_video_url TEXT,
  
  -- Verification & Status
  submission_status TEXT DEFAULT 'pending' CHECK (submission_status IN ('pending', 'approved', 'rejected', 'needs_review')),
  admin_notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  
  -- Contact Information
  contact_email TEXT,
  record_label TEXT,
  publishing_rights TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for user submissions
CREATE INDEX idx_user_submissions_status ON public.user_music_submissions (submission_status);
CREATE INDEX idx_user_submissions_user ON public.user_music_submissions (user_id);
CREATE INDEX idx_user_submissions_created ON public.user_music_submissions (created_at DESC);

-- Search index for submissions
CREATE INDEX idx_user_submissions_search ON public.user_music_submissions 
USING GIN (to_tsvector('english', title || ' ' || artist_name || ' ' || COALESCE(album_title, '')));

-- Enable RLS on cached external songs
ALTER TABLE public.cached_external_songs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view cached songs (public data)
CREATE POLICY "Anyone can view cached external songs" 
ON public.cached_external_songs 
FOR SELECT 
USING (true);

-- Enable RLS on user music submissions
ALTER TABLE public.user_music_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for user music submissions
CREATE POLICY "Users can view their own submissions" 
ON public.user_music_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" 
ON public.user_music_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending submissions" 
ON public.user_music_submissions 
FOR UPDATE 
USING (auth.uid() = user_id AND submission_status = 'pending');

-- Policy: Approved submissions are viewable by everyone
CREATE POLICY "Anyone can view approved submissions" 
ON public.user_music_submissions 
FOR SELECT 
USING (submission_status = 'approved');

-- Update trigger for user submissions
CREATE TRIGGER update_user_submissions_updated_at
BEFORE UPDATE ON public.user_music_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for cached songs (track access)
CREATE OR REPLACE FUNCTION public.update_cached_song_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = now();
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cached_song_access_trigger
BEFORE UPDATE ON public.cached_external_songs
FOR EACH ROW
EXECUTE FUNCTION public.update_cached_song_access();