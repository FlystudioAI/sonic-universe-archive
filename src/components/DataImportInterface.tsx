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
      name: "Japanese Music",
      description: "Import Japanese artists and songs",
      action: "search_and_import",
      query: "japanese music",
      icon: Music,
      color: "bg-red-500"
    },
    {
      name: "South African Music",
      description: "Import South African artists and genres",
      action: "search_and_import",
      query: "south african music",
      icon: Music,
      color: "bg-yellow-500"
    },
    {
      name: "Brazilian Music",
      description: "Import Brazilian artists and bossa nova",
      action: "search_and_import",
      query: "brazilian music",
      icon: Music,
      color: "bg-green-500"
    },
    {
      name: "Electronic Music",
      description: "Import electronic and dance music",
      action: "search_and_import",
      query: "electronic music",
      icon: Music,
      color: "bg-purple-500"
    },
    {
      name: "Hip Hop",
      description: "Import hip hop and rap music",
      action: "search_and_import",
      query: "hip hop",
      icon: Music,
      color: "bg-orange-500"
    },
    {
      name: "Classical Music",
      description: "Import classical composers and pieces",
      action: "search_and_import",
      query: "classical music",
      icon: Music,
      color: "bg-indigo-500"
    },
    {
      name: "Reggae Music",
      description: "Import reggae and Caribbean music",
      action: "search_and_import",
      query: "reggae music",
      icon: Music,
      color: "bg-emerald-500"
    },
    {
      name: "Afrobeat",
      description: "Import African Afrobeat artists",
      action: "search_and_import",
      query: "afrobeat",
      icon: Music,
      color: "bg-amber-500"
    },
    {
      name: "K-Pop",
      description: "Import Korean pop music",
      action: "search_and_import",
      query: "k-pop",
      icon: Music,
      color: "bg-pink-500"
    },
    {
      name: "Latin Music",
      description: "Import Latin American music",
      action: "search_and_import",
      query: "latin music",
      icon: Music,
      color: "bg-rose-500"
    },
    {
      name: "Folk Music",
      description: "Import traditional folk music",
      action: "search_and_import",
      query: "folk music",
      icon: Music,
      color: "bg-teal-500"
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

      {/* Database Access Info */}
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Database Access & Manual Data Entry
          </CardTitle>
          <p className="text-muted-foreground">
            How to access your Supabase database and add data manually
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Your Database Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Project ID:</strong> <code className="bg-muted px-2 py-1 rounded text-xs">ksrjbezddhxyozllycer</code>
                </div>
                <div>
                  <strong>Database URL:</strong> <code className="bg-muted px-2 py-1 rounded text-xs">https://ksrjbezddhxyozllycer.supabase.co</code>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Access Methods</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>• <strong>SQL Editor:</strong> Use Supabase dashboard for direct SQL queries</div>
                  <div>• <strong>API:</strong> REST API for programmatic access</div>
                  <div>• <strong>Admin Panel:</strong> Table editor in Supabase dashboard</div>
                  <div>• <strong>psql:</strong> Direct PostgreSQL connection</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Main Tables</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>• <strong>songs:</strong> Main song metadata</div>
                  <div>• <strong>artists:</strong> Artist information</div>
                  <div>• <strong>albums:</strong> Album details</div>
                  <div>• <strong>genres:</strong> Music genres</div>
                  <div>• <strong>song_artists:</strong> Song-artist relationships</div>
                  <div>• <strong>user_music_submissions:</strong> User submissions</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">Quick Access Links</h4>
              <div className="space-y-1 text-xs">
                <div>• <a href="https://supabase.com/dashboard/project/ksrjbezddhxyozllycer/editor" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Table Editor</a> - View and edit data in tables</div>
                <div>• <a href="https://supabase.com/dashboard/project/ksrjbezddhxyozllycer/sql/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">SQL Editor</a> - Run custom SQL queries</div>
                <div>• <a href="https://supabase.com/dashboard/project/ksrjbezddhxyozllycer/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">API Documentation</a> - REST API reference</div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-sm mb-2 text-amber-900 dark:text-amber-100">Manual Data Entry Tips</h4>
              <div className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
                <div>• Use the user submission form in the app for new music</div>
                <div>• For bulk imports, use the SQL editor with INSERT statements</div>
                <div>• Check existing data structure before adding new records</div>
                <div>• Use UUIDs for ID fields (gen_random_uuid() function)</div>
                <div>• Remember to link songs to artists via the song_artists table</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImportInterface;