import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { CategoriesSection } from "@/components/marketing/CategoriesSection";
import { LibrarySection } from "@/components/marketing/LibrarySection";
import { ClosingCta } from "@/components/marketing/ClosingCta";
import { Footer } from "@/components/marketing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <Features />
        <HowItWorks />
        <CategoriesSection />
        <LibrarySection />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
