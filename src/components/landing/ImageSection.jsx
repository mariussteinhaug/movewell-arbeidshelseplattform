import React from 'react';

export default function ImageSection() {
  return (
    <div className="container mx-auto px-6 md:px-20 py-12 md:py-16">
      <img
        src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop"
        alt="MoveWell Dashboard"
        className="w-full rounded-2xl shadow-2xl"
      />
    </div>
  );
}