import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  MoreHorizontal,
  ChevronUp,
  Music2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_art_url?: string;
  duration_ms?: number;
  audio_url?: string;
}

interface MusicPlayerProps {
  currentTrack?: Track;
  isPlaying?: boolean;
  queue?: Track[];
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onVolumeChange?: (volume: number) => void;
  onSeek?: (position: number) => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTrack,
  isPlaying = false,
  queue = [],
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onSeek
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [isLiked, setIsLiked] = useState(false);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    setIsMuted(vol === 0);
    onVolumeChange?.(vol);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    onVolumeChange?.(isMuted ? volume : 0);
  };

  const toggleRepeat = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Mini Player */}
      <Card className="rounded-none border-t border-x-0 border-b-0 bg-card/95 backdrop-blur-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Track Info */}
            <div 
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                  {currentTrack.cover_art_url ? (
                    <motion.img
                      src={currentTrack.cover_art_url}
                      alt={currentTrack.album}
                      className="w-full h-full object-cover"
                      animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <Music2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                {/* Playing Indicator */}
                {isPlaying && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full pulse-glow" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{currentTrack.title}</p>
                <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={`h-8 w-8 p-0 ${isLiked ? 'text-red-500' : ''}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                className="h-8 w-8 p-0"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                onClick={isPlaying ? onPause : onPlay}
                className="h-10 w-10 p-0 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                className="h-8 w-8 p-0"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Slider
              value={[currentTime]}
              max={currentTrack.duration_ms || 100}
              step={1000}
              onValueChange={(value) => {
                setCurrentTime(value[0]);
                onSeek?.(value[0]);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(currentTrack.duration_ms || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card/95 backdrop-blur-lg border-t border-border"
          >
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              {/* Enhanced Track Info */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">{currentTrack.title}</h3>
                <p className="text-muted-foreground">{currentTrack.artist}</p>
                {currentTrack.album && (
                  <Badge variant="outline">{currentTrack.album}</Badge>
                )}
              </div>

              {/* Additional Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShuffled(!isShuffled)}
                  className={`h-8 w-8 p-0 ${isShuffled ? 'text-primary' : ''}`}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleRepeat}
                  className={`h-8 w-8 p-0 ${repeatMode !== 'none' ? 'text-primary' : ''}`}
                >
                  <Repeat className="h-4 w-4" />
                  {repeatMode === 'one' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] text-primary-foreground flex items-center justify-center">
                      1
                    </span>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="h-8 w-8 p-0"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {/* Queue Preview */}
              {queue.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Up Next</h4>
                  <div className="space-y-2">
                    {queue.slice(0, 3).map((track, index) => (
                      <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <Music2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        </div>
                      </div>
                    ))}
                    {queue.length > 3 && (
                      <p className="text-xs text-center text-muted-foreground">
                        +{queue.length - 3} more tracks
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MusicPlayer;