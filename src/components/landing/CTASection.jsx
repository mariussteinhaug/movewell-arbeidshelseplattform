import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="container mx-auto px-6 md:px-20">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 px-8 py-12 md:px-16 md:py-16 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
          {/* subtle highlight */}
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

          <h2 className="relative text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Klar til å ta neste steg?
          </h2>

          <p className="relative mt-5 text-base md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            La oss vise deg hvordan MoveWell kan gi tidlige signaler, tydelig oppfølging og bedre beslutningsgrunnlag.
          </p>

          <div className="relative mt-10 flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full px-8 py-6 bg-[#33c58f] text-white shadow-sm hover:bg-[#2aa876] hover:shadow-md hover:-translate-y-0.5 transition-all"
              onClick={() => scrollTo("contact")}
            >
              Book et møte
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto rounded-full px-8 py-6 bg-white/10 text-white hover:bg-white/15 border border-white/15 transition-all"
              onClick={() => scrollTo("how-it-works")}
            >
              Se hvordan det fungerer
            </Button>
          </div>

          <p className="relative mt-6 text-sm text-white/60">
            Uforpliktende • 15 min • Svar innen 24 timer
          </p>
        </div>
      </div>
    </section>
  );
}