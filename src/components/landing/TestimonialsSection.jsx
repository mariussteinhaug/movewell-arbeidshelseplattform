import React from "react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "HR-leder",
      role: "Industri (200+ ansatte)",
      quote:
        "MoveWell gjorde det enkelt å fange opp tidlige signaler. Vi fikk raskt en bedre oversikt og en tydeligere plan for oppfølging.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    },
    {
      name: "Produksjonsleder",
      role: "Matproduksjon",
      quote:
        "Systemet er intuitivt, og anbefalingene gjorde det lettere å prioritere tiltak. Ansatte opplever at vi tar arbeidshelsen på alvor.",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    },
    {
      name: "HMS-ansvarlig",
      role: "Logistikk",
      quote:
        "Anonym kartlegging ga oss ærlige tilbakemeldinger vi aldri fikk før. Det har blitt et viktig verktøy i forbedringsarbeidet.",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-white overflow-hidden">
      {/* subtle background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-slate-200/40 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-6 md:px-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Erfaringer
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
              Hva sier brukerne?
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Uttalelser kan anonymiseres i tidlig fase. Når du har godkjente caser,
              kan vi bytte til ekte logoer og navn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <div
                key={index}
                className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur"
              >
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="h-14 w-14 rounded-full object-cover border border-slate-200"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {t.name}
                    </p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed">
                  “{t.quote}”
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
