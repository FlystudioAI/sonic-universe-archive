import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Podcast, 
  Twitter, 
  Bookmark, 
  User, 
  MessageSquare,
  TrendingUp,
  Calendar,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      label: 'Feed',
      href: '/',
      icon: Home,
      description: 'Latest AI news',
    },
    {
      label: 'CTRLcast',
      href: '/ctrlcast',
      icon: Podcast,
      description: 'Daily AI podcast',
      badge: 'New'
    },
    {
      label: 'X Pulse',
      href: '/x-pulse',
      icon: Twitter,
      description: 'Top AI tweets',
    },
    {
      label: 'Saved',
      href: '/saved',
      icon: Bookmark,
      description: 'Your saved content',
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Account settings',
    },
  ];

  const quickActions = [
    {
      label: 'CTRL/Ask',
      icon: MessageSquare,
      action: () => console.log('Open CTRL/Ask'),
      description: 'Ask AI about news',
    },
    {
      label: 'Trending',
      icon: TrendingUp,
      action: () => console.log('Show trending'),
      description: 'Trending topics',
    },
  ];

  return (
    <nav className="h-full flex flex-col p-4">
      {/* Main Navigation */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Navigation
        </h2>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
                          (item.href === '/' && location.pathname === '/feed');
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary-foreground" : "group-hover:text-foreground"
              )} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <p className={cn(
                  "text-xs opacity-70",
                  isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {item.description}
                </p>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        {quickActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Button
              key={action.label}
              variant="ghost"
              onClick={action.action}
              className="w-full justify-start space-x-3 px-3 py-2.5 h-auto text-left"
            >
              <Icon className="h-5 w-5" />
              <div>
                <div className="font-medium text-sm">{action.label}</div>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Subscription Section */}
      <div className="mt-auto pt-6 border-t border-border">
        {user?.subscriptionTier === 'free' ? (
          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Upgrade to Premium</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Unlimited access, no ads, and exclusive features
            </p>
            <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              Upgrade for $9.99/mo
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Premium Member</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Thank you for supporting CTRL/news!
            </p>
          </div>
        )}
      </div>

      {/* Today's Stats */}
      <div className="mt-4 p-3 bg-card/50 rounded-lg border">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">Today's Activity</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Articles read</span>
            <span className="font-medium">12</span>
          </div>
          <div className="flex justify-between">
            <span>Podcast listened</span>
            <span className="font-medium">1</span>
          </div>
          <div className="flex justify-between">
            <span>Tweets viewed</span>
            <span className="font-medium">8</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;