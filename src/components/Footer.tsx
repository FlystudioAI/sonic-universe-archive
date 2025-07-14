import { Music, Mail, Twitter, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Music className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                TunesDB
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              The world's most comprehensive music database. Discover, explore, and rate every song ever recorded.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Discover */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Discover</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Top Charts
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                New Releases
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Genres
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Playlists
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Artist Directory
              </a>
            </nav>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Company</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Careers
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Press
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                API Documentation
              </a>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Stay Updated</h4>
            <p className="text-sm text-muted-foreground">
              Get the latest music discoveries and industry news delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter your email"
                className="bg-background/50 border-border/50"
              />
              <Button variant="default" size="icon">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 TunesDB. All rights reserved.
          </div>
          <nav className="flex gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Cookie Policy
            </a>
          </nav>
        </div>
      </div>

      {/* Ad Space Placeholder */}
      <div className="border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4 py-4">
          <div className="bg-secondary/20 border-2 border-dashed border-secondary/50 rounded-lg p-8 text-center">
            <p className="text-secondary-foreground/60 text-sm">Advertisement Space</p>
            <p className="text-xs text-secondary-foreground/40 mt-1">
              This area will display targeted music-related ads for free users
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;