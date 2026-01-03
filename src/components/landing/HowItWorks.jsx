import React from 'react';
import { ClipboardCheck, LineChart, Lightbulb } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    step: "01",
    title: "Kartlegging",
    description: "Enkel onboarding for HR/leder. Anonyme, ukentlige kartlegginger av fysisk belastning, mental helse og arbeidsforhold."
  },
  {
    icon: LineChart,
    step: "02", 
    title: "Analyse & Innsikt",
    description: "Vi aggregerer data på avdelingsnivå og identifiserer risikofaktorer tidlig. Få tydelige, handlingsrettede tiltak med oversiktlige dashboards."
  },
  {
    icon: Lightbulb,
    step: "03",
    title: "Handling & Oppfølging",
    description: "Implementer tiltak basert på innsikter. Følg med på utvikling over tid og juster strategien for kontinuerlig forbedring."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-4">Slik fungerer det</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Fra innsikt til handling <span className="block">på tre steg</span>
          </h2>
          <p className="text-slate-600 text-xl font-light">
            MoveWell gjør det enkelt å komme i gang med forebyggende helsearbeid
          </p>
        </div>
        
        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-1/2 w-full h-1 bg-gradient-to-r from-emerald-200 to-transparent" />
              )}
              
              <div className="relative bg-white rounded-3xl p-10 border-2 border-slate-200 hover:border-emerald-300 hover:shadow-2xl transition-all duration-300">
                {/* Step number badge */}
                <div className="absolute -top-5 -left-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-xl">
                  <span className="text-white text-xl font-bold">{step.step}</span>
                </div>
                
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-10 h-10 text-emerald-600" />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}