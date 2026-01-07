import React from "react";

export default function LogoSection() {
  const items = [
    "Industri & bygg",
    "Helse & omsorg",
    "Offentlig sektor",
    "Logistikk",
    "Retail",
  ];

  return (
    <section className="py-6 md:py-8 bg-white">
      <div className="container mx-auto px-6 md:px-20">
        <div className="text-center mb-5">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Bygget for norske virksomheter
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm md:text-base">
          {items.map((item, index) => (
            <span
              key={index}
              className="px-5 py-2 rounded-full border border-slate-100 bg-slate-50/50 text-slate-400 text-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}