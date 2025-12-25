import React from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import Benefits from '../components/landing/Benefits';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
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