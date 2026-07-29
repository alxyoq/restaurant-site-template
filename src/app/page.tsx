import Layout from "@/components/layout/Layout";
import FeaturedSections from "@/components/ui/FeaturedSections";
import Hero from "@/components/ui/Hero";
import ReviewsSection from "@/components/ui/ReviewsSection";

export default function HomePage() {
  return (
    <Layout>
      <Hero />
      <FeaturedSections />
      <ReviewsSection />
    </Layout>
  );
}
