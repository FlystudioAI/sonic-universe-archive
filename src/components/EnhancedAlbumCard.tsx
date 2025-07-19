import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, Share2, Clock, Calendar, Disc, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Track {
  id: string;
  title: string;
  track_number: number;
  duration_ms?: number;
  song_key?: string;
  bpm?: number;
  mood?: string;
}

interface Album {
  id: string;
  title: string;
  cover_art_url?: string;
  release_date?: string;
  total_tracks?: number;
  album_type?: string;
  record_label?: string;
  tracks?: Track[];
  artist_name?: string;
}

interface EnhancedAlbumCardProps {
  album: Album;
  expanded?: boolean;
  onPlay?: () => void;
  onTrackPlay?: (track: Track) => void;
}

const EnhancedAlbumCard: React.FC<EnhancedAlbumCardProps> = ({
  album,
  expanded = false,
  onPlay,
  onTrackPlay
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden group vinyl-hover">
        <CardContent className="p-0">
          {/* Album Cover Section */}
          <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-accent/20">
            {album.cover_art_url && (
              <motion.img
                src={album.cover_art_url}
                alt={album.title}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.4 }}
              />
            )}
            
            {/* Vinyl Animation Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                whileHover={{ scale: 1, rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100"
              >
                <Play className="h-8 w-8 text-white ml-1" />
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full bg-primary/90 hover:bg-primary"
                onClick={onPlay}
              >
                <Play className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <Heart className="h-3 w-3" />
              </Button>
            </div>

            {/* Album Type Badge */}
            {album.album_type && (
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="text-xs bg-black/50 text-white">
                  {album.album_type}
                </Badge>
              </div>
            )}
          </div>

          {/* Album Info */}
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <h3 className="font-bold text-lg line-clamp-2">{album.title}</h3>
              {album.artist_name && (
                <p className="text-muted-foreground">{album.artist_name}</p>
              )}
            </div>

            {/* Album Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {album.release_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(album.release_date)}
                </div>
              )}
              {album.total_tracks && (
                <div className="flex items-center gap-1">
                  <Disc className="h-3 w-3" />
                  {album.total_tracks} tracks
                </div>
              )}
            </div>

            {/* Record Label */}
            {album.record_label && (
              <Badge variant="outline" className="text-xs">
                {album.record_label}
              </Badge>
            )}

            {/* Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-xs"
            >
              {isExpanded ? 'Hide Tracks' : 'Show Tracks'}
            </Button>

            {/* Expanded Track List */}
            <AnimatePresence>
              {isExpanded && album.tracks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2 border-t border-border pt-3"
                >
                  <h4 className="font-semibold text-sm mb-3">Tracklist</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {album.tracks.map((track, index) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                          hoveredTrack === track.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                        onMouseEnter={() => setHoveredTrack(track.id)}
                        onMouseLeave={() => setHoveredTrack(null)}
                        onClick={() => onTrackPlay?.(track)}
                      >
                        {/* Track Number */}
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-mono">
                          {hoveredTrack === track.id ? (
                            <Play className="h-3 w-3" />
                          ) : (
                            track.track_number
                          )}
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{track.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {track.duration_ms && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(track.duration_ms)}
                              </div>
                            )}
                            {track.song_key && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                Key: {track.song_key}
                              </Badge>
                            )}
                            {track.bpm && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {track.bpm} BPM
                              </Badge>
                            )}
                            {track.mood && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {track.mood}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Track Actions */}
                        {hoveredTrack === track.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-1"
                          >
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Heart className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Headphones className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedAlbumCard;