import React from "react";
import { TrendingDown, Clock, Smile, PiggyBank, CheckCircle2 } from "lucide-react";

const benefits = [
  {
    icon: TrendingDown,
    title: "Tidligere innsikt",
    description: "Oppdag risikosignaler tidlig og prioriter tiltak der de gir mest effekt.",
    stat: "Tidlige varsler",
  },
  {
    icon: Clock,
    title: "Mindre administrasjon",
    description: "Automatisert oppfølging og rapportering frigjør tid for HR og ledere.",
    stat: "Automatisert flyt",
  },
  {
    icon: Smile,
    title: "Bedre arbeidsmiljø",
    description: "Enklere oppfølging gjør at ansatte opplever støtte når det trengs.",
    stat: "Bedre opplevelse",
  },
  {
    icon: PiggyBank,
    title: "Bedre beslutninger",
    description: "Rapporter og trender gir et tydeligere grunnlag for prioriteringer over tid.",
    stat: "Datadrevet",
  },
];

const targetIndustries = [
  "Industri & produksjon",
  "Bygg & anlegg",
  "Helse & omsorg",
  "Offentlig sektor",
  "Transport & logistikk",
];

export default function Benefits() {
  return (
    <section id="benefits" className="py-14 md:py-20 bg-white">
      <div className="container mx-auto px-6 md:px-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-wide text-slate-500">
            Fordeler
          </p>
          <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
            Målbar forbedring over tid
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed">
            MoveWell gjør forebyggende helsearbeid enklere – og mer handlingsrettet.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {benefits.map((b, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] transition-shadow"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <b.icon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
                </div>
                <span className="text-xs font-semibold text-slate-500 rounded-full border border-slate-200 px-2.5 sm:px-3 py-1 whitespace-nowrap">
                  {b.stat}
                </span>
              </div>

              <h3 className="mt-5 sm:mt-6 text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                {b.title}
              </h3>
              <p className="mt-2 sm:mt-3 text-slate-600 leading-relaxed text-sm">
                {b.description}
              </p>
            </div>
          ))}
        </div>

        {/* Industries */}
        <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-950 p-6 sm:p-10 md:p-14 shadow-[0_25px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6 md:gap-8">
            <div className="text-center md:text-left max-w-xl">
              <p className="text-sm font-medium uppercase tracking-wide text-white/60">
                Bransjer
              </p>
              <h3 className="mt-3 text-xl sm:text-2xl md:text-4xl font-semibold tracking-tight text-white">
                Skreddersydd for din hverdag
              </h3>
              <p className="mt-4 text-white/70 text-sm sm:text-base">
                Tilpasset arbeidshverdagen i bransjer med høy belastning og krav til tydelig oppfølging.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {targetIndustries.map((industry, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 text-white text-xs sm:text-sm border border-white/15 hover:bg-white/15 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  {industry}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Optional footnote if you later add real metrics */}
        {/* <p className="mt-6 text-center text-sm text-slate-500">
          Tall og effekter kan dokumenteres i pilot/case-studier.
        </p> */}
      </div>
    </section>
  );
}