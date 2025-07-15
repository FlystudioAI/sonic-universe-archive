import React, { useState, useEffect } from 'react';
import { User, History, Heart, Settings, LogOut, Music2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  preferred_genres: string[];
  listening_preferences: any;
}

interface SearchHistoryItem {
  id: string;
  search_query: string;
  search_type: string;
  results_count: number;
  searched_at: string;
}

interface ListeningHistoryItem {
  id: string;
  listened_at: string;
  completion_percentage: number;
  listening_context: string;
  song_id: string;
  songs: {
    title: string;
    song_artists: Array<{
      artists: { name: string };
    }>;
  };
}

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [listeningHistory, setListeningHistory] = useState<ListeningHistoryItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
        await loadSearchHistory(session.user.id);
        await loadListeningHistory(session.user.id);
      }
    };

    getCurrentUser();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create profile if it doesn't exist
        await createUserProfile(userId);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          username: user?.user_metadata?.username || user?.email?.split('@')[0],
          display_name: user?.user_metadata?.username || user?.email?.split('@')[0],
          preferred_genres: [],
          listening_preferences: {}
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const loadSearchHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_search_history')
        .select('*')
        .eq('user_id', userId)
        .order('searched_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSearchHistory(data || []);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const loadListeningHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_listening_history')
        .select(`
          *,
          songs (
            title,
            song_artists (
              artists (name)
            )
          )
        `)
        .eq('user_id', userId)
        .order('listened_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setListeningHistory(data || []);
    } catch (error) {
      console.error('Error loading listening history:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">Please sign in to view your profile</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile?.display_name || user.email}</h2>
              <p className="text-muted-foreground">@{profile?.username || user.email?.split('@')[0]}</p>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-6 w-6" />
            Recent Searches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {searchHistory.length > 0 ? (
            <div className="space-y-3">
              {searchHistory.map((search) => (
                <div key={search.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{search.search_query}</div>
                    <div className="text-sm text-muted-foreground">
                      {search.results_count} results • {formatDate(search.searched_at)}
                    </div>
                  </div>
                  <Badge variant="outline">{search.search_type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No search history yet. Start exploring music!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Listening History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="h-6 w-6" />
            Recently Played
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listeningHistory.length > 0 ? (
            <div className="space-y-3">
              {listeningHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.songs?.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.songs?.song_artists?.[0]?.artists?.name} • {formatDate(item.listened_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{Math.round(item.completion_percentage * 100)}% played</div>
                    <Badge variant="outline" className="text-xs">{item.listening_context}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No listening history yet. Start discovering music!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferred Genres */}
      {profile?.preferred_genres && profile.preferred_genres.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6" />
              Favorite Genres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_genres.map((genre, index) => (
                <Badge key={index} variant="secondary">{genre}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfile;