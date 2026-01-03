import React from "react";

export default function ImageSection() {
  return (
    <section className="relative py-20 md:py-28 bg-white overflow-hidden">
      {/* Subtle background depth */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-slate-200/40 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-6 md:px-20">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&h=800&fit=crop"
              alt="MoveWell dashboard oversikt"
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
