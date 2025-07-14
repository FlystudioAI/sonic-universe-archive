import { Heart, Play, Star, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SongCardProps {
  title: string;
  artist: string;
  album: string;
  year: number;
  rating: number;
  image: string;
  duration: string;
  genre: string;
  isPremium?: boolean;
}

const SongCard = ({ 
  title, 
  artist, 
  album, 
  year, 
  rating, 
  image, 
  duration, 
  genre,
  isPremium = false 
}: SongCardProps) => {
  return (
    <Card className="group bg-gradient-card hover:bg-card/80 border-border/50 hover:border-accent/50 transition-all duration-300 hover:scale-105 overflow-hidden">
      <div className="relative">
        {/* Album Art */}
        <div className="aspect-square relative overflow-hidden">
          <img 
            src={image} 
            alt={`${album} cover`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button size="icon" variant="default" className="h-12 w-12 rounded-full shadow-glow">
              <Play className="h-5 w-5 fill-current" />
            </Button>
          </div>

          {/* Premium Badge */}
          {isPremium && (
            <div className="absolute top-2 right-2 bg-gradient-premium text-premium-foreground px-2 py-1 rounded-full text-xs font-semibold">
              Premium
            </div>
          )}

          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {duration}
          </div>
        </div>

        {/* Song Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground truncate">{artist}</p>
              <p className="text-xs text-muted-foreground truncate">{album} • {year}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Genre & Rating */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
              {genre}
            </span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">{rating}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="flex-1">
              <Heart className="h-4 w-4" />
              Like
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Add to List
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SongCard;