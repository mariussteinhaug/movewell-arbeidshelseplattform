import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function ProductSection({ badge, title, description, image, features, reversed, buttonText = "Les mer" }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6 md:px-20">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${reversed ? '' : ''}`}>
          {/* Image */}
          <div className={`${reversed ? 'lg:order-2' : ''} bg-slate-100 p-2 rounded-2xl`}>
            <img 
              src={image} 
              alt={title}
              className="w-full rounded-xl aspect-[16/10] object-cover"
            />
          </div>
          
          {/* Content */}
          <div className={`${reversed ? 'lg:order-1' : ''} grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6`}>
            <div>
              {badge && (
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-6 py-2 rounded-full mb-6">
                  {badge}
                </span>
              )}
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                {title}
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {description}
              </p>
              
              {features && (
                <ul className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="flex items-end justify-start md:justify-end">
              <Button 
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {buttonText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}