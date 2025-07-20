import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { User, Settings, Crown, BarChart } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, preferences, and subscription
          </p>
        </div>
        {user?.subscriptionTier === 'premium' && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
            <Crown className="h-3 w-3 mr-1" />
            Premium Member
          </Badge>
        )}
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">{user?.displayName || 'User'}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Subscription</p>
              <p className="text-sm text-muted-foreground capitalize">
                {user?.subscriptionTier || 'Free'} tier
              </p>
            </div>
            {user?.subscriptionTier === 'free' && (
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                Upgrade to Premium
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Customize your CTRL/news experience with personalized settings.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Content interests</span>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Email notifications</span>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Podcast frequency</span>
              <Button variant="outline" size="sm">Change</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Your Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-500">12</div>
              <div className="text-sm text-muted-foreground">Articles Read</div>
            </div>
            <div className="text-center p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-500">3</div>
              <div className="text-sm text-muted-foreground">Podcasts Listened</div>
            </div>
            <div className="text-center p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-500">8</div>
              <div className="text-sm text-muted-foreground">Content Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;