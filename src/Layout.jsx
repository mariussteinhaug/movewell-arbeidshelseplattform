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
        <div className="flex flex-col flex-grow bg-white border-r border-slate-200 pt-10 pb-6 overflow-y-auto">
                  {/* Logo */}
                  <div className="flex items-center px-10 mb-16">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694db50ccf9dcb239e37fc6a/bdae0c18b_image.png"
                      alt="MoveWell Logo"
                      className="h-14 w-auto object-contain"
                      style={{ background: 'transparent' }}
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
                    "group flex items-center gap-4 px-5 py-3.5 rounded-lg transition-all duration-200 font-medium",
                    isActive 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                  )} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Privacy badge */}
          <div className="mx-6 mt-6 p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <div className="flex items-center gap-3 text-slate-700 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-sm font-semibold">Personvern</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All data er anonymisert og aggregert. Ansatte eier sine egne data.
            </p>
          </div>

          {/* Logout button */}
          {user && (
            <div className="mx-6 mt-3">
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
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
            className="p-3 rounded-xl hover:bg-slate-100 transition-colors"
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
          <nav className="px-6 pb-6 space-y-2 border-t border-slate-200 pt-6 bg-slate-50">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 rounded-lg transition-colors font-medium",
                    isActive 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "text-slate-700 hover:bg-white"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            {user && (
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
              >
                <span>Logg ut</span>
              </button>
            )}
          </nav>
        )}
      </div>

      {/* Main content */}
      <main className="lg:pl-72">
        <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}