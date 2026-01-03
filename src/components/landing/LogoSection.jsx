import React from 'react';

export default function LogoSection() {
  const logos = [
    { name: 'Norsk Hydro', width: 'w-32' },
    { name: 'Equinor', width: 'w-28' },
    { name: 'Mowi', width: 'w-24' },
    { name: 'Posten', width: 'w-28' },
    { name: 'Rema 1000', width: 'w-32' },
  ];

  return (
    <div className="container mx-auto px-6 md:px-20 py-16 md:py-20">
      <div className="text-center mb-12">
        <h4 className="text-lg font-bold text-slate-900 mb-2">
          Betrodd av ledende norske bedrifter
        </h4>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16 opacity-60">
        {logos.map((logo, index) => (
          <div 
            key={index}
            className={`${logo.width} h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-semibold text-sm`}
          >
            {logo.name}
          </div>
        ))}
      </div>
    </div>
  );
}