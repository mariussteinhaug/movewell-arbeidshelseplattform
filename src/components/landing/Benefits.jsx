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
    <section id="benefits" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6 md:px-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Fordeler
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Målbar forbedring over tid
          </h2>
          <p className="mt-4 text-slate-600 text-base md:text-lg">
            MoveWell gjør forebyggende helsearbeid enklere – og mer handlingsrettet.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <b.icon className="h-6 w-6 text-slate-700" />
                </div>
                <span className="text-xs font-semibold text-slate-500 rounded-full border border-slate-200 px-3 py-1">
                  {b.stat}
                </span>
              </div>

              <h3 className="mt-6 text-lg font-semibold text-slate-900">
                {b.title}
              </h3>
              <p className="mt-3 text-slate-600 leading-relaxed text-sm md:text-base">
                {b.description}
              </p>
            </div>
          ))}
        </div>

        {/* Industries */}
        <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-950 p-10 md:p-14 shadow-[0_25px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="text-center md:text-left max-w-xl">
              <p className="text-sm font-medium uppercase tracking-wide text-white/60">
                Bransjer
              </p>
              <h3 className="mt-3 text-2xl md:text-4xl font-semibold tracking-tight text-white">
                Skreddersydd for din hverdag
              </h3>
              <p className="mt-4 text-white/70">
                Tilpasset arbeidshverdagen i bransjer med høy belastning og krav til tydelig oppfølging.
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-3">
              {targetIndustries.map((industry, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm border border-white/15 hover:bg-white/15 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
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
