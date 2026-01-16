import React from "react";

export default function LogoSection() {
  const industries = [
    "Industri & bygg",
    "Helse & omsorg",
    "Offentlig sektor",
    "Logistikk",
    "Retail",
  ];

  const logos = [
    {
      name: "Eramet",
      url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694db50ccf9dcb239e37fc6a/7405f97c3_image.png",
    },
  ];

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container mx-auto px-6 md:px-20">
        {/* Customer logos */}
        <div className="text-center mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500 mb-8">
            Brukes av ledende norske virksomheter
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {logos.map((logo, index) => (
              <img
                key={index}
                src={logo.url}
                alt={logo.name}
                className="h-12 md:h-16 object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
              />
            ))}
          </div>
        </div>


      </div>
    </section>
  );
}