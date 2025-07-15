import Header from "@/components/Header";
import FeaturedSection from "@/components/FeaturedSection";
import AISearchInterface from "@/components/AISearchInterface";
import DataImportInterface from "@/components/DataImportInterface";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main>
        <FeaturedSection />
        <div className="container mx-auto px-4 py-8">
          <DataImportInterface />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
