import Header from "@/components/Header";
import FeaturedSection from "@/components/FeaturedSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main>
        <FeaturedSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
