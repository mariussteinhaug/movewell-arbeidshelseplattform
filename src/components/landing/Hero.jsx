import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingDown, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 overflow-hidden">
      {/* Background decoration - Simployer inspired */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-teal-100/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-50/20 to-teal-50/20 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-emerald-200 text-emerald-700 text-sm font-semibold mb-8 shadow-sm">
            <Shield className="w-4 h-4" />
            Forebyggende arbeidshelse
          </div>
          
          {/* Headline - Simployer-style serif font */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Reduser sykefravær{" "}
            <span className="block mt-2">med{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  smart forebygging
                </span>
                <span className="absolute bottom-0 left-0 right-0 h-4 bg-emerald-200/40 -rotate-1"></span>
              </span>
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            MoveWell gir bedrifter verktøyene for å identifisere helserisiko tidlig – med full respekt for personvern og ansattes tillit.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-20">
            <Button 
              size="lg" 
              className="bg-slate-900 hover:bg-slate-800 text-white text-lg px-10 py-7 rounded-full shadow-xl shadow-slate-900/20 transition-all hover:scale-105 font-semibold"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book en demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-10 py-7 border-2 border-slate-300 hover:border-slate-400 rounded-full font-semibold transition-all hover:scale-105"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Se hvordan det fungerer
            </Button>
          </div>
          
          {/* Trust indicators - Simployer style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">30%</p>
              <p className="text-sm font-medium text-slate-600">reduksjon i sykefravær</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">100%</p>
              <p className="text-sm font-medium text-slate-600">anonym datainnsamling</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
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