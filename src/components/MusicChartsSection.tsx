import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Heart,
  Share2,
  ExternalLink,
  Crown,
  Flame,
  Music,
  Loader2,
  RefreshCw,
  BarChart3,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ChartItem {
  id: string;
  chart_type: string;
  position: number;
  song_title: string;
  artist_name: string;
  album_name?: string;
  cover_art_url?: string;
  chart_date: string;
  previous_position?: number;
  weeks_on_chart?: number;
  peak_position?: number;
  external_id?: string;
  source_url?: string;
  metadata?: any;
}

interface MusicChartsSectionProps {
  className?: string;
}

const MusicChartsSection: React.FC<MusicChartsSectionProps> = ({ className }) => {
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChart, setActiveChart] = useState('spotify_global_top_50');
  const { toast } = useToast();

  const chartTypes = [
    { 
      id: 'spotify_global_top_50', 
      label: 'Spotify Global Top 50', 
      icon: Music,
      color: 'bg-green-500'
    },
    { 
      id: 'billboard_hot_100', 
      label: 'Billboard Hot 100', 
      icon: Award,
      color: 'bg-red-500'
    },
    { 
      id: 'apple_music_top_100', 
      label: 'Apple Music Top 100', 
      icon: Crown,
      color: 'bg-gray-500'
    },
    { 
      id: 'trending', 
      label: 'Trending Now', 
      icon: TrendingUp,
      color: 'bg-primary'
    }
  ];

  useEffect(() => {
    loadCharts();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('music_charts_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'music_charts'
      }, (payload) => {
        const newItem = payload.new as ChartItem;
        if (newItem.chart_type === activeChart) {
          setCharts(prev => {
            const filtered = prev.filter(item => item.position !== newItem.position);
            return [...filtered, newItem].sort((a, b) => a.position - b.position);
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeChart]);

  const loadCharts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('music-news-and-charts', {
        body: { 
          action: 'get-charts', 
          chartType: activeChart,
          limit: 50
        }
      });

      if (error) throw error;

      setCharts(data || []);
    } catch (error) {
      console.error('Error loading charts:', error);
      toast({
        title: "Error loading charts",
        description: "Failed to load music charts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshCharts = async () => {
    try {
      setRefreshing(true);
      
      // Trigger charts fetch
      const { data, error } = await supabase.functions.invoke('music-news-and-charts', {
        body: { 
          action: 'fetch-charts',
          chartType: activeChart
        }
      });

      if (error) throw error;

      toast({
        title: "Charts Updated!",
        description: `Fetched ${data.count} chart positions`,
      });
      
      // Reload the charts
      await loadCharts();
    } catch (error) {
      console.error('Error refreshing charts:', error);
      toast({
        title: "Error refreshing charts",
        description: "Failed to refresh charts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getPositionChange = (current: number, previous?: number) => {
    if (!previous) return { icon: Minus, color: 'text-muted-foreground', text: 'New' };
    
    const change = previous - current;
    if (change > 0) {
      return { icon: TrendingUp, color: 'text-green-500', text: `+${change}` };
    } else if (change < 0) {
      return { icon: TrendingDown, color: 'text-red-500', text: `${change}` };
    } else {
      return { icon: Minus, color: 'text-muted-foreground', text: '0' };
    }
  };

  const getPositionStyle = (position: number) => {
    if (position === 1) return 'text-yellow-500 font-bold';
    if (position <= 3) return 'text-orange-500 font-bold';
    if (position <= 10) return 'text-primary font-semibold';
    return 'text-muted-foreground';
  };

  const handleShare = async (item: ChartItem) => {
    try {
      await navigator.share({
        title: `${item.song_title} by ${item.artist_name}`,
        text: `Check out #${item.position} on ${activeChart}`,
        url: item.source_url || ''
      });
    } catch (error) {
      // Fallback to clipboard
      if (item.source_url) {
        await navigator.clipboard.writeText(item.source_url);
        toast({
          title: "Link copied!",
          description: "Song link copied to clipboard",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Music Charts</h2>
            <p className="text-muted-foreground">Real-time rankings from top platforms</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshCharts} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>

      {/* Chart Types */}
      <Tabs value={activeChart} onValueChange={setActiveChart} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          {chartTypes.map((chart) => (
            <TabsTrigger key={chart.id} value={chart.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${chart.color}`} />
              <span className="hidden sm:inline">{chart.label}</span>
              <span className="sm:hidden">{chart.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeChart} className="space-y-4">
          {charts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No chart data available yet.
                </p>
                <Button className="mt-4" onClick={refreshCharts}>
                  Fetch Latest Charts
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {charts.map((item) => {
                const positionChange = getPositionChange(item.position, item.previous_position);
                const PositionIcon = positionChange.icon;
                
                return (
                  <Card key={item.id} className="group hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Position */}
                        <div className="flex flex-col items-center min-w-[3rem]">
                          <span className={`text-xl font-bold ${getPositionStyle(item.position)}`}>
                            {item.position}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <PositionIcon className={`h-3 w-3 ${positionChange.color}`} />
                            <span className={`text-xs ${positionChange.color}`}>
                              {positionChange.text}
                            </span>
                          </div>
                        </div>

                        {/* Album Art */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
                          {item.cover_art_url ? (
                            <img 
                              src={item.cover_art_url} 
                              alt={item.album_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="h-6 w-6 text-primary/50" />
                            </div>
                          )}
                          
                          {/* Play button overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                          
                          {/* Crown for #1 */}
                          {item.position === 1 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Crown className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Song Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                            {item.song_title}
                          </h3>
                          <p className="text-muted-foreground truncate">
                            {item.artist_name}
                            {item.album_name && ` • ${item.album_name}`}
                          </p>
                          
                          {/* Chart Stats */}
                          <div className="flex items-center gap-3 mt-2">
                            {item.weeks_on_chart && (
                              <Badge variant="outline" className="text-xs">
                                {item.weeks_on_chart} weeks
                              </Badge>
                            )}
                            {item.peak_position && (
                              <Badge variant="outline" className="text-xs">
                                Peak: #{item.peak_position}
                              </Badge>
                            )}
                            {item.metadata?.popularity && (
                              <Badge variant="outline" className="text-xs">
                                {item.metadata.popularity}% popular
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-10 h-10 p-0"
                            onClick={() => handleShare(item)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          {item.source_url && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-10 h-10 p-0"
                              onClick={() => window.open(item.source_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MusicChartsSection;