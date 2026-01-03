import React, { useEffect } from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import Hero from '../components/landing/Hero';
import ImageSection from '../components/landing/ImageSection';
import LogoSection from '../components/landing/LogoSection';
import ProductSection from '../components/landing/ProductSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CTASection from '../components/landing/CTASection';
import HowItWorks from '../components/landing/HowItWorks';
import Benefits from '../components/landing/Benefits';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';

export default function Landing() {
  // Hide the layout by adding a class to body
  useEffect(() => {
    document.body.classList.add('no-layout');
    return () => {
      document.body.classList.remove('no-layout');
    };
  }, []);

  return (
    <div className="min-h-screen bg-white fixed inset-0 z-50 overflow-auto">
      <LandingHeader />
      <main className="pt-16">
        <Hero />
        <ImageSection />
        <LogoSection />
        
        <ProductSection 
          title="AI-drevet kartlegging som gir innsikt"
          description="Vårt adaptive system tilpasser spørsmålene basert på svarene, og bruker kunstig intelligens til å identifisere risikofaktorer før de blir et problem."
          image="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop"
          features={[
            "Anonyme kartlegginger som gir ærlige svar",
            "AI-analyse av trender og risikomønstre",
            "Automatiske varsler til HR ved høy risiko",
            "GDPR-sikker datahåndtering"
          ]}
        />
        
        <ProductSection 
          title="Oppfølging som skaper resultater"
          description="Fra kartlegging til handling - vårt system hjelper deg med konkrete tiltak og oppfølging av ansatte som trenger det."
          image="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop"
          features={[
            "Automatisk genererte handlingsplaner",
            "Direkte kommunikasjon mellom HR og ansatte",
            "Tilretteleggingsverktøy og dokumentasjon",
            "Måling av effekt over tid"
          ]}
          reversed
        />
        
        <TestimonialsSection />
        
        <HowItWorks />
        <Benefits />
        
        <CTASection />
        
        <Contact />
      </main>
      <Footer />
    </div>
  );
}