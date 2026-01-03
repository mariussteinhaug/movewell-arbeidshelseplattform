import React from 'react';

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
    <section className="relative bg-emerald-100 py-40 overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJhIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0wIDQwTDQwIDBaIiBzdHJva2U9IiMwMDAiIGZpbGw9Im5vbmUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] bg-cover pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-6 md:px-20">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 text-center mb-16 leading-tight">
          Hva sier våre kunder?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-[72px] h-[72px] rounded-full object-cover border-4 border-emerald-500"
                />
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-9">{testimonial.name}</p>
                  <p className="text-sm text-emerald-600">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed">
                "{testimonial.quote}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}