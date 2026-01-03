import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

type ProductSectionProps = {
  badge?: string;
  title: string;
  description: string;
  image: string;
  features?: string[];
  reversed?: boolean;
  buttonText?: string;
};

export default function ProductSection({
  badge,
  title,
  description,
  image,
  features,
  reversed,
  buttonText = "Book et møte",
}: ProductSectionProps) {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6 md:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <div className={reversed ? "lg:order-2" : ""}>
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <img
                src={image}
                alt={title}
                className="w-full aspect-[16/10] object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Content */}
          <div className={reversed ? "lg:order-1" : ""}>
            {badge && (
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
                {badge}
              </div>
            )}

            <h2 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
              {title}
            </h2>

            <p className="mt-4 text-slate-600 leading-relaxed max-w-xl">
              {description}
            </p>

            {features?.length ? (
              <ul className="mt-8 space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 text-sm leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-10">
              <Button
                className="rounded-full px-7 py-6 bg-slate-900 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                onClick={scrollToContact}
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
