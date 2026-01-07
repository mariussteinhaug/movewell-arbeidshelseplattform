import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
        LayoutDashboard,
        ClipboardCheck,
        Building2,
        Settings,
        Menu,
        X,
        Shield,
        FileText,
        Mail,
        TrendingUp,
        Wrench,
        User,
        UserPlus,
      } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { ROLE, normalizeRole, hasRole } from "./components/access/role";


// Normaliser role fra Base44 (så du ikke knekker hvis den heter "admin" i dag)

// RBAC helper

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Don't show layout on Landing page
  if (currentPageName === "Landing") {
    return <>{children}</>;
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Could not fetch user:", error);
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const userRole = normalizeRole(user);

  const navigation = useMemo(() => {
    const items = [
      // Employee (alle)
      { name: "Kartlegging", page: "Assessment", icon: ClipboardCheck, roles: [ROLE.EMPLOYEE, ROLE.MANAGER, ROLE.HR] },
      { name: "Min profil", page: "Profile", icon: User, roles: [ROLE.EMPLOYEE, ROLE.MANAGER, ROLE.HR] },
      { name: "Mine meldinger", page: "MyMessages", icon: Mail, roles: [ROLE.EMPLOYEE, ROLE.MANAGER, ROLE.HR] },

      // Manager + HR
      { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard, roles: [ROLE.MANAGER, ROLE.HR] },
      { name: "AI-Rapporter", page: "Reports", icon: FileText, roles: [ROLE.MANAGER, ROLE.HR] },

      { name: "Tilrettelegging", page: "Accommodation", icon: Wrench, roles: [ROLE.MANAGER, ROLE.HR] },
      { name: "Invitasjoner", page: "Invite", icon: UserPlus, roles: [ROLE.MANAGER, ROLE.HR] },

      // HR-only

      { name: "Trendanalyse", page: "TrendAnalysis", icon: TrendingUp, roles: [ROLE.HR] },
      { name: "Ansattprofil", page: "EmployeeProfile", icon: Shield, roles: [ROLE.HR] },
      { name: "Avdelinger", page: "Departments", icon: Building2, roles: [ROLE.HR] },
      { name: "Innstillinger", page: "Settings", icon: Settings, roles: [ROLE.HR] },
            { name: "Docs", page: "Docs", icon: FileText, roles: [ROLE.HR] },
    ];

    return items.filter((item) => hasRole(userRole, item.roles));
  }, [userRole]);

  const handleLogout = async () => {
    try {
      setMobileMenuOpen(false);
      await base44.auth.logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-slate-200 pt-10 pb-6 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center px-10 mb-12">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694db50ccf9dcb239e37fc6a/906a80b56_movewell-high-resolution-logo-transparent.png"
              alt="MoveWell Logo"
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 space-y-2">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "group flex items-center gap-4 px-5 py-3.5 rounded-xl transition-colors font-medium",
                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Privacy badge */}
          <div className="mx-6 mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3 text-slate-700 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-slate-700" />
              </div>
              <span className="text-sm font-semibold">Personvern</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Data kan anonymiseres og aggregeres. Ansatte ser kun sin egen profil. Ledere ser kun sin avdeling. HR ser full oversikt.
            </p>
          </div>

          {/* Logout */}
          {user && (
            <div className="mx-6 mt-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium"
              >
                <span className="text-sm">Logg ut</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-4">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694db50ccf9dcb239e37fc6a/906a80b56_movewell-high-resolution-logo-transparent.png"
            alt="MoveWell Logo"
            className="h-10 w-auto object-contain"
          />

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-3 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Åpne/lukk meny"
            aria-expanded={mobileMenuOpen}
            type="button"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-700" />
            ) : (
              <Menu className="h-6 w-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="px-6 pb-6 space-y-2 border-t border-slate-200 pt-6 bg-white">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 rounded-xl transition-colors font-medium",
                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {user && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium"
              >
                <span>Logg ut</span>
              </button>
            )}
          </nav>
        )}
      </div>

      {/* Main */}
      <main className="lg:pl-72">
        <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}