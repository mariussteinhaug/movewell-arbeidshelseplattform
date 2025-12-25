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
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-emerald-600 font-semibold mb-3">Slik fungerer det</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Fra innsikt til handling på tre steg
          </h2>
          <p className="text-slate-600 text-lg">
            MoveWell gjør det enkelt å komme i gang med forebyggende helsearbeid
          </p>
        </div>
        
        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-slate-200" />
              )}
              
              <div className="relative bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-shadow duration-300">
                {/* Step number */}
                <span className="absolute -top-4 left-8 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-full shadow-lg">
                  {step.step}
                </span>
                
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <step.icon className="w-8 h-8 text-emerald-600" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
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