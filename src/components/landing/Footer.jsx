import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Facebook, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="container mx-auto px-6 md:px-20 py-14 md:py-16">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              MoveWell
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
              Klar for å komme i gang?
            </h2>
            <p className="mt-3 text-slate-600">
              Book en uforpliktende demo og se hvordan det fungerer i praksis.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                className="rounded-full px-7 py-6 bg-slate-900 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                onClick={() => scrollTo("contact")}
              >
                Book et møte
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="ghost"
                className="rounded-full px-7 py-6 bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors"
                onClick={() => scrollTo("how-it-works")}
              >
                Se hvordan det fungerer
              </Button>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 w-full md:w-auto">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Innhold
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#how-it-works"
                    className="text-slate-600 hover:text-slate-900 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo("how-it-works");
                    }}
                  >
                    Slik fungerer det
                  </a>
                </li>
                <li>
                  <a
                    href="#benefits"
                    className="text-slate-600 hover:text-slate-900 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo("benefits");
                    }}
                  >
                    Fordeler
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-slate-600 hover:text-slate-900 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo("contact");
                    }}
                  >
                    Kontakt
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Juridisk
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Personvern
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cookies
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Vilkår
                  </a>
                </li>
              </ul>
            </div>

            <div className="sm:block hidden">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Sosialt
              </h3>
              <div className="flex gap-3">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            © {year} MoveWell. Alle rettigheter reservert.
          </p>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-900 transition-colors">
              Norge
            </a>
            <span className="text-slate-300">•</span>
            <a href="#" className="hover:text-slate-900 transition-colors">
              English
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}