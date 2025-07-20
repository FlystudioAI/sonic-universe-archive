import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navigation from './Navigation';
import Header from './Header';
import { cn } from '@/lib/utils';

const Layout = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Main content area */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card/50 backdrop-blur-sm z-40">
          <Navigation />
        </aside>
        
        {/* Main content */}
        <main className="flex-1 ml-64 min-h-[calc(100vh-4rem)]">
          <div className="container max-w-6xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;