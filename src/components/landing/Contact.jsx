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
    <section id="contact" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left column - Info */}
          <div>
            <p className="text-emerald-600 font-semibold mb-3">Kontakt oss</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Klar til å redusere sykefraværet?
            </h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              Book en uforpliktende demo og se hvordan MoveWell kan hjelpe din 
              bedrift med å bygge en sunnere arbeidsplass.
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
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Takk for din henvendelse!</h3>
                <p className="text-slate-600 text-center">Vi tar kontakt med deg innen 24 timer.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 mb-6">
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
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 transition-opacity"
                  >
                    Send forespørsel
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <p className="text-xs text-slate-500 text-center">
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