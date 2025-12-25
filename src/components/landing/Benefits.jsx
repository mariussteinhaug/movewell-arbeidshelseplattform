import React from 'react';
import { TrendingDown, Clock, Smile, PiggyBank, CheckCircle2 } from "lucide-react";

const benefits = [
  {
    icon: TrendingDown,
    title: "Redusert sykefravær",
    description: "Forebygg fravær før det skjer med tidlig identifisering av helserisiko.",
    stats: "Opptil 30%"
  },
  {
    icon: Clock,
    title: "Spar tid på administrasjon",
    description: "Automatisert oppfølging og rapportering frigjør tid for HR og ledere.",
    stats: "5+ timer/uke"
  },
  {
    icon: Smile,
    title: "Bedre arbeidsmiljø",
    description: "Ansatte føler seg sett og får hjelp når de trenger det.",
    stats: "92% fornøyde"
  },
  {
    icon: PiggyBank,
    title: "Positiv ROI",
    description: "Lavere fraværskostnader og høyere produktivitet gir rask tilbakebetaling.",
    stats: "4x ROI"
  }
];

const targetIndustries = [
  "Industri & produksjon",
  "Bygg & anlegg", 
  "Helse & omsorg",
  "Offentlig sektor",
  "Transport & logistikk"
];

export default function Benefits() {
  return (
    <section id="benefits" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-emerald-600 font-semibold mb-3">Fordeler</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Målbar effekt for din bedrift
          </h2>
          <p className="text-slate-600 text-lg">
            MoveWell leverer resultater som kan dokumenteres og måles
          </p>
        </div>
        
        {/* Benefits grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-5 group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 transition-all duration-300">
                <benefit.icon className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                {benefit.stats}
              </p>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
        
        {/* Target industries */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">
                Skreddersydd for din bransje
              </h3>
              <p className="text-white/90">
                Vi forstår de unike utfordringene i ulike sektorer
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {targetIndustries.map((industry, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm border border-white/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {industry}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}