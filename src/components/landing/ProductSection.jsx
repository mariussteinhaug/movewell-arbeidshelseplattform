import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function ProductSection({ title, description, image, features, reversed }) {
  return (
    <section className="container mx-auto px-6 md:px-20 py-16 md:py-24">
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
        {/* Image */}
        <div className={reversed ? 'lg:order-2' : ''}>
          <img 
            src={image} 
            alt={title}
            className="w-full rounded-2xl shadow-2xl"
          />
        </div>
        
        {/* Content */}
        <div className={reversed ? 'lg:order-1' : ''}>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            {title}
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            {description}
          </p>
          
          {features && (
            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          )}
          
          <Button 
            size="lg" 
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 rounded-full font-semibold transition-all hover:scale-105"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Les mer
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}