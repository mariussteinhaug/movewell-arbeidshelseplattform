import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Building2, 
  Lightbulb, 
  Settings,
  Menu,
  X,
  Shield,
  Heart,
  FileText,
  Mail,
  TrendingUp,
  Wrench,
  User
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show layout on Landing page
  if (currentPageName === 'Landing') {
    return <>{children}</>;
  }

  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Could not fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin';

  const navigation = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
    { name: 'Kartlegging', page: 'Assessment', icon: ClipboardCheck },
    { name: 'Min profil', page: 'Profile', icon: Shield },
    { name: 'Mine meldinger', page: 'MyMessages', icon: Mail },
    { name: 'Kartleggingsdata', page: 'AssessmentResults', icon: FileText, adminOnly: true },
    { name: 'AI-Rapporter', page: 'Reports', icon: FileText, adminOnly: true },
    { name: 'Trendanalyse', page: 'TrendAnalysis', icon: TrendingUp, adminOnly: true },
    { name: 'Ansattprofil', page: 'EmployeeProfile', icon: Shield, adminOnly: true },
    { name: 'Tilrettelegging', page: 'Accommodation', icon: Wrench, adminOnly: true },
    { name: 'Avdelinger', page: 'Departments', icon: Building2, adminOnly: true },
    { name: 'Anbefalinger', page: 'Recommendations', icon: Lightbulb, adminOnly: true },
    { name: 'Meldingssenter', page: 'MessageCenter', icon: Mail, adminOnly: true },
    { name: 'Innstillinger', page: 'Settings', icon: Settings, adminOnly: true },
  ].filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-xl border-r border-slate-200/60 pt-8 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center px-8 mb-12">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694db50ccf9dcb239e37fc6a/bdae0c18b_image.png"
              alt="MoveWell Logo"
              className="h-16 w-auto object-contain"
              style={{ background: 'transparent' }}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Privacy badge */}
          <div className="mx-4 mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">Personvern</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              All data er anonymisert og aggregert. Ansatte eier sine egne data.
            </p>
          </div>

          {/* Logout button */}
          {user && (
            <div className="mx-4 mt-2">
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <span className="text-sm font-medium">Logg ut</span>
              </button>
            </div>
          )}
          </div>
          </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694db50ccf9dcb239e37fc6a/bdae0c18b_image.png"
              alt="MoveWell Logo"
              className="h-10 w-auto object-contain"
              style={{ background: 'transparent' }}
            />
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-slate-600" />
            ) : (
              <Menu className="h-5 w-5 text-slate-600" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-1 border-t border-slate-100 pt-4">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-600" : "text-slate-400")} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
            {user && (
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <span className="font-medium">Logg ut</span>
              </button>
            )}
          </nav>
        )}
      </div>

      {/* Main content */}
      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-8 lg:px-12 lg:py-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}