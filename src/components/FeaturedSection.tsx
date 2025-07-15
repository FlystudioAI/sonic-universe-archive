import { TrendingUp, Award, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import SongCard from "./SongCard";
import AISearchInterface from "./AISearchInterface";

const FeaturedSection = () => {
  const featuredSongs = [
    {
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      year: 2020,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      duration: "3:20",
      genre: "Synthpop",
      isPremium: true
    },
    {
      title: "Good 4 U",
      artist: "Olivia Rodrigo",
      album: "SOUR",
      year: 2021,
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
      duration: "2:58",
      genre: "Pop Rock"
    },
    {
      title: "Watermelon Sugar",
      artist: "Harry Styles",
      album: "Fine Line",
      year: 2020,
      rating: 4.5,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      duration: "2:54",
      genre: "Pop"
    },
    {
      title: "Levitating",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      year: 2020,
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
      duration: "3:23",
      genre: "Disco-Pop",
      isPremium: true
    }
  ];

  const categories = [
    {
      icon: TrendingUp,
      title: "Trending Now",
      description: "Most popular tracks this week",
      color: "text-primary"
    },
    {
      icon: Award,
      title: "Editor's Choice",
      description: "Hand-picked by our music experts",
      color: "text-accent"
    },
    {
      icon: Clock,
      title: "New Releases",
      description: "Latest songs and albums",
      color: "text-success"
    },
    {
      icon: Zap,
      title: "Rising Stars",
      description: "Up-and-coming artists to watch",
      color: "text-warning"
    }
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section with integrated AI Search */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Discover Your Next
            <br />
            Favorite Song
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore the world's most comprehensive music database with detailed information on every song ever recorded.
          </p>
          
          {/* Integrated AI Search Interface */}
          <div className="mb-8">
            <AISearchInterface />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl">
              Start Exploring
            </Button>
            <Button variant="outline" size="xl">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div 
                key={index}
                className="bg-gradient-card border border-border/50 rounded-lg p-6 hover:border-accent/50 transition-all duration-300 hover:scale-105"
              >
                <Icon className={`h-8 w-8 ${category.color} mb-4`} />
                <h3 className="font-semibold text-foreground mb-2">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            );
          })}
        </div>

        {/* Featured Songs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Featured This Week</h2>
            <Button variant="ghost">View All</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSongs.map((song, index) => (
              <SongCard key={index} {...song} />
            ))}
          </div>
        </div>

        {/* Premium Callout */}
        <div className="bg-gradient-premium rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-premium-foreground mb-4">
            Unlock Premium Features
          </h3>
          <p className="text-premium-foreground/90 mb-6 max-w-2xl mx-auto">
            Get access to high-quality audio, exclusive content, advanced search filters, and ad-free browsing.
          </p>
          <Button variant="outline" size="lg" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            Start Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;