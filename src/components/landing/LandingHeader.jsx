import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, Heart } from "lucide-react";
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">MoveWell</span>
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost">Logg inn</Button>
            </Link>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 transition-opacity">
              Book demo
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-900" />
            ) : (
              <Menu className="w-6 h-6 text-slate-900" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-600 hover:text-slate-900 transition-colors font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link to={createPageUrl('Dashboard')} className="py-2">
                <Button variant="ghost" className="w-full">Logg inn</Button>
              </Link>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 transition-opacity mt-2">
                Book demo
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}