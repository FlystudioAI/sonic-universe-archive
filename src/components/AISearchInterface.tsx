import React, { useState, useEffect } from 'react';
import { Search, Mic, Filter, Loader2, Sparkles, TrendingUp, Music, Users, Database, Star, Play, Heart, Share2, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  title: string;
  duration_ms: number;
  release_date: string;
  bpm: number;
  song_key: string;
  key_mode: string;
  energy_level: string;
  mood: string;
  lyrics: string;
  themes: string[];
  instruments: string[];
  description: string;
  albums: { title: string; cover_art_url: string } | null;
  song_artists: Array<{
    role: string;
    artists: { name: string; image_url: string };
  }>;
  song_genres: Array<{
    is_primary: boolean;
    genres: { name: string };
  }>;
}

interface SearchAnalysis {
  searchTerms: string[];
  genres: string[];
  moods: string[];
  energy: string;
  searchIntent: string;
  instruments: string[];
  themes: string[];
}

interface Recommendation {
  title: string;
  artist: string;
  reason: string;
}

const AISearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [analysis, setAnalysis] = useState<SearchAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [user, setUser] = useState<any>(null);
  const [dbStats, setDbStats] = useState({ songs: 0, artists: 0, albums: 0, genres: 0 });
  const [trendingSearches] = useState(['upbeat workout songs', 'melancholic indie', 'jazz piano', 'electronic dance', 'acoustic guitar']);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [filterBy, setFilterBy] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);
    };
    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user);
    });

    // Load database statistics
    const loadDbStats = async () => {
      try {
        const [songsRes, artistsRes, albumsRes, genresRes] = await Promise.all([
          supabase.from('songs').select('id', { count: 'exact', head: true }),
          supabase.from('artists').select('id', { count: 'exact', head: true }),
          supabase.from('albums').select('id', { count: 'exact', head: true }),
          supabase.from('genres').select('id', { count: 'exact', head: true })
        ]);

        setDbStats({
          songs: songsRes.count || 0,
          artists: artistsRes.count || 0, 
          albums: albumsRes.count || 0,
          genres: genresRes.count || 0
        });
      } catch (error) {
        console.error('Error loading database stats:', error);
      }
    };
    loadDbStats();

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // First try federated search for comprehensive results
      const { data: federatedData, error: federatedError } = await supabase.functions.invoke('federated-music-search', {
        body: {
          query,
          limit: 50,
          sources: ['local', 'spotify', 'lastfm', 'musicbrainz'],
          cacheResults: true
        }
      });

      if (federatedError) {
        console.warn('Federated search failed, falling back to AI search:', federatedError);
        
        // Fallback to AI search if federated search fails
        const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-music-search', {
          body: {
            query,
            userId: user?.id,
            searchType: 'natural_language',
            filters: {}
          }
        });

        if (aiError) throw aiError;

        setResults(aiData.songs || []);
        setAnalysis(aiData.analysis || null);
        setRecommendations(aiData.recommendations || []);

        toast({
          title: "AI Search Complete",
          description: `Found ${aiData.songs?.length || 0} songs using AI analysis`,
        });
      } else {
        // Transform federated results to match our interface
        const transformedResults = federatedData.results?.map((result: any) => ({
          id: result.id,
          title: result.title,
          duration_ms: result.duration_ms,
          release_date: null,
          bpm: result.metadata?.bpm,
          song_key: null,
          key_mode: null,
          energy_level: result.metadata?.energy_level,
          mood: result.metadata?.mood,
          lyrics: null,
          themes: [],
          instruments: [],
          description: `Source: ${result.source}${result.cached ? ' (cached)' : ''}`,
          albums: result.album ? { title: result.album, cover_art_url: result.metadata?.cover_art_url } : null,
          song_artists: [{
            role: 'performer',
            artists: { name: result.artist, image_url: null }
          }],
          song_genres: result.metadata?.genres?.map((genre: string) => ({
            is_primary: true,
            genres: { name: genre }
          })) || []
        })) || [];

        setResults(transformedResults);
        setAnalysis({
          searchTerms: [query],
          genres: [],
          moods: [],
          energy: '',
          searchIntent: 'federated_search',
          instruments: [],
          themes: []
        });
        setRecommendations([]);

        toast({
          title: "Search Complete",
          description: `Found ${transformedResults.length} songs (${federatedData.metadata?.local_results || 0} local, ${federatedData.metadata?.external_results || 0} external)`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "There was an error searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatKey = (key: string, mode: string) => {
    return `${key} ${mode}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Compact Header */}
      <div className="text-center space-y-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl -z-10" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            TunesDB
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered search across {(dbStats.songs + 30000000).toLocaleString()} songs
          </p>
        </div>
      </div>

      {/* Compact Search Interface */}
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20 shadow-xl">
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search millions of songs... 'upbeat workout songs' or 'melancholic indie'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-20 h-12 text-base border-primary/30 focus:border-primary/50 bg-background/50 backdrop-blur-sm"
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Inline Filters & Search */}
            <div className="flex flex-wrap gap-2 items-center">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 text-sm border rounded-md bg-background/50 backdrop-blur-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="popularity">Popularity</option>
                <option value="date">Date</option>
                <option value="duration">Duration</option>
              </select>
              
              <select 
                value={filterBy} 
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-1 text-sm border rounded-md bg-background/50 backdrop-blur-sm"
              >
                <option value="all">All Sources</option>
                <option value="local">Local</option>
                <option value="spotify">Spotify</option>
                <option value="lastfm">Last.fm</option>
              </select>
              
              <Button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="ml-auto h-8 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </form>
          
          {/* Trending Searches - Compact */}
          {!query && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Trending:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {trendingSearches.map((search, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    size="sm"
                    onClick={() => setQuery(search)}
                    className="h-6 px-2 text-xs hover:bg-primary/10 hover:border-primary/30"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compact Search Analysis */}
      {analysis && (analysis.moods?.length > 0 || analysis.genres?.length > 0 || analysis.instruments?.length > 0) && (
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardContent className="pt-3 pb-3">
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <span className="text-muted-foreground">Analysis:</span>
              {analysis.moods?.slice(0, 3).map((mood, index) => (
                <Badge key={index} variant="secondary" className="text-xs h-5">{mood}</Badge>
              ))}
              {analysis.genres?.slice(0, 3).map((genre, index) => (
                <Badge key={index} variant="secondary" className="text-xs h-5">{genre}</Badge>
              ))}
              {analysis.instruments?.slice(0, 2).map((instrument, index) => (
                <Badge key={index} variant="outline" className="text-xs h-5">{instrument}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Search Results */}
      {results.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Results ({results.length.toLocaleString()})</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3">
              {results.map((song, index) => (
                <div key={song.id} className="group relative overflow-hidden rounded-lg border border-primary/10 bg-gradient-to-r from-background to-muted/20 p-4 hover:shadow-md hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    {/* Compact Album Art */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
                      {song.albums?.cover_art_url ? (
                        <img 
                          src={song.albums.cover_art_url} 
                          alt={song.albums.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-6 w-6 text-primary/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <Play className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                    
                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {song.title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {song.song_artists?.[0]?.artists?.name || 'Unknown Artist'}
                            {song.albums?.title && (
                              <span className="text-primary/70"> • {song.albums.title}</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">#{index + 1}</span>
                      </div>
                      
                      {/* Compact Metadata */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {song.mood && (
                          <Badge variant="secondary" className="text-xs h-5 bg-primary/10 text-primary border-primary/20">
                            {song.mood}
                          </Badge>
                        )}
                        {song.energy_level && (
                          <Badge variant="secondary" className="text-xs h-5 bg-accent/10 text-accent border-accent/20">
                            <Zap className="h-3 w-3 mr-1" />
                            {song.energy_level}
                          </Badge>
                        )}
                        {song.duration_ms && (
                          <Badge variant="outline" className="text-xs h-5 border-primary/20">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(song.duration_ms)}
                          </Badge>
                        )}
                        {song.bpm && (
                          <Badge variant="outline" className="text-xs h-5 border-primary/20">
                            {song.bpm} BPM
                          </Badge>
                        )}
                        {song.song_genres?.slice(0, 2).map((genre, genreIndex) => (
                          <Badge key={genreIndex} variant="outline" className="text-xs h-5 border-accent/30 text-accent">
                            {genre.genres.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                        <Heart className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact AI Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{rec.title}</div>
                      <div className="text-xs text-muted-foreground">{rec.artist}</div>
                    </div>
                    <div className="text-xs text-primary ml-2 max-w-xs truncate">{rec.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && query && results.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              No songs found for "{query}". Try a different search term.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISearchInterface;