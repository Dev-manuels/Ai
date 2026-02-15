'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  TrendingUp,
  ShieldCheck,
  Shield,
  Zap,
  BarChart4,
  Globe,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const { user, nextAuthUser, loading } = useAuth();
  const activeUser = user || nextAuthUser;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SYSTEMS ONLINE: v2.4.0-STABLE
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">
            Institutional Intelligence <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
              For Professional Markets
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10">
            Quantitative edge detection, real-time signal intelligence, and automated risk controls for high-frequency sports trading environments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {loading ? (
              <div className="w-48 h-12 bg-slate-900 animate-pulse rounded-lg"></div>
            ) : activeUser ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition-all"
              >
                Access Dashboard
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="group flex items-center gap-2 bg-white text-slate-950 px-8 py-3 rounded-lg font-bold hover:bg-slate-200 transition-all"
                >
                  Request Access
                  <ChevronRight size={18} />
                </Link>
                <Link
                  href="#features"
                  className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all"
                >
                  View Capabilities
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-1">500ms</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Latency</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-1">99.8%</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Survivability</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-1">10k+</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Daily Signals</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-1">1.85</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Sharpe Ratio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Engineered for Alpha</h2>
            <p className="text-slate-400">Proprietary infrastructure designed for the world's most competitive markets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="text-indigo-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Predictive Modeling</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Advanced Poisson-based models enhanced with real-time Bayesian updates and momentum signals.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-time Signals</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sub-second intelligence stream with expected value (EV) calculations and market depth analysis.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-6">
                <ShieldCheck className="text-indigo-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Risk Controls</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automated circuit breakers and exposure limits to protect capital during high volatility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Shield className="text-indigo-500" size={24} />
            <span className="text-lg font-bold text-white tracking-tight">INTEL<span className="text-indigo-500">AI</span></span>
          </div>
          <div className="flex gap-8 text-slate-500 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Compliance</Link>
          </div>
          <p className="text-slate-600 text-xs font-mono">
            &copy; 2024 INTELAI GLOBAL MARKETS. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}
