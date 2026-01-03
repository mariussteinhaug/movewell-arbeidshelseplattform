import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Sparkles, Users, LineChart } from "lucide-react";

export default function Hero() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative bg-white overflow-hidden py-20 md:py-32">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-slate-200/40 blur-3xl" />
        <div className="absolute -bottom-40 right-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-6 md:px-20 max-w-5xl">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            AI-drevet forebygging for arbeidshelse
          </div>

          {/* Headline */}
          <h1 className="mt-8 text-4xl md:text-6xl font-semibold tracking-tight text-slate-900 leading-tight max-w-4xl">
            Reduser sykefravær med{" "}
            <span className="text-slate-900">tidlig innsikt</span> – og tydelig oppfølging
          </h1>

          {/* Subheadline */}
          <p className="mt-5 text-base md:text-xl text-slate-600 max-w-2xl leading-relaxed">
            Kartlegging, risikosignaler og tiltak i ett system. Bygget for norske bedrifter – med anonymitet og GDPR i kjernen.
          </p>

          {/* CTA row */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 bg-slate-900 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              onClick={() => scrollTo("contact")}
            >
              Book et møte
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-8 py-6 bg-white/70 hover:bg-white border border-slate-200 text-slate-900 shadow-sm transition-all"
              onClick={() => scrollTo("how-it-works")}
            >
              Se hvordan det fungerer
            </Button>
          </div>

          {/* Trust cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mx-auto mt-16">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-left shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <LineChart className="h-5 w-5 text-slate-700" />
                </div>
                <p className="font-semibold text-slate-900">Tidlige risikosignaler</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Oppdag mønstre og trender før de utvikler seg til fravær – per team og avdeling.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-left shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-slate-700" />
                </div>
                <p className="font-semibold text-slate-900">Anonym kartlegging</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Høyere ærlighet i svarene – samtidig som du får innsikt på aggregert nivå.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-left shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-slate-700" />
                </div>
                <p className="font-semibold text-slate-900">GDPR og personvern</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Data behandles sikkert, med tydelige roller og tilgang – HR/leder/ansatt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}