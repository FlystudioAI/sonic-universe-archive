import { useState } from "react";
import { Search, Music, Star, Crown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Music className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TunesDB
            </span>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs, artists, albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Discover
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Charts
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Artists
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Reviews
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Star className="h-4 w-4" />
              Sign In
            </Button>
            <Button variant="premium" size="sm">
              <Crown className="h-4 w-4" />
              Go Premium
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Discover
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Charts
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Artists
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Reviews
              </a>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Star className="h-4 w-4" />
                  Sign In
                </Button>
                <Button variant="premium" size="sm" className="flex-1">
                  <Crown className="h-4 w-4" />
                  Go Premium
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;