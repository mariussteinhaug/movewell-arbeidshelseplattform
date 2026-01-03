import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "#how-it-works", label: "Slik fungerer det" },
    { href: "#benefits", label: "Fordeler" },
    { href: "#contact", label: "Kontakt" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="container mx-auto px-6 md:px-20">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694db50ccf9dcb239e37fc6a/bdae0c18b_image.png"
              alt="MoveWell Logo"
              className="h-12 w-auto object-contain"
              style={{ background: 'transparent' }}
            />
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-slate-700 hover:text-slate-900 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button 
                variant="ghost" 
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 rounded-full px-6"
              >
                Logg inn
              </Button>
            </Link>
            <Button 
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-lg"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book et møte
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-3 rounded-lg hover:bg-slate-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-700" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 border-t border-slate-200 pt-6">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-700 hover:text-slate-900 transition-colors font-medium py-3 px-4 rounded-lg hover:bg-slate-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link to={createPageUrl('Dashboard')} className="mt-2">
                <Button 
                  variant="ghost" 
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 rounded-full py-6"
                >
                  Logg inn
                </Button>
              </Link>
              <Button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full py-6 shadow-lg mt-2"
                onClick={() => {
                  setIsMenuOpen(false);
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Book et møte
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}