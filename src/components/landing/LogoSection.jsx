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
              className="h-10 px-6 flex items-center rounded-full border border-[#33c58f]/50 bg-[#33c58f]/10 text-[#2a9e73] font-medium shadow-[0_4px_16px_rgba(51,197,143,0.15),inset_0_1px_1px_rgba(255,255,255,0.6)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}