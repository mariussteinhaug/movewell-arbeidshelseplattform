import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Facebook, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="container mx-auto px-6 py-16 md:px-20 md:py-20">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* CTA Column */}
          <div className="md:col-span-2">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
              Klar for å komme i gang?
            </h2>
            <Button 
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 rounded-full font-semibold transition-all hover:scale-105"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Se hva vi kan tilby
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          {/* Product Links */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Funksjoner</h3>
            <ul className="space-y-4">
              <li><a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">Slik fungerer det</a></li>
              <li><a href="#benefits" className="text-slate-600 hover:text-slate-900 transition-colors">Fordeler</a></li>
              <li><a href="#contact" className="text-slate-600 hover:text-slate-900 transition-colors">Priser</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Ressurser</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Kunnskapshub</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Webinarer</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Guider</a></li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Selskap</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Om oss</a></li>
              <li><a href="#contact" className="text-slate-600 hover:text-slate-900 transition-colors">Kontakt</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Personvern</a></li>
            </ul>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-900">Følg oss:</span>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} MoveWell. Alle rettigheter reservert.
          </p>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="bg-slate-900 py-4">
        <div className="container mx-auto px-6 md:px-20">
          <div className="flex flex-col md:flex-row justify-between gap-4 text-sm">
            <div className="flex gap-4 text-white/60">
              <a href="#" className="hover:text-white transition-colors">Norge</a>
              <a href="#" className="hover:text-white transition-colors">Sverige</a>
            </div>
            <div className="flex gap-4 text-white/60">
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
              <a href="#" className="hover:text-white transition-colors">Personvernerklæring</a>
              <a href="#" className="hover:text-white transition-colors">Trust Center</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}