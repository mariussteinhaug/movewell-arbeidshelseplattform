import React from "react";
import { ClipboardCheck, LineChart, Lightbulb } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    step: "01",
    title: "Kartlegging",
    description:
      "Kom i gang på minutter. Anonyme kartlegginger gir ærlige svar om belastning, trivsel og arbeidsforhold.",
  },
  {
    icon: LineChart,
    step: "02",
    title: "Analyse & innsikt",
    description:
      "Data aggregeres per avdeling. Se trender tidlig og få anbefalte tiltak i et oversiktlig dashboard.",
  },
  {
    icon: Lightbulb,
    step: "03",
    title: "Handling & oppfølging",
    description:
      "Sett inn tiltak og følg utviklingen over tid. Juster kursen med konkrete forbedringspunkter.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6 md:px-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Slik fungerer det
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Fra innsikt til handling på tre steg
          </h2>
          <p className="mt-4 text-slate-600 text-base md:text-lg">
            En enkel prosess som gir tydeligere prioriteringer for HR og ledere.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((s, index) => (
            <div
              key={index}
              className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <s.icon className="h-6 w-6 text-slate-700" />
                </div>
                <span className="text-sm font-semibold text-slate-400">
                  {s.step}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-semibold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-3 text-slate-600 leading-relaxed text-sm md:text-base">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
