-- Create tables for music news and charts

-- Music News table
CREATE TABLE public.music_news (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    image_url TEXT,
    source TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Music Charts table
CREATE TABLE public.music_charts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chart_type TEXT NOT NULL, -- 'billboard_hot_100', 'spotify_top_50', 'apple_music_top_100'
    position INTEGER NOT NULL,
    song_title TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    album_name TEXT,
    cover_art_url TEXT,
    chart_date DATE NOT NULL,
    previous_position INTEGER,
    weeks_on_chart INTEGER,
    peak_position INTEGER,
    external_id TEXT, -- spotify_id, apple_music_id, etc.
    source_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(chart_type, position, chart_date)
);

-- Music Trends table (for trending topics, hashtags, etc.)
CREATE TABLE public.music_trends (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trend_name TEXT NOT NULL,
    trend_type TEXT NOT NULL, -- 'hashtag', 'artist', 'genre', 'topic'
    mentions_count INTEGER DEFAULT 0,
    sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
    source TEXT NOT NULL, -- 'twitter', 'instagram', 'tiktok', 'reddit'
    trend_date DATE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(trend_name, trend_type, source, trend_date)
);

-- Enable Row Level Security
ALTER TABLE public.music_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_trends ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view music news" ON public.music_news FOR SELECT USING (true);
CREATE POLICY "Anyone can view music charts" ON public.music_charts FOR SELECT USING (true);
CREATE POLICY "Anyone can view music trends" ON public.music_trends FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_music_news_published_at ON public.music_news(published_at DESC);
CREATE INDEX idx_music_news_source ON public.music_news(source);
CREATE INDEX idx_music_news_category ON public.music_news(category);

CREATE INDEX idx_music_charts_chart_type ON public.music_charts(chart_type);
CREATE INDEX idx_music_charts_date ON public.music_charts(chart_date DESC);
CREATE INDEX idx_music_charts_position ON public.music_charts(chart_type, chart_date, position);

CREATE INDEX idx_music_trends_date ON public.music_trends(trend_date DESC);
CREATE INDEX idx_music_trends_type ON public.music_trends(trend_type);
CREATE INDEX idx_music_trends_source ON public.music_trends(source);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_music_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_music_news_updated_at
    BEFORE UPDATE ON public.music_news
    FOR EACH ROW
    EXECUTE FUNCTION public.update_music_updated_at_column();

CREATE TRIGGER update_music_charts_updated_at
    BEFORE UPDATE ON public.music_charts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_music_updated_at_column();

CREATE TRIGGER update_music_trends_updated_at
    BEFORE UPDATE ON public.music_trends
    FOR EACH ROW
    EXECUTE FUNCTION public.update_music_updated_at_column();

-- Enable realtime for live updates
ALTER TABLE public.music_news REPLICA IDENTITY FULL;
ALTER TABLE public.music_charts REPLICA IDENTITY FULL;
ALTER TABLE public.music_trends REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.music_news;
ALTER PUBLICATION supabase_realtime ADD TABLE public.music_charts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.music_trends;