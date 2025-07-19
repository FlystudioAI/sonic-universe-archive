import Header from "@/components/Header";
import FeaturedSection from "@/components/FeaturedSection";
import DiscoveryInterface from "@/components/DiscoveryInterface";
import MusicChatInterface from "@/components/MusicChatInterface";
import AISearchInterface from "@/components/AISearchInterface";
import DataImportInterface from "@/components/DataImportInterface";
import MusicSubmissionForm from "@/components/MusicSubmissionForm";
import MusicNewsSection from "@/components/MusicNewsSection";
import MusicChartsSection from "@/components/MusicChartsSection";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, Plus, Newspaper, BarChart3, Compass, MessageCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main>
        {/* Hero Discovery Section */}
        <section className="py-12">
          <DiscoveryInterface />
        </section>
        
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="discover" className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-8">
              <TabsTrigger value="discover" className="flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                News
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Import
              </TabsTrigger>
              <TabsTrigger value="submit" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Submit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover">
              <FeaturedSection />
            </TabsContent>

            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    AI Music Historian
                  </CardTitle>
                  <CardDescription>
                    Chat with our AI about any music topic - get stories, analysis, and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MusicChatInterface />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search">
              <AISearchInterface />
            </TabsContent>

            <TabsContent value="news">
              <MusicNewsSection />
            </TabsContent>

            <TabsContent value="charts">
              <MusicChartsSection />
            </TabsContent>

            <TabsContent value="import">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Data Import
                  </CardTitle>
                  <CardDescription>
                    Import music data from various sources to build your database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataImportInterface />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Submit Music
                  </CardTitle>
                  <CardDescription>
                    Submit your music to be included in our database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MusicSubmissionForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
