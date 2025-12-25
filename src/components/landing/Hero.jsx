import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingDown, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Forebyggende arbeidshelse
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Reduser sykefravær med{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              smart forebygging
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            MoveWell gir små og mellomstore bedrifter verktøyene for å identifisere 
            helserisiko tidlig, med full respekt for personvern og ansattes tillit.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 transition-opacity text-lg px-8 py-6 shadow-lg shadow-emerald-500/20"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book en demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-slate-300"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Se hvordan det fungerer
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">30% reduksjon</p>
                <p className="text-sm text-slate-500">i sykefravær</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">100% anonym</p>
                <p className="text-sm text-slate-500">datainnsamling</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">GDPR-sikret</p>
                <p className="text-sm text-slate-500">personvern først</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}