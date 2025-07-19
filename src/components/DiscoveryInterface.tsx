import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, Music2, TrendingUp, Clock, Heart, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface DiscoveryPod {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  items: any[];
}

const DiscoveryInterface = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPod, setSelectedPod] = useState<string | null>(null);
  const [discoveryPods, setDiscoveryPods] = useState<DiscoveryPod[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  const loadDiscoveryData = async () => {
    // Load trending songs
    const { data: trendingSongs } = await supabase
      .from('songs')
      .select(`
        *,
        song_artists!inner(
          artists(name)
        ),
        albums(title, cover_art_url)
      `)
      .limit(10);

    // Load recent additions
    const { data: recentSongs } = await supabase
      .from('songs')
      .select(`
        *,
        song_artists!inner(
          artists(name)
        ),
        albums(title, cover_art_url)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Load charts data
    const { data: chartsData } = await supabase
      .from('music_charts')
      .select('*')
      .eq('chart_type', 'billboard-hot-100')
      .order('position')
      .limit(10);

    const pods: DiscoveryPod[] = [
      {
        id: 'trending',
        title: 'Trending Now',
        description: 'What everyone\'s discovering',
        icon: TrendingUp,
        gradient: 'from-pink-500 to-violet-500',
        items: trendingSongs || []
      },
      {
        id: 'hidden-gems',
        title: 'Hidden Gems',
        description: 'Underrated masterpieces',
        icon: Sparkles,
        gradient: 'from-emerald-500 to-cyan-500',
        items: recentSongs?.slice(5, 10) || []
      },
      {
        id: 'your-vibe',
        title: 'Your Vibe',
        description: 'Tailored to your taste',
        icon: Heart,
        gradient: 'from-rose-500 to-orange-500',
        items: trendingSongs?.slice(3, 8) || []
      },
      {
        id: 'time-machine',
        title: 'Time Machine',
        description: 'Journey through eras',
        icon: Clock,
        gradient: 'from-indigo-500 to-purple-500',
        items: recentSongs?.slice(0, 5) || []
      },
      {
        id: 'rabbit-holes',
        title: 'Rabbit Holes',
        description: 'Deep musical exploration',
        icon: Zap,
        gradient: 'from-yellow-500 to-red-500',
        items: chartsData || []
      },
      {
        id: 'charts',
        title: 'Hot Charts',
        description: 'What\'s dominating right now',
        icon: Music2,
        gradient: 'from-blue-500 to-purple-500',
        items: chartsData || []
      }
    ];

    setDiscoveryPods(pods);
  };

  const handleVoiceSearch = () => {
    setIsListening(!isListening);
    // Voice search implementation would go here
  };

  const podVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const searchVariants = {
    focused: {
      scale: 1.02,
      boxShadow: "0 0 30px hsl(var(--primary) / 0.3)",
      transition: { duration: 0.3 }
    },
    idle: {
      scale: 1,
      boxShadow: "0 0 0px hsl(var(--primary) / 0)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
      {/* Hero Search Section */}
      <motion.div 
        className="text-center space-y-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="space-y-4">
          <motion.h1 
            className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent neon-text"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "linear" 
            }}
          >
            Discover Music
          </motion.h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The world's most comprehensive music discovery platform. 
            Ask anything, find everything, explore endlessly.
          </p>
        </div>

        {/* Enhanced Search Bar */}
        <motion.div 
          className="relative max-w-2xl mx-auto"
          variants={searchVariants}
          initial="idle"
          whileFocus="focused"
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Songs that sound like midnight rain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-20 h-14 text-lg glass border-primary/20 focus:border-primary/50 bg-card/50"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <Button
                variant={isListening ? "default" : "ghost"}
                size="sm"
                onClick={handleVoiceSearch}
                className={`h-10 w-10 p-0 ${isListening ? 'pulse-glow' : ''}`}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'text-red-500' : ''}`} />
              </Button>
              <Button size="sm" className="h-10">
                Search
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {[
            "Jazz influences in hip-hop",
            "Songs in B minor",
            "Vintage synthesizer sounds",
            "Collaborations with Quincy Jones"
          ].map((suggestion, index) => (
            <motion.div
              key={suggestion}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + index * 0.1 }}
            >
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-primary/20 transition-colors px-3 py-1"
                onClick={() => setSearchQuery(suggestion)}
              >
                {suggestion}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Discovery Pods Grid */}
      <div className="space-y-6">
        <motion.h2 
          className="text-3xl font-bold text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Discovery Pods
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discoveryPods.map((pod, index) => (
            <motion.div
              key={pod.id}
              custom={index}
              variants={podVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Card 
                className={`discovery-card cursor-pointer h-full bg-gradient-to-br ${pod.gradient} p-1`}
                onClick={() => setSelectedPod(selectedPod === pod.id ? null : pod.id)}
              >
                <CardContent className="p-6 bg-card/90 backdrop-blur-sm rounded-lg h-full">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <pod.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{pod.title}</h3>
                        <p className="text-sm text-muted-foreground">{pod.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {pod.items.length} items • Updated now
                    </div>

                    <AnimatePresence>
                      {selectedPod === pod.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2 border-t border-border pt-4"
                        >
                          {pod.items.slice(0, 3).map((item, itemIndex) => (
                            <motion.div
                              key={itemIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: itemIndex * 0.1 }}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Music2 className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {item.title || item.song_title || 'Unknown Title'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.song_artists?.[0]?.artists?.name || item.artist_name || 'Unknown Artist'}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                          {pod.items.length > 3 && (
                            <p className="text-xs text-center text-muted-foreground pt-2">
                              +{pod.items.length - 3} more
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryInterface;