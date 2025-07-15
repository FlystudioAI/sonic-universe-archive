import { useState, useEffect } from "react";
import { Search, Music, Star, Crown, Menu, X, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);
    };
    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="premium" size="sm">
                  <Crown className="h-4 w-4" />
                  Go Premium
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  <Star className="h-4 w-4" />
                  Sign In
                </Button>
                <Button variant="premium" size="sm">
                  <Crown className="h-4 w-4" />
                  Go Premium
                </Button>
              </>
            )}
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
                {user ? (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate('/auth')}>
                      <Star className="h-4 w-4" />
                      Sign In
                    </Button>
                    <Button variant="premium" size="sm" className="flex-1">
                      <Crown className="h-4 w-4" />
                      Go Premium
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;