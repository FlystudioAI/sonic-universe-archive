import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Music, TrendingUp, Globe, Play, Users, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TrendingTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  streams: number;
  chartPosition: number;
  countryFlag: string;
}

interface MusicRegion {
  id: string;
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
  topGenres: string[];
  trendingTracks: TrendingTrack[];
  musicScene: string;
  culturalNote: string;
  flag: string;
  timeZone: string;
  population: string;
}

const MUSIC_REGIONS: MusicRegion[] = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    topGenres: ['J-Pop', 'City Pop', 'Electronic', 'Shibuya-kei'],
    trendingTracks: [
      { id: '1', title: 'Plastic Love', artist: 'Mariya Takeuchi', genre: 'City Pop', streams: 5200000, chartPosition: 1, countryFlag: '🇯🇵' },
      { id: '2', title: 'Stay Alive', artist: 'YOASOBI', genre: 'J-Pop', streams: 4800000, chartPosition: 2, countryFlag: '🇯🇵' },
      { id: '3', title: 'Kaikai Kitan', artist: 'Eve', genre: 'Rock', streams: 3900000, chartPosition: 3, countryFlag: '🇯🇵' }
    ],
    musicScene: 'Innovative fusion of traditional and modern sounds, leading the global J-Pop renaissance',
    culturalNote: 'Birthplace of City Pop revival and cutting-edge electronic music production',
    flag: '🇯🇵',
    timeZone: 'JST',
    population: '14M'
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo',
    country: 'Brazil',
    coordinates: { lat: -23.5505, lng: -46.6333 },
    topGenres: ['Sertanejo', 'Brazilian Funk', 'MPB', 'Forró'],
    trendingTracks: [
      { id: '4', title: 'Morena', artist: 'Luísa Sonza', genre: 'Pop', streams: 6100000, chartPosition: 1, countryFlag: '🇧🇷' },
      { id: '5', title: 'Seu Jorge', artist: 'Anitta', genre: 'Brazilian Funk', streams: 5500000, chartPosition: 2, countryFlag: '🇧🇷' },
      { id: '6', title: 'Vida Louca', artist: 'Felipe Araújo', genre: 'Sertanejo', streams: 4200000, chartPosition: 3, countryFlag: '🇧🇷' }
    ],
    musicScene: 'Vibrant mix of traditional Brazilian rhythms with modern urban influences',
    culturalNote: 'Heart of Brazilian music production and the global funk carioca movement',
    flag: '🇧🇷',
    timeZone: 'BRT',
    population: '12M'
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    topGenres: ['Grime', 'UK Drill', 'Indie Rock', 'Garage'],
    trendingTracks: [
      { id: '7', title: 'As It Was', artist: 'Harry Styles', genre: 'Pop Rock', streams: 8900000, chartPosition: 1, countryFlag: '🇬🇧' },
      { id: '8', title: 'Bad Habit', artist: 'Steve Lacy', genre: 'Alternative R&B', streams: 7200000, chartPosition: 2, countryFlag: '🇬🇧' },
      { id: '9', title: 'Flowers', artist: 'Miley Cyrus', genre: 'Pop', streams: 6800000, chartPosition: 3, countryFlag: '🇬🇧' }
    ],
    musicScene: 'Global music capital with thriving underground and mainstream scenes',
    culturalNote: 'Birthplace of punk, grime, and countless music movements that shaped the world',
    flag: '🇬🇧',
    timeZone: 'GMT',
    population: '9M'
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    country: 'Kenya',
    coordinates: { lat: -1.2921, lng: 36.8219 },
    topGenres: ['Afrobeats', 'Gengetone', 'Kapuka', 'Gospel'],
    trendingTracks: [
      { id: '10', title: 'Lamba Lolo', artist: 'Ethic Entertainment', genre: 'Gengetone', streams: 2100000, chartPosition: 1, countryFlag: '🇰🇪' },
      { id: '11', title: 'Utawezana', artist: 'Femi One ft Mejja', genre: 'Hip Hop', streams: 1800000, chartPosition: 2, countryFlag: '🇰🇪' },
      { id: '12', title: 'Shukisha', artist: 'Khaligraph Jones', genre: 'Rap', streams: 1500000, chartPosition: 3, countryFlag: '🇰🇪' }
    ],
    musicScene: 'Rising hub of East African music with innovative genre-blending artists',
    culturalNote: 'Emerging center for Afrobeats and the birthplace of the Gengetone movement',
    flag: '🇰🇪',
    timeZone: 'EAT',
    population: '4.4M'
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    coordinates: { lat: 52.5200, lng: 13.4050 },
    topGenres: ['Techno', 'House', 'Minimal', 'Industrial'],
    trendingTracks: [
      { id: '13', title: 'Flowers', artist: 'Klangkuenstler', genre: 'Techno', streams: 3200000, chartPosition: 1, countryFlag: '🇩🇪' },
      { id: '14', title: 'Berghain', artist: 'Tale of Us', genre: 'Deep House', streams: 2800000, chartPosition: 2, countryFlag: '🇩🇪' },
      { id: '15', title: 'Acid Dreams', artist: 'Charlotte de Witte', genre: 'Acid Techno', streams: 2400000, chartPosition: 3, countryFlag: '🇩🇪' }
    ],
    musicScene: 'Global techno capital with legendary club culture and underground scenes',
    culturalNote: 'Home to iconic venues like Berghain and the epicenter of European electronic music',
    flag: '🇩🇪',
    timeZone: 'CET',
    population: '3.7M'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    topGenres: ['Bollywood', 'Indian Pop', 'Indie', 'Classical Fusion'],
    trendingTracks: [
      { id: '16', title: 'Kesariya', artist: 'Arijit Singh', genre: 'Bollywood', streams: 12000000, chartPosition: 1, countryFlag: '🇮🇳' },
      { id: '17', title: 'Excuses', artist: 'AP Dhillon', genre: 'Punjabi Pop', streams: 8500000, chartPosition: 2, countryFlag: '🇮🇳' },
      { id: '18', title: 'Satisfya', artist: 'Imran Khan', genre: 'Indo-Pop', streams: 7200000, chartPosition: 3, countryFlag: '🇮🇳' }
    ],
    musicScene: 'Bollywood music capital blending traditional Indian sounds with modern production',
    culturalNote: 'Heart of Indian film music industry and emerging indie music scene',
    flag: '🇮🇳',
    timeZone: 'IST',
    population: '20M'
  }
];

const GlobalMusicMap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<MusicRegion | null>(null);
  const [activeView, setActiveView] = useState<'map' | 'trends' | 'genres'>('map');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getRegionColor = (region: MusicRegion) => {
    const colors = {
      'tokyo': 'from-pink-500 to-purple-600',
      'sao-paulo': 'from-green-400 to-blue-500',
      'london': 'from-gray-600 to-blue-700',
      'nairobi': 'from-orange-400 to-red-500',
      'berlin': 'from-purple-500 to-indigo-600',
      'mumbai': 'from-orange-500 to-pink-500'
    };
    return colors[region.id as keyof typeof colors] || 'from-blue-500 to-purple-600';
  };

  const formatStreams = (streams: number) => {
    if (streams >= 1000000) {
      return `${(streams / 1000000).toFixed(1)}M`;
    }
    return `${(streams / 1000).toFixed(0)}K`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Global Music Map</h2>
            <p className="text-muted-foreground">Discover what's trending around the world</p>
          </div>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            World Map
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Global Trends
          </TabsTrigger>
          <TabsTrigger value="genres" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Regional Genres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Interactive Map Area */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] relative overflow-hidden">
                <CardContent className="p-0 h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                    <div className="relative w-full h-full max-w-4xl max-h-96">
                      {/* World Map Simulation */}
                      <div className="absolute inset-0 bg-slate-700 rounded-lg opacity-30"></div>
                      
                      {/* Region Markers */}
                      {MUSIC_REGIONS.map((region) => (
                        <motion.div
                          key={region.id}
                          className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2`}
                          style={{
                            left: `${((region.coordinates.lng + 180) / 360) * 100}%`,
                            top: `${((90 - region.coordinates.lat) / 180) * 100}%`
                          }}
                          onHoverStart={() => setHoveredRegion(region.id)}
                          onHoverEnd={() => setHoveredRegion(null)}
                          onClick={() => setSelectedRegion(region)}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRegionColor(region)} flex items-center justify-center shadow-lg border-2 border-white`}>
                            <Music className="h-4 w-4 text-white" />
                          </div>
                          
                          <AnimatePresence>
                            {hoveredRegion === region.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-10"
                              >
                                <div className="font-semibold">{region.name} {region.flag}</div>
                                <div className="text-xs opacity-75">{region.topGenres.slice(0, 2).join(', ')}</div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Region Details Panel */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {selectedRegion ? (
                  <motion.div
                    key={selectedRegion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <span className="text-2xl">{selectedRegion.flag}</span>
                          <div>
                            <div className="text-xl">{selectedRegion.name}</div>
                            <div className="text-sm text-muted-foreground">{selectedRegion.country}</div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Population</div>
                            <div className="text-muted-foreground">{selectedRegion.population}</div>
                          </div>
                          <div>
                            <div className="font-medium">Time Zone</div>
                            <div className="text-muted-foreground">{selectedRegion.timeZone}</div>
                          </div>
                        </div>

                        <div>
                          <div className="font-medium mb-2">Top Genres</div>
                          <div className="flex flex-wrap gap-1">
                            {selectedRegion.topGenres.map((genre) => (
                              <Badge key={genre} variant="secondary" className="text-xs">
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium mb-2">Music Scene</div>
                          <p className="text-sm text-muted-foreground">{selectedRegion.musicScene}</p>
                        </div>

                        <div>
                          <div className="font-medium mb-2">Cultural Note</div>
                          <p className="text-sm text-muted-foreground">{selectedRegion.culturalNote}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Trending Now</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-3">
                            {selectedRegion.trendingTracks.map((track, index) => (
                              <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                  {track.chartPosition}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{track.title}</div>
                                  <div className="text-sm text-muted-foreground truncate">{track.artist}</div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">{track.genre}</Badge>
                                    <span>{formatStreams(track.streams)} plays</span>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost" className="shrink-0">
                                  <Play className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Explore the World</h3>
                    <p className="text-muted-foreground">Click on any region to discover local music trends</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MUSIC_REGIONS.map((region) => (
              <Card key={region.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-xl">{region.flag}</span>
                    {region.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {region.trendingTracks.slice(0, 3).map((track, index) => (
                    <div key={track.id} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{track.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatStreams(track.streams)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="genres" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MUSIC_REGIONS.map((region) => (
              <Card key={region.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{region.flag}</span>
                    {region.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {region.topGenres.map((genre, index) => (
                      <Badge 
                        key={genre} 
                        variant={index === 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{region.musicScene}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalMusicMap;