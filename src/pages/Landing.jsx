import React, { useEffect } from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import Hero from '../components/landing/Hero';
import ImageSection from '../components/landing/ImageSection';
import LogoSection from '../components/landing/LogoSection';
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
        <HowItWorks />
        <Benefits />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}