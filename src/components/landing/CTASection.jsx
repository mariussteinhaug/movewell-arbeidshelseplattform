import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="container mx-auto px-6 md:px-20 py-20 md:py-28">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 md:p-20 text-center shadow-2xl">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Klar til å ta neste steg?
        </h2>
        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          La oss vise deg hvordan MoveWell kan redusere sykefravær og forbedre arbeidshelsen i din bedrift.
        </p>
        <Button 
          size="lg" 
          className="bg-white hover:bg-slate-100 text-slate-900 px-10 py-7 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl"
          onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Book et møte i dag
          <ArrowRight className="w-6 h-6 ml-2" />
        </Button>
      </div>
    </section>
  );
}