import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MoveWell</span>
          </a>
          
          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">
              Slik fungerer det
            </a>
            <a href="#benefits" className="text-slate-400 hover:text-white transition-colors text-sm">
              Fordeler
            </a>
            <a href="#contact" className="text-slate-400 hover:text-white transition-colors text-sm">
              Kontakt
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
              Personvern
            </a>
          </nav>
          
          {/* Copyright */}
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} MoveWell. Alle rettigheter reservert.
          </p>
        </div>
      </div>
    </footer>
  );
}