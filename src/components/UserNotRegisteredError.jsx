import React from "react";
import { ShieldAlert, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function UserNotRegisteredError() {
  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.reload();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-amber-700" />
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Du har ikke tilgang ennå
          </h1>

          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Kontoen din er ikke registrert i MoveWell.
            <br />
            Ta kontakt med leder eller HR for å få tilgang.
          </p>

          <div className="w-full space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logg ut og prøv annen konto
            </Button>

            <a
              href="mailto:kontakt@movewell.no"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <Mail className="h-4 w-4" />
              Kontakt support
            </a>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-2">Vanlige årsaker:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Du er logget inn med feil e-post</li>
              <li>Bedriften din er ikke aktivert ennå</li>
              <li>Tilgang er ikke gitt av HR</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
