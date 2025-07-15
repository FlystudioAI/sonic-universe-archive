import React, { useState } from 'react';
import { Database, Download, Search, User, Album, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const DataImportInterface: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [importStatus, setImportStatus] = useState<string>('');
  const { toast } = useToast();

  const handleImport = async (action: string, query?: string, limit = 50) => {
    setIsLoading(true);
    setImportStatus(`Starting ${action}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-music-data', {
        body: {
          action,
          query,
          limit
        }
      });

      if (error) throw error;

      setImportStatus(`Completed: ${data.message}`);
      toast({
        title: "Import Successful",
        description: data.message,
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus(`Error: ${error.message}`);
      toast({
        title: "Import Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importPresets = [
    {
      name: "Popular Artists",
      description: "Import 50 popular artists from MusicBrainz",
      action: "import_popular_artists",
      icon: User,
      color: "bg-blue-500"
    },
    {
      name: "Beatles Albums",
      description: "Import Beatles discography",
      action: "import_artist_albums",
      query: "The Beatles",
      icon: Album,
      color: "bg-green-500"
    },
    {
      name: "Rock Music",
      description: "Search and import rock music",
      action: "search_and_import",
      query: "rock",
      icon: Music,
      color: "bg-purple-500"
    },
    {
      name: "80s Hits",
      description: "Import popular 80s music",
      action: "search_and_import",
      query: "80s hits",
      icon: Music,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Music Database Import
          </CardTitle>
          <p className="text-muted-foreground">
            Populate your music database with real data from MusicBrainz and Last.fm
          </p>
        </CardHeader>
        <CardContent>
          {/* Quick Import Presets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {importPresets.map((preset, index) => {
              const IconComponent = preset.icon;
              return (
                <Card key={index} className="border-muted hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${preset.color} text-white`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{preset.name}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{preset.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => handleImport(preset.action, preset.query)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      Import
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Custom Search Import */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for artists, albums, or songs to import..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => handleImport('search_and_import', searchQuery)}
                disabled={isLoading || !searchQuery.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search & Import
              </Button>
            </div>

            {/* Import Status */}
            {importStatus && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={importStatus.startsWith('Error') ? 'destructive' : 'default'}>
                    {importStatus.startsWith('Error') ? 'Error' : 'Status'}
                  </Badge>
                  <span className="text-sm">{importStatus}</span>
                </div>
              </div>
            )}

            {/* Data Sources Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Data Sources</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>• <strong>MusicBrainz:</strong> Artist info, albums, songs</div>
                  <div>• <strong>Last.fm:</strong> Artist bios and images</div>
                  <div>• <strong>Generated:</strong> Mood, energy, and audio features</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Import Features</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>• Automatic duplicate detection</div>
                  <div>• Rate-limited API calls</div>
                  <div>• Comprehensive metadata</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImportInterface;