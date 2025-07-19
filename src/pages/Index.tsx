import Header from "@/components/Header";
import FeaturedSection from "@/components/FeaturedSection";
import DiscoveryInterface from "@/components/DiscoveryInterface";
import MusicChatInterface from "@/components/MusicChatInterface";
import AISearchInterface from "@/components/AISearchInterface";
import DataImportInterface from "@/components/DataImportInterface";
import LiveChartsSection from "@/components/LiveChartsSection";
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
          <Tabs defaultValue="sonic-sage" className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-8">
              <TabsTrigger value="sonic-sage" className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                <MessageCircle className="h-4 w-4" />
                SonicSage
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                News
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

            <TabsContent value="sonic-sage">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    SonicSage
                    <div className="px-2 py-1 bg-accent/20 rounded-full text-xs font-normal">
                      Beta
                    </div>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    The world's first conversational music intelligence. Ask anything about any song, artist, or musical topic.
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
              <LiveChartsSection />
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
