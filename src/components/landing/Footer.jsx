import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 py-16 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694db50ccf9dcb239e37fc6a/bdae0c18b_image.png"
              alt="MoveWell Logo"
              className="h-12 w-auto object-contain"
              style={{ background: 'transparent', filter: 'brightness(0) invert(1)' }}
            />
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