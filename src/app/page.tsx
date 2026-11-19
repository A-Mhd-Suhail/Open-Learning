import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { CategoriesSection } from "@/components/marketing/CategoriesSection";
import { TogetherSection } from "@/components/marketing/TogetherSection";
import { Footer } from "@/components/marketing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <CategoriesSection />
        <TogetherSection />
      </main>
      <Footer />
    </>
  );
}
