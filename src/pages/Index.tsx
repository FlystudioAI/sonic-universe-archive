import Header from "@/components/Header";
import FeaturedSection from "@/components/FeaturedSection";
import AISearchInterface from "@/components/AISearchInterface";
import DataImportInterface from "@/components/DataImportInterface";
import MusicSubmissionForm from "@/components/MusicSubmissionForm";
import MusicNewsSection from "@/components/MusicNewsSection";
import MusicChartsSection from "@/components/MusicChartsSection";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, Plus, Newspaper, BarChart3 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main>
        <FeaturedSection />
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
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
