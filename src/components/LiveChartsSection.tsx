import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ChartEntry {
  id: string;
  chart_type: string;
  position: number;
  song_title: string;
  artist_name: string;
  album_name?: string;
  chart_date: string;
  previous_position?: number;
  weeks_on_chart?: number;
  peak_position?: number;
}

const LiveChartsSection = () => {
  const [charts, setCharts] = useState<Record<string, ChartEntry[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadCharts = async () => {
    try {
      const { data: chartData } = await supabase
        .from('music_charts')
        .select('*')
        .order('chart_type')
        .order('position');

      if (chartData) {
        const groupedCharts = chartData.reduce((acc, chart) => {
          if (!acc[chart.chart_type]) {
            acc[chart.chart_type] = [];
          }
          acc[chart.chart_type].push(chart);
          return acc;
        }, {} as Record<string, ChartEntry[]>);

        setCharts(groupedCharts);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error loading charts:', error);
    }
  };

  const updateCharts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('live-charts-update');
      if (error) throw error;
      
      console.log('Charts updated:', data);
      await loadCharts();
    } catch (error) {
      console.error('Error updating charts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCharts();
  }, []);

  const getPositionChange = (current: number, previous?: number) => {
    if (!previous) return 'new';
    if (current < previous) return 'up';
    if (current > previous) return 'down';
    return 'same';
  };

  const formatChartType = (type: string) => {
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Live Music Charts</h2>
          <p className="text-muted-foreground">
            Real-time chart positions from major music platforms
          </p>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        
        <Button 
          onClick={updateCharts} 
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          <Activity className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Updating...' : 'Update Charts'}
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(charts).map(([chartType, entries]) => (
          <motion.div
            key={chartType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {formatChartType(chartType)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entries.slice(0, 10).map((entry, index) => {
                    const change = getPositionChange(entry.position, entry.previous_position);
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* Position */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                          {entry.position}
                        </div>

                        {/* Change Indicator */}
                        <div className="w-6 flex justify-center">
                          {change === 'up' && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          {change === 'down' && (
                            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                          )}
                          {change === 'new' && (
                            <Badge variant="secondary" className="text-xs px-1">
                              NEW
                            </Badge>
                          )}
                        </div>

                        {/* Song Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{entry.song_title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {entry.artist_name}
                          </p>
                          {entry.album_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.album_name}
                            </p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="text-right text-xs text-muted-foreground">
                          {entry.weeks_on_chart && (
                            <p>{entry.weeks_on_chart}w</p>
                          )}
                          {entry.peak_position && (
                            <p>Peak: #{entry.peak_position}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {Object.keys(charts).length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Chart Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Click "Update Charts" to fetch the latest chart information
            </p>
            <Button onClick={updateCharts} disabled={isLoading}>
              <Activity className="h-4 w-4 mr-2" />
              Update Charts
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveChartsSection;