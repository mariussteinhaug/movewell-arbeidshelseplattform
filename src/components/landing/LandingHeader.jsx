import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "#how-it-works", label: "Slik fungerer det" },
    { href: "#benefits", label: "Fordeler" },
    { href: "#contact", label: "Kontakt" },
  ];

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="container mx-auto px-6 md:px-20">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
              setIsMenuOpen(false);
            }}
            aria-label="Gå til toppen"
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694db50ccf9dcb239e37fc6a/906a80b56_movewell-high-resolution-logo-transparent.png"
              alt="MoveWell Logo"
              className="h-12 w-auto object-contain"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Hovedmeny">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-slate-700 hover:text-slate-900 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-slate-50"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId(link.href.replace("#", ""));
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <motion.button
                className="relative overflow-hidden bg-[#33c58f]/10 backdrop-blur-2xl border border-[#33c58f]/50 text-[#2a9e73] font-medium rounded-full px-6 py-2 shadow-[0_4px_16px_rgba(51,197,143,0.15),inset_0_1px_1px_rgba(255,255,255,0.6)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#33c58f]/30 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 2.5,
                    ease: "linear",
                  }}
                />
                <span className="relative z-10">Logg inn</span>
              </motion.button>
            </Link>

            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-lg"
              onClick={() => scrollToId("contact")}
            >
              Book et møte
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-3 rounded-lg hover:bg-slate-100"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Åpne/lukk meny"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            type="button"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-700" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div id="mobile-nav" className="md:hidden pb-6 border-t border-slate-200 pt-6">
            <nav className="flex flex-col gap-3" aria-label="Mobilmeny">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-700 hover:text-slate-900 transition-colors font-medium py-3 px-4 rounded-lg hover:bg-slate-50"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMenuOpen(false);
                    scrollToId(link.href.replace("#", ""));
                  }}
                >
                  {link.label}
                </a>
              ))}

              <Link to={createPageUrl("Dashboard")} className="mt-2">
                <motion.button
                  className="relative overflow-hidden w-full bg-[#33c58f]/10 backdrop-blur-2xl border border-[#33c58f]/50 text-[#2a9e73] font-medium rounded-full py-3 shadow-[0_4px_16px_rgba(51,197,143,0.15),inset_0_1px_1px_rgba(255,255,255,0.6)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#33c58f]/30 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 2.5,
                      ease: "linear",
                    }}
                  />
                  <span className="relative z-10">Logg inn</span>
                </motion.button>
              </Link>

              <Button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full py-6 shadow-lg mt-2"
                onClick={() => {
                  setIsMenuOpen(false);
                  scrollToId("contact");
                }}
              >
                Book et møte
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}