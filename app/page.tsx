import {
  Navbar,
  Hero,
  HowItWorks,
  Features,
  DemoSection,
  PaymentMarquee,
  Stats,
  Pricing,
  Testimonials,
  FAQ,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <main className="landing-page">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <DemoSection />
      <PaymentMarquee />
      <Stats />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
