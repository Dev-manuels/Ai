'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { useAuth } from './AuthProvider';
import {
  Menu,
  X,
  LayoutDashboard,
  Search,
  Briefcase,
  BarChart2,
  Settings,
  LogOut,
  LogIn,
  Home,
  Info,
  Shield
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, nextAuthUser, isLegacy, loading, signOut: supabaseSignOut } = useAuth();
  const pathname = usePathname();

  const activeUser = user || nextAuthUser;

  const navItems = activeUser ? [
    { label: 'Intelligence', href: '/dashboard/matches', icon: LayoutDashboard },
    { label: 'Performance', href: '/dashboard/performance', icon: BarChart2 },
    { label: 'Research', href: '/dashboard/research', icon: Search },
    { label: 'Portfolio', href: '/dashboard/portfolio', icon: Briefcase },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ] : [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Features', href: '/#features', icon: Info },
    { label: 'About', href: '/#about', icon: Shield },
  ];

  const handleSignOut = async () => {
    if (isLegacy) {
      await nextAuthSignOut({ callbackUrl: '/' });
    } else {
      await supabaseSignOut();
      window.location.href = '/';
    }
  };

  return (
    <nav className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">INTEL<span className="text-indigo-500">AI</span></span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                      pathname === item.href
                        ? "bg-slate-900 text-white border border-slate-700"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {loading ? (
                <div className="w-20 h-8 bg-slate-900 animate-pulse rounded-md"></div>
              ) : activeUser ? (
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 font-mono hidden lg:block">
                    {activeUser.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-slate-400 hover:text-rose-400 text-sm font-medium transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all"
                >
                  <LogIn size={16} />
                  Login
                </Link>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3",
                  pathname === item.href
                    ? "bg-slate-900 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
            {activeUser ? (
              <button
                onClick={() => {
                  handleSignOut();
                  setIsOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-slate-900 flex items-center gap-3"
              >
                <LogOut size={18} />
                Logout
              </button>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-indigo-400 hover:bg-slate-900 flex items-center gap-3"
              >
                <LogIn size={18} />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
