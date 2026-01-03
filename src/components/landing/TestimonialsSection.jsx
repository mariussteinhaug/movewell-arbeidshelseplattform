import React from 'react';
import { Quote } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Erik Hansen",
      role: "HR-direktør @ Norsk Hydro",
      quote: "MoveWell har gitt oss verdifull innsikt i arbeidshelsen til våre ansatte. Vi har redusert sykefraværet med 25% på bare 6 måneder.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
    },
    {
      name: "Maria Nilsen",
      role: "Leder Produksjon @ Lerøy Seafood",
      quote: "Systemet er intuitivt og gir oss konkrete handlingsplaner. Våre ansatte føler seg sett og verdsatt.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
    },
    {
      name: "Lars Johansen",
      role: "HMS-ansvarlig @ Posten Norge",
      quote: "Den anonyme kartleggingen har gitt oss ærlige tilbakemeldinger som vi aldri hadde fått ellers. Viktig verktøy for oss.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop"
    }
  ];

  return (
    <section className="bg-slate-50 py-20 md:py-28">
      <div className="container mx-auto px-6 md:px-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Hva sier våre kunder?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Se hvordan norske bedrifter bruker MoveWell til å forbedre arbeidshelsen
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <Quote className="w-10 h-10 text-emerald-500 mb-6" />
              <p className="text-slate-700 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}