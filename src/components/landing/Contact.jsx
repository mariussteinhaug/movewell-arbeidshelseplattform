import React, { useState } from 'react';
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
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", company: "", message: "" });
    }, 3000);
  };

  return (
    <section id="contact" className="py-32 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
          {/* Left column - Info */}
          <div>
            <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-4">Kontakt oss</p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Klar til å redusere <span className="block">sykefraværet?</span>
            </h2>
            <p className="text-slate-600 text-xl font-light mb-10 leading-relaxed">
              Book en uforpliktende demo og se hvordan MoveWell kan hjelpe din bedrift med å bygge en sunnere arbeidsplass.
            </p>
            
            {/* Contact info */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">E-post</p>
                  <a href="mailto:hei@movewell.no" className="text-slate-600 hover:text-emerald-600 transition-colors">
                    hei@movewell.no
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Telefon</p>
                  <a href="tel:+4722334455" className="text-slate-600 hover:text-emerald-600 transition-colors">
                    +47 22 33 44 55
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Kontor</p>
                  <p className="text-slate-600">Oslo, Norge</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Form */}
          <div className="bg-white rounded-3xl p-10 border-2 border-slate-200 shadow-xl">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Takk for din henvendelse!</h3>
                <p className="text-slate-600 text-center text-lg">Vi tar kontakt med deg innen 24 timer.</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-slate-900 mb-8">
                  Book en demo
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Input
                      placeholder="Ditt navn"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-12 bg-white"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="email"
                      placeholder="E-postadresse"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-12 bg-white"
                    />
                  </div>
                  
                  <div>
                    <Input
                      placeholder="Bedriftsnavn"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                      className="h-12 bg-white"
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      placeholder="Hva ønsker du å vite mer om?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="bg-white"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-7 rounded-full font-semibold transition-all hover:scale-105"
                  >
                    Send forespørsel
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <p className="text-sm text-slate-500 text-center">
                    Vi svarer vanligvis innen 24 timer. Ingen spam, vi lover.
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