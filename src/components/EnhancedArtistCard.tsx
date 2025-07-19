import React from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, Share2, MessageCircle, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Artist {
  id: string;
  name: string;
  image_url?: string;
  bio?: string;
  genres?: string[];
  verified?: boolean;
  followers?: number;
  monthly_listeners?: number;
  formed_year?: number;
}

interface EnhancedArtistCardProps {
  artist: Artist;
  showDetails?: boolean;
  onPlay?: () => void;
  onChat?: () => void;
}

const EnhancedArtistCard: React.FC<EnhancedArtistCardProps> = ({
  artist,
  showDetails = false,
  onPlay,
  onChat
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden group vinyl-hover glass">
        <CardContent className="p-0">
          {/* Hero Section */}
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 relative overflow-hidden">
              {artist.image_url && (
                <img 
                  src={artist.image_url} 
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Action Buttons */}
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  className="h-10 w-10 p-0 rounded-full bg-primary hover:bg-primary/90"
                  onClick={onPlay}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* AI Chat Button */}
              {onChat && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onChat}
                    className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    AI Chat
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Artist Avatar */}
            <div className="absolute -bottom-8 left-6">
              <Avatar className="h-16 w-16 border-4 border-card">
                <AvatarImage src={artist.image_url} alt={artist.name} />
                <AvatarFallback className="text-2xl font-bold">
                  {artist.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-12 space-y-4">
            {/* Artist Name & Verification */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{artist.name}</h3>
                {artist.verified && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Verified
                  </Badge>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {artist.monthly_listeners && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {formatNumber(artist.monthly_listeners)} monthly listeners
                  </div>
                )}
                {artist.formed_year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Since {artist.formed_year}
                  </div>
                )}
              </div>
            </div>

            {/* Genres */}
            {artist.genres && artist.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {artist.genres.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
                {artist.genres.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{artist.genres.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Bio Preview */}
            {artist.bio && showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="text-sm text-muted-foreground"
              >
                <p className="line-clamp-3">{artist.bio}</p>
              </motion.div>
            )}

            {/* Musical DNA Visualization (Placeholder) */}
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <h4 className="font-semibold text-sm">Musical DNA</h4>
                <div className="space-y-2">
                  {[
                    { genre: 'Rock', percentage: 45, color: 'bg-red-500' },
                    { genre: 'Folk', percentage: 30, color: 'bg-green-500' },
                    { genre: 'Blues', percentage: 25, color: 'bg-blue-500' }
                  ].map((dna) => (
                    <div key={dna.genre} className="flex items-center gap-3">
                      <span className="text-xs w-12">{dna.genre}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${dna.percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full ${dna.color}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {dna.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedArtistCard;