import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: Replace with real submit (Base44 action / email integration)
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", company: "", message: "" });
    }, 2500);
  };

  return (
    <section id="contact" className="py-14 md:py-20 bg-white">
      <div className="container mx-auto px-6 md:px-20">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left: Info */}
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Kontakt
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
              Book en uforpliktende demo
            </h2>
            <p className="mt-4 text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
              Se hvordan MoveWell kan gi tidlige signaler og en enklere oppfølgingsflyt for HR og ledere.
            </p>

            {/* Contact cards */}
            <div className="mt-10 grid gap-4 max-w-xl">
              <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">E-post</p>
                    <a
                      href="mailto:hei@movewell.no"
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      hei@movewell.no
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Telefon</p>
                    <a
                      href="tel:+4722334455"
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      +47 22 33 44 55
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Kontor</p>
                    <p className="text-sm text-slate-600">Oslo, Norge</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500">
                Foretrekker du e-post? Send kort hva du ønsker å se, så foreslår vi et tidspunkt.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] p-6 sm:p-8 md:p-10">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-14">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-slate-800" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-slate-900">
                  Takk!
                </h3>
                <p className="mt-2 text-slate-600 text-center">
                  Vi tar kontakt med deg innen 24 timer.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl md:text-2xl font-semibold text-slate-900">
                  Send forespørsel
                </h3>
                <p className="mt-2 text-slate-600">
                  Uforpliktende • 15 min • Ingen spam
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <Input
                    placeholder="Navn"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="h-12"
                  />

                  <Input
                    type="email"
                    placeholder="E-post"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="h-12"
                  />

                  <Input
                    placeholder="Bedrift"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    required
                    className="h-12"
                  />

                  <Textarea
                    placeholder="Hva ønsker du å se i demoen?"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={4}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full py-6 bg-slate-900 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    Send forespørsel
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    Ved å sende inn godtar du at vi kan kontakte deg om demoen.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}