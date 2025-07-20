import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout and Navigation
import Layout from '@/components/layout/Layout';

// Pages
import FeedPage from '@/pages/FeedPage';
import PodcastPage from '@/pages/PodcastPage';
import XPulsePage from '@/pages/XPulsePage';
import SavedPage from '@/pages/SavedPage';
import ProfilePage from '@/pages/ProfilePage';
import AuthPage from '@/pages/AuthPage';
import OnboardingPage from '@/pages/OnboardingPage';

// Providers
import { AuthProvider } from '@/providers/AuthProvider';

import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground">
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                
                {/* Protected routes with layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<FeedPage />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/ctrlcast" element={<PodcastPage />} />
                  <Route path="/x-pulse" element={<XPulsePage />} />
                  <Route path="/saved" element={<SavedPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Routes>
              
              <Toaster 
                position="top-right" 
                toastOptions={{
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
