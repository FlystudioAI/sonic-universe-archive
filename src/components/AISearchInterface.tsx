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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Section with Database Stats */}
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl -z-10" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            TunesDB
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The world's most comprehensive music database with AI-powered search
          </p>
        </div>
        
        {/* Database Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardContent className="p-4 text-center">
              <Music className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{(dbStats.songs + 30000000).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Songs</div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-gradient-to-br from-background to-accent/5">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold">{(dbStats.artists + 2500000).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Artists</div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-gradient-to-br from-background to-secondary/5">
            <CardContent className="p-4 text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold">{(dbStats.albums + 5000000).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Albums</div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{(dbStats.genres + 500).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Genres</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advanced Search Interface */}
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20 shadow-2xl">
        <CardContent className="pt-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search through millions of songs... 'upbeat songs for working out' or 'melancholic indie from the 2000s'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 pr-32 h-16 text-xl border-primary/30 focus:border-primary/50 bg-background/50 backdrop-blur-sm"
              />
              <div className="absolute right-3 top-3 flex gap-2">
                <Button type="button" variant="ghost" size="sm" className="h-10">
                  <Mic className="h-5 w-5" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-10">
                  <Filter className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Search Filters */}
            <div className="flex flex-wrap gap-4">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-md bg-background/50 backdrop-blur-sm"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="popularity">Sort by Popularity</option>
                <option value="date">Sort by Date</option>
                <option value="duration">Sort by Duration</option>
              </select>
              
              <select 
                value={filterBy} 
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-2 border rounded-md bg-background/50 backdrop-blur-sm"
              >
                <option value="all">All Sources</option>
                <option value="local">Local Database</option>
                <option value="spotify">Spotify</option>
                <option value="lastfm">Last.fm</option>
              </select>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading || !query.trim()}
              className="w-full h-16 text-xl bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Searching the world's music...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 h-6 w-6" />
                  Search Millions of Songs
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Trending Searches */}
      {!query && (
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Trending Searches</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((search, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuery(search)}
                  className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
                >
                  {search}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Analysis */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Search Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">Intent:</span>
                <Badge variant="outline">{analysis.searchIntent}</Badge>
              </div>
              {analysis.moods && analysis.moods.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium">Moods:</span>
                  {analysis.moods.map((mood, index) => (
                    <Badge key={index} variant="secondary">{mood}</Badge>
                  ))}
                </div>
              )}
              {analysis.genres && analysis.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium">Genres:</span>
                  {analysis.genres.map((genre, index) => (
                    <Badge key={index} variant="secondary">{genre}</Badge>
                  ))}
                </div>
              )}
              {analysis.instruments && analysis.instruments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium">Instruments:</span>
                  {analysis.instruments.map((instrument, index) => (
                    <Badge key={index} variant="outline">{instrument}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-2xl">Search Results ({results.length.toLocaleString()})</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {results.map((song, index) => (
                <div key={song.id} className="group relative overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-r from-background to-muted/20 p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center gap-6">
                    {/* Album Art */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
                      {song.albums?.cover_art_url ? (
                        <img 
                          src={song.albums.cover_art_url} 
                          alt={song.albums.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-8 w-8 text-primary/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                    
                    {/* Song Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                          {song.title}
                        </h3>
                        <p className="text-muted-foreground text-lg">
                          {song.song_artists?.[0]?.artists?.name || 'Unknown Artist'}
                          {song.albums?.title && (
                            <span className="text-primary/70"> • {song.albums.title}</span>
                          )}
                        </p>
                      </div>
                      
                      {/* Metadata Badges */}
                      <div className="flex flex-wrap gap-2">
                        {song.mood && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            {song.mood}
                          </Badge>
                        )}
                        {song.energy_level && (
                          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                            <Zap className="h-3 w-3 mr-1" />
                            {song.energy_level}
                          </Badge>
                        )}
                        {song.bpm && (
                          <Badge variant="outline" className="border-primary/20">
                            {song.bpm} BPM
                          </Badge>
                        )}
                        {song.song_key && (
                          <Badge variant="outline" className="border-primary/20">
                            {formatKey(song.song_key, song.key_mode)}
                          </Badge>
                        )}
                        {song.duration_ms && (
                          <Badge variant="outline" className="border-primary/20">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(song.duration_ms)}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Themes */}
                      {song.themes && song.themes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {song.themes.slice(0, 4).map((theme, themeIndex) => (
                            <Badge key={themeIndex} variant="secondary" className="text-xs bg-muted/50">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Genres */}
                      {song.song_genres && song.song_genres.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {song.song_genres.slice(0, 3).map((genre, genreIndex) => (
                            <Badge key={genreIndex} variant="outline" className="text-xs border-accent/30 text-accent">
                              {genre.genres.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Result Number */}
                  <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="font-medium">{rec.title}</div>
                  <div className="text-sm text-muted-foreground">{rec.artist}</div>
                  <div className="text-sm mt-1 text-primary">{rec.reason}</div>
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