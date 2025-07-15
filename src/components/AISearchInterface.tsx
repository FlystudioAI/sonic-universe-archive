import React, { useState, useEffect } from 'react';
import { Search, Mic, Filter, Loader2, Sparkles } from 'lucide-react';
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

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-music-search', {
        body: {
          query,
          userId: user?.id,
          searchType: 'natural_language',
          filters: {}
        }
      });

      if (error) throw error;

      setResults(data.songs || []);
      setAnalysis(data.analysis || null);
      setRecommendations(data.recommendations || []);

      toast({
        title: "Search Complete",
        description: `Found ${data.songs?.length || 0} songs matching your query`,
      });
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Interface */}
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20 shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for music naturally... 'upbeat songs for working out' or 'melancholic indie from the 2000s'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-20 h-12 text-lg border-primary/30 focus:border-primary/50"
              />
              <div className="absolute right-2 top-2 flex gap-2">
                <Button type="button" variant="ghost" size="sm">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !query.trim()}
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Search Music
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

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
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((song) => (
                <div key={song.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    {song.albums?.cover_art_url ? (
                      <img 
                        src={song.albums.cover_art_url} 
                        alt={song.albums.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 rounded-lg" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">{song.title}</h3>
                      <p className="text-muted-foreground">
                        {song.song_artists?.[0]?.artists?.name || 'Unknown Artist'}
                        {song.albums?.title && ` • ${song.albums.title}`}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{song.mood}</Badge>
                      <Badge variant="outline">{song.energy_level}</Badge>
                      {song.bpm && <Badge variant="outline">{song.bpm} BPM</Badge>}
                      {song.song_key && <Badge variant="outline">{formatKey(song.song_key, song.key_mode)}</Badge>}
                      {song.duration_ms && <Badge variant="outline">{formatDuration(song.duration_ms)}</Badge>}
                    </div>
                    
                    {song.themes && song.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {song.themes.slice(0, 3).map((theme, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{theme}</Badge>
                        ))}
                      </div>
                    )}
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