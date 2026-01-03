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
    <section id="benefits" className="py-32 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-4">Fordeler</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Målbar effekt for <span className="block">din bedrift</span>
          </h2>
          <p className="text-slate-600 text-xl font-light">
            MoveWell leverer resultater som kan dokumenteres og måles
          </p>
        </div>
        
        {/* Benefits grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="group p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-emerald-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center mb-6 shadow-xl">
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              
              <p className="text-3xl font-bold text-slate-900 mb-3">
                {benefit.stats}
              </p>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
              <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
        
        {/* Target industries */}
        <div className="bg-slate-900 rounded-3xl p-12 md:p-16 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Skreddersydd for <span className="block">din bransje</span>
              </h3>
              <p className="text-slate-300 text-lg">
                Vi forstår de unike utfordringene i ulike sektorer
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {targetIndustries.map((industry, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 text-white font-semibold backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5" />
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