import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingDown, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex items-center justify-center bg-white overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-6 md:px-20 max-w-5xl">
        <div className="flex flex-col items-center text-center">
          {/* Icon badge */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-8 shadow-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight max-w-4xl">
            Reduser sykefravær med smart forebygging
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Fra kartlegging til oppfølging – et system bygget for norske bedrifter som gir deg trygghet og kontroll over arbeidshelsen.
          </p>
          
          {/* CTA */}
          <Button 
            size="lg" 
            className="bg-slate-900 hover:bg-slate-800 text-white text-lg px-10 py-6 rounded-full shadow-xl transition-all hover:scale-105 font-semibold"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Book et møte
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-20">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <TrendingDown className="w-7 h-7 text-slate-700" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">30%</p>
              <p className="text-sm font-medium text-slate-600">reduksjon i sykefravær</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-slate-700" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">100%</p>
              <p className="text-sm font-medium text-slate-600">anonym datainnsamling</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-slate-700" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">GDPR</p>
              <p className="text-sm font-medium text-slate-600">personvern først</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}